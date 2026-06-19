import { useState, useEffect } from "react";
import { auth, db } from "../../../app/providers/Firebase/firebase";
import { GEMINI_API_KEY } from "../../../shared/config/gemini";
import { signOut } from "firebase/auth";
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
        try {
          await updateDoc(userDocRef, {
            overallProgress: nextProgress,
            weeklyProductivity: updatedProductivity,
            subjectsMastery: updatedMastery,
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
        } catch {
          console.error("Ошибка при начислении прогресса");
        }
      } else {
        const currentAttention = studentStats.attentionNeeded || [];
        if (!currentAttention.some((item) => item.topic === activeTasksTopic)) {
          try {
            await updateDoc(userDocRef, {
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
          } catch {
            console.error("Ошибка обновления списка внимания");
          }
        }
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

  const handleFinishDiagnostic = async (scorePercent, combo) => {
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
      "Казахский язык – Казахская литература": [
        "Казахский язык",
        "Казахская литература",
      ],
      "Русский язык – Русская литература": [
        "Русский язык",
        "Русская литература",
      ],
      "Творческий экзамен": ["Творческий экзамен 1", "Творческий экзамен 2"],
    };

    const profileSubs = subjectsMap[combo] || [
      "Профильный предмет 1",
      "Профильный предмет 2",
    ];
    const allCurrentSubjects = [
      "История Казахстана",
      "Грамотность чтения",
      "Математическая грамотность",
      ...profileSubs,
    ];

    const startProgress = scorePercent > 80 ? 35 : scorePercent > 45 ? 20 : 5;

    const subjectsMastery = [
      {
        id: "history",
        name: "История Казахстана",
        level: startProgress > 20 ? "Средний" : "Базовый",
        progress: startProgress,
        color: "bg-emerald-500",
        icon: "🕌",
      },
      {
        id: "read_lit",
        name: "Грамотность чтения",
        level: startProgress > 20 ? "Средний" : "Базовый",
        progress: startProgress,
        color: "bg-teal-500",
        icon: "📖",
      },
      {
        id: "math_lit",
        name: "Математическая грамотность",
        level: startProgress > 20 ? "Средний" : "Базовый",
        progress: startProgress,
        color: "bg-indigo-500",
        icon: "📐",
      },
      {
        id: "profile_1",
        name: profileSubs[0],
        level: startProgress > 20 ? "Средний" : "Базовый",
        progress: startProgress,
        color: "bg-blue-600",
        icon: "🧬",
      },
      {
        id: "profile_2",
        name: profileSubs[1],
        level: startProgress > 20 ? "Средний" : "Базовый",
        progress: startProgress,
        color: "bg-purple-600",
        icon: "⚡",
      },
    ];

    const initialGoals = [
      {
        id: 1,
        text: `Решить 30 задач по теме ${profileSubs[0]}`,
        current: 0,
        max: 30,
        color: "bg-blue-600",
      },
      {
        id: 2,
        text: `Отработать тему по теме ${profileSubs[1]}`,
        current: 0,
        max: 30,
        color: "bg-purple-600",
      },
      {
        id: 3,
        text: "Решить тест по Истории Казахстана",
        current: 0,
        max: 1,
        color: "bg-emerald-500",
      },
    ];

    const studyPlan = [
      {
        id: "sp-1",
        name: `Введение в предмет: ${profileSubs[0]}`,
        status: "upcoming",
        date: "Срок: на этой неделе",
      },
      {
        id: "sp-2",
        name: `Базовые законы: ${profileSubs[1]}`,
        status: "upcoming",
        date: "Срок: следующая неделя",
      },
      {
        id: "sp-3",
        name: "Казахстан в период Средневековья",
        status: "upcoming",
        date: "Срок: через 2 недели",
      },
    ];

    try {
      const batch = writeBatch(db);
      const today = new Date();

      for (let i = 0; i < 4; i++) {
        const targetDay = new Date(today);
        targetDay.setDate(today.getDate() + (i + 1));
        const dateStr = targetDay.toISOString().split("T")[0];

        const targetSub = allCurrentSubjects[i % allCurrentSubjects.length];
        const topics = getTopicsForSubject(targetSub);
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        const calendarRef = doc(collection(db, "calendar"));
        batch.set(calendarRef, {
          title: `AI Урок: ${randomTopic}`,
          subject: targetSub,
          topic: randomTopic,
          time: "16:00",
          date: dateStr,
          type: "lesson",
          studentId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      const userDocRef = doc(db, "users", user.uid);
      batch.update(userDocRef, {
        profileCombination: combo,
        hasPassedDiagnostic: true,
        subjectsMastery: subjectsMastery,
        weeklyGoals: initialGoals,
        overallProgress: Math.round(scorePercent / 3),
        examPrep: {
          completedPercent: 0,
          studyPlan: studyPlan,
          recommendations: [],
        },
        recentActivity: [
          {
            id: crypto.randomUUID(),
            type: "Система",
            name: `Пройдена стартовая ИИ-диагностика на ${scorePercent}% баллов. Календарь сформирован!`,
            score: "+500 опыта",
            time: "Только что",
          },
        ],
      });

      await batch.commit();

      setTasksSubject(subjectsMastery[0].name);
      setTasksTopic(getTopicsForSubject(subjectsMastery[0].name)[0]);
      setLocalPassedDiagnostic(true);
    } catch (err) {
      console.error("Ошибка автопланирования при диагностике:", err);
      alert(
        "Ошибка записи в базу. Убедитесь, что Firestore активен в консоли Firebase!",
      );
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
      "dateOffset": 0, // число: 0 - сегодня, 1 - завтра, 2 - послезавтра и т.д.
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

  const handleGoalClick = async (goalId) => {
    if (!studentStats || !user || !studentStats.weeklyGoals) return;
    const updatedGoals = studentStats.weeklyGoals.map((goal) =>
      goal.id === goalId
        ? { ...goal, current: Math.min(goal.current + 5, goal.max) }
        : goal,
    );
    const totalMax = updatedGoals.reduce((acc, g) => acc + g.max, 0);
    const totalCurrent = updatedGoals.reduce((acc, g) => acc + g.current, 0);
    const newProgress = Math.min(
      totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 0,
      100,
    );
    const clickedGoal = studentStats.weeklyGoals.find((g) => g.id === goalId);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        weeklyGoals: updatedGoals,
        overallProgress: newProgress,
        recentActivity: [
          {
            id: crypto.randomUUID(),
            type: "Практика",
            name: `Продвижение по цели: "${clickedGoal?.text}"`,
            score: "+5 к прогрессу",
            time: "Только что",
          },
          ...(studentStats.recentActivity || []).slice(0, 4),
        ],
      });
    } catch {
      console.error("Ошибка при обновлении прогресса по целям");
    }
  };

  const getNextStepInfo = () => {
    if (studentStats?.attentionRequired?.length > 0) {
      const firstItem = studentStats.attentionRequired[0];
      return {
        title: `Исправить тему: ${firstItem.topic}`,
        desc: `Вы ошиблись в этой теме в проверочном тесте. Точность составила всего ${firstItem.accuracy}%. Давайте отработаем её в тренажере.`,
        btnText: "Запустить отработку ИИ",
        action: () => {
          setTasksSubject(firstItem.subject);
          setTasksTopic(firstItem.topic);
          setActiveTab("tasks");
        },
      };
    }
    return {
      title: "Пройти практику ИИ",
      desc: "Создайте individualную задачу с помощью ИИ-помощника для закрепления знаний по любой выбранной теме.",
      btnText: "Начать практику",
      action: () => setActiveTab("tasks"),
    };
  };

  const nextStep = getNextStepInfo();
  const handleLogout = () => signOut(auth);

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
                На основе твоего выбора AI построит индивидуальный план занятий,
                расписание в календаре и сгенерирует задачи для тренировок.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full pt-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                {
                  name: "Математика – Физика",
                  desc: "Инженерия, IT, Строительство",
                  icon: "⚙️",
                },
                {
                  name: "Биология – Химия",
                  desc: "Медицина, Биоинженерия, Экология",
                  icon: "🧬",
                },
                {
                  name: "Математика – Информатика",
                  desc: "Программирование, Анализ данных, IT",
                  icon: "💻",
                },
                {
                  name: "География – Иностранный язык",
                  desc: "Туризм, Международные отношения",
                  icon: "🌍",
                },
                {
                  name: "Биология – География",
                  desc: "Агрономия, Геология",
                  icon: "🌱",
                },
                {
                  name: "Всемирная история – География",
                  desc: "Геополитика, Регионоведение",
                  icon: "🗺️",
                },
                {
                  name: "Всемирная история – Основы права",
                  desc: "Юриспруденция, Правоохрана",
                  icon: "⚖️",
                },
                {
                  name: "Казахский язык – Казахская литература",
                  desc: "Филология, Журналистика",
                  icon: "✍️",
                },
                {
                  name: "Русский язык – Русская литература",
                  desc: "Русская филология, Педагогика",
                  icon: "📚",
                },
                {
                  name: "Творческий экзамен",
                  desc: "Дизайн, Искусство, Спорт",
                  icon: "🎨",
                },
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
                    <h4 className="font-bold text-sm text-white">
                      {combo.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {combo.desc}
                    </p>
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
            try {
              await updateDoc(doc(db, "users", user.uid), {
                overallProgress: nextProgress,
                weeklyProductivity: updatedProductivity,
                subjectsMastery: updatedMastery,
                attentionRequired: nextAttentionRequired,
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
              {studentStats?.daysToUnt && (
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
            <span>⚙️</span> Настройки Ключа
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
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200:bg-slate-700 transition"
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
          {activeTab === "dashboard" && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Твоя траектория подготовки к ЕНТ
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Здесь собираются личные показатели ИИ-тренировок.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-indigo-500/15 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
                    <div className="text-lg">🎓</div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                        Направление ЕНТ
                      </p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">
                        {studentStats?.profileCombination}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-emerald-500/15 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
                    <div className="text-lg">🔥</div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                        Ударный режим
                      </p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">
                        {studentStats?.streakDays || 0} дней
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[200px]">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                    Готовность к экзамену
                  </h3>
                  <div className="text-center my-2">
                    <p className="text-5xl font-black text-indigo-600">
                      {studentStats?.overallProgress || 0}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      Цель: {studentStats?.targetScore || 140} баллов
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${studentStats?.overallProgress || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-4">
                    Ежедневные задачи плана
                  </h3>
                  <div className="space-y-4">
                    {studentStats?.weeklyGoals?.map((goal) => (
                      <div
                        key={goal.id}
                        onClick={() => handleGoalClick(goal.id)}
                        className="space-y-1 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-all"
                      >
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{goal.text}</span>
                          <span className="text-slate-400 font-mono">
                            {goal.current}/{goal.max}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${goal.color} rounded-full`}
                            style={{
                              width: `${Math.min((goal.current / goal.max) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2 space-y-4">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                    🎯 Темы для закрепления
                  </h3>
                  {studentStats?.attentionNeeded?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">
                      Отличная работа! Слабых мест в тренировках пока не
                      обнаружено.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {studentStats?.attentionNeeded?.map((item, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex flex-col justify-between gap-4"
                        >
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                              {item.subject}
                            </p>
                            <h4 className="font-bold text-slate-800 text-sm mt-1">
                              {item.topic}
                            </h4>
                          </div>
                          <button
                            onClick={() => {
                              setTasksSubject(item.subject);
                              setTasksTopic(item.topic);
                              setActiveTab("tasks");
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50"
                          >
                            Запустить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl text-white flex flex-col justify-between shadow-xl">
                  <span className="text-[9px] bg-white border border-white/10 px-2.5 py-1 rounded-full font-bold uppercase w-fit">
                    Рекомендация ИИ
                  </span>
                  <h3 className="text-xl font-black mt-4 leading-tight">
                    {nextStep.title}
                  </h3>
                  <p className="text-xs text-indigo-100/80 mt-2">
                    {nextStep.desc}
                  </p>
                  <button
                    onClick={nextStep.action}
                    className="w-full bg-white text-indigo-600 py-3 rounded-xl text-xs font-black shadow-md mt-6 hover:bg-slate-50 transition"
                  >
                    {nextStep.btnText}
                  </button>
                </div>
              </div>
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
                {!geminiKey && (
                  <span className="text-[10px] bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-xl font-bold">
                    ✨ AI Free Mode
                  </span>
                )}
              </div>

              {!generatedTask && !tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        1. Предмет
                      </label>
                      <div className="flex flex-col gap-2">
                        {(studentStats?.subjectsMastery || []).map((sub) => {
                          let icon = "📚";
                          if (
                            sub.name.includes("Математика") ||
                            sub.name.includes("математическая")
                          )
                            icon = "📐";
                          else if (sub.name.includes("Физика")) icon = "⚡";
                          else if (sub.name.includes("Биология")) icon = "🧬";
                          else if (sub.name.includes("Химия")) icon = "🧪";
                          else if (sub.name.includes("История")) icon = "🕌";
                          else if (sub.name.includes("Информатика"))
                            icon = "💻";
                          else if (sub.name.includes("География")) icon = "🌍";
                          else if (
                            sub.name.includes("право") ||
                            sub.name.includes("Право")
                          )
                            icon = "⚖️";
                          else if (
                            sub.name.includes("язык") ||
                            sub.name.includes("литература")
                          )
                            icon = "✍️";
                          else if (sub.name.includes("чтения")) icon = "📖";

                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setTasksSubject(sub.name);
                                setTasksTopic(getTopicsForSubject(sub.name)[0]);
                              }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all text-left ${activeTasksSubject === sub.name ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-slate-50 text-slate-600"}`}
                            >
                              <span>{icon}</span> {sub.name}
                            </button>
                          );
                        })}
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

          {activeTab === "exam_prep" && (
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
          )}

          {activeTab === "calendar" && (
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
          )}

          {activeTab === "progress" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
              <h1 className="text-2xl font-black text-slate-900">
                📈 Сводная аналитика успеваемости
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {studentStats?.subjectsMastery?.map((subject, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-100 p-4 rounded-2xl space-y-2"
                  >
                    <p className="text-xs font-bold text-slate-800">
                      {subject.name}
                    </p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${subject.color}`}
                        style={{ width: `${subject.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-mono">
                      Прогресс: {subject.progress}%
                    </p>
                  </div>
                ))}
              </div>
              {studentStats?.attentionRequired?.length > 0 && (
                <div className="border border-red-100 bg-red-50/10 p-5 rounded-2xl space-y-3">
                  <h3 className="font-black text-red-600 text-sm uppercase tracking-wider">
                    🚨 Проблемы из проверочных школьных работ:
                  </h3>
                  <div className="space-y-2">
                    {studentStats.attentionRequired.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-50 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            {item.topic}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {item.subject}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setTasksSubject(item.subject);
                            setTasksTopic(item.topic);
                            setActiveTab("tasks");
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold"
                        >
                          Отработать в ИИ-Тренажере
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl text-slate-800 space-y-5 relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                ⚙️
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">
                  Настройки EduTech AI
                </h3>
                <p className="text-[10px] text-slate-400">
                  Персонализация и подключение ИИ
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-emerald-800 flex items-center gap-1">
                    <span>👑</span> EduTrack Premium
                  </p>
                  <p className="text-[10px] text-emerald-600/80 font-semibold uppercase tracking-wider">
                    Подписка активна
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  БЕЗЛИМИТНЫЙ ИИ
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Дней до ЕНТ
                </label>
                <input
                  type="number"
                  placeholder="Например: 120"
                  value={studentStats?.daysToUnt || ""}
                  onChange={async (e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : "";
                    const updatedStats = { ...studentStats, daysToUnt: val };
                    setStudentStats(updatedStats);
                    try {
                      localStorage.setItem(`cached_student_stats_${user.uid}`, JSON.stringify(updatedStats));
                      await updateDoc(doc(db, "users", user.uid), { daysToUnt: val });
                    } catch (err) {
                      console.warn("Deferred Firestore save:", err);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Класс обучения
                </label>
                <select
                  value={studentStats?.grade || "11 класс"}
                  onChange={async (e) => {
                    const val = e.target.value;
                    const updatedStats = { ...studentStats, grade: val };
                    setStudentStats(updatedStats);
                    try {
                      localStorage.setItem(`cached_student_stats_${user.uid}`, JSON.stringify(updatedStats));
                      await updateDoc(doc(db, "users", user.uid), { grade: val });
                    } catch (err) {
                      console.warn("Deferred Firestore save:", err);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-slate-800"
                >
                  <option value="9 класс">9 класс</option>
                  <option value="10 класс">10 класс</option>
                  <option value="11 класс">11 класс</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};