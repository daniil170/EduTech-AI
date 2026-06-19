import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./app/providers/Firebase/firebase";

import { LandingPage } from "./pages/LandingPage";
import { Workspace } from "./pages/Workspace";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setLoading(true);
        const userDocRef = doc(db, "users", currentUser.uid);

        try {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            const savedGrade = localStorage.getItem("selected_grade") || "11 класс";
            const savedDaysToUnt = localStorage.getItem("selected_days_to_unt") || "";
            localStorage.removeItem("selected_role");
            localStorage.removeItem("selected_grade");
            localStorage.removeItem("selected_days_to_unt");

            await setDoc(userDocRef, {
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
                { day: "Вс", solved: 0 }
              ],

              subjectsMastery: [],
              attentionRequired: [],
              attentionNeeded: [],

              weeklyGoals: [
                { id: 1, text: "Решить 50 задач по Алгебре", current: 0, max: 50, color: "bg-indigo-600" },
                { id: 2, text: "Пробный тест по Истории Казахстана", current: 0, max: 1, color: "bg-emerald-500" },
                { id: 3, text: "Практические занятия (ИИ)", current: 0, max: 30, color: "bg-amber-500", isTime: false }
              ],

              examPrep: {
                completedPercent: 0,
                studyPlan: [
                  { id: "sp-1", name: "Основы алгебры", status: "upcoming", date: "Срок: на этой неделе" },
                  { id: "sp-2", name: "Тригонометрические функции", status: "upcoming", date: "Срок: следующая неделя" },
                  { id: "sp-3", name: "Дифференциальное исчисление", status: "upcoming", date: "Срок: через 2 недели" }
                ],
                recommendations: []
              },
              recentActivity: [
                { id: "act-1", type: "Система", name: "Добро пожаловать в EduTrack AI! Начните подготовку с прохождения диагностического теста.", score: "+0 опыта", time: "Только что" }
              ]
            });
          }
        } catch (err) {
          console.error("Ошибка при проверке/создании документа пользователя (возможно офлайн):", err);
          // Не падаем, а позволяем приложению использовать локальный стейт или кэш Firebase
        }

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: выносим из try блока, чтобы загрузка гарантированно отключалась
        setUser(currentUser);
        setLoading(false);
        if (window.location.pathname === "/") {
          navigate("/workspace");
        }
      } else {
        setUser(null);
        setLoading(false);
        if (window.location.pathname !== "/") {
          navigate("/");
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans select-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600 rounded-full filter blur-[100px] animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full filter blur-[100px] animate-pulse pointer-events-none"></div>

        <div className="relative flex flex-col items-center z-10">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 border-r-indigo-500 animate-spin [animation-duration:1.2s] premium-glow"></div>
            <div className="absolute inset-2.5 rounded-full border-[3px] border-purple-500/10 border-b-purple-500 border-l-purple-500 animate-spin [animation-duration:1.8s] [animation-direction:reverse]"></div>
            <div className="absolute inset-5.5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center premium-glow-cyan shadow-indigo-500/40">
              <svg className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              Инициализация защищенного соединения и профиля...
            </p>
          </div>

          <div className="h-[2px] w-36 bg-slate-900 rounded-full overflow-hidden mt-6 relative">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-50 to-cyan-400 rounded-full animate-progress-width"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/workspace" /> : <LandingPage />} />
      <Route path="/dashboard" element={<Navigate to="/workspace" />} />
      <Route path="/workspace" element={user ? <Workspace /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default App;