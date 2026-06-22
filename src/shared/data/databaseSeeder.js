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
    // 1. Seed Curriculum Subjects
    const subjectsSnap = await getDocs(query(collection(db, "subjects"), limit(1)));
    if (subjectsSnap.empty) {
      console.log("[Seeder] Subjects collection is empty, seeding curriculum...");
      for (const [subjectName, topics] of Object.entries(curriculumProgram)) {
        const lessons = topics.map((topic, index) => {
          // Generate a clean lesson ID
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
        console.log(`[Seeder] Seeded curriculum for subject: ${subjectName}`);
      }
    } else {
      console.log("[Seeder] Subjects curriculum already seeded.");
    }

    // 2. Seed Question Bank
    const questionsSnap = await getDocs(query(collection(db, "questionBank"), limit(1)));
    if (questionsSnap.empty) {
      console.log("[Seeder] questionBank collection is empty, seeding initial gold standard questions...");
      for (const [subjectName, subData] of Object.entries(entDatabase)) {
        const themes = subData.themes || [];
        const questions = subData.questions || [];

        for (const q of questions) {
          const themeObj = themes.find(t => t.id === q.themeId) || {};
          const themeName = themeObj.name || "Общая теория";
          const topic = getMappedTopic(themeName);
          const difficultyMap = {
            "Легкий": "easy",
            "Средний": "medium",
            "Сложный": "hard"
          };
          const diffCode = difficultyMap[themeObj.difficulty] || "medium";
          const qId = q.id || `q_${crypto.randomUUID().slice(0, 8)}`;

          const qDocRef = doc(db, "questionBank", qId);
          await setDoc(qDocRef, {
            subject: subjectName,
            topic: topic,
            difficulty: diffCode,
            storagePath: `gs://bank/${subjectName}/${topic}/${qId}.json`.toLowerCase(),
            isApproved: true,
            timesShown: 0,
            createdAt: new Date().toISOString(),
            storageMockContent: {
              question: q.question,
              options: q.options,
              correctIndex: q.correct !== undefined ? q.correct : 0,
              explanation: q.explanation || "",
              difficulty: diffCode,
              topic: topic
            }
          });
          console.log(`[Seeder] Seeded question ${qId} for topic: ${topic}`);
        }
      }
    } else {
      console.log("[Seeder] questionBank already seeded.");
    }
  } catch (error) {
    console.error("[Seeder] Error during database seeding:", error);
  }
};
