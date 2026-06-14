import { useState, useEffect } from "react";
import { auth, db } from "../../../app/providers/Firebase/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  where, 
  addDoc, 
  getDocs,
  deleteDoc 
} from "firebase/firestore";
import { ExamPrep } from "./ExamPrep";
import { MockExam } from "./MockExam";
import { TeacherWorkspace } from "./TeacherWorkspace";

export const Workspace = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Ученик";

  // Управление вкладками: "dashboard", "tasks", "progress", "exam_prep", "assignments", "calendar"
  const [activeTab, setActiveTab] = useState("exam_prep");
  const [activeExam, setActiveExam] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  
  // Состояния для класса и тестов
  const [classExams, setClassExams] = useState([]);
  const [completedExams, setCompletedExams] = useState({}); // examId -> { scorePercent, grade }
  const [joinCode, setJoinCode] = useState("");
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("gemini_api_key") || "");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Состояния для Календаря
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("12:00");
  const [newEventDate, setNewEventDate] = useState("");
  
  // Состояния ИИ-Тренажера
  const [tasksSubject, setTasksSubject] = useState("Math");
  const [tasksTopic, setTasksTopic] = useState("Тригонометрия");
  const [tasksDifficulty, setTasksDifficulty] = useState("Средний");
  const [generatedTask, setGeneratedTask] = useState(null);
  const [tasksGenerating, setTasksGenerating] = useState(false);
  const [selectedTaskAns, setSelectedTaskAns] = useState(null);
  const [taskChecked, setTaskChecked] = useState(false);
  const [isTaskCorrect, setIsTaskCorrect] = useState(null);

  // ЧИСТОЕ РЕШЕНИЕ: Задаем начальное состояние без вызовов setState внутри эффекта
  const [loading, setLoading] = useState(!!user);

  // Локальный ИИ-генератор задач при отсутствии ключа или интернета
  const generateLocalTask = (subject, topic, difficulty) => {
    const pool = {
      "Производные": {
        question: "Найдите производную f'(x) следующей показательной функции:",
        formula: "f(x) = 5e^x + 4x³",
        sub: "Выберите верный результат дифференцирования:",
        options: ["A) 5e^x + 12x", "B) 5e^x + 12x²", "C) 5 + 12x²", "D) e^x + 12x²"],
        correctIndex: 1,
        explanation: "Производная от e^x равна e^x. Производная от x³ равна 3x², умножаем на 4 и получаем 12x². Следовательно, f'(x) = 5e^x + 12x²."
      },
      "Тригонометрия": {
        question: "Найдите корни тригонометрического уравнения на интервале [0, π]:",
        formula: "sin(x) = \u221A3 / 2",
        sub: "Выберите множество решений x:",
        options: ["A) {π/3, 2π/3}", "B) {π/6, 5π/6}", "C) {π/4, 3π/4}", "D) {0, π}"],
        correctIndex: 0,
        explanation: "Синус равен \u221A3/2 в точках π/3 и 2π/3 на заданном интервале."
      },
      "Репликация ДНК": {
        question: "Какая нить ДНК синтезируется непрерывно в направлении репликационной вилки?",
        formula: "Синтез идет от 5'-конца к 3'-концу...",
        sub: "Выберите тип цепи ДНК:",
        options: ["A) Отстающая цепь", "B) Лидирующая цепь", "C) Материнская цепь", "D) Окказиональная цепь"],
        correctIndex: 1,
        explanation: "Лидирующая цепь синтезируется непрерывно, в то время как отстающая цепь собирается фрагментами Оказаки в противоположном направлении."
      },
      "Классическая механика": {
        question: "Какое тело движется с большим ускорением при действии одинаковой силы?",
        formula: "a = F / mass",
        sub: "Выберите верный физический вывод:",
        options: ["A) Тело с большей массой", "B) Тело с меньшей массой", "C) Ускорения будут одинаковыми", "D) Зависит от объема тела"],
        correctIndex: 1,
        explanation: "Согласно второму закону Ньютона (a = F/m), при одинаковой силе ускорение обратно пропорционально массе. Поэтому тело с меньшей массой имеет большее ускорение."
      }
    };

    return pool[topic] || {
      question: `Вопрос по предмету ${subject === "Math" ? "Математика" : subject === "Biology" ? "Биология" : "Физика"} (Тема: ${topic}):`,
      formula: `Формула/Схема темы ${topic}`,
      sub: "Выберите наиболее логичный ответ на основе теории:",
      options: [
        "A) Верно утверждение А",
        "B) Верно утверждение Б (правильный ответ)",
        "C) Оба утверждения неверны",
        "D) Недостаточно данных для ответа"
      ],
      correctIndex: 1,
      explanation: `При детальном рассмотрении темы "${topic}" для уровня сложности ${difficulty} наиболее обоснованным является выбор варианта B на основе законов этой научной дисциплины.`
    };
  };

  const handleGenerateTask = async () => {
    setTasksGenerating(true);
    setTaskChecked(false);
    setSelectedTaskAns(null);
    setIsTaskCorrect(null);
    setGeneratedTask(null);

    const subjectName = tasksSubject === "Math" ? "Математика" : tasksSubject === "Biology" ? "Биология" : "Физика";
    const topicName = tasksTopic;
    const difficulty = tasksDifficulty;

    const prompt = `Сгенерируй один интересный учебный вопрос по предмету ${subjectName} на тему "${topicName}", сложность: ${difficulty}. 
Ответ должен быть на русском языке. Верни ответ строго в формате JSON:
{
  "question": "условие задачи (на русском)",
  "formula": "формула или ключевое выражение (на латыни/LaTeX)",
  "sub": "дополнительный вопрос или указание к решению",
  "options": ["A) вариант 1", "B) вариант 2", "C) вариант 3", "D) вариант 4"],
  "correctIndex": индекс правильного ответа (число от 0 до 3),
  "explanation": "подробное пошаговое объяснение правильного решения на русском"
}
Не пиши ничего кроме этого JSON, не используй разметку markdown типа \`\`\`json.`;

    if (geminiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(text);
        setGeneratedTask(parsed);
      } catch (err) {
        console.warn("Gemini API error, falling back to local generator:", err);
        const fallback = generateLocalTask(tasksSubject, tasksTopic, tasksDifficulty);
        setGeneratedTask(fallback);
      } finally {
        setTasksGenerating(false);
      }
    } else {
      setTimeout(() => {
        const fallback = generateLocalTask(tasksSubject, tasksTopic, tasksDifficulty);
        setGeneratedTask(fallback);
        setTasksGenerating(false);
      }, 1500);
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
        const nextProgress = Math.min((studentStats.overallProgress || 0) + 2, 100);
        
        // 1. Увеличиваем продуктивность текущего дня
        const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
        const currentDay = days[new Date().getDay()];
        const updatedProductivity = (studentStats.weeklyProductivity || []).map(dayObj => {
          if (dayObj.day === currentDay) {
            return { ...dayObj, solved: Math.min((dayObj.solved || 0) + 10, 100) };
          }
          return dayObj;
        });

        // 2. Увеличиваем уровень владения предметом
        const subjectKeyMap = {
          "Math": "math",
          "Biology": "science",
          "Physics": "science"
        };
        const targetSubId = subjectKeyMap[tasksSubject] || "math";
        const updatedMastery = (studentStats.subjectsMastery || []).map(sub => {
          if (sub.id === targetSubId) {
            const nextProg = Math.min((sub.progress || 0) + 5, 100);
            let nextLvl = "Базовый";
            if (nextProg >= 80) nextLvl = "Продвинутый";
            else if (nextProg >= 40) nextLvl = "Средний";
            return { ...sub, progress: nextProg, level: nextLvl };
          }
          return sub;
        });

        try {
          await updateDoc(userDocRef, {
            overallProgress: nextProgress,
            weeklyProductivity: updatedProductivity,
            subjectsMastery: updatedMastery,
            recentActivity: [
              {
                id: crypto.randomUUID(),
                type: "Практика",
                name: `Решена задача ИИ по теме: ${tasksTopic}`,
                score: "+150 опыта",
                time: "Только что"
              },
              ...(studentStats.recentActivity || []).slice(0, 4)
            ]
          });
        } catch (e) {
          console.error("Ошибка при начислении прогресса:", e);
        }
      } else {
        // Добавляем тему в список "Требует внимания"
        const currentAttention = studentStats.attentionNeeded || [];
        const topicExists = currentAttention.some(item => item.topic === tasksTopic);
        
        if (!topicExists) {
          const nextAttention = [
            {
              id: `need-${crypto.randomUUID().slice(0, 6)}`,
              subject: tasksSubject === "Math" ? "Математика" : tasksSubject === "Biology" ? "Биология" : "Физика",
              topic: tasksTopic,
              type: "Практика",
              urgency: tasksDifficulty === "Сложный" ? "Высокий" : "Средний"
            },
            ...currentAttention.slice(0, 3)
          ];
          
          try {
            await updateDoc(userDocRef, {
              attentionNeeded: nextAttention
            });
          } catch (e) {
            console.error("Ошибка обновления списка внимания:", e);
          }
        }
      }
    }
  };

  // СИСТЕМА: Получение экзаменов класса и результатов сдачи в реальном времени
  useEffect(() => {
    if (!user || !studentStats?.classCode) return;

    // 1. Подгружаем экзамены для класса ученика
    const qExams = query(collection(db, "exams"), where("classCode", "==", studentStats.classCode));
    const unsubExams = onSnapshot(qExams, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClassExams(list);
    });

    // 2. Подгружаем сданные этим учементом результаты
    const qResults = query(collection(db, "exam_results"), where("studentId", "==", user.uid));
    const unsubResults = onSnapshot(qResults, (snap) => {
      const map = {};
      snap.forEach((doc) => {
        const data = doc.data();
        map[data.examId] = { scorePercent: data.scorePercent, grade: data.grade };
      });
      setCompletedExams(map);
    });

    return () => {
      unsubExams();
      unsubResults();
    };
  }, [user, studentStats?.classCode]);

  // СИСТЕМА: Присоединение к классу по коду
  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!joinCode.trim() || !user || !studentStats) return;

    const code = joinCode.trim().toUpperCase();
    
    const qClasses = query(collection(db, "classes"), where("code", "==", code));
    try {
      const snap = await getDocs(qClasses);
      if (snap.empty) {
        alert("Класс с таким кодом не найден. Проверьте правильность ввода!");
        return;
      }

      let classDocId = "";
      let currentStudentsCount = 0;
      snap.forEach((doc) => {
        classDocId = doc.id;
        currentStudentsCount = doc.data().studentsCount || 0;
      });

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        classCode: code
      });

      const classDocRef = doc(db, "classes", classDocId);
      await updateDoc(classDocRef, {
        studentsCount: currentStudentsCount + 1
      });

      alert(`Вы успешно присоединились к классу!`);
      setJoinCode("");
    } catch (err) {
      console.error("Ошибка при вступлении в класс:", err);
      alert("Произошла ошибка при вступлении в класс.");
    }
  };

  // СИСТЕМА: Получение всех данных ученика в реальном времени
  useEffect(() => {
    if (!user) return;
    
    const userDocRef = doc(db, "users", user.uid);
    
    const unsubscribe = onSnapshot(
      userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setStudentStats(docSnap.data());
          setLoading(false); 
        }
      },
      (error) => {
        console.error("Ошибка при получении данных из Firestore:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // СИСТЕМА: Подгрузка событий календаря в реальном времени
  useEffect(() => {
    if (!user) return;

    const qCalendar = query(collection(db, "calendar"), where("studentId", "==", user.uid));
    const unsubscribe = onSnapshot(qCalendar, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCalendarEvents(list);
    });

    return () => unsubscribe();
  }, [user]);

  // СИСТЕМА: Создание нового события календаря
  const handleAddCalendarEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate || !user) return;

    try {
      await addDoc(collection(db, "calendar"), {
        title: newEventTitle,
        time: newEventTime,
        date: newEventDate,
        studentId: user.uid,
        createdAt: new Date().toISOString()
      });
      setNewEventTitle("");
      setNewEventTime("12:00");
      setNewEventDate("");
      setIsAddEventOpen(false);
    } catch (err) {
      console.error("Ошибка при создании события календаря:", err);
    }
  };

  // СИСТЕМА: Клик по целям недели на Дашборде
  const handleGoalClick = async (goalId) => {
    if (!studentStats || !user || !studentStats.weeklyGoals) return;

    const updatedGoals = studentStats.weeklyGoals.map(goal => {
      if (goal.id === goalId) {
        const nextVal = goal.current + 5;
        return { ...goal, current: nextVal > goal.max ? goal.max : nextVal };
      }
      return goal;
    });

    const totalMax = updatedGoals.reduce((acc, g) => acc + g.max, 0);
    const totalCurrent = updatedGoals.reduce((acc, g) => acc + g.current, 0);
    const newProgress = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 0;

    const clickedGoal = studentStats.weeklyGoals.find(g => g.id === goalId);
    const newActivity = {
      id: crypto.randomUUID(),
      type: "Практика",
      name: `Продвижение по цели: "${clickedGoal?.text}"`,
      score: "+5 к прогрессу",
      time: "Только что"
    };

    const currentActivityArray = studentStats.recentActivity || [];

    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, {
        weeklyGoals: updatedGoals,
        overallProgress: newProgress > 100 ? 100 : newProgress,
        recentActivity: [newActivity, ...currentActivityArray.slice(0, 4)]
      });
    } catch (e) {
      console.error("Ошибка обновления целей:", e);
    }
  };

  const getNextStepInfo = () => {
    if (studentStats?.attentionRequired && studentStats.attentionRequired.length > 0) {
      const firstItem = studentStats.attentionRequired[0];
      return {
        title: `Повторить: ${firstItem.topic}`,
        desc: `Рекомендуется пройти практику по предмету ${firstItem.subject}. Точность в тестах по этой теме составляет всего ${firstItem.accuracy}%.`,
        btnText: "Начать практику ИИ",
        action: () => {
          const subMapping = {
            "Математика": "Math",
            "Биология": "Biology",
            "Физика": "Physics"
          };
          setTasksSubject(subMapping[firstItem.subject] || "Math");
          setTasksTopic(firstItem.topic);
          setActiveTab("tasks");
        }
      };
    }

    if (studentStats?.examPrep?.studyPlan) {
      const nextPlanItem = studentStats.examPrep.studyPlan.find(item => item.status === "upcoming" || item.status === "in_progress");
      if (nextPlanItem) {
        return {
          title: `План: ${nextPlanItem.name}`,
          desc: `Следующий шаг вашего плана подготовки: повторение темы "${nextPlanItem.name}". Срок: ${nextPlanItem.date || "ближайшее время"}.`,
          btnText: "Перейти к подготовке",
          action: () => {
            setActiveTab("exam_prep");
          }
        };
      }
    }

    return {
      title: "Пройти практику ИИ",
      desc: "Создайте индивидуальную задачу с помощью ИИ-помощника для закрепления знаний по любой выбранной теме.",
      btnText: "Начать практику",
      action: () => {
        setActiveTab("tasks");
      }
    };
  };

  const nextStep = getNextStepInfo();

  const achievements = [
    {
      id: "ach-tasks",
      emoji: "🏆",
      title: "Мастер задач",
      unlocked: studentStats?.overallProgress > 10,
      desc: "Наберите более 10% общего прогресса"
    },
    {
      id: "ach-ai",
      emoji: "✨",
      title: "ИИ Эксперт",
      unlocked: !!geminiKey && (studentStats?.recentActivity || []).some(act => act.name.includes("ИИ")),
      desc: "Подключите Gemini API и решите задачу ИИ"
    }
  ];

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (studentStats?.role === "teacher") {
    return <TeacherWorkspace />;
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
            const nextProgress = Math.min((studentStats.overallProgress || 0) + 6, 100);
            const nextStreak = (studentStats.streakDays || 0) + 1;
            
            // 1. Увеличиваем продуктивность текущего дня
            const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
            const currentDay = days[new Date().getDay()];
            const updatedProductivity = (studentStats.weeklyProductivity || []).map(dayObj => {
              if (dayObj.day === currentDay) {
                return { ...dayObj, solved: Math.min((dayObj.solved || 0) + 25, 100) };
              }
              return dayObj;
            });

            // 2. Увеличиваем уровень владения предметом
            const targetSubject = activeExam.subject;
            const targetSubId = (targetSubject === "Math" || targetSubject === "Математика") ? "math" : "science";
            const updatedMastery = (studentStats.subjectsMastery || []).map(sub => {
              if (sub.id === targetSubId) {
                const nextProg = Math.min((sub.progress || 0) + 15, 100);
                let nextLvl = "Базовый";
                if (nextProg >= 80) nextLvl = "Продвинутый";
                else if (nextProg >= 40) nextLvl = "Средний";
                return { ...sub, progress: nextProg, level: nextLvl };
              }
              return sub;
            });

            // 3. Если плохой балл (меньше 70%), добавляем в attentionRequired
            let nextAttentionRequired = studentStats.attentionRequired || [];
            if (scorePercent < 70) {
              const subjectName = (targetSubject === "Math" || targetSubject === "Математика") ? "Математика" : (targetSubject === "Biology" || targetSubject === "Биология") ? "Биология" : "Физика";
              const topicName = activeExam.topic || "Общая практика";
              const exists = nextAttentionRequired.some(item => item.topic === topicName);
              if (!exists) {
                nextAttentionRequired = [
                  {
                    id: `req-${crypto.randomUUID().slice(0, 6)}`,
                    subject: subjectName,
                    topic: topicName,
                    accuracy: scorePercent
                  },
                  ...nextAttentionRequired.slice(0, 2)
                ];
              }
            }

            const userDocRef = doc(db, "users", user.uid);
            
            try {
              await updateDoc(userDocRef, {
                overallProgress: nextProgress,
                streakDays: nextStreak,
                weeklyProductivity: updatedProductivity,
                subjectsMastery: updatedMastery,
                attentionRequired: nextAttentionRequired,
                recentActivity: [
                  {
                    id: crypto.randomUUID(),
                    type: "Экзамен",
                    name: `Сдан тест: ${activeExam.title || "Пробный экзамен"}`,
                    score: `Результат: ${scorePercent}% (Оценка ${grade})`,
                    time: "Только что"
                  },
                  ...(studentStats.recentActivity || []).slice(0, 4)
                ]
              });

              // Если это официальный тест от учителя, сохраняем в общие результаты
              if (examId) {
                await addDoc(collection(db, "exam_results"), {
                  examId: examId,
                  examTitle: activeExam.title || "Пробный экзамен",
                  studentId: user.uid,
                  studentName: userName,
                  studentEmail: user.email,
                  scorePercent: scorePercent,
                  grade: grade,
                  classCode: studentStats.classCode || "",
                  teacherId: activeExam.teacherId || "",
                  submittedAt: new Date().toISOString()
                });
              }
            } catch (e) {
              console.error("Ошибка сохранения результатов:", e);
            }
          }
          setActiveTab("exam_prep");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans text-slate-900 w-full antialiased">
      
      {/* ЛЕВОЕ МЕНЮ (САЙДБАР) */}
      <aside className="w-64 bg-white border-r border-slate-200/60 p-6 flex flex-col justify-between hidden lg:flex sticky top-0 h-screen z-30">
        <div className="space-y-8">
          <div>
            <div onClick={() => setActiveTab("dashboard")} className="flex items-center gap-2 font-black text-xl tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
              <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-100">E</span>
              EduTrack <span className="text-indigo-600">AI</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {studentStats?.grade || "11 класс"} • {studentStats?.examType || "ЕНТ 2026"}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "dashboard" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📊</span> Дашборд
            </button>
            <button 
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "tasks" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>✏️</span> Решить задачу (ИИ)
            </button>
            <button 
              onClick={() => setActiveTab("exam_prep")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "exam_prep" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>🎓</span> Exam Prep
            </button>
            <button 
              onClick={() => setActiveTab("assignments")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "assignments" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📋</span> Задания
            </button>
            <button 
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "calendar" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📅</span> Календарь
            </button>
            <button 
              onClick={() => setActiveTab("progress")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "progress" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📈</span> Аналитика ИИ
            </button>
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <button 
            onClick={() => alert("Оформление подписки PRO: 1490₸/месяц. Функция будет подключена в боевом режиме.")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-black shadow-md hover:shadow-indigo-100 transition-all text-center block"
          >
            Upgrade to Pro
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-1.5 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition text-left"
          >
            <span>⚙️</span> Настройки
          </button>

          <button 
            onClick={() => alert("Служба поддержки: Помощь по работе с ИИ, чат с куратором.")}
            className="w-full flex items-center gap-3 px-4 py-1.5 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition text-left"
          >
            <span>❓</span> Помощь
          </button>

          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-1.5 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition text-left">
            <span>🏠</span> На главную страницу
          </button>
          
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-1.5 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition text-left">
            <span>🚪</span> Выйти из аккаунта
          </button>
        </div>
      </aside>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeTab !== "exam_prep" && (
          <header className="h-16 border-b border-slate-200/60 bg-white px-8 flex items-center justify-between sticky top-0 z-20">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              {activeTab === "dashboard" ? "Рабочее пространство" : activeTab === "tasks" ? "ИИ-Тренажер" : activeTab === "progress" ? "Аналитический модуль" : "Раздел"}
            </span>
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/40 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-[10px]">
                {userName[0].toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-700">{userName}</span>
            </div>
          </header>
        )}

        <div className="p-8 space-y-8 max-w-6xl w-full mx-auto flex-1">
          
          {/* ВКЛАДКА 1: ДАШБОРД */}
          {activeTab === "dashboard" && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 font-sans">С возвращением, {userName}!</h1>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Твой ИИ-наставник проанализировал успехи. Готов продолжить?</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  {/* БЛОК КЛАССА */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px] flex-1 sm:flex-initial">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">🏫</div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Класс</p>
                      {studentStats?.classCode ? (
                        <p className="text-sm font-black text-indigo-600 font-mono tracking-wider mt-0.5">{studentStats.classCode}</p>
                      ) : (
                        <form onSubmit={handleJoinClass} className="flex gap-1 mt-1">
                          <input
                            type="text"
                            required
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Код"
                            className="px-2 py-0.5 border border-slate-200 rounded-lg text-[9px] w-16 focus:outline-none focus:border-indigo-600 font-mono uppercase font-black"
                          />
                          <button type="submit" className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold hover:bg-indigo-700 transition">
                            ОК
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* УДАРНЫЙ РЕЖИМ */}
                  <div className="bg-white border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px] flex-1 sm:flex-initial">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">🔥</div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ударный режим</p>
                      <p className="text-base font-black text-slate-800 mt-0.5">{studentStats?.streakDays || 0} дней</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Готовность к экзаменам */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[260px]">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Готовность к экзамену</h3>
                  <div className="text-center my-4">
                    <p className="text-6xl font-black text-indigo-600 tracking-tighter">{studentStats?.overallProgress || 0}%</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">Цель: {studentStats?.targetScore || 90} баллов</p>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${studentStats?.overallProgress || 0}%` }}></div>
                  </div>
                </div>

                {/* Недельные цели */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Цели на неделю</h3>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-lg">
                      Выполнено: {studentStats?.weeklyGoals?.filter(g => g.current === g.max).length || 0} из {studentStats?.weeklyGoals?.length || 0}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {studentStats?.weeklyGoals?.map((goal) => {
                      const percent = Math.min((goal.current / goal.max) * 100, 100);
                      return (
                        <div key={goal.id} onClick={() => handleGoalClick(goal.id)} className="space-y-1.5 cursor-pointer p-1 hover:bg-slate-50 rounded-lg transition-all">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{goal.text}</span>
                            <span className="text-slate-400 font-mono">{goal.current}/{goal.max}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`h-full ${goal.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Требует внимания */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2 space-y-4">
                  <h3 className="font-black text-red-500 text-sm uppercase tracking-tight">⚠️ Требует внимания</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {studentStats?.attentionNeeded?.map((item) => (
                      <div key={item.id} className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{item.subject}</p>
                          <h4 className="font-bold text-slate-800 text-sm mt-1.5">{item.topic}</h4>
                        </div>
                        <button onClick={() => setActiveTab("tasks")} className="w-full bg-white border border-slate-200/80 text-slate-700 py-2 rounded-xl text-xs font-bold shadow-sm">Повторить</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl text-white flex flex-col justify-between shadow-xl">
                  <span className="text-[9px] bg-white/20 border border-white/10 px-2.5 py-1 rounded-full font-bold uppercase w-fit">Следующий шаг</span>
                  <h3 className="text-xl font-black mt-4 leading-tight">{nextStep.title}</h3>
                  <p className="text-xs text-indigo-100/80 mt-2">{nextStep.desc}</p>
                  <button onClick={nextStep.action} className="w-full bg-white text-indigo-600 py-3 rounded-xl text-xs font-black shadow-md mt-6 hover:bg-slate-50 transition active:scale-95">{nextStep.btnText}</button>
                </div>
              </div>
            </>
          )}

          {/* ВКЛАДКА 2: АНАЛИТИКА ПРОГРЕССА */}
          {activeTab === "progress" && (
            <>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Аналитика продуктивности</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Интерактивный разбор твоей траектории обучения на основе данных из облака.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Круговой прогресс */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 self-start">Общий уровень</h3>
                  <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-[12px] border-slate-100">
                    <div className="absolute inset-0 rounded-full border-[12px] border-indigo-600 clip-path-custom" style={{ transform: `rotate(${((studentStats?.overallProgress || 0) * 360) / 100}deg)` }}></div>
                    <div>
                      <p className="text-3xl font-black text-slate-800">{studentStats?.overallProgress || 0}%</p>
                      <p className="text-[10px] text-emerald-500 font-bold mt-0.5">+2.4% за неделю</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 max-w-[180px]">Рассчитано на основе точности ответов в симуляциях ЕНТ.</p>
                </div>

                {/* График на чистом Tailwind */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Продуктивность по дням</h3>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> Решено задач</span>
                    </div>
                  </div>

                  <div className="h-40 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-100">
                    {studentStats?.weeklyProductivity?.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div 
                          className="w-full bg-indigo-600 rounded-t-lg transition-all duration-1000 relative group-hover:bg-indigo-700 shadow-sm"
                          style={{ height: `${item.solved}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                            {item.solved}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Уровень владения предметами */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2 space-y-4">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Анализ по предметам</h3>
                  <div className="space-y-4">
                    {studentStats?.subjectsMastery?.map((subject) => (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{subject.name}</h4>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Уровень: {subject.level}</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-700">{subject.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${subject.color} rounded-full`} style={{ width: `${subject.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Стрик и Достижения */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-3xl text-white shadow-md">
                    <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded">ТОП 5%</span>
                    <h3 className="text-lg font-black mt-2">Идеальный стрик!</h3>
                    <p className="text-xs text-indigo-100/80 mt-1">Ты занимаешься стабильнее большинства учеников твоей параллели.</p>
                  </div>

                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Достижения</h4>
                    <div className="flex gap-3">
                      {achievements.map(ach => (
                        <div 
                          key={ach.id} 
                          title={ach.desc}
                          className={`flex-1 border p-3 rounded-xl text-center transition-all ${
                            ach.unlocked 
                              ? "bg-indigo-50/50 border-indigo-100/60 opacity-100 text-slate-800 scale-100" 
                              : "bg-slate-50/20 border-slate-100 opacity-40 grayscale text-slate-400"
                          }`}
                        >
                          <span className="text-xl">{ach.emoji}</span>
                          <p className="text-[10px] font-bold mt-1">{ach.title}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">{ach.unlocked ? "Разблокировано" : "Заблокировано"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Проблемные зоны (Attention Required) */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-black text-red-500 text-sm uppercase tracking-tight flex items-center gap-2">🔴 Требует срочного разбора</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {studentStats?.attentionRequired?.map((item) => (
                    <div key={item.id} className="border border-red-100 bg-red-50/10 p-4 rounded-2xl flex flex-col justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-red-500 font-mono">Точность: {item.accuracy}%</p>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{item.subject}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{item.topic}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const subMapping = {
                            "Математика": "Math",
                            "Биология": "Biology",
                            "Физика": "Physics"
                          };
                          setTasksSubject(subMapping[item.subject] || "Math");
                          setTasksTopic(item.topic);
                          setActiveTab("tasks");
                        }} 
                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        Решить в ИИ-Тренажере
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ВКЛАДКА 3: ИИ-ТРЕНАЖЕР ЗАДАЧ */}
          {activeTab === "tasks" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* TOP HEADER */}
              <div className="flex justify-between items-center bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-sans">
                    <span>🤖</span> ИИ-Тренажер Задач
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Генерация бесконечных индивидуальных задач с проверкой ИИ и подробным разбором
                  </p>
                </div>
                {!geminiKey && (
                  <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                    ⚠️ Оффлайн-режим
                  </span>
                )}
              </div>

              {/* CONFIGURATION BAR (only visible if not currently showing a task and not generating) */}
              {!generatedTask && !tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Настройка параметров задачи
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* SUBJECT SELECT */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">1. Выберите предмет</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "Math", label: "Математика", icon: "📐" },
                          { id: "Physics", label: "Физика", icon: "⚡" },
                          { id: "Biology", label: "Биология", icon: "🧬" }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setTasksSubject(sub.id);
                              const topics = {
                                Math: ["Тригонометрия", "Производные", "Интегралы", "Логарифмические уравнения", "Теория вероятностей"],
                                Physics: ["Классическая механика", "Термодинамика", "Электродинамика", "Оптика", "Квантовая физика"],
                                Biology: ["Репликация ДНК", "Синтез белка", "Генетика", "Эволюция", "Анатомия человека"]
                              };
                              setTasksTopic(topics[sub.id][0]);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all text-left ${tasksSubject === sub.id ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" : "bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100/70"}`}
                          >
                            <span className="text-lg">{sub.icon}</span> {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TOPIC SELECT */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">2. Выберите тему</label>
                      <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                        {(
                          tasksSubject === "Math" ? ["Тригонометрия", "Производные", "Интегралы", "Логарифмические уравнения", "Теория вероятностей"] :
                          tasksSubject === "Biology" ? ["Репликация ДНК", "Синтез белка", "Генетика", "Эволюция", "Анатомия человека"] :
                          ["Классическая механика", "Термодинамика", "Электродинамика", "Оптика", "Квантовая физика"]
                        ).map(topic => (
                          <button
                            key={topic}
                            onClick={() => setTasksTopic(topic)}
                            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all text-left ${tasksTopic === topic ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-extrabold" : "bg-slate-50/50 border-slate-200/40 text-slate-600 hover:bg-slate-100/70"}`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* DIFFICULTY SELECT */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3. Уровень сложности</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "Легкий", label: "Легкий (базовые понятия)", color: "text-emerald-600 bg-emerald-50 border-emerald-200", activeColor: "bg-emerald-50 border-emerald-500 text-emerald-700" },
                          { id: "Средний", label: "Средний (уровень экзамена)", color: "text-amber-600 bg-amber-50 border-amber-200", activeColor: "bg-amber-50 border-amber-500 text-amber-700" },
                          { id: "Сложный", label: "Сложный (олимпиадный)", color: "text-rose-600 bg-rose-50/50 border-rose-200", activeColor: "bg-rose-50 border-rose-500 text-rose-700" }
                        ].map(diff => (
                          <button
                            key={diff.id}
                            onClick={() => setTasksDifficulty(diff.id)}
                            className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all text-left ${tasksDifficulty === diff.id ? diff.activeColor : "bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100/70"}`}
                          >
                            {diff.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!geminiKey && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-amber-900">
                      <span className="text-lg flex-shrink-0">⚠️</span>
                      <div>
                        <p className="font-bold">Ключ Gemini не найден</p>
                        <p className="text-amber-700 mt-0.5">
                          Будет сгенерирована стандартная задача из локального хранилища. Для подключения полноценного генератора бесконечных задач на любую тему укажите свой API-ключ в <button onClick={() => setIsSettingsOpen(true)} className="font-bold underline hover:text-amber-950">Настройках ⚙️</button>
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateTask}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    🚀 Сгенерировать задачу
                  </button>
                </div>
              )}

              {/* LOADING SKELETON */}
              {tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 animate-pulse">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="h-4 w-24 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-16 bg-slate-200 rounded-lg"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
                    <div className="h-6 w-1/2 bg-slate-200 rounded-lg"></div>
                  </div>
                  <div className="h-20 bg-slate-50 border border-slate-200/40 rounded-2xl flex items-center justify-center text-slate-400 font-mono text-xs">
                    ИИ формулирует задачу и разбор...
                  </div>
                  <div className="space-y-3 pt-4">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="h-12 border border-slate-100 rounded-2xl bg-slate-50/50"></div>
                    ))}
                  </div>
                </div>
              )}

              {/* TASK VIEW */}
              {generatedTask && !tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 relative overflow-hidden">
                  
                  {/* Task Header info */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                        {tasksSubject === "Math" ? "Математика" : tasksSubject === "Biology" ? "Биология" : "Физика"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">•</span>
                      <span className="text-[10px] font-medium text-slate-500">Тема: {tasksTopic}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                      tasksDifficulty === "Легкий" ? "bg-emerald-50 text-emerald-700" :
                      tasksDifficulty === "Средний" ? "bg-amber-50 text-amber-700" :
                      "bg-rose-50 text-rose-700"
                    }`}>
                      {tasksDifficulty}
                    </span>
                  </div>

                  {/* Question body */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900 leading-relaxed">
                      {generatedTask.question}
                    </h3>

                    {/* Formula/Expression panel if present */}
                    {generatedTask.formula && (
                      <div className="p-4 bg-slate-900 rounded-2xl flex justify-center text-center shadow-inner select-all relative group overflow-x-auto">
                        <span className="text-emerald-400 font-mono text-sm tracking-wide py-1 font-bold">
                          {generatedTask.formula}
                        </span>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-200 text-[9px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          Формула
                        </div>
                      </div>
                    )}

                    {generatedTask.sub && (
                      <p className="text-xs text-slate-400 italic">
                        {generatedTask.sub}
                      </p>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-3 pt-2">
                    {generatedTask.options.map((opt, idx) => {
                      const letter = ["A", "B", "C", "D"][idx];
                      const isSelected = selectedTaskAns === idx;
                      const isCorrect = idx === generatedTask.correctIndex;
                      
                      let cardStyle = "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50/50 hover:border-slate-300";
                      let badgeStyle = "bg-slate-100 text-slate-600";

                      if (isSelected) {
                        cardStyle = "border-indigo-600 bg-indigo-50/20 text-indigo-900";
                        badgeStyle = "bg-indigo-600 text-white";
                      }

                      if (taskChecked) {
                        if (isCorrect) {
                          cardStyle = "border-emerald-500 bg-emerald-50/30 text-emerald-950 font-bold";
                          badgeStyle = "bg-emerald-500 text-white";
                        } else if (isSelected) {
                          cardStyle = "border-rose-500 bg-rose-50/30 text-rose-950";
                          badgeStyle = "bg-rose-500 text-white";
                        } else {
                          cardStyle = "border-slate-100 bg-slate-50/20 text-slate-400 opacity-60";
                          badgeStyle = "bg-slate-100 text-slate-400";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={taskChecked}
                          onClick={() => setSelectedTaskAns(idx)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-xs font-medium transition-all text-left shadow-sm ${cardStyle}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-sans flex-shrink-0 transition-all ${badgeStyle}`}>
                            {letter}
                          </div>
                          <span className="leading-normal flex-1">{opt}</span>
                          {taskChecked && isCorrect && (
                            <span className="text-emerald-600 text-base font-bold">✓</span>
                          )}
                          {taskChecked && isSelected && !isCorrect && (
                            <span className="text-rose-600 text-base font-bold">✗</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions area */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                    {!taskChecked ? (
                      <button
                        onClick={handleCheckTask}
                        disabled={selectedTaskAns === null}
                        className={`w-full py-3 rounded-2xl text-xs font-black shadow-md transition-all active:scale-[0.98] ${selectedTaskAns !== null ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                      >
                        🎯 Проверить ответ
                      </button>
                    ) : (
                      <div className="space-y-5">
                        {/* Result banner */}
                        {isTaskCorrect ? (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-950 font-bold animate-fade-in">
                            <span className="text-lg">🎉</span>
                            <div>
                              <p className="font-black">Отлично, ответ верный!</p>
                              <p className="text-emerald-700 font-medium mt-0.5">Вам начислено +150 опыта. Вы закрепили тему!</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-950 font-bold animate-fade-in">
                            <span className="text-lg">❌</span>
                            <div>
                              <p className="font-black">Ответ неверный</p>
                              <p className="text-rose-700 font-medium mt-0.5">Не расстраивайтесь. Изучите ИИ-разбор задачи ниже, чтобы понять суть.</p>
                            </div>
                          </div>
                        )}

                        {/* AI Explanation Box */}
                        <div className="p-5 bg-gradient-to-br from-indigo-50/40 to-purple-50/40 border border-indigo-100/80 rounded-2xl space-y-2.5 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🤖</span>
                            <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">Разбор ИИ-помощника</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                            {generatedTask.explanation}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setSelectedTaskAns(null);
                              setTaskChecked(false);
                              setIsTaskCorrect(null);
                              setGeneratedTask(null);
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all text-center"
                          >
                            ⚙️ Выбрать другую тему
                          </button>
                          <button
                            onClick={handleGenerateTask}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black transition-all text-center shadow-md shadow-indigo-100 hover:shadow-indigo-200 active:scale-95"
                          >
                            🔄 Решить еще одну
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 4: EXAM PREP (ПОДГОТОВКА) */}
          {activeTab === "exam_prep" && (
            <ExamPrep 
              userName={userName} 
              onStartPractice={(topic, subject) => {
                setActiveExam({ subject: subject || "Math", topic: topic });
              }} 
            />
          )}

          {/* ВКЛАДКА 5: ЗАДАНИЯ */}
          {activeTab === "assignments" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 font-sans">📚 Классные задания</h1>
                {studentStats?.classCode ? (
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    Работы, назначенные вашим преподавателем для класса <span className="font-mono font-bold text-indigo-600">{studentStats?.classCode}</span>.
                  </p>
                ) : (
                  <p className="text-xs md:text-sm text-rose-500 mt-1 font-bold">
                    ⚠️ Вы еще не вступили в класс. Пожалуйста, введите инвайт-код на Дашборде!
                  </p>
                )}
              </div>

              {studentStats?.classCode && (
                <div className="space-y-4">
                  {classExams.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Для вашего класса пока не назначено ни одного задания.</p>
                  ) : (
                    classExams.map((exam) => {
                      const completed = completedExams[exam.id];
                      return (
                        <div key={exam.id} className="border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-50/50 transition">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">
                              {exam.subject === "Biology" ? "🧬" : exam.subject === "Physics" ? "⚡" : "📐"}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{exam.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Вопросов: {exam.questionsCount} • Лимит времени: {exam.timeLimit} мин • Опубликовано: {new Date(exam.createdAt).toLocaleDateString("ru-RU")}
                              </p>
                            </div>
                          </div>
                          <div>
                            {completed ? (
                              <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-3 py-1.5 rounded-xl border border-emerald-100">
                                Сдано ({completed.scorePercent}% - Оценка {completed.grade})
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveExam({
                                    id: exam.id,
                                    subject: exam.subject,
                                    questionsCount: exam.questionsCount,
                                    timeLimit: exam.timeLimit,
                                    title: exam.title,
                                    teacherId: exam.teacherId
                                  });
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                              >
                                Начать тест
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 6: КАЛЕНДАРЬ */}
          {activeTab === "calendar" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">📅 Календарь занятий</h1>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Расписание занятий, дедлайнов и подготовки с ИИ.</p>
                </div>
                <button 
                  onClick={() => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    setNewEventDate(todayStr);
                    setIsAddEventOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>+</span> Добавить событие
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {(() => {
                  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
                  const calendarDays = [];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const dayName = weekdays[d.getDay()];
                    const dayNum = d.getDate();
                    const dateString = d.toISOString().split("T")[0];
                    calendarDays.push({ name: `${dayName} ${dayNum}`, dateString });
                  }
                  
                  return calendarDays.map((dayObj, idx) => {
                    const dayEvents = calendarEvents.filter(e => e.date === dayObj.dateString);
                    
                    return (
                      <div key={idx} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30 flex flex-col min-h-[180px] justify-between relative group hover:bg-slate-50 transition-all">
                        <p className="text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">{dayObj.name}</p>
                        
                        <div className="flex-1 py-3 space-y-2 max-h-[110px] overflow-y-auto pr-0.5">
                          {dayEvents.map(event => (
                            <div 
                              key={event.id} 
                              className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 p-1.5 rounded-lg font-bold flex justify-between items-center group/item"
                            >
                              <div>
                                <span className="font-mono text-indigo-500 block">{event.time}</span>
                                <span className="leading-tight block text-slate-700">{event.title}</span>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (confirm("Удалить это событие из расписания?")) {
                                    try {
                                      await deleteDoc(doc(db, "calendar", event.id));
                                    } catch (e) {
                                      console.error("Ошибка удаления события:", e);
                                    }
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-500 text-[10px] opacity-0 group-hover/item:opacity-100 transition-opacity ml-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {dayEvents.length === 0 && (
                            <p className="text-[9px] text-slate-300 italic pt-4 text-center">Свободно</p>
                          )}
                        </div>

                        <button 
                          onClick={() => {
                            setNewEventDate(dayObj.dateString);
                            setIsAddEventOpen(true);
                          }} 
                          className="w-full text-center py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-slate-200 hover:border-indigo-300"
                        >
                          + Добавить
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: НАСТРОЙКИ (КЛЮЧ GEMINI) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-800 relative space-y-5">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner">
                ⚙️
              </div>
              <div>
                <h3 className="font-black text-slate-955 text-sm uppercase tracking-wider leading-tight text-slate-900">Настройки EduTech AI</h3>
                <p className="text-[10px] text-slate-400">Персонализация и подключение ИИ</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">API-ключ Gemini</label>
                <input 
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGeminiKey(val);
                    localStorage.setItem("gemini_api_key", val);
                  }}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-2xl text-[10px] leading-relaxed text-indigo-900 space-y-1">
                <p className="font-bold">Как получить ключ бесплатно?</p>
                <p>1. Перейдите в <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-indigo-700 transition">Google AI Studio</a>.</p>
                <p>2. Авторизуйтесь и нажмите кнопку <strong>«Get API Key»</strong>.</p>
                <p>3. Скопируйте созданный ключ и вставьте его в поле выше.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if (!geminiKey) {
                    alert("Пожалуйста, сначала введите API-ключ.");
                    return;
                  }
                  alert("Проверка ключа... Начат тестовый запрос к Gemini.");
                  fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: "Ответь ровно одним словом OK" }] }]
                    })
                  })
                  .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                  })
                  .then(() => {
                    alert("Успешно! API-ключ проверен и готов к работе.");
                  })
                  .catch(() => {
                    alert("Ошибка проверки ключа. Проверьте правильность ввода или доступность API.");
                  });
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all text-center"
              >
                Проверить
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all text-center shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};