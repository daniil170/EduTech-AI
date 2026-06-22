import { collection, getDocs, setDoc, doc, limit, query } from "firebase/firestore";
import { curriculumProgram } from "./curriculum";
import { entDatabase } from "./entBase";

const getMappedTopic = (themeName) => {
  if (!themeName) return "Общая теория";
  if (themeName.includes("Тригонометрические")) return "Тригонометрия";
  if (themeName.includes("Производная")) return "Производные и их применение";
  if (themeName.includes("Первообразная")) return "Первообразная и интеграл";
  if (themeName.includes("Казахского ханства")) return "Казахское ханство";
  if (themeName.includes("присоединения к России")) return "Казахстан в новое время";
  if (themeName.includes("Логические и комбинаторные")) return "Логические задачи";
  if (themeName.includes("проценты, смеси")) return "Проценты и пропорции";
  return themeName;
};

export const seedCurriculumAndQuestions = async (db) => {
  try {
    const subjectsSnap = await getDocs(query(collection(db, "subjects"), limit(1)));
    if (subjectsSnap.empty) {
      for (const [subjectName, topics] of Object.entries(curriculumProgram)) {
        const lessons = topics.map((topic, index) => {
          const slug = topic.name
            .toLowerCase()
            .replace(/[^a-zа-я0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
          const subjectSlug = subjectName
            .toLowerCase()
            .replace(/[^a-zа-я0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
          const lessonId = `${subjectSlug}_${String(index + 1).padStart(2, "0")}_${slug}`;

          return {
            lessonId,
            title: topic.name,
            order: index + 1,
            unlockThreshold: index === 0 ? 0 : 70,
            topicTags: [topic.name],
            requiredCorrectPercent: 70
          };
        });

        const subjectDocRef = doc(db, "subjects", subjectName);
        await setDoc(subjectDocRef, {
          subjectId: subjectName,
          lessons
        });
      }
    }

    const questionsSnap = await getDocs(query(collection(db, "questionBank"), limit(1)));
    if (questionsSnap.empty) {
      for (const [subjectName, subData] of Object.entries(entDatabase)) {
        const themes = subData.themes || [];
        const questions = subData.questions || [];

        for (const q of questions) {
          const themeObj = themes.find(t => t.id === q.themeId) || {};
          const themeName = themeObj.name || "Общая теория";
          const topic = getMappedTopic(themeName);
          const qId = q.id || `q_${crypto.randomUUID().slice(0, 8)}`;

          const qDocRef = doc(db, "questionBank", qId);
          await setDoc(qDocRef, {
            subject: subjectName,
            topic: topic,
            difficulty: themeObj.difficulty || "Средний",
            storagePath: `gs://bank/${subjectName}/${topic}/${qId}.json`.toLowerCase(),
            isApproved: true,
            timesShown: 0,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};