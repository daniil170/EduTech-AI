import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "./app/providers/Firebase/firebase";

import { LandingPage } from "./pages/LandingPage";
import { Workspace } from "./pages/Workspace";
import { ResetPassword } from "./pages/ResetPassword";
import { PrivacyPolicyModal } from "./features/PrivacyPolicyModal";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [cookieDocOpen, setCookieDocOpen] = useState(false);
  const [cookieDocType, setCookieDocType] = useState("cookies");

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => {
        setShowCookieBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowCookieBanner(false);
  };

  const handleDeclineCookies = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShowCookieBanner(false);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setLoading(true);
        const userDocRef = doc(db, "users", currentUser.uid);

        try {
          const docSnap = await getDoc(userDocRef);
          const userEmailLower = currentUser.email ? currentUser.email.toLowerCase() : "";
          const isFounderEmail = userEmailLower === "daniilivakin30@gmail.com";

          // Проверяем, есть ли пользователь в вайтлисте приглашенных друзей
          let isWhitelisted = false;
          if (userEmailLower) {
            const whitelistDocRef = doc(db, "premium_whitelist", userEmailLower);
            const whitelistSnap = await getDoc(whitelistDocRef);
            isWhitelisted = whitelistSnap.exists();
          }

          if (!docSnap.exists()) {
            const savedGrade = localStorage.getItem("selected_grade") || "11 класс";
            const savedDaysToUnt = localStorage.getItem("selected_days_to_unt") || "";
            const savedStudyTimeSlot = localStorage.getItem("selected_study_time_slot") || "14:00 - 20:00";
            const savedNickname = localStorage.getItem("selected_nickname") || "";
            localStorage.removeItem("selected_role");
            localStorage.removeItem("selected_grade");
            localStorage.removeItem("selected_days_to_unt");
            localStorage.removeItem("selected_study_time_slot");
            localStorage.removeItem("selected_nickname");

            let finalNickname = savedNickname;
            if (!finalNickname) {
              const baseName = currentUser.email ? currentUser.email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "") : `user_${Math.random().toString(36).substring(2, 7)}`;
              let tempName = baseName || `user_${Math.random().toString(36).substring(2, 7)}`;
              let isUnique = false;
              let attempts = 0;
              while (!isUnique && attempts < 5) {
                const q = query(
                  collection(db, "users"),
                  where("nicknameLower", "==", tempName.toLowerCase())
                );
                const querySnap = await getDocs(q);
                if (querySnap.empty) {
                  isUnique = true;
                  finalNickname = tempName;
                } else {
                  tempName = `${baseName}_${Math.floor(100 + Math.random() * 900)}`;
                  attempts++;
                }
              }
              if (!finalNickname) {
                finalNickname = `${baseName}_${Date.now().toString().slice(-4)}`;
              }
            }

            await setDoc(userDocRef, {
              email: currentUser.email,
              nickname: finalNickname,
              nicknameLower: finalNickname.toLowerCase(),
              role: isFounderEmail ? "founder" : "student",
              tariff: isFounderEmail ? "founder" : (isWhitelisted ? "whitelisted" : "free"),
              grade: savedGrade,
              daysToUnt: savedDaysToUnt ? parseInt(savedDaysToUnt, 10) : "",
              studyTimeSlot: savedStudyTimeSlot,
              examType: "ЕНТ",
              profileCombination: "",
              hasPassedDiagnostic: false,
              topicMastery: {},
              diagnostics: {},

              overallProgress: 0,
              targetScore: 140,
              streakDays: 0,
              xp: 0,
              level: 1,
              activityDates: [],

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
          } else {
            // Если документ существует, проверяем и синхронизируем роль founder или вайтлист
            const existingData = docSnap.data();
            let updates = {};

            if (isFounderEmail && existingData.role !== "founder") {
              updates.role = "founder";
              updates.tariff = "founder";
            } else if (!isFounderEmail && isWhitelisted && existingData.tariff !== "whitelisted") {
              updates.tariff = "whitelisted";
            } else if (!isFounderEmail && !isWhitelisted && existingData.tariff === "whitelisted") {
              // Если друга удалили из вайтлиста, возвращаем базовый тариф
              updates.tariff = "free";
            }

            if (Object.keys(updates).length > 0) {
              await setDoc(userDocRef, updates, { merge: true });
            }
          }
        } catch (err) {
          console.error("Ошибка при проверке/создании документа пользователя (возможно офлайн):", err);
          // Не падаем, а позволяем приложению использовать локальный стейт или кэш Firebase
        }

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: выносим из try блока, чтобы загрузка гарантированно отключалась
        setUser(currentUser);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
        if (window.location.pathname !== "/" && window.location.pathname !== "/reset-password") {
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
    <>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/dashboard" element={<Navigate to="/workspace" />} />
        <Route path="/workspace" element={user ? <Workspace /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>

      {showCookieBanner && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-[420px] bg-slate-900/95 border border-slate-800/80 rounded-3xl p-5 shadow-2xl shadow-slate-950/60 backdrop-blur-xl z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">🍪</span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">Использование файлов cookie</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Мы используем файлы cookie для вашей авторизации, обеспечения безопасности и настройки персонализированного ИИ-обучения. Ознакомьтесь с нашей{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCookieDocType("cookies");
                    setCookieDocOpen(true);
                  }}
                  className="text-indigo-400 hover:underline font-bold inline border-none bg-transparent p-0 cursor-pointer text-[10px]"
                >
                  Политикой использования cookie
                </button>
                .
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeclineCookies}
              className="flex-1 bg-slate-805 hover:bg-slate-700 text-slate-300 hover:text-white transition py-2 px-4 rounded-xl text-[10px] font-bold border border-slate-800/60 cursor-pointer"
            >
              Отклонить
            </button>
            <button
              onClick={handleAcceptCookies}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white transition py-2 px-4 rounded-xl text-[10px] font-black cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Принять всё
            </button>
          </div>
        </div>
      )}

      {cookieDocOpen && (
        <PrivacyPolicyModal onClose={() => setCookieDocOpen(false)} documentType={cookieDocType} />
      )}
    </>
  );
}

export default App;