import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { app } from "../../app/providers/Firebase/firebase"; // Твой инициализированный инстанс firebase app

const storage = getStorage(app);

export async function fetchQuestionContent(storagePath) {
  try {
    if (!storagePath) {
      throw new Error("Missing storage path");
    }
    
    // Переводим ТЗ-путь вида gs://bank/subject/topic/qId.json в относительный путь для Cloud Storage
    const relativePath = storagePath.replace("gs://bank/", "");
    const fileRef = ref(storage, relativePath);
    
    // Получаем публичную/защищенную ссылку на скачивание JSON-файла контента
    const downloadUrl = await getDownloadURL(fileRef);
    
    // Скачиваем сам JSON-файл
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON content from storage: ${response.statusText}`);
    }
    
    const matchedQuestion = await response.json();
    
    // Форматируем маппинг сложности под интерфейс
    const difficultyMap = {
      "Легкий": "easy",
      "Средний": "medium",
      "Сложный": "hard"
    };
    const diffCode = difficultyMap[matchedQuestion.difficulty] || "medium";

    return {
      question: matchedQuestion.question,
      options: matchedQuestion.options,
      correctIndex: matchedQuestion.correctIndex !== undefined ? matchedQuestion.correctIndex : 0,
      explanation: matchedQuestion.explanation || "",
      difficulty: diffCode,
      topic: matchedQuestion.topic || "Общая теория"
    };
  } catch (error) {
    console.error("[ContentService] Error loading question from Firebase Cloud Storage:", error);
    return null;
  }
}