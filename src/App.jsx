import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./app/providers/Firebase/firebase";

import { LandingPage } from "./pages/LandingPage";
import { Workspace } from "./pages/Workspace";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Отписываемся от предыдущего слушателя документа при смене пользователя
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        // Используем onSnapshot для мгновенной загрузки из оффлайн-кэша без ожидания сети
        unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (!docSnap.exists()) {
            const savedRole = localStorage.getItem("selected_role") || "student";
            localStorage.removeItem("selected_role");

            setDoc(userDocRef, {
              email: currentUser.email,
              role: savedRole,
              grade: savedRole === "teacher" ? "Преподаватель" : "11 класс",
              examType: savedRole === "teacher" ? "Управление" : "ЕНТ 2026",
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

              subjectsMastery: [
                { id: "math", name: "Математическая грамотность", level: "Базовый", progress: 0, color: "bg-indigo-600" },
                { id: "history", name: "История Казахстана", level: "Базовый", progress: 0, color: "bg-emerald-500" },
                { id: "science", name: "Профильный предмет", level: "Базовый", progress: 0, color: "bg-slate-800" }
              ],

              attentionRequired: [],

              weeklyGoals: [
                { id: 1, text: "Решить 50 задач по Алгебре", current: 0, max: 50, color: "bg-indigo-600" },
                { id: 2, text: "Пробный тест по Истории Казахстана", current: 0, max: 1, color: "bg-emerald-500" },
                { id: 3, text: "Практические занятия (ИИ)", current: 0, max: 30, color: "bg-amber-500", isTime: false }
              ],

              attentionNeeded: [],

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
                { id: "act-1", type: "Система", name: "Добро пожаловать в EduTech AI! Начните подготовку, решив задачу в ИИ-Тренажере или вступив в класс.", score: "+0 опыта", time: "Только что" }
              ]
            }).catch(err => console.error("Ошибка создания документа:", err));
          }
          
          setUser(currentUser);
          setLoading(false);
        }, (error) => {
          console.warn("Предупреждение оффлайн-режима в onSnapshot:", error);
          setUser(currentUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/workspace" /> : <LandingPage />} />
        <Route path="/dashboard" element={<Navigate to="/workspace" />} />
        <Route path="/workspace" element={user ? <Workspace /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;