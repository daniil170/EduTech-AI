package com.edutech.bank;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class BankGenerator {

    private static final int MIN_QUESTIONS_PER_TOPIC = 20;
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
    private static final Gson gson = new Gson();
    
    private Firestore db;
    private Storage storage;
    private String bucketName;
    private String geminiApiKey;

    public BankGenerator() throws IOException {
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.getApplicationDefault())
                .build();
        FirebaseApp.initializeApp(options);
        
        this.db = FirestoreClient.getFirestore();
        this.storage = StorageOptions.getDefaultInstance().getService();
        this.bucketName = System.getenv("FIREBASE_STORAGE_BUCKET");
        this.geminiApiKey = System.getenv("GEMINI_API_KEY");
    }

    public void run() throws Exception {
        List<Map<String, Object>> deficitTopics = getDeficitTopics();
        
        for (Map<String, Object> item : deficitTopics) {
            String subject = (String) item.get("subject");
            String topic = (String) item.get("topic");
            int needed = (int) item.get("needed");
            
            List<JsonObject> questions = generateBatchForTopic(subject, topic, needed);
            
            for (JsonObject q : questions) {
                if (!validateQuestion(q)) {
                    continue;
                }
                
                String qId = "q_" + UUID.randomUUID().toString().substring(0, 8);
                String storagePath = ("bank/" + subject + "/" + topic + "/" + qId + ".json").toLowerCase();
                
                JsonObject fullContent = new JsonObject();
                fullContent.addProperty("question", q.get("question").getAsString());
                fullContent.add("options", q.get("options").getAsJsonArray());
                fullContent.addProperty("correctIndex", q.get("correctIndex").getAsInt());
                fullContent.addProperty("explanation", q.get("explanation").getAsString());
                fullContent.addProperty("difficulty", q.get("difficulty").getAsString());
                fullContent.addProperty("topic", topic);
                
                BlobId blobId = BlobId.of(bucketName, storagePath);
                BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType("application/json").build();
                storage.create(blobInfo, gson.toJson(fullContent).getBytes(StandardCharsets.UTF_8));
                
                Map<String, Object> indexData = new HashMap<>();
                indexData.put("subject", subject);
                indexData.put("topic", topic);
                indexData.put("difficulty", q.get("difficulty").getAsString());
                indexData.put("storagePath", "gs://" + bucketName + "/" + storagePath);
                indexData.put("isApproved", false);
                indexData.put("timesShown", 0);
                indexData.put("createdAt", new Date().toString());
                
                db.collection("questionBank").document(qId).set(indexData).get();
            }
        }
    }

    private List<Map<String, Object>> getDeficitTopics() throws Exception {
        List<Map<String, Object>> deficitTopics = new ArrayList<>();
        QuerySnapshot subjectsSnap = db.collection("subjects").get().get();
        
        for (QueryDocumentSnapshot subjectDoc : subjectsSnap.getDocuments()) {
            List<Map<String, Object>> lessons = (List<Map<String, Object>>) subjectDoc.get("lessons");
            if (lessons == null) continue;
            
            for (Map<String, Object> lesson : lessons) {
                String topic = (String) lesson.get("title");
                QuerySnapshot questionsSnap = db.collection("questionBank")
                        .whereEqualTo("subject", subjectDoc.getId())
                        .whereEqualTo("topic", topic)
                        .get().get();
                
                if (questionsSnap.size() < MIN_QUESTIONS_PER_TOPIC) {
                    Map<String, Object> deficit = new HashMap<>();
                    deficit.put("subject", subjectDoc.getId());
                    deficit.put("topic", topic);
                    deficit.put("needed", MIN_QUESTIONS_PER_TOPIC - questionsSnap.size());
                    deficitTopics.add(deficit);
                }
            }
        }
        return deficitTopics;
    }

    private List<JsonObject> generateBatchForTopic(String subject, String topic, int count) throws Exception {
        String prompt = "Ты — ведущий эксперт-методолог ЕНТ. Сгенерируй ровно " + count + " уникальных тестовых заданий по предмету \"" + subject + "\" на тему \"" + topic + "\".\n" +
                "Каждое задание должно содержать вопрос, ровно 4 варианта ответа, индекс правильного ответа (0-3) и подробный академический разбор.\n" +
                "Для математических предметов обязательно используй LaTeX-разметку внутри знаков $, оборачивая каждую формулу и переменную. Пример: $f(x) = \\\\frac{a}{b}$.\n" +
                "Распредели сложность (difficulty) заданий как: \"easy\", \"medium\", \"hard\".\n" +
                "Верни ответ строго в формате JSON по схеме: {\"questions\": [{\"question\": \"...\", \"options\": [\"...\"], \"correctIndex\": 0, \"explanation\": \"...\", \"difficulty\": \"...\"}]}";

        JsonObject responseSchema = new JsonObject();
        responseSchema.addProperty("type", "OBJECT");
        JsonObject properties = new JsonObject();
        JsonObject questionsProp = new JsonObject();
        questionsProp.addProperty("type", "ARRAY");
        JsonObject itemsProp = new JsonObject();
        itemsProp.addProperty("type", "OBJECT");
        JsonObject qProps = new JsonObject();
        qProps.add(gson.fromJson("{\"type\":\"STRING\"}", JsonObject.class), gson.fromJson("{\"type\":\"STRING\"}", JsonObject.class));
        itemsProp.add("properties", qProps);
        questionsProp.add("items", itemsProp);
        properties.add("questions", questionsProp);
        responseSchema.add("properties", properties);

        JsonObject config = new JsonObject();
        config.addProperty("responseMimeType", "application/json");
        config.addProperty("temperature", 0.2);

        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", prompt);
        JsonArray parts = new JsonArray();
        parts.add(textPart);
        JsonObject contentObj = new JsonObject();
        contentObj.add("parts", parts);
        JsonArray contents = new JsonArray();
        contents.add(contentObj);

        JsonObject requestBody = new JsonObject();
        requestBody.add("contents", contents);
        requestBody.add("generationConfig", config);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_API_URL + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        JsonObject responseJson = gson.fromJson(response.body(), JsonObject.class);
        
        List<JsonObject> list = new ArrayList<>();
        try {
            JsonArray candidates = responseJson.getAsJsonArray("candidates");
            String text = candidates.get(0).getAsJsonObject().getAsJsonObject("content").getAsJsonArray("parts").get(0).getAsJsonObject().get("text").getAsString();
            JsonObject resultJson = gson.fromJson(text, JsonObject.class);
            JsonArray questionsArray = resultJson.getAsJsonArray("questions");
            for (int i = 0; i < questionsArray.size(); i++) {
                list.add(questionsArray.get(i).getAsJsonObject());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini output");
        }
        return list;
    }

    private boolean validateQuestion(JsonObject q) {
        if (!q.has("question") || q.get("question").isJsonNull()) return false;
        if (!q.has("options") || !q.get("options").isJsonArray() || q.getAsJsonArray("options").size() != 4) return false;
        if (!q.has("correctIndex") || q.get("correctIndex").getAsInt() < 0 || q.get("correctIndex").getAsInt() > 3) return false;
        if (!q.has("explanation") || q.get("explanation").isJsonNull()) return false;
        if (!q.has("difficulty") || q.get("difficulty").isJsonNull()) return false;
        return true;
    }

    public static void main(String[] args) {
        try {
            new BankGenerator().run();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}