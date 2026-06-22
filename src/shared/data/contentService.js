import { entDatabase } from "./entBase";

export async function fetchQuestionContent(storagePath) {
  try {
    if (!storagePath) {
      throw new Error("Missing storage path");
    }
    
    const parts = storagePath.replace("gs://bank/", "").split("/");
    if (parts.length < 3) {
      throw new Error("Invalid storage path format");
    }
    
    const subjectKey = parts[0];
    const filenameWithExt = parts[2];
    const qId = filenameWithExt.replace(".json", "");
    
    const subData = entDatabase[subjectKey];
    if (!subData || !subData.questions) {
      throw new Error("Subject data not found in local database");
    }
    
    const matchedQuestion = subData.questions.find(q => q.id === qId);
    if (!matchedQuestion) {
      throw new Error("Question structure not found");
    }
    
    const themes = subData.themes || [];
    const themeObj = themes.find(t => t.id === matchedQuestion.themeId) || {};
    
    const difficultyMap = {
      "Легкий": "easy",
      "Средний": "medium",
      "Сложный": "hard"
    };
    const diffCode = difficultyMap[themeObj.difficulty] || "medium";
    
    let topic = themeObj.name || "Общая теория";
    if (topic.includes("Тригонометрические")) topic = "Тригонометрия";
    else if (topic.includes("Производная")) topic = "Производные и их применение";
    else if (topic.includes("Первообразная")) topic = "Первообразная и интеграл";
    else if (topic.includes("Казахского ханства")) topic = "Казахское ханство";
    else if (topic.includes("присоединения к России")) topic = "Казахстан в новое время";
    else if (topic.includes("Логические и комбинаторные")) topic = "Логические задачи";
    else if (topic.includes("проценты, смеси")) topic = "Проценты и пропорции";

    return {
      question: matchedQuestion.question,
      options: matchedQuestion.options,
      correctIndex: matchedQuestion.correct !== undefined ? matchedQuestion.correct : 0,
      explanation: matchedQuestion.explanation || "",
      difficulty: diffCode,
      topic: topic
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}