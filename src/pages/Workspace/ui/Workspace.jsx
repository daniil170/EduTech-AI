import { useState, useEffect } from "react";
import { auth, db } from "../../../app/providers/Firebase/firebase";
import { signOut } from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  where, 
  addDoc, 
  getDocs 
} from "firebase/firestore";
import { ExamPrep } from "./ExamPrep";
import { MockExam } from "./MockExam";
import { TeacherWorkspace } from "./TeacherWorkspace";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export const Workspace = () => {
  const user = auth.currentUser;
  const userName = user?.displayName || user?.email?.split("@")[0] || "Ученик";

  // Управление вкладками: "dashboard", "tasks", "exam_prep", "assignments", "calendar", "progress"
  const [activeTab, setActiveTab] = useState("dashboard");
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
  "formula": "формула или ключевое выражение в LaTeX",
  "sub": "дополнительный вопрос или указание к решению",
  "options": ["A) вариант 1", "B) вариант 2", "C) вариант 3", "D) вариант 4"],
  "correctIndex": индекс правильного ответа (число от 0 до 3),
  "explanation": "ПОДРОБНОЕ объяснение. ВАЖНО: Если в задаче есть сложные формулы (например, интегралы, правило Лейбница, производные), сначала объясни СУТЬ формулы простыми словами (на пальцах, с живой аналогией), а затем покажи пошаговый разбор решения, чтобы понял даже слабый ученик."
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

        if (!response.ok) throw new Error("API request failed");

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
        const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
        const currentDay = days[new Date().getDay()];
        const updatedProductivity = (studentStats.weeklyProductivity || []).map(dayObj => {
          if (dayObj.day === currentDay) {
            return { ...dayObj, solved: Math.min((dayObj.solved || 0) + 10, 100) };
          }
          return dayObj;
        });

        const subjectKeyMap = { "Math": "math", "Biology": "science", "Physics": "science" };
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
            await updateDoc(userDocRef, { attentionNeeded: nextAttention });
          } catch (e) {
            console.error("Ошибка обновления списка внимания:", e);
          }
        }
      }
    }
  };

  // Слушаем экзамены класса
  useEffect(() => {
    if (!user || !studentStats?.classCode) return;

    const qExams = query(collection(db, "exams"), where("classCode", "==", studentStats.classCode));
    const unsubExams = onSnapshot(qExams, (snap) => {
      const list = [];
      snap.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
      setClassExams(list);
    });

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

  // Присоединение к классу
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

      await updateDoc(doc(db, "users", user.uid), { classCode: code });
      await updateDoc(doc(db, "classes", classDocId), { studentsCount: currentStudentsCount + 1 });

      alert(`Вы успешно присоединились к классу!`);
      setJoinCode("");
    } catch (err) {
      console.error("Ошибка при вступлении в класс:", err);
    }
  };

  // Получение данных ученика в реальном времени
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setStudentStats(docSnap.data());
        setLoading(false); 
      }
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Календарь
  useEffect(() => {
    if (!user) return;
    const qCalendar = query(collection(db, "calendar"), where("studentId", "==", user.uid));
    const unsubscribe = onSnapshot(qCalendar, (snap) => {
      const list = [];
      snap.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
      setCalendarEvents(list);
    });
    return () => unsubscribe();
  }, [user]);

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
      setIsAddEventOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

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
    try {
      await updateDoc(doc(db, "users", user.uid), {
        weeklyGoals: updatedGoals,
        overallProgress: newProgress > 100 ? 100 : newProgress,
        recentActivity: [{
          id: crypto.randomUUID(),
          type: "Практика",
          name: `Продвижение по цели: "${clickedGoal?.text}"`,
          score: "+5 к прогрессу",
          time: "Только что"
        }, ...(studentStats.recentActivity || []).slice(0, 4)]
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getNextStepInfo = () => {
    if (studentStats?.attentionRequired && studentStats.attentionRequired.length > 0) {
      const firstItem = studentStats.attentionRequired[0];
      return {
        title: `Исправить тему: ${firstItem.topic}`,
        desc: `Вы ошиблись в этой теме в проверочном тесте. Точность составила всего ${firstItem.accuracy}%. Давайте отработаем её в тренажере.`,
        btnText: "Запустить отработку ИИ",
        action: () => {
          const subMapping = { "Математика": "Math", "Биология": "Biology", "Физика": "Physics" };
          setTasksSubject(subMapping[firstItem.subject] || "Math");
          setTasksTopic(firstItem.topic);
          setActiveTab("tasks");
        }
      };
    }
    return {
      title: "Пройти практику ИИ",
      desc: "Создайте индивидуальную задачу с помощью ИИ-помощника для закрепления знаний по любой выбранной теме.",
      btnText: "Начать практику",
      action: () => setActiveTab("tasks")
    };
  };

  const nextStep = getNextStepInfo();
  const handleLogout = () => signOut(auth);

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
            const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
            const currentDay = days[new Date().getDay()];
            const updatedProductivity = (studentStats.weeklyProductivity || []).map(dayObj => {
              if (dayObj.day === currentDay) {
                return { ...dayObj, solved: Math.min((dayObj.solved || 0) + 25, 100) };
              }
              return dayObj;
            });

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

            let nextAttentionRequired = studentStats.attentionRequired || [];
            if (scorePercent < 75) {
              const subjectName = (targetSubject === "Math" || targetSubject === "Математика") ? "Математика" : (targetSubject === "Biology" || targetSubject === "Биология") ? "Биология" : "Физика";
              const topicName = activeExam.topic || "Общая практика";
              const exists = nextAttentionRequired.some(item => item.topic === topicName);
              if (!exists) {
                nextAttentionRequired = [
                  { id: `req-${crypto.randomUUID().slice(0, 6)}`, subject: subjectName, topic: topicName, accuracy: scorePercent },
                  ...nextAttentionRequired.slice(0, 2)
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
                    time: "Только что"
                  },
                  ...(studentStats.recentActivity || []).slice(0, 4)
                ]
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
                  classCode: studentStats.classCode || "",
                  teacherId: activeExam.teacherId || "",
                  submittedAt: new Date().toISOString()
                });
              }
            } catch (e) {
              console.error(e);
            }
          }
          setActiveTab("assignments");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans text-slate-900 w-full antialiased">
      
      {/* САЙДБАР: НАВИГАЦИЯ */}
      <aside className="w-64 bg-white border-r border-slate-200/60 p-6 flex flex-col justify-between hidden lg:flex sticky top-0 h-screen z-30">
        <div className="space-y-8">
          <div>
            <div onClick={() => setActiveTab("dashboard")} className="flex items-center gap-2 font-black text-xl tracking-tight cursor-pointer">
              <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm">E</span>
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "dashboard" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📊</span> Личный Дашборд
            </button>
            <button 
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "tasks" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>🤖</span> ИИ-Тренажер Задач
            </button>
            <button 
              onClick={() => setActiveTab("exam_prep")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "exam_prep" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>🎓</span> План Подготовки
            </button>
            <button 
              onClick={() => setActiveTab("assignments")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "assignments" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>🏫</span> Класс и Задания {studentStats?.classCode && <span className="ml-auto text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold">{studentStats.classCode}</span>}
            </button>
            <button 
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "calendar" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📅</span> Расписание
            </button>
            <button 
              onClick={() => setActiveTab("progress")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "progress" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📈</span> Аналитика ИИ
            </button>
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-1.5 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition">
            <span>⚙️</span> Настройки Ключа
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-1.5 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition">
            <span>🚪</span> Выйти
          </button>
        </div>
      </aside>

      {/* КОНТЕНТНАЯ ЧАСТЬ */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200/60 bg-white px-8 flex items-center justify-between sticky top-0 z-20">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            {activeTab === "dashboard" ? "Рабочая область" : activeTab === "tasks" ? "Тренажер" : "Раздел"}
          </span>
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/40 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold text-slate-700">{userName}</span>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-6xl w-full mx-auto flex-1">
          
          {/* ВКЛАДКА 1: ЛИЧНЫЙ ДАШБОРД */}
          {activeTab === "dashboard" && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Твоя траектория подготовки</h1>
                  <p className="text-xs text-slate-500 mt-1">Здесь собираются личные показатели ИИ-тренировок.</p>
                </div>
                <div className="bg-white border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="text-xl">🔥</div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Ударный режим</p>
                    <p className="text-sm font-black text-slate-800">{studentStats?.streakDays || 0} дней</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[200px]">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Готовность к экзамену</h3>
                  <div className="text-center my-2">
                    <p className="text-5xl font-black text-indigo-600">{studentStats?.overallProgress || 0}%</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Цель: {studentStats?.targetScore || 140} баллов</p>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${studentStats?.overallProgress || 0}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-4">Ежедневные задачи плана</h3>
                  <div className="space-y-4">
                    {studentStats?.weeklyGoals?.map((goal) => (
                      <div key={goal.id} onClick={() => handleGoalClick(goal.id)} className="space-y-1 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-all">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{goal.text}</span>
                          <span className="text-slate-400 font-mono">{goal.current}/{goal.max}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${goal.color} rounded-full`} style={{ width: `${Math.min((goal.current / goal.max) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm md:col-span-2 space-y-4">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">🎯 Темы для закрепления</h3>
                  {studentStats?.attentionNeeded?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">Отличная работа! Слабых мест в тренировках пока не обнаружено.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {studentStats?.attentionNeeded?.map((item) => (
                        <div key={item.id} className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex flex-col justify-between gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{item.subject}</p>
                            <h4 className="font-bold text-slate-800 text-sm mt-1">{item.topic}</h4>
                          </div>
                          <button onClick={() => {
                            setTasksSubject(item.subject === "Математика" ? "Math" : item.subject === "Биология" ? "Biology" : "Physics");
                            setTasksTopic(item.topic);
                            setActiveTab("tasks");
                          }} className="w-full bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50">Запустить</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl text-white flex flex-col justify-between shadow-xl">
                  <span className="text-[9px] bg-white/20 border border-white/10 px-2.5 py-1 rounded-full font-bold uppercase w-fit">Рекомендация ИИ</span>
                  <h3 className="text-xl font-black mt-4 leading-tight">{nextStep.title}</h3>
                  <p className="text-xs text-indigo-100/80 mt-2">{nextStep.desc}</p>
                  <button onClick={nextStep.action} className="w-full bg-white text-indigo-600 py-3 rounded-xl text-xs font-black shadow-md mt-6 hover:bg-slate-50 transition">{nextStep.btnText}</button>
                </div>
              </div>
            </>
          )}

          {/* ВКЛАДКА 2: ИИ-ТРЕНАЖЕР ЗАДАЧ */}
          {activeTab === "tasks" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">🤖 Персональный ИИ-Тренажер</h1>
                  <p className="text-xs text-slate-500 mt-1">Бесконечные умные задачи по кодификатору ЕНТ.</p>
                </div>
                {!geminiKey && <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-xl font-bold">⚠️ Локальный пул</span>}
              </div>

              {!generatedTask && !tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">1. Предмет</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "Math", label: "Математика", icon: "📐" },
                          { id: "Physics", label: "Физика", icon: "⚡" },
                          { id: "Biology", label: "Биология", icon: "🧬" }
                        ].map(sub => (
                          <button key={sub.id} onClick={() => {
                            setTasksSubject(sub.id);
                            const topics = {
                              Math: ["Тригонометрия", "Производные", "Интегралы"],
                              Physics: ["Классическая механика", "Термодинамика"],
                              Biology: ["Репликация ДНК", "Генетика"]
                            };
                            setTasksTopic(topics[sub.id][0]);
                          }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all text-left ${tasksSubject === sub.id ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-slate-50 text-slate-600"}`}>
                            <span>{sub.icon}</span> {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">2. Тема</label>
                      <div className="flex flex-col gap-2">
                        {(tasksSubject === "Math" ? ["Тригонометрия", "Производные", "Интегралы"] : tasksSubject === "Biology" ? ["Репликация ДНК", "Генетика"] : ["Классическая механика", "Термодинамика"]).map(topic => (
                          <button key={topic} onClick={() => setTasksTopic(topic)} className={`px-4 py-2.5 rounded-xl border text-xs font-bold text-left ${tasksTopic === topic ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-slate-50/50"}`}>{topic}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">3. Сложность</label>
                      <div className="flex flex-col gap-2">
                        {["Легкий", "Средний", "Сложный"].map(diff => (
                          <button key={diff} onClick={() => setTasksDifficulty(diff)} className={`px-4 py-3 rounded-2xl border text-xs font-bold text-left ${tasksDifficulty === diff ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-slate-50"}`}>{diff}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button onClick={handleGenerateTask} className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg">Сгенерировать задачу</button>
                </div>
              )}

              {tasksGenerating && <div className="p-12 text-center text-slate-400 animate-pulse bg-white rounded-3xl border border-slate-200">ИИ составляет индивидуальный вопрос...</div>}

              {generatedTask && !tasksGenerating && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-slate-900">{generatedTask.question}</h3>
                  {generatedTask.formula && <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-center rounded-2xl">{generatedTask.formula}</div>}
                  
                  <div className="space-y-3">
                    {generatedTask.options.map((opt, idx) => (
                      <button key={idx} disabled={taskChecked} onClick={() => setSelectedTaskAns(idx)} className={`w-full p-4 rounded-2xl border text-xs text-left font-medium transition-all ${taskChecked ? (idx === generatedTask.correctIndex ? "border-emerald-500 bg-emerald-50" : selectedTaskAns === idx ? "border-rose-500 bg-rose-50" : "opacity-50") : (selectedTaskAns === idx ? "border-indigo-600 bg-indigo-50" : "bg-white")}`}>
                        {opt}
                      </button>
                    ))}
                  </div>

                  {!taskChecked ? (
                    <button onClick={handleCheckTask} disabled={selectedTaskAns === null} className={`w-full py-3 rounded-2xl text-xs font-black ${selectedTaskAns !== null ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>Проверить ответ</button>
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-2xl text-xs font-bold ${isTaskCorrect ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>{isTaskCorrect ? "🎉 Правильно! +150 опыта начислено." : "❌ Ошибка. Изучите разбор ниже:"}</div>
                      <div className="p-5 bg-slate-50 rounded-2xl text-xs leading-relaxed whitespace-pre-line border border-slate-200"><strong>Разбор решения:</strong> {generatedTask.explanation}</div>
                      <button onClick={() => setGeneratedTask(null)} className="w-full bg-slate-800 text-white py-3 rounded-2xl text-xs font-black">Выбрать другую тему</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 3: КАТАЛОГ И ПЛАН ПОДГОТОВКИ (БЕЗ МОК-ДАННЫХ) */}
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

          {/* ВКЛАДКА 4: ИЗОЛИРОВАННАЯ ШКОЛЬНАЯ СИСТЕМА (КЛАСС И ЗАДАНИЯ) */}
          {activeTab === "assignments" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div>
                <h1 className="text-2xl font-black text-slate-900">📚 Официальный школьный класс</h1>
                <p className="text-xs text-slate-500 mt-1">Всё, что назначает ваш учитель в школе, находится в этой вкладке.</p>
              </div>

              {!studentStats?.classCode ? (
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-4">
                  <p className="text-sm text-slate-500">Вы еще не привязаны к школьному кабинету учителя. Введите код приглашения, полученный от преподавателя.</p>
                  <form onSubmit={handleJoinClass} className="flex gap-2 justify-center max-w-md mx-auto">
                    <input type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="НАПРИМЕР: МАТ-412" className="px-4 py-2 border border-slate-300 rounded-xl text-sm w-full font-mono uppercase focus:outline-none focus:border-indigo-600" />
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">Связать</button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-center">
                    <p className="text-xs font-bold text-indigo-900">Вы состоите в классе: <span className="font-mono bg-white px-2 py-0.5 rounded shadow-sm text-indigo-600">{studentStats.classCode}</span></p>
                    <button onClick={async () => {
                      if(confirm("Выйти из текущего класса?")) {
                        await updateDoc(doc(db, "users", user.uid), { classCode: "" });
                      }
                    }} className="text-xs text-red-500 hover:underline">Выйти из класса</button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Назначенные тесты и уроки:</h3>
                    {classExams.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">Учитель пока не выкладывал проверочных работ.</p>
                    ) : (
                      classExams.map((exam) => {
                        const completed = completedExams[exam.id];
                        return (
                          <div key={exam.id} className="border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">📋 {exam.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Вопросов: {exam.questionsCount} • Время: {exam.timeLimit} мин</p>
                            </div>
                            {completed ? (
                              <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-3 py-1.5 rounded-xl border border-emerald-100">Сдано ({completed.scorePercent}% • Оценка {completed.grade})</span>
                            ) : (
                              <button onClick={() => setActiveExam({ id: exam.id, subject: exam.subject, questionsCount: exam.questionsCount, timeLimit: exam.timeLimit, title: exam.title, teacherId: exam.teacherId, topic: exam.title })} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm">Начать тест</button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 5: ИНТЕРАКТИВНЫЙ КАЛЕНДАРЬ И РАСПИСАНИЕ */}
          {activeTab === "calendar" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">📅 Интерактивное расписание</h1>
                  <p className="text-xs text-slate-500 mt-1">Управляйте планом занятий и дедлайнов.</p>
                </div>
                <button 
                  onClick={() => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    setNewEventDate(todayStr);
                    setIsAddEventOpen(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  + Добавить событие
                </button>
              </div>

              {isAddEventOpen && (
                <form onSubmit={handleAddCalendarEvent} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 max-w-md">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase">Название события</label>
                    <input type="text" required value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="Повторить тригонометрию" className="w-full border px-3 py-1.5 rounded-xl text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase">Дата</label>
                      <input type="date" required value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="w-full border px-3 py-1.5 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase">Время</label>
                      <input type="time" required value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="w-full border px-3 py-1.5 rounded-xl text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Создать</button>
                    <button type="button" onClick={() => setIsAddEventOpen(false)} className="bg-slate-200 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-bold">Отмена</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {(() => {
                  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
                  const days = [];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    days.push({ name: weekdays[d.getDay()], dateStr: d.toISOString().split("T")[0], num: d.getDate() });
                  }
                  return days.map((day, idx) => {
                    const dayEvents = calendarEvents.filter(e => e.date === day.dateStr);
                    return (
                      <div key={idx} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 min-h-[160px] flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700 border-b pb-1 mb-2">{day.name} {day.num}</p>
                          <div className="space-y-1">
                            {dayEvents.map(ev => (
                              <div key={ev.id} className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 p-1 rounded-md">
                                <span className="font-mono block opacity-70">{ev.time}</span>
                                <span className="font-bold block truncate">{ev.title}</span>
                              </div>
                            ))}
                            {dayEvents.length === 0 && <p className="text-[9px] text-slate-300 italic pt-2">Свободно</p>}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* ВКЛАДКА 6: АНАЛИТИКА ПРОГРЕССА СВЯЗАННАЯ */}
          {activeTab === "progress" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
              <h1 className="text-2xl font-black text-slate-900">📈 Сводная аналитика успеваемости</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {studentStats?.subjectsMastery?.map((subject) => (
                  <div key={subject.id} className="border border-slate-100 p-4 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-slate-800">{subject.name}</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${subject.color}`} style={{ width: `${subject.progress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Прогресс: {subject.progress}%</p>
                  </div>
                ))}
              </div>

              {studentStats?.attentionRequired && studentStats.attentionRequired.length > 0 && (
                <div className="border border-red-100 bg-red-50/10 p-5 rounded-2xl space-y-3">
                  <h3 className="font-black text-red-600 text-sm uppercase tracking-wider">🚨 Проблемы из проверочных школьных работ:</h3>
                  <div className="space-y-2">
                    {studentStats.attentionRequired.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-50 text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{item.topic}</span>
                          <p className="text-[10px] text-slate-400">{item.subject}</p>
                        </div>
                        <button onClick={() => {
                          const subMapping = { "Математика": "Math", "Биология": "Biology", "Физика": "Physics" };
                          setTasksSubject(subMapping[item.subject] || "Math");
                          setTasksTopic(item.topic);
                          setActiveTab("tasks");
                        }} className="bg-red-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold">Отработать в ИИ-Тренажере</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* МОДАЛКА НАСТРОЕК */}
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
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner">
                ⚙️
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider leading-tight">Настройки EduTech AI</h3>
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
                    setGeminiKey(e.target.value);
                    localStorage.setItem("gemini_api_key", e.target.value);
                  }} 
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all" 
                />
              </div>

              {/* ВОЗВРАЩЕННАЯ ИНСТРУКЦИЯ */}
              <div className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-2xl text-[10px] leading-relaxed text-indigo-900 space-y-1">
                <p className="font-bold">Как получить ключ бесплатно?</p>
                <p>1. Перейдите в <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-indigo-700 transition">Google AI Studio</a>.</p>
                <p>2. Авторизуйтесь под своим Google-аккаунтом и нажмите кнопку <strong>«Get API Key»</strong>.</p>
                <p>3. Скопируйте созданный ключ и вставьте его в поле выше.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  if (!geminiKey) {
                    alert("Пожалуйста, сначала введите API-ключ.");
                    return;
                  }
                  alert("Проверка ключа... Отправка тестового запроса к Gemini.");
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all text-center shadow-md shadow-indigo-100"
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