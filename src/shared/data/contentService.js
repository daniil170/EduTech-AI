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

export function getLocalLessonFallback(subject, topic) {
  // Генерация контента урока (теория, формула и 3 задания)
  let theory = `### Теоретический разбор: **${topic}**\n\nВ рамках данного урока по предмету **${subject}** мы подробно изучим ключевые особенности темы **${topic}**.\n\n* **Основные определения**: Изучите базовые понятия и формулировки.\n* **Практическая применимость**: Рассмотрите типовые задачи, встречающиеся в тестах ЕНТ.\n* **Особый фокус**: Обратите внимание на каверзные вопросы и ловушки составителей тестов.`;
  let formula = "";
  let tasks;

  if (subject.includes("Математика") || subject.includes("Физика") || subject.includes("Химия")) {
    formula = "E = m \\cdot c^2 \\quad \\text{или} \\quad f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x)-f(x)}{\\Delta x}";
    tasks = [
      {
        question: `Тестовое задание по теме "${topic}" (Базовый уровень):`,
        options: ["A) Вариант 1 (верный)", "B) Вариант 2", "C) Вариант 3", "D) Вариант 4"],
        correct: 0,
        explanation: "Пошаговый разбор решения задачи базовой сложности."
      },
      {
        question: `Тестовое задание по теме "${topic}" (Средний уровень):`,
        options: ["A) Вариант 1", "B) Вариант 2 (верный)", "C) Вариант 3", "D) Вариант 4"],
        correct: 1,
        explanation: "Подробный математический разбор решения среднего уровня."
      },
      {
        question: `Тестовое задание по теме "${topic}" (Сложный уровень):`,
        options: ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3 (верный)", "D) Вариант 4"],
        correct: 2,
        explanation: "Глубокое объяснение алгоритма решения сложной задачи."
      }
    ];
  } else {
    tasks = [
      {
        question: `Какое из утверждений о теме "${topic}" является верным?`,
        options: ["A) Утверждение A (верно)", "B) Утверждение B", "C) Утверждение C", "D) Утверждение D"],
        correct: 0,
        explanation: "Подробный исторический/смысловой разбор вариантов ответа."
      },
      {
        question: `Выберите наиболее значимый фактор, характеризующий тему "${topic}":`,
        options: ["A) Второстепенная деталь", "B) Главный фактор (верный)", "C) Ошибочная характеристика", "D) Случайное совпадение"],
        correct: 1,
        explanation: "Анализ ключевых понятий и аргументов по теме."
      },
      {
        question: `Укажите верную причинно-следственную связь для процесса "${topic}":`,
        options: ["A) Неверная связь", "B) Ошибочное суждение", "C) Доказанная причинно-следственная связь (верно)", "D) Обратное влияние"],
        correct: 2,
        explanation: "Разбор логической взаимосвязи событий."
      }
    ];
  }

  return { theory, formula, tasks };
}

export async function fetchLessonContent(subject, topic) {
  try {
    const subjectSlug = subject.toLowerCase().replace(/[^a-zа-я0-9]+/g, "_");
    const topicSlug = topic.toLowerCase().replace(/[^a-zа-я0-9]+/g, "_");
    
    const fileRef = ref(storage, `lessons/${subjectSlug}/${topicSlug}.json`);
    const downloadUrl = await getDownloadURL(fileRef);
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error("Lesson file not found");
    
    return await response.json();
  } catch {
    console.warn(`[ContentService] No remote lesson file for ${subject} - ${topic}, using local fallback.`);
    return getLocalLessonFallback(subject, topic);
  }
}