import { useState, useEffect } from "react";
import { auth, db } from "../../../app/providers/Firebase/firebase";
import { GEMINI_API_KEY } from "../../../shared/config/gemini";
import { signOut } from "firebase/auth";
import { 
  generatePlanGemini, 
  generatePlanLocal, 
  calculateWeightedProgress
} from "../../../shared/data/planGenerator";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { ExamPrep } from "../../../widgets/ExamPrep";
import { MockExam } from "../../../widgets/MockExam";
import { AiLearningCore } from "../../../widgets/AiLearningCore";
import { InteractiveCalendar } from "../../../widgets/InteractiveCalendar";
import { StudentAnalytics } from "../../../widgets/StudentAnalytics/ui/StudentAnalytics";
import { FinalSimulation } from "../../../widgets/FinalSimulation";
import { CeoPanel } from "../../../widgets/CeoPanel";
import { SubscriptionModal } from "../../../features/SubscriptionModal";
import { CongratsModal } from "../../../features/CongratsModal";
import { CertificateModal } from "../../../features/CertificateModal";
import {
  generateAiPromptForSimilarTask,
  entDatabase,
} from "../../../shared/data/entBase";
import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

const getTopicsForSubject = (subjectName) => {
  const defaultTopics = {
    "История Казахстана": [
      "Древний Казахстан",
      "Средневековый Казахстан",
      "Казахское ханство",
      "Казахстан в новое время",
      "Современный Казахстан",
    ],
    "Грамотность чтения": [
      "Анализ текста",
      "Определение основной мысли",
      "Понимание контекста",
      "Смысловая структура",
      "Средства выразительности",
    ],
    "Математическая грамотность": [
      "Логические задачи",
      "Текстовые задачи",
      "Проценты и пропорции",
      "Диаграммы и графики",
      "Комбинаторика и вероятность",
    ],
    Математика: [
      "Тригонометрия",
      "Производные и их применение",
      "Первообразная и интеграл",
      "Уравнения и неравенства",
      "Стереометрия и планиметрия",
    ],
    Физика: [
      "Механика и кинематика",
      "Молекулярная физика и термодинамика",
      "Электродинамика",
      "Оптика",
      "Квантовая и ядерная физика",
    ],
    Биология: [
      "Цитология и генетика",
      "Ботаника и зоология",
      "Анатомия и физиология человека",
      "Эволюционное учение",
      "Экология и биосфера",
    ],
    Химия: [
      "Общая химия и строение атома",
      "Неорганическая химия",
      "Органическая химия",
      "Химические реакции и растворы",
      "Химическая термодинамика",
    ],
    Информатика: [
      "Алгоритмы и структуры данных",
      "Программирование на Python",
      "Базы данных и SQL",
      "Компьютерные сети и безопасность",
      "Архитектура компьютера",
    ],
    География: [
      "Физическая география",
      "Экономическая и социальная география",
      "География Казахстана",
      "Геоэкология и природопользование",
      "Политическая карта мира",
    ],
    "Всемирная история": [
      "История древнего мира",
      "История средних веков",
      "Новое время",
      "Новейшая история",
      "Мировая культура и религии",
    ],
    "Основы права": [
      "Конституционное право РК",
      "Гражданское и семейное право",
      "Трудовое и административное право",
      "Уголовное право и процесс",
      "Теория государства и права",
    ],
    "Казахский язык": [
      "Фонетика мен графика",
      "Лексикология",
      "Морфология",
      "Синтаксис",
      "Орфография және пунктуация",
    ],
    "Казахская литература": [
      "Ауыз әдебиеті және фольклор",
      "Абай және Ыбырай шығармашылығы",
      "ХХ ғасыр басындағы әдебиет",
      "Кеңес дәуіріндеги қазақ әдебиеті",
      "Қазіргі қазақ әдебиеті",
    ],
    "Русский язык": [
      "Фонетика и орфоэпия",
      "Лексика и фразеология",
      "Морфология и синтаксис",
      "Орфография и пунктуация",
      "Стилистика и культура речи",
    ],
    "Русская литература": [
      "Русская классика XIX века",
      "Литература Серебряного века",
      "Советская литература",
      "Современная русская литература",
      "Теория литературы",
    ],
  };

  const foundKey = Object.keys(defaultTopics).find(
    (key) =>
      subjectName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(subjectName.toLowerCase()),
  );

  return (
    defaultTopics[foundKey] || [
      "Общая теория",
      "Практические задачи",
      "Тестирование",
    ]
  );
};

export const Workspace = () => {
  const user = auth.currentUser;
  const userName = user?.displayName || user?.email?.split("@")[0] || "Ученик";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeExam, setActiveExam] = useState(null);

  const [onboardingStep, setOnboardingStep] = useState("select_combo");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const [studentStats, setStudentStats] = useState(() => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const cached = localStorage.getItem(
          `cached_student_stats_${currentUser.uid}`,
        );
        if (cached) return JSON.parse(cached);

        const savedGrade = localStorage.getItem("selected_grade") || "11 класс";
        const savedDaysToUnt =
          localStorage.getItem("selected_days_to_unt") || "";
        return {
          email: currentUser.email,
          role: "student",
          grade: savedGrade,
          daysToUnt: savedDaysToUnt ? parseInt(savedDaysToUnt, 10) : "",
          examType: "ЕНТ",
          profileCombination: "",
          hasPassedDiagnostic: false,
          overallProgress: 0,
          targetScore: 140,
          streakDays: 0,
          weeklyProductivity: [
            { day: "Пн", solved: 0 },
            { day: "Вт", solved: 0 },
            { day: "Ср", solved: 0 },
            { day: "Чт", solved: 0 },
            { day: "Пт", solved: 0 },
            { day: "Сб", solved: 0 },
            { day: "Вс", solved: 0 },
          ],
          subjectsMastery: [],
          attentionRequired: [],
          weeklyGoals: [
            {
              id: 1,
              text: "Решить 50 задач по Алгебре",
              current: 0,
              max: 50,
              color: "bg-indigo-600",
            },
            {
              id: 2,
              text: "Пробный тест по Истории Казахстана",
              current: 0,
              max: 1,
              color: "bg-emerald-500",
            },
            {
              id: 3,
              text: "Практические занятия (ИИ)",
              current: 0,
              max: 30,
              color: "bg-amber-500",
              isTime: false,
            },
          ],
          attentionNeeded: [],
          examPrep: {
            completedPercent: 0,
            studyPlan: [
              {
                id: "sp-1",
                name: "Основы алгебры",
                status: "upcoming",
                date: "Срок: на этой неделе",
              },
              {
                id: "sp-2",
                name: "Тригонометрические функции",
                status: "upcoming",
                date: "Срок: следующая неделя",
              },
              {
                id: "sp-3",
                name: "Дифференциальное исчисление",
                status: "upcoming",
                date: "Срок: через 2 недели",
              },
            ],
            recommendations: [],
          },
          recentActivity: [
            {
              id: "act-1",
              type: "Система",
              name: "Добро пожаловать в EduTrack AI! Начните подготовку с прохождения диагностического теста.",
              score: "+0 опыта",
              time: "Только что",
            },
          ],
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [geminiKey] = useState(
    GEMINI_API_KEY || localStorage.getItem("gemini_api_key") || "",
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isCongratsOpen, setIsCongratsOpen] = useState(false);

  useEffect(() => {
    if (user && studentStats?.tariff === "whitelisted") {
      const key = `has_seen_congrats_${user.uid}`;
      if (!localStorage.getItem(key)) {
        const timer = setTimeout(() => {
          setIsCongratsOpen(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [user, studentStats?.tariff]);

  // Real-time synchronization of whitelist premium status for current user
  useEffect(() => {
    if (!user || !user.email) return;
    
    const userEmailLower = user.email.toLowerCase();
    
    // Listen to current user's whitelist entry
    const unsubWhitelist = onSnapshot(
      doc(db, "premium_whitelist", userEmailLower),
      async (snap) => {
        if (snap.exists()) {
          // If whitelisted, ensure tariff is "whitelisted" (except for founder)
          if (studentStats && studentStats.tariff !== "whitelisted" && studentStats.role !== "founder") {
            try {
              await updateDoc(doc(db, "users", user.uid), { tariff: "whitelisted" });
            } catch (err) {
              console.error("Error updating tariff to whitelisted:", err);
            }
          }
        } else {
          // If not whitelisted, and current tariff is "whitelisted" (and not founder), revert to free
          if (studentStats && studentStats.tariff === "whitelisted" && studentStats.role !== "founder") {
            try {
              await updateDoc(doc(db, "users", user.uid), { tariff: "free" });
            } catch (err) {
              console.error("Error reverting tariff from whitelisted:", err);
            }
          }
        }
      },
      (error) => {
        user.uid && console.warn("Whitelist listener error:", error);
      }
    );

    return () => unsubWhitelist();
  }, [user, studentStats]);

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedCombo, setSelectedCombo] = useState("");
  const [onboardingSaving, setOnboardingSaving] = useState(false);

  const [localPassedDiagnostic, setLocalPassedDiagnostic] = useState(false);

  const [tasksSubject, setTasksSubject] = useState("");
  const [tasksTopic, setTasksTopic] = useState("");
  const [tasksDifficulty, setTasksDifficulty] = useState("Средний");

  const activeTasksSubject =
    tasksSubject ||
    studentStats?.subjectsMastery?.[0]?.name ||
    "История Казахстана";
  const activeTasksTopic =
    tasksTopic || getTopicsForSubject(activeTasksSubject)?.[0] || "";

  const hasProAccess =
    studentStats?.tariff === "premium" ||
    studentStats?.tariff === "ultimate" ||
    studentStats?.tariff === "whitelisted" ||
    studentStats?.role === "founder";

  const hasUltraAccess =
    studentStats?.tariff === "ultimate" ||
    studentStats?.tariff === "whitelisted" ||
    studentStats?.role === "founder";
  const [generatedTask, setGeneratedTask] = useState(null);
  const [tasksGenerating, setTasksGenerating] = useState(false);
  const [selectedTaskAns, setSelectedTaskAns] = useState(null);
  const [taskChecked, setTaskChecked] = useState(false);
  const [isTaskCorrect, setIsTaskCorrect] = useState(null);

  const [loading, setLoading] = useState(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return !localStorage.getItem(`cached_student_stats_${currentUser.uid}`);
    }
    return true;
  });

  const formatFormulaForKatex = (rawFormula) => {
    if (!rawFormula) return "";
    let clean = rawFormula.toString().trim();
    if (clean.startsWith("$$") && clean.endsWith("$$")) clean = clean.slice(2, -2);
    else if (clean.startsWith("$") && clean.endsWith("$")) clean = clean.slice(1, -1);
    if (clean.startsWith("\\[") && clean.endsWith("\\]")) clean = clean.slice(2, -2);
    if (clean.startsWith("\\(") && clean.endsWith("\\)")) clean = clean.slice(2, -2);
    return clean.trim();
  };

  const hasMathContent = (text) => {
    if (!text) return false;
    return /\\frac|\\sin|\\cos|\\tan|\\sqrt|\\pi|\\alpha|\\beta|\\gamma|\\theta|\\sum|\\int|\\infty|\\rightarrow|\\left|\\right|\\text|\^|_\{|\\cdot|\\times|\\pm|\\leq|\\geq|\\neq/.test(
      text,
    );
  };

  const renderMixedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$[^$]+\$)/g);
    
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
            try {
              return <InlineMath key={i} math={formatFormulaForKatex(part)} />;
            } catch {
              return <span key={i} className="text-amber-500">{part}</span>;
            }
          }
          
          if (hasMathContent(part)) {
            try {
              return <InlineMath key={i} math={formatFormulaForKatex(part)} />;
            } catch {
              return <span key={i}>{part}</span>;
            }
          }
          
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  const renderOptionContent = (optText) => {
    if (!optText) return null;
    const letterMatch = optText.match(/^([A-Dа-г][).]\s*)([\s\S]*)$/i);
    if (letterMatch) {
      return (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            {letterMatch[1]}
          </span>
          {renderMixedContent(letterMatch[2].trim())}
        </span>
      );
    }
    return renderMixedContent(optText);
  };

  const safeBlockMath = (formula) => {
    if (!formula) return null;
    try {
      return <BlockMath math={formatFormulaForKatex(formula)} />;
    } catch {
      return (
        <div
          style={{
            padding: "1rem",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#34d399",
          }}
        >
          {formula}
        </div>
      );
    }
  };

  const generateLocalTask = (subject, topic) => {
    const normalize = (name) => name.toLowerCase().trim();
    const foundKey = Object.keys(entDatabase).find(
      (key) =>
        normalize(key).includes(normalize(subject)) ||
        normalize(subject).includes(normalize(key)),
    );

    if (foundKey && entDatabase[foundKey].questions.length > 0) {
      const list = entDatabase[foundKey].questions;
      const matched =
        list.find((q) => q.explanation && q.explanation.includes(topic)) ||
        list[Math.floor(Math.random() * list.length)];
      return {
        question: matched.question,
        formula: matched.formula,
        sub: "Выберите правильный вариант ответа:",
        options: matched.options,
        correctIndex: matched.correct,
        explanation: matched.explanation,
      };
    }

    return {
      question: `Практический вопрос по теме "${topic}" предмета "${subject}":`,
      formula: "",
      sub: "Выберите наиболее обоснованный ответ:",
      options: [
        "A) Утверждение A верно",
        "B) Утверждение B верно",
        "C) Все варианты неверны",
        "D) Данных недостаточно",
      ],
      correctIndex: 1,
      explanation: `Подробный анализ темы "${topic}" показывает, что правильным выбором является вариант B.`,
    };
  };

  const handleGenerateTask = async () => {
    // 1. Free subject restriction
    const isFree = !studentStats?.tariff || studentStats.tariff === "free";
    const activeFreeSubName = studentStats?.activeFreeSubject || studentStats?.subjectsMastery?.[3]?.name || "Математика";
    if (isFree && activeTasksSubject !== activeFreeSubName) {
      alert(`🔒 На бесплатном тарифе доступен только предмет "${activeFreeSubName}".\nВы можете переключить его в меню выбора предметов.`);
      return;
    }

    // 2. Daily tasks limit validation
    const todayStr = new Date().toLocaleDateString("en-CA");
    const currentTasksSolved = studentStats?.lastActiveDate === todayStr ? (studentStats?.dailyTasksSolved || 0) : 0;
    const getDailyLimit = (tariff, role) => {
      if (role === "founder" || tariff === "whitelisted") return Infinity;
      if (tariff === "ultimate") return 500;
      if (tariff === "premium") return 300;
      if (tariff === "basic") return 50;
      return 15;
    };
    const limit = getDailyLimit(studentStats?.tariff, studentStats?.role);
    if (currentTasksSolved >= limit) {
      alert(`⚠️ Вы достигли дневного лимита ИИ-задач (${limit} задач).\n\nОбновление лимита произойдет завтра. Перейдите на более высокий тариф, чтобы увеличить лимит!`);
      return;
    }

    setTasksGenerating(true);
    setTaskChecked(false);
    setSelectedTaskAns(null);
    setIsTaskCorrect(null);
    setGeneratedTask(null);

    const subjectName = activeTasksSubject || "Математика";
    const topicName = activeTasksTopic || "Общая теория";

    const prompt = generateAiPromptForSimilarTask(
      subjectName,
      topicName,
      tasksDifficulty,
    );

    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );
        if (!response.ok) throw new Error("API request failed");
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        text = text
          .replace(/^```json\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        const parsedTask = JSON.parse(text);

        if (
          Object.hasOwn(parsedTask, "correct") &&
          !Object.hasOwn(parsedTask, "correctIndex")
        ) {
          parsedTask.correctIndex = parsedTask.correct;
        }

        setGeneratedTask(parsedTask);
      } catch (err) {
        console.warn("Gemini API error, fallback to local database:", err);
        setGeneratedTask(generateLocalTask(subjectName, topicName));
      } finally {
        setTasksGenerating(false);
      }
    } else {
      setTimeout(() => {
        setGeneratedTask(generateLocalTask(subjectName, topicName));
        setTasksGenerating(false);
      }, 800);
    }
  };

  const handleCheckTask = async () => {
    if (selectedTaskAns === null || !generatedTask) return;
    const isCorrect = selectedTaskAns === generatedTask.correctIndex;
    setIsTaskCorrect(isCorrect);
    setTaskChecked(true);

    if (studentStats && user) {
      const userDocRef = doc(db, "users", user.uid);
      const todayStr = new Date().toLocaleDateString("en-CA");
      const currentTasksSolved = studentStats.lastActiveDate === todayStr ? (studentStats.dailyTasksSolved || 0) : 0;

      // =========================================================
      // РАСЧЕТ ЖИВОГО ПОТЕМНОГО МАСТЕРСТВА ИЗ ТРЕНАЖЕРА
      // =========================================================
      const currentTopicMastery = studentStats?.topicMastery || {};
      const sessionResult = {
        subject: activeTasksSubject,
        topic: activeTasksTopic,
        score: isCorrect ? 1.0 : 0.0,
        totalQuestions: 1
      };

      const { updateTopicMasteryAfterSession, syncPlanStatusesWithMastery, calculateWeightedProgress } = await import("../../../shared/data/planGenerator");
      const { updatedMastery: liveMastery } = updateTopicMasteryAfterSession(currentTopicMastery, sessionResult);
      
      const currentStudyPlan = studentStats?.examPrep?.studyPlan || [];
      const updatedStudyPlan = syncPlanStatusesWithMastery(currentStudyPlan, liveMastery);
      
      const nextPlanPercent = calculateWeightedProgress(updatedStudyPlan);

      const updateData = {
        dailyTasksSolved: currentTasksSolved + 1,
        lastActiveDate: todayStr,
        "topicMastery": liveMastery,
        "studentStats.topicMastery": liveMastery,
        "examPrep.studyPlan": updatedStudyPlan,
        "examPrep.completedPercent": nextPlanPercent,
        "examPrep.updatedAt": new Date().toISOString()
      };

      if (isCorrect) {
        const nextProgress = Math.min(
          (studentStats.overallProgress || 0) + 2,
          100,
        );
        const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
        const currentDay = days[new Date().getDay()];
        const updatedProductivity = (studentStats.weeklyProductivity || []).map(
          (d) =>
            d.day === currentDay
              ? { ...d, solved: Math.min((d.solved || 0) + 10, 100) }
              : d,
        );
        const updatedMastery = (studentStats.subjectsMastery || []).map(
          (sub) => {
            if (sub.name !== activeTasksSubject) return sub;
            const nextProg = Math.min((sub.progress || 0) + 5, 100);
            return {
              ...sub,
              progress: nextProg,
              level:
                nextProg >= 80
                  ? "Продвинутый"
                  : nextProg >= 40
                    ? "Средний"
                    : "Базовый",
            };
          },
        );
        const updatedGoals = (studentStats.weeklyGoals || []).map((goal) => {
          if (goal.id === 1 && (activeTasksSubject.toLowerCase().includes("матем") || activeTasksSubject.toLowerCase().includes("алгебр"))) {
            return { ...goal, current: Math.min((goal.current || 0) + 1, goal.max) };
          }
          if (goal.id === 3) {
            return { ...goal, current: Math.min((goal.current || 0) + 1, goal.max) };
          }
          return goal;
        });

        Object.assign(updateData, {
          overallProgress: nextProgress,
          weeklyProductivity: updatedProductivity,
          subjectsMastery: updatedMastery,
          weeklyGoals: updatedGoals,
          recentActivity: [
            {
              id: crypto.randomUUID(),
              type: "Практика",
              name: `Решена задача ИИ по теме: ${activeTasksTopic}`,
              score: "+150 опыта",
              time: "Только что",
            },
            ...(studentStats.recentActivity || []).slice(0, 4),
          ],
        });
      } else {
        const currentAttention = studentStats.attentionNeeded || [];
        if (!currentAttention.some((item) => item.topic === activeTasksTopic)) {
          Object.assign(updateData, {
            attentionNeeded: [
              {
                id: `need-${crypto.randomUUID().slice(0, 6)}`,
                subject: activeTasksSubject,
                topic: activeTasksTopic,
                type: "Практика",
                urgency:
                  tasksDifficulty === "Сложный" ? "Высокий" : "Средний",
              },
              ...currentAttention.slice(0, 3),
            ],
          });
        }
      }

      try {
        await updateDoc(userDocRef, updateData);
        console.log("[Trainer Engine] Результат одиночной задачи успешно зафиксирован в теме кодификатора.");
      } catch (err) {
        console.error("Ошибка обновления данных в Firestore:", err);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudentStats(data);
          if (data.hasPassedDiagnostic) {
            setLocalPassedDiagnostic(true);
          }
          try {
            localStorage.setItem(
              `cached_student_stats_${user.uid}`,
              JSON.stringify(data),
            );
          } catch (e) {
            console.error("Failed to cache student stats:", e);
          }
          setLoading(false);
          clearTimeout(timer);
        }
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setLoading(false);
        clearTimeout(timer);
      },
    );

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [user]);

  const handleFinishDiagnostic = async (scorePercent, combo, topicBreakdown) => {
    if (!user) return;
    setOnboardingStep("generating_plan");
    setOnboardingSaving(true);

    const subjectsMap = {
      "Математика – Физика": ["Математика", "Физика"],
      "Биология – Химия": ["Биология", "Химия"],
      "Математика – Информатика": ["Математика", "Информатика"],
      "География – Иностранный язык": ["География", "Иностранный язык"],
      "Биология – География": ["Биология", "География"],
      "Всемирная история – География": ["Всемирная история", "География"],
      "Всемирная история – Основы права": ["Всемирная история", "Основы права"],
      "Казахский язык – Казахская литература": ["Казахский язык", "Казахская литература"],
      "Русский язык – Русская литература": ["Русский язык", "Русская литература"],
      "Творческий экзамен": ["Творческий экзамен 1", "Творческий экзамен 2"],
    };

    const profileSubs = subjectsMap[combo] || ["Математика", "Физика"];
    const allCurrentSubjects = [
      "История Казахстана",
      "Грамотность чтения",
      "Математическая грамотность",
      ...profileSubs,
    ];

    try {
      const userRef = doc(db, "users", user.uid);
      const now = Date.now();

      // ==========================================
      // ФОРМИРОВАНИЕ ИНДИВИДУАЛЬНОЙ TOPIC MASTERY MAP
      // ==========================================
      const targetTopicMastery = {};

      allCurrentSubjects.forEach((subjectName) => {
        targetTopicMastery[subjectName] = {};
        const incomingSubjectData = topicBreakdown?.[subjectName] || {};
        const staticTopics = getTopicsForSubject(subjectName);
        
        staticTopics.forEach((topicName) => {
          const initialLevel = incomingSubjectData[topicName] !== undefined 
            ? Number(incomingSubjectData[topicName]) 
            : 0.0;

          targetTopicMastery[subjectName][topicName] = {
            level: initialLevel,
            attempts: 1,
            lastTested: new Date(now).toISOString()
          };
        });
      });

      // ==========================================
      // РАСЧЕТ SUBJECTS MASTERY ДЛЯ ИНТЕРФЕЙСА ДАШБОРДА
      // ==========================================
      const updatedSubjectsMastery = allCurrentSubjects.map((subjectName, idx) => {
        const topics = targetTopicMastery[subjectName];
        const totalTopics = Object.keys(topics).length;
        const sumLevels = Object.values(topics).reduce((sum, t) => sum + t.level, 0);
        const avgPercent = totalTopics > 0 ? Math.round((sumLevels / totalTopics) * 100) : 0;

        let color = "bg-indigo-500";
        let icon = "📚";
        if (subjectName.includes("История")) { color = "bg-emerald-500"; icon = "🕌"; }
        else if (subjectName.includes("чтения")) { color = "bg-teal-500"; icon = "📖"; }
        else if (subjectName.includes("грамотность")) { color = "bg-indigo-500"; icon = "📐"; }
        else if (idx === 3) { color = "bg-blue-600"; icon = "🧬"; }
        else if (idx === 4) { color = "bg-purple-600"; icon = "⚡"; }

        return {
          id: `sub-${idx + 1}-${now}`,
          name: subjectName,
          level: avgPercent >= 75 ? "Продвинутый" : avgPercent >= 40 ? "Средний" : "Базовый",
          progress: avgPercent,
          color,
          icon
        };
      });

      // ==========================================
      // АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ И ПЛАН СРАЗУ ПОСЛЕ ТЕСТА
      // ==========================================
      const studentStatsMock = {
        grade: studentStats?.grade || "11 класс",
        daysToUnt: studentStats?.daysToUnt || 180,
        dailyBudgetMinutes: studentStats?.dailyBudgetMinutes || 120,
        subjectsMastery: updatedSubjectsMastery,
        topicMastery: targetTopicMastery
      };

      let generatedPlanResult;
      if (geminiKey) {
        generatedPlanResult = await generatePlanGemini(studentStatsMock, geminiKey, null);
      } else {
        generatedPlanResult = generatePlanLocal(studentStatsMock, null);
      }

      const nextPercent = calculateWeightedProgress(generatedPlanResult.studyPlan);

      // ==========================================
      // СОХРАНЕНИЕ ДАННЫХ И ИНИЦИАЛИЗАЦИЯ КАЛЕНДАРЯ В FIREBASE
      // ==========================================
      const batch = writeBatch(db);
      const today = new Date();

      const flatWeakestTopics = [];
      Object.keys(targetTopicMastery).forEach(sub => {
        Object.keys(targetTopicMastery[sub]).forEach(top => {
          flatWeakestTopics.push({ sub, top, level: targetTopicMastery[sub][top].level });
        });
      });
      flatWeakestTopics.sort((a, b) => a.level - b.level);

      for (let i = 0; i < 4; i++) {
        const targetDay = new Date(today);
        targetDay.setDate(today.getDate() + (i + 1));
        const dateStr = targetDay.toISOString().split("T")[0];

        const recommendation = flatWeakestTopics[i % flatWeakestTopics.length];

        const calendarRef = doc(collection(db, "calendar"));
        batch.set(calendarRef, {
          title: `AI Урок: ${recommendation.top}`,
          subject: recommendation.subject,
          topic: recommendation.top,
          time: "16:00",
          date: dateStr,
          type: "lesson",
          completed: false,
          studentId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      const initialGoals = [
        { id: 1, text: `Решить 30 задач по теме ${profileSubs[0]}`, current: 0, max: 30, color: "bg-blue-600" },
        { id: 2, text: `Отработать тему по теме ${profileSubs[1]}`, current: 0, max: 30, color: "bg-purple-600" },
        { id: 3, text: "Решить тест по Истории Казахстана", current: 0, max: 1, color: "bg-emerald-500" },
      ];

      batch.update(userRef, {
        profileCombination: combo,
        hasPassedDiagnostic: true,
        subjectsMastery: updatedSubjectsMastery,
        weeklyGoals: initialGoals,
        overallProgress: Math.round(scorePercent / 3),
        "studentStats.topicMastery": targetTopicMastery,
        "topicMastery": targetTopicMastery,
        examPrep: {
          studyPlan: generatedPlanResult.studyPlan,
          recommendations: generatedPlanResult.recommendations,
          completedPercent: nextPercent,
          planVersion: 1,
          dailyBudgetMinutes: studentStatsMock.dailyBudgetMinutes,
          updatedAt: new Date(now).toISOString()
        },
        recentActivity: [
          {
            id: crypto.randomUUID(),
            type: "Система",
            name: `Пройдена стартовая ИИ-диагностика (Результат: ${scorePercent}%). Потемная матрица знаний и Календарь успешно сформированы!`,
            score: "+500 опыта",
            time: "Только что",
          },
          ...(studentStats?.recentActivity || []).slice(0, 4),
        ],
      });

      await batch.commit();

      setTasksSubject(profileSubs[0]);
      setTasksTopic(getTopicsForSubject(profileSubs[0])[0]);
      setLocalPassedDiagnostic(true);

    } catch (err) {
      console.error("Ошибка автопланирования при диагностике:", err);
      alert("Ошибка записи в базу данных. Убедитесь в стабильности подключения к Firebase.");
      setOnboardingStep("select_combo");
    } finally {
      setOnboardingSaving(false);
    }
  };

  const handleAiAutoSchedule = async () => {
    if (!user || !studentStats) return;

    const weakSubjects = [...(studentStats.subjectsMastery || [])].sort(
      (a, b) => (a.progress || 0) - (b.progress || 0),
    );

    if (weakSubjects.length === 0) {
      alert("Пожалуйста, сначала выберите направление ЕНТ.");
      return;
    }

    try {
      const today = new Date();
      let scheduledCount = 3;
      let messageSuffix = "на ближайшие 3 дня";

      if (studentStats.grade === "11 класс") {
        const days = parseInt(studentStats.daysToUnt, 10) || 120;
        if (days < 30) {
          scheduledCount = 7;
          messageSuffix =
            "на каждый день следующей недели (высокая интенсивность, ЕНТ уже близко!)";
        } else if (days < 90) {
          scheduledCount = 5;
          messageSuffix = "на ближайшие 5 дней (средняя интенсивность)";
        } else {
          scheduledCount = 4;
          messageSuffix = "на ближайшие 4 дня (базовая интенсивность)";
        }
      } else if (studentStats.grade === "10 класс") {
        scheduledCount = 3;
        messageSuffix = "на ближайшие 3 дня (плановое повторение)";
      } else {
        scheduledCount = 2;
        messageSuffix = "на ближайшие 2 дня (мягкий режим)";
      }

      // 1. Попытка сгенерировать детальное расписание через реальный ИИ Gemini
      if (geminiKey) {
        try {
          const daysLeftText = studentStats.daysToUnt ? ` (осталось дней до ЕНТ: ${studentStats.daysToUnt})` : "";
          const prompt = `Спланируй детальное расписание ЕНТ-подготовки для ученика ${studentStats.grade}${daysLeftText}.
Ученик имеет следующие предметы и текущую успеваемость:
${weakSubjects.map(s => `- ${s.name}: ${s.progress}% освоения`).join("\n")}

Твоя задача — сгенерировать ровно ${scheduledCount} учебных занятий на ближайшие дни (начиная с сегодня).
Для каждого занятия выбери конкретный предмет из списка слабых предметов, выбери конкретную тему, подходящую для ЕНТ, определи тип активности (например: 'Разбор теории', 'Практика задач', 'Тестирование', 'Работа над ошибками') и укажи время (в диапазоне с 14:00 до 20:00, например: '15:30').
Сделай заголовки занятий («title») мотивирующими и предметно-ориентированными (например, 'Разбор формул: Синусы и Косинусы', 'Практика ЕНТ: Образование Казахского ханства' вместо общего 'AI Отработка').

Ответ верни строго в формате JSON без markdown-разметки (без \`\`\`json):
{
  "schedule": [
    {
      "dateOffset": 0, 
      "subject": "Название предмета",
      "topic": "Название темы",
      "title": "Тип активности: Название темы",
      "time": "ЧЧ:ММ"
    }
  ]
}`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (!response.ok) throw new Error("API call failed");
          const resData = await response.json();
          let text = resData.candidates[0].content.parts[0].text;
          text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
          const parsed = JSON.parse(text);

          if (parsed.schedule && parsed.schedule.length > 0) {
            const batch = writeBatch(db);
            parsed.schedule.forEach(item => {
              const targetDay = new Date(today);
              targetDay.setDate(today.getDate() + (item.dateOffset || 0));
              const dateStr = targetDay.toISOString().split("T")[0];

              const docRef = doc(collection(db, "calendar"));
              batch.set(docRef, {
                title: item.title,
                subject: item.subject,
                topic: item.topic,
                time: item.time || "15:00",
                date: dateStr,
                type: "lesson",
                completed: false,
                studentId: user.uid,
                createdAt: new Date().toISOString()
              });
            });

            await batch.commit();
            alert(
              `🤖 AI успешно спланировал детальное расписание ${messageSuffix} по вашим слабым темам! Проверьте календарь.`
            );
            return;
          }
        } catch (err) {
          console.warn("AI Auto-schedule error, falling back to local generation:", err);
        }
      }

      // 2. Локальный генератор (работает бесплатно / оффлайн) с детализированными заголовками
      const actions = ["Практика ЕНТ", "Теория и формулы", "Тестирование", "Работа над ошибками"];
      const batch = writeBatch(db);

      for (let i = 0; i < scheduledCount; i++) {
        const targetDay = new Date(today);
        targetDay.setDate(today.getDate() + i);
        const dateStr = targetDay.toISOString().split("T")[0];

        const sub = weakSubjects[i % weakSubjects.length];
        const topics = getTopicsForSubject(sub.name);
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const action = actions[i % actions.length];

        const docRef = doc(collection(db, "calendar"));
        batch.set(docRef, {
          title: `${action}: ${topic}`,
          subject: sub.name,
          topic: topic,
          time: "15:00",
          date: dateStr,
          type: "lesson",
          completed: false,
          studentId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      await batch.commit();

      alert(
        `🤖 С учетом того, что вы учитесь в ${studentStats.grade}${studentStats.daysToUnt ? ` и до ЕНТ осталось всего ${studentStats.daysToUnt} дн.` : ""}, AI спланировал тренировки ${messageSuffix} по вашим слабым темам! Проверьте календарь.`,
      );
    } catch (err) {
      console.error("Ошибка авто-планирования:", err);
      alert("Произошла ошибка при создании AI-плана.");
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "calendar"), where("studentId", "==", user.uid)),
      (snap) => {
        const list = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setCalendarEvents(list);
      },
    );
    return () => unsubscribe();
  }, [user]);

  // Smart CTA: determines next recommended action
  const getSmartNextStep = () => {
    if (!studentStats?.hasPassedDiagnostic) {
      return {
        icon: "🧪",
        label: "Начать диагностику",
        title: "Пройди стартовую диагностику",
        desc: "ИИ проанализирует уровень знаний и составит персональный план.",
        action: () => setOnboardingStep("diagnostic_test"),
        color: "from-violet-600 to-indigo-600",
      };
    }
    const plan = studentStats?.examPrep?.studyPlan || [];
    const unfinished = plan.filter((t) => t.status !== "completed");
    if (unfinished.length > 0) {
      const top = unfinished[0];
      return {
        icon: "📖",
        label: "Продолжить обучение",
        title: top.name,
        desc: top.date || "Следующая тема по плану подготовки к ЕНТ.",
        action: () => {
          const subj = studentStats?.subjectsMastery?.[0]?.name || "История Казахстана";
          setTasksSubject(subj);
          setTasksTopic(top.name);
          setActiveTab("tasks");
        },
        color: "from-indigo-600 to-blue-600",
      };
    }
    return {
      icon: "🏁",
      label: "Финальная аттестация",
      title: "Все темы освоены!",
      desc: "Пройди финальную симуляцию ЕНТ и получи сертификат.",
      action: () => setOnboardingStep("final_exam"),
      color: "from-emerald-600 to-teal-600",
    };
  };

  const smartStep = getSmartNextStep();
  const handleLogout = () => signOut(auth);

  // Derived dashboard values
  const is11Grade = studentStats?.grade === "11 класс";
  const isJuniorGrade =
    studentStats?.grade === "9 класс" || studentStats?.grade === "10 класс";

  // Score forecast (140-point scale)
  const profileSubjects = (studentStats?.subjectsMastery || []).filter(
    (s) => s.id === "profile_1" || s.id === "profile_2"
  );
  const mandatorySubjects = (studentStats?.subjectsMastery || []).filter(
    (s) => s.id !== "profile_1" && s.id !== "profile_2"
  );
  const forecastScore = (() => {
    if (!studentStats?.subjectsMastery?.length) return 0;
    const profilePts = profileSubjects.reduce(
      (sum, s) => sum + Math.round(((s.progress || 0) / 100) * 50),
      0
    );
    const mandatoryWeights = [20, 10, 10];
    const mandatoryPts = mandatorySubjects
      .slice(0, 3)
      .reduce(
        (sum, s, i) =>
          sum + Math.round(((s.progress || 0) / 100) * (mandatoryWeights[i] || 10)),
        0
      );
    return profilePts + mandatoryPts;
  })();

  // Average mastery for 9-10 graders
  const avgMastery =
    studentStats?.subjectsMastery?.length
      ? Math.round(
          studentStats.subjectsMastery.reduce((s, x) => s + (x.progress || 0), 0) /
            studentStats.subjectsMastery.length
        )
      : 0;

  // Last 28 days activity grid
  const activityGrid = (() => {
    const grid = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const streakDays = studentStats?.streakDays || 0;
      const isActive = i < streakDays;
      grid.push({ date: dateStr, active: isActive });
    }
    return grid;
  })();

  // Top 3 study-plan topics (not completed) for dashboard
  const topPlanTopics = (studentStats?.examPrep?.studyPlan || [])
    .filter((t) => t.status !== "completed")
    .slice(0, 3);

  // Alerts
  const needsReviewTopics = (studentStats?.attentionNeeded || []).filter(
    (t) => t.status === "needs_review"
  );
  const hasOverdueTopics = needsReviewTopics.length > 0 || (studentStats?.attentionNeeded?.length || 0) > 3;

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans select-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600 rounded-full filter blur-[100px] animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full filter blur-[100px] animate-pulse pointer-events-none"></div>

        <div className="relative flex flex-col items-center z-10">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 border-r-indigo-500 animate-spin [animation-duration:1.2s] premium-glow"></div>
            <div className="absolute inset-2.5 rounded-full border-[3px] border-purple-500/10 border-b-purple-500 border-l-purple-500 animate-spin [animation-duration:1.8s] [animation-direction:reverse]"></div>
            <div className="absolute inset-5.5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center premium-glow-cyan shadow-indigo-500/40">
              <svg
                className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center text-center px-4">
            <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200">
              EduTrack <span className="text-indigo-400">AI</span>
            </h2>
            <p className="text-[11px] text-indigo-300/60 font-semibold tracking-wider uppercase mt-1">
              Настройка траектории обучения
            </p>
            <p className="text-xs text-slate-400 font-medium tracking-wide animate-pulse mt-4 max-w-[280px]">
              Синхронизация вашей траектории обучения и расписания...
            </p>
          </div>

          <div className="h-[2px] w-36 bg-slate-900 rounded-full overflow-hidden mt-6 relative">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-50 to-cyan-400 rounded-full animate-progress-width"></div>
          </div>
        </div>
      </div>
    );
  }

  if (
    studentStats &&
    !studentStats.hasPassedDiagnostic &&
    !localPassedDiagnostic
  ) {
    if (onboardingStep === "select_combo") {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-12 font-sans relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>

          <header className="relative z-10 flex items-center justify-between w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2 font-black text-xl tracking-tight cursor-pointer">
              <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm">
                E
              </span>
              EduTrack <span className="text-indigo-500">ЕНТ AI</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              Выйти
            </button>
          </header>

          <main className="relative z-10 max-w-4xl w-full mx-auto my-auto py-12 flex flex-col items-center text-center space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Начало пути к 140 баллам
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
                Выбери своё направление ЕНТ
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                На основе твоего выбора AI построит индивидуальный plan занятий,
                расписание в календаре и сгенерирует задачи для тренировок.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full pt-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { name: "Математика – Физика", desc: "Инженерия, IT, Строительство", icon: "⚙️" },
                { name: "Биология – Химия", desc: "Медицина, Биоинженерия, Экология", icon: "🧬" },
                { name: "Математика – Информатика", desc: "Программирование, Анализ данных, IT", icon: "💻" },
                { name: "География – Иностранный язык", desc: "Туризм, Международные отношения", icon: "🌍" },
                { name: "Биология – География", desc: "Агрономия, Геология", icon: "🌱" },
                { name: "Всемирная история – География", desc: "Геополитика, Регионоведение", icon: "🗺️" },
                { name: "Всемирная история – Основы права", desc: "Юриспруденция, Правоохрана", icon: "⚖️" },
                { name: "Казахский язык – Казахская литература", desc: "Филология, Журналистика", icon: "✍️" },
                { name: "Русский язык – Русская литература", desc: "Русская филология, Педагогика", icon: "📚" },
                { name: "Творческий экзамен", desc: "Дизайн, Искусство, Спорт", icon: "🎨" },
              ].map((combo) => (
                <button
                  key={combo.name}
                  disabled={onboardingSaving}
                  onClick={() => setSelectedCombo(combo.name)}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 group relative overflow-hidden ${
                    selectedCombo === combo.name
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-2xl">{combo.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{combo.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{combo.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setOnboardingStep("diagnostic_test")}
              disabled={!selectedCombo || onboardingSaving}
              className={`w-full max-w-sm py-3.5 rounded-2xl text-xs font-black shadow-xl transition-all ${
                selectedCombo && !onboardingSaving
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60"
              }`}
            >
              Перейти к диагностическому тесту
            </button>
          </main>
          <footer className="text-center text-[10px] text-slate-500 relative z-10">
            EduTrack ЕНТ AI. Подготовка к Единому Национальному Тестированию.
          </footer>
        </div>
      );
    }

    if (onboardingStep === "diagnostic_test") {
      return (
        <MockExam
          subject={selectedCombo}
          examTitle="Стартовый диагностический тест (Анализ уровня знаний)"
          userName={userName}
          questionsCount={5}
          timeLimit={15}
          geminiKey={geminiKey}
          onClose={() => setOnboardingStep("select_combo")}
          onFinish={async (scorePercent) => {
            await handleFinishDiagnostic(scorePercent, selectedCombo);
          }}
        />
      );
    }

    if (onboardingStep === "final_exam") {
      if (!hasUltraAccess) {
        alert("🔒 Режим симуляции ЕНТ доступен только на тарифе Ultra.\n\nПожалуйста, обновите тариф в разделе Подписка!");
        setOnboardingStep("");
        return null;
      }
      return (
        <FinalSimulation
          combo={studentStats?.profileCombination || "Математика и Физика"}
          userName={userName}
          geminiKey={geminiKey}
          onClose={() => setOnboardingStep("")}
          onFinish={async (score, analysis) => {
            if (user) {
              try {
                await updateDoc(doc(db, "users", user.uid), {
                  finalExamScore: score,
                  finalExamAnalysis: analysis,
                  finalExamPassedAt: new Date().toISOString()
                });
              } catch (err) {
                console.error("Error saving final exam score:", err);
              }
            }
            setOnboardingStep("");
          }}
        />
      );
    }

    if (onboardingStep === "generating_plan") {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-black tracking-wide text-indigo-400 animate-pulse">
            ИИ рассчитывает персональную матрицу знаний...
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
            Мы анализируем результаты твоей диагностики, заполняем адаптивный
            умный календарь и оптимизируем темы тренировок.
          </p>
        </div>
      );
    }
  }

  if (activeExam) {
    return (
      <MockExam
        subject={activeExam.subject}
        topic={activeExam.topic}
        userName={userName}
        examId={activeExam.id}
        questionsCount={activeExam.questionsCount}
        timeLimit={activeExam.timeLimit}
        examTitle={activeExam.title}
        geminiKey={geminiKey}
        onClose={() => setActiveExam(null)}
        onFinish={async (scorePercent, grade, examId) => {
          setActiveExam(null);
          if (studentStats && user) {
            const nextProgress = Math.min(
              (studentStats.overallProgress || 0) + 6,
              100,
            );
            const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
            const currentDay = days[new Date().getDay()];
            const updatedProductivity = (
              studentStats.weeklyProductivity || []
            ).map((d) =>
              d.day === currentDay
                ? { ...d, solved: Math.min((d.solved || 0) + 25, 100) }
                : d,
            );
            const targetSubject = activeExam.subject;
            const updatedMastery = (studentStats.subjectsMastery || []).map(
              (sub) => {
                if (
                  !sub.name
                    .toLowerCase()
                    .includes(targetSubject.toLowerCase()) &&
                  !targetSubject.toLowerCase().includes(sub.name.toLowerCase())
                ) {
                  return sub;
                }
                const nextProg = Math.min((sub.progress || 0) + 15, 100);
                return {
                  ...sub,
                  progress: nextProg,
                  level:
                    nextProg >= 80
                      ? "Продвинутый"
                      : nextProg >= 40
                        ? "Средний"
                        : "Базовый",
                };
              },
            );
            let nextAttentionRequired = studentStats.attentionRequired || [];
            if (scorePercent < 75) {
              const subjectName = targetSubject;
              const topicName = activeExam.topic || "Общая практика";
              if (
                !nextAttentionRequired.some((item) => item.topic === topicName)
              ) {
                nextAttentionRequired = [
                  {
                    id: `req-${crypto.randomUUID().slice(0, 6)}`,
                    subject: subjectName,
                    topic: topicName,
                    accuracy: scorePercent,
                  },
                  ...nextAttentionRequired.slice(0, 2),
                ];
              }
            }
            const updatedGoals = (studentStats.weeklyGoals || []).map((goal) => {
              if (goal.id === 2) {
                return { ...goal, current: Math.min((goal.current || 0) + 1, goal.max) };
              }
              return goal;
            });
            try {
              await updateDoc(doc(db, "users", user.uid), {
                overallProgress: nextProgress,
                weeklyProductivity: updatedProductivity,
                subjectsMastery: updatedMastery,
                attentionRequired: nextAttentionRequired,
                weeklyGoals: updatedGoals,
                recentActivity: [
                  {
                    id: crypto.randomUUID(),
                    type: "Экзамен",
                    name: `Сдан школьный тест: ${activeExam.title || "Проверочная работа"}`,
                    score: `Результат: ${scorePercent}% (Оценка ${grade})`,
                    time: "Только что",
                  },
                  ...(studentStats.recentActivity || []).slice(0, 4),
                ],
              });
              if (examId) {
                await addDoc(collection(db, "exam_results"), {
                  examId,
                  examTitle: activeExam.title || "Проверочная работа",
                  studentId: user.uid,
                  studentName: userName,
                  studentEmail: user.email,
                  scorePercent,
                  grade,
                  submittedAt: new Date().toISOString(),
                });
              }
            } catch (e) {
              console.error(e);
            }
          }
          setActiveTab("dashboard");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans text-slate-900 w-full antialiased">
      <aside className="w-64 bg-white border-r border-slate-200/60 p-6 flex flex-col justify-between hidden lg:flex sticky top-0 h-screen z-30">
        <div className="space-y-8">
          <div>
            <div
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-2 font-black text-xl tracking-tight cursor-pointer"
            >
              <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm">
                E
              </span>
              EduTrack <span className="text-indigo-600">ЕНТ AI</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-2 rounded-xl w-fit">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {studentStats?.grade || "11 класс"} •{" "}
                  {studentStats?.examType || "ЕНТ"}
                </p>
              </div>
              {!!studentStats?.daysToUnt && (
                <div className="text-[9px] text-indigo-600 font-bold bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/40">
                  🗓️ До ЕНТ: {studentStats.daysToUnt} дн.
                </div>
              )}
            </div>
          </div>
          <nav className="space-y-1">
            {[
              { id: "dashboard", icon: "📊", label: "Личный Дашборд" },
              { id: "tasks", icon: "🤖", label: "ИИ-Тренажер Задач" },
              { id: "ai_lessons", icon: "🧠", label: "ИИ-Уроки и Пробники" },
              { id: "exam_prep", icon: "🎓", label: "План Подготовки" },
              { id: "calendar", icon: "📅", label: "Расписание" },
              { id: "progress", icon: "📈", label: "Аналитика ИИ" },
              ...(studentStats?.role === "founder" || user?.email?.toLowerCase() === "daniilivakin30@gmail.com"
                ? [{ id: "ceo_panel", icon: "🔑", label: "Панель CEO" }]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === tab.id ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-1.5 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
          >
            <span>💳</span> Подписка
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-1.5 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition"
          >
            <span>🚪</span> Выйти
          </button>
          <div className="pt-2 text-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            developed by Ivakin Daniil
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200/60 bg-white px-8 flex items-center justify-between sticky top-0 z-20">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            {activeTab === "dashboard"
              ? "Рабочая область"
              : activeTab === "tasks"
                ? "Тренажер"
                : "Раздел"}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-700 transition"
              title="Переключить тему"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/40 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-700">{userName}</span>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-6xl w-full mx-auto flex-1">
          {activeTab === "forecast" && (() => {
            if (!hasUltraAccess) {
              return (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl shadow-slate-200/40 select-none">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-indigo-100 shadow-sm">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">ИИ-Прогноз балла ЕНТ</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Функция прогнозирования финального балла ЕНТ на основе вашей успеваемости доступна только на тарифе <span className="text-indigo-600 font-bold">Ultra</span>.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setActiveTab("dashboard");
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-200 cursor-pointer"
                      >
                        ⚡ Перейти на тариф Ultra
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500 text-sm"
                  >
                    ← Назад
                  </button>
                  <h1 className="text-xl font-black text-slate-900">📊 Подробный ИИ-прогноз балла ЕНТ</h1>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Прогнозируемый результат</p>
                    <p className="text-6xl font-black text-indigo-600">{forecastScore}</p>
                    <p className="text-sm text-slate-400">из 140 баллов</p>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${(forecastScore / 140) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profileSubjects.map((s) => {
                      const pts = Math.round(((s.progress || 0) / 100) * 50);
                      return (
                        <div key={s.id} className="border border-indigo-100 bg-indigo-50/30 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-indigo-800">{s.name}</p>
                            <span className="text-xs font-mono font-bold text-indigo-600">{pts}/50 пт</span>
                          </div>
                          <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${s.progress || 0}%` }} />
                          </div>
                          <p className="text-[10px] text-indigo-500">Освоено: {s.progress || 0}%</p>
                        </div>
                      );
                    })}
                    {mandatorySubjects.slice(0, 3).map((s, i) => {
                      const weights = [20, 10, 10];
                      const pts = Math.round(((s.progress || 0) / 100) * (weights[i] || 10));
                      return (
                        <div key={s.id} className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-slate-700">{s.name}</p>
                            <span className="text-xs font-mono font-bold text-slate-500">{pts}/{weights[i] || 10} пт</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-slate-500 h-full rounded-full" style={{ width: `${s.progress || 0}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400">Освоено: {s.progress || 0}%</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border border-amber-100 bg-amber-50/50 p-4 rounded-2xl">
                    <p className="text-xs font-black text-amber-800 mb-1">🔢 Формула расчёта ЕНТ</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Профильный предмет 1 (макс. 50 пт) + Профильный предмет 2 (макс. 50 пт) +
                      История Казахстана (макс. 20 пт) + Грамотность чтения (макс. 10 пт) +
                      Математическая грамотность (макс. 10 пт) = 140 баллов
                    </p>
                  </div>
                  <div className="border border-rose-100 bg-rose-50/30 p-4 rounded-2xl">
                    <p className="text-xs font-black text-rose-700 mb-1">📉 Упущенные баллы</p>
                    <p className="text-[11px] text-rose-600 leading-relaxed">
                      При текущем прогрессе вы теряете примерно{" "}
                      <span className="font-black">{140 - forecastScore} баллов</span> из 140.
                      Продолжайте отрабатывать темы, чтобы повысить прогноз.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "simulation_results" && (() => {
            if (!hasUltraAccess) {
              return (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl shadow-slate-200/40 select-none">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-indigo-100 shadow-sm">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">Анализ результатов симуляции</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Подробный разбор финальной аттестации и расчет вероятности сдачи доступны только на тарифе <span className="text-indigo-600 font-bold">Ultra</span>.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setActiveTab("dashboard");
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-200 cursor-pointer"
                      >
                        ⚡ Перейти на тариф Ultra
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500 text-sm"
                  >
                    ← Назад
                  </button>
                  <h1 className="text-xl font-black text-slate-900">🎓 Подробный разбор симуляции ЕНТ</h1>
                </div>
                {studentStats?.finalExamScore !== undefined ? (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Итоговый результат</p>
                        <p className="text-4xl font-black text-emerald-600">{studentStats.finalExamScore} / 140</p>
                      </div>
                      <button
                        onClick={() => setIsCertificateOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md animate-pulse"
                      >
                        🏆 Получить сертификат
                      </button>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                        style={{ width: `${(studentStats.finalExamScore / 140) * 100}%` }}
                      />
                    </div>
                    {studentStats.finalExamAnalysis && (
                      <div className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl">
                        <p className="text-xs font-black text-slate-600 mb-2">📋 Анализ от ИИ-наставника</p>
                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {studentStats.finalExamAnalysis}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-12 shadow-sm text-center space-y-4">
                    <p className="text-4xl">📝</p>
                    <p className="text-sm font-bold text-slate-700">Вы ещё не проходили финальную симуляцию</p>
                    <button
                      onClick={() => setOnboardingStep("final_exam")}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-indigo-700 transition"
                    >
                      🚀 Начать симуляцию ЕНТ
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === "dashboard" && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Твоя траектория подготовки к ЕНТ
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Личные показатели ИИ-тренировок и следующее действие.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-white border border-indigo-500/15 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
                    <div className="text-lg">🎓</div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Направление ЕНТ</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{studentStats?.profileCombination || "—"}</p>
                    </div>
                  </div>

                  {is11Grade ? (
                    <div className="bg-white border border-rose-500/20 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
                      <div className="text-lg">🗓️</div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">До ЕНТ</p>
                        <p className="text-xs font-black text-rose-600 mt-0.5">
                          {studentStats?.daysToUnt ? `${studentStats.daysToUnt} дн.` : "Скоро!"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-teal-500/20 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
                      <div className="text-lg">📈</div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Программа</p>
                        <p className="text-xs font-black text-teal-600 mt-0.5">Накопительная</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-emerald-500/15 rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-lg">🔥</div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Ударный режим</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">{studentStats?.streakDays || 0} дней</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {activityGrid.map((day, i) => (
                        <div
                          key={i}
                          title={day.date}
                          className={`w-3 h-3 rounded-sm transition-colors ${
                            day.active
                              ? "bg-emerald-500"
                              : "bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[8px] text-slate-400 mt-1 text-right">последние 28 дней</p>
                  </div>
                </div>
              </div>

              {hasOverdueTopics && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl">
                    <span className="text-lg shrink-0">⚠️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-amber-800">Есть темы, требующие повторения</p>
                      <p className="text-[10px] text-amber-600">
                        {(studentStats?.attentionNeeded?.length || 0)} тем помечены как «нужно повторить».
                        Отработайте их в ИИ-тренажере.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("tasks")}
                      className="bg-amber-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 hover:bg-amber-600 transition"
                    >
                      Отработать
                    </button>
                  </div>
                </div>
              )}

              <div
                className={`relative overflow-hidden bg-gradient-to-br ${smartStep.color} rounded-3xl p-6 text-white shadow-xl`}
              >
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-white/15 border border-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      {smartStep.label}
                    </span>
                    <h3 className="text-lg font-black mt-2 leading-tight">
                      {smartStep.icon} {smartStep.title}
                    </h3>
                    <p className="text-xs text-white/70">{smartStep.desc}</p>
                  </div>
                  <button
                    onClick={smartStep.action}
                    className="bg-white text-indigo-700 px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-slate-50 transition shrink-0 hover:scale-[1.02] active:scale-95"
                  >
                    Продолжить →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                      {isJuniorGrade ? "Прогресс программы" : "Готовность к экзамену"}
                    </h3>
                    {isJuniorGrade && (
                      <span className="text-[9px] bg-teal-50 text-teal-600 border border-teal-200/60 px-2 py-0.5 rounded-full font-bold">9–10 кл.</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-5xl font-black text-indigo-600">
                      {isJuniorGrade ? avgMastery : (studentStats?.overallProgress || 0)}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      {isJuniorGrade ? "Средний уровень mastery" : `Цель: ${studentStats?.targetScore || 140} баллов`}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${isJuniorGrade ? avgMastery : (studentStats?.overallProgress || 0)}%` }}
                    />
                  </div>
                  {!isJuniorGrade && profileSubjects.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Профильные предметы</p>
                      {profileSubjects.map((s) => (
                        <div key={s.id} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-semibold text-slate-700 truncate max-w-[140px]">{s.name}</span>
                            <span className="font-black text-indigo-600">{s.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.color || "bg-indigo-500"}`} style={{ width: `${s.progress || 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isJuniorGrade && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Рост по предметам</p>
                      {(studentStats?.subjectsMastery || []).slice(0, 3).map((s) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden flex-1">
                            <div className={`h-full rounded-full ${s.color || "bg-teal-500"}`} style={{ width: `${s.progress || 0}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-slate-500 w-8 text-right">{s.progress || 0}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-4">
                    Ежедневные задачи плана
                  </h3>
                  <div className="space-y-4">
                    {studentStats?.weeklyGoals?.map((goal) => {
                      const isCompleted = goal.current >= goal.max;
                      return (
                        <div
                          key={goal.id}
                          className={`space-y-1.5 p-2 px-3 rounded-2xl transition-all border ${isCompleted ? "border-emerald-100 bg-emerald-50/20" : "border-slate-100 bg-slate-50/40"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {goal.max === 1 ? (
                                <span className={`text-xs shrink-0 font-bold select-none leading-none ${isCompleted ? "text-emerald-500" : "text-slate-300"}`}>
                                  {isCompleted ? "✓" : "○"}
                                </span>
                              ) : (
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCompleted ? "bg-emerald-500" : "bg-indigo-500 animate-pulse"}`} />
                              )}
                              <span className={`text-xs font-semibold text-slate-700 truncate ${isCompleted ? "line-through text-slate-400" : ""}`}>
                                {goal.text}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {goal.current}/{goal.max}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? "bg-emerald-500" : goal.color || "bg-indigo-600"}`}
                              style={{ width: `${Math.min((goal.current / goal.max) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                      🎯 Темы для закрепления
                    </h3>
                    <button
                      onClick={() => setActiveTab("exam_prep")}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition"
                    >
                      Все темы → План Подготовки
                    </button>
                  </div>
                  {topPlanTopics.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">
                      ✅ Все темы из плана пройдены. Отличная работа!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topPlanTopics.map((topic, idx) => (
                        <div
                          key={topic.id || idx}
                          className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{topic.name}</p>
                              <p className="text-[10px] text-slate-400">{topic.date}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const subj = studentStats?.subjectsMastery?.[0]?.name || "История Казахстана";
                              setTasksSubject(subj);
                              setTasksTopic(topic.name);
                              setActiveTab("tasks");
                            }}
                            className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shrink-0 group-hover:border-indigo-300"
                          >
                            Отработать
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {is11Grade ? (
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
                    {!hasUltraAccess && (
                      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px] flex flex-col items-center justify-center text-center p-4 z-10 select-none">
                        <span className="text-xl mb-1">🔒</span>
                        <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Прогноз балла ЕНТ</p>
                        <p className="text-[9px] text-slate-300 mt-1 leading-normal max-w-[165px]">Доступно эксклюзивно на тарифе Ultra</p>
                        <button
                          onClick={() => setIsSettingsOpen(true)}
                          className="mt-2.5 px-3 py-1 bg-white text-indigo-700 text-[10px] font-black rounded-lg shadow hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                        >
                          Открыть Ultra
                        </button>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] bg-white/15 border border-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        ИИ-Прогноз балла
                      </span>
                      <p className="text-5xl font-black mt-4 leading-none">{forecastScore}</p>
                      <p className="text-xs text-indigo-200 mt-1">из 140 возможных</p>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className="bg-white h-full rounded-full transition-all duration-700"
                          style={{ width: `${(forecastScore / 140) * 100}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("forecast")}
                      className="w-full bg-white text-indigo-700 py-2.5 rounded-xl text-xs font-black shadow-md mt-4 hover:bg-slate-50 transition hover:scale-[1.02]"
                    >
                      Подробнее →
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-6 rounded-3xl text-white flex flex-col justify-between shadow-xl">
                    <div>
                      <span className="text-[9px] bg-white/15 border border-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        Рост Mastery
                      </span>
                      <p className="text-5xl font-black mt-4 leading-none">{avgMastery}%</p>
                      <p className="text-xs text-teal-100 mt-1">Средний уровень по кодификатору</p>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className="bg-white h-full rounded-full transition-all duration-700"
                          style={{ width: `${avgMastery}%` }}
                        />
                      </div>
                      <p className="text-xs text-teal-100/80 mt-3 leading-relaxed">
                        Продолжай решать задачи — каждая сессия повышает твой уровень!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {is11Grade && (
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50/40 to-transparent pointer-events-none rounded-r-3xl" />
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎓</span>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                          Финальная аттестация и Сертификат
                        </h3>
                        {studentStats?.finalExamScore !== undefined && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                            Сдано
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                        {studentStats?.finalExamScore !== undefined
                          ? `Результат: ${studentStats.finalExamScore} / 140 баллов. Нажмите «Подробнее», чтобы увидеть полный анализ.`
                          : "Пройдите итоговую комплексную симуляцию ЕНТ. После завершения вы получите цифровой сертификат."}
                      </p>
                    </div>
                    <div className="shrink-0 flex gap-2">
                      {studentStats?.finalExamScore !== undefined ? (
                        <>
                          <button
                            onClick={() => setActiveTab("simulation_results")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-black shadow-md transition-all"
                          >
                            📋 Открыть разбор
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Пересдать? Предыдущий результат будет удалён.")) {
                                setOnboardingStep("final_exam");
                              }
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
                          >
                            Пересдать
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setOnboardingStep("final_exam")}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all"
                        >
                          🚀 Начать симуляцию ЕНТ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">
                    🤖 Персональный ИИ-Тренажер
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Бесконечные умные задачи по кодификатору ЕНТ.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-xl font-bold">
                    Задач сегодня: {studentStats?.lastActiveDate === new Date().toLocaleDateString("en-CA") ? (studentStats?.dailyTasksSolved || 0) : 0} / {studentStats?.role === "founder" || studentStats?.tariff === "whitelisted" ? "∞" : studentStats?.tariff === "ultimate" ? 500 : studentStats?.tariff === "premium" ? 300 : studentStats?.tariff === "basic" ? 50 : 15}
                  </span>
                  {!geminiKey && (
                    <span className="text-[10px] bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-xl font-bold font-mono">
                      ✨ Fallback Mode
                    </span>
                  )}
                </div>
              </div>

              {!generatedTask && !tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        1. Предмет
                      </label>
                      <div className="flex flex-col gap-2">
                        {(() => {
                          const isFree = !studentStats?.tariff || studentStats.tariff === "free";
                          const activeFreeSubName = studentStats?.activeFreeSubject || studentStats?.subjectsMastery?.[3]?.name || "Математика";

                          return (studentStats?.subjectsMastery || []).map((sub) => {
                            let icon = "📚";
                            if (sub.name.includes("Математика") || sub.name.includes("математическая")) icon = "📐";
                            else if (sub.name.includes("Физика")) icon = "⚡";
                            else if (sub.name.includes("Биология")) icon = "🧬";
                            else if (sub.name.includes("Химия")) icon = "🧪";
                            else if (sub.name.includes("История")) icon = "🕌";
                            else if (sub.name.includes("Информатика")) icon = "💻";
                            else if (sub.name.includes("География")) icon = "🌍";
                            else if (sub.name.includes("право") || sub.name.includes("Право")) icon = "⚖️";
                            else if (sub.name.includes("язык") || sub.name.includes("литература")) icon = "✍️";
                            else if (sub.name.includes("чтения")) icon = "📖";

                            const isLocked = isFree && sub.name !== activeFreeSubName;

                            return (
                              <button
                                key={sub.id}
                                onClick={async () => {
                                  if (isLocked) {
                                    if (confirm(`🔒 На бесплатном тарифе доступен только 1 предмет одновременно.\n\nСейчас активен: "${activeFreeSubName}".\n\nХотите переключить ваш единственный бесплатный предмет на "${sub.name}"?`)) {
                                      try {
                                        await updateDoc(doc(db, "users", user.uid), {
                                          activeFreeSubject: sub.name
                                        });
                                        setTasksSubject(sub.name);
                                        setTasksTopic(getTopicsForSubject(sub.name)[0]);
                                      } catch (e) {
                                        console.error("Error updating activeFreeSubject:", e);
                                      }
                                    }
                                    return;
                                  }
                                  setTasksSubject(sub.name);
                                  setTasksTopic(getTopicsForSubject(sub.name)[0]);
                                }}
                                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all text-left ${activeTasksSubject === sub.name ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold" : "bg-slate-50 text-slate-600"} ${isLocked ? "opacity-60 border-dashed" : ""}`}
                              >
                                <span className="flex items-center gap-3">
                                  <span>{icon}</span> {sub.name}
                                </span>
                                {isLocked && <span className="text-[10px] text-amber-500 font-bold shrink-0">🔒 Free</span>}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        2. Тема
                      </label>
                      <div className="flex flex-col gap-2">
                        {getTopicsForSubject(activeTasksSubject).map(
                          (topic) => (
                            <button
                              key={topic}
                              onClick={() => setTasksTopic(topic)}
                              className={`px-4 py-2.5 rounded-xl border text-xs font-bold text-left ${activeTasksTopic === topic ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-slate-50/50"}`}
                            >
                              {topic}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        3. Сложность
                      </label>
                      <div className="flex flex-col gap-2">
                        {["Легкий", "Средний", "Сложный"].map((diff) => (
                          <button
                            key={diff}
                            onClick={() => setTasksDifficulty(diff)}
                            className={`px-4 py-3 rounded-2xl border text-xs font-bold text-left ${tasksDifficulty === diff ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-slate-50"}`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateTask}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg hover:bg-indigo-700 transition"
                  >
                    Сгенерировать задачу
                  </button>
                </div>
              )}

              {tasksGenerating && (
                <div className="p-12 text-center text-slate-400 animate-pulse bg-white rounded-3xl border border-slate-200">
                  ИИ составляет индивидуальный вопрос...
                </div>
              )}

              {generatedTask && !tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-slate-900">
                    {generatedTask.question}
                  </h3>
                  {generatedTask.formula && (
                    <div className="p-4 bg-slate-900 text-center rounded-2xl overflow-x-auto">
                      {safeBlockMath(generatedTask.formula)}
                    </div>
                  )}
                  {generatedTask.sub && (
                    <p className="text-sm text-slate-500 font-medium">
                      {generatedTask.sub}
                    </p>
                  )}
                  <div className="space-y-3">
                    {generatedTask.options.map((opt, idx) => (
                      <button
                        key={idx}
                        disabled={taskChecked}
                        onClick={() => setSelectedTaskAns(idx)}
                        className={`w-full p-4 rounded-2xl border text-sm text-left font-medium transition-all ${
                          taskChecked
                            ? idx === generatedTask.correctIndex
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                              : selectedTaskAns === idx
                                ? "border-rose-500 bg-rose-50 text-rose-900"
                                : "opacity-40 bg-white"
                            : selectedTaskAns === idx
                              ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {renderOptionContent(opt)}
                      </button>
                    ))}
                  </div>
                  {!taskChecked ? (
                    <button
                      onClick={handleCheckTask}
                      disabled={selectedTaskAns === null}
                      className={`w-full py-3 rounded-2xl text-xs font-black transition ${selectedTaskAns !== null ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                    >
                      Проверить ответ
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-2xl text-xs font-bold ${isTaskCorrect ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}
                      >
                        {isTaskCorrect
                          ? "🎉 Правильно! +150 опыта начислено."
                          : "❌ Ошибка. Изучите разбор решения ниже:"}
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl text-xs leading-relaxed whitespace-pre-line border border-slate-200">
                        <strong>Разбор решения:</strong>
                        <br />
                        {generatedTask.explanation}
                      </div>
                      <button
                        onClick={() => {
                          setGeneratedTask(null);
                          setTaskChecked(false);
                          setSelectedTaskAns(null);
                          setIsTaskCorrect(null);
                        }}
                        className="w-full bg-slate-800 text-white py-3 rounded-2xl text-xs font-black hover:bg-slate-900 transition"
                      >
                        Выбрать другую тему
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "ai_lessons" && (
            <AiLearningCore
              user={auth.currentUser}
              userData={studentStats}
              geminiKey={geminiKey}
              onClose={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "exam_prep" && (() => {
            if (!hasProAccess) {
              return (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl shadow-slate-200/40 select-none">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-emerald-100 shadow-sm">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">Персональный ИИ-План</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Умная траектория подготовки, расчет весов тем и персональные рекомендации ИИ-тьютора доступны только на тарифах <span className="text-emerald-600 font-bold">Pro</span> и <span className="text-indigo-600 font-bold">Ultra</span>.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setActiveTab("dashboard");
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-200 cursor-pointer"
                      >
                        ⚡ Перейти на тариф Pro / Ultra
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <ExamPrep
                studentStats={studentStats}
                geminiKey={geminiKey}
                user={user}
                onStartPractice={(topic, subject) => {
                  setTasksSubject(subject || "Math");
                  setTasksTopic(topic);
                  setActiveTab("tasks");
                }}
              />
            );
          })()}

          {activeTab === "calendar" && (() => {
            const hasAccess = 
              studentStats?.tariff === "premium" || 
              studentStats?.tariff === "ultimate" || 
              studentStats?.tariff === "whitelisted" || 
              studentStats?.role === "founder";
              
            if (!hasAccess) {
              return (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl shadow-slate-200/40 select-none">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-indigo-100 shadow-sm">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">Умный ИИ-календарь</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Функция автоматического ИИ-расписания уроков, дедлайнов и подготовки доступна только на тарифах <span className="text-indigo-600 font-bold">Pro</span> и <span className="text-indigo-600 font-bold">Ultra</span>.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-200 cursor-pointer"
                      >
                        ⚡ Перейти на тариф Pro / Ultra
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="h-full">
                <InteractiveCalendar 
                  events={calendarEvents}
                  onAddEvent={async (evt) => {
                    try {
                      await addDoc(collection(db, "calendar"), {
                        studentId: user.uid,
                        title: evt.title,
                        date: evt.date,
                        time: evt.time || "12:00",
                        type: evt.type || "lesson",
                        completed: false,
                        createdAt: new Date().toISOString()
                      });
                    } catch (e) {
                      console.error("Error adding event: ", e);
                    }
                  }}
                  onAutoSchedule={handleAiAutoSchedule}
                  onToggleComplete={async (eventId, completed) => {
                    try {
                      await updateDoc(doc(db, "calendar", eventId), { completed });
                    } catch (e) {
                      console.error("Error toggling event completion:", e);
                    }
                  }}
                  onEventClick={(evt) => {
                    if (evt.subject && evt.topic) {
                      setTasksSubject(evt.subject);
                      setTasksTopic(evt.topic);
                      setActiveTab("tasks");
                    }
                  }}
                />
              </div>
            );
          })()}

          {activeTab === "progress" && (() => {
            const isFree = !studentStats?.tariff || studentStats.tariff === "free";
            if (isFree) {
              return (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl shadow-slate-200/40 select-none">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-indigo-100 shadow-sm">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">Аналитика успеваемости</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Подробная аналитика освоения тем, статистика ошибок и отслеживание слабых мест доступны на платных тарифах.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setActiveTab("dashboard");
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-200 cursor-pointer"
                      >
                        ⚡ Улучшить тариф
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return <StudentAnalytics user={user} userData={studentStats} />;
          })()}

          {activeTab === "ceo_panel" && (
            <CeoPanel
              user={user}
              studentStats={studentStats}
              geminiKey={geminiKey}
            />
          )}

          <footer className="pt-8 border-t border-slate-200/60 text-center text-xs text-slate-400">
            <p>
              EduTrack ЕНТ AI. Все права защищены.{" "}
              <span className="text-indigo-600 font-bold ml-2">
                Developed by Ivakin Daniil
              </span>
            </p>
          </footer>
        </div>
      </div>

      {isSettingsOpen && (
        <SubscriptionModal
          user={user}
          studentStats={studentStats}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isCongratsOpen && (
        <CongratsModal
          user={user}
          onClose={() => setIsCongratsOpen(false)}
        />
      )}

      {isCertificateOpen && (
        <CertificateModal
          userName={userName}
          studentStats={studentStats}
          onClose={() => setIsCertificateOpen(false)}
        />
      )}
    </div>
  );
};