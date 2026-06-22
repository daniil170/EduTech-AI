import { useState, useEffect } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";

export const CeoPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "moderation") return;

    let isMounted = true;

    const performFetch = async () => {
      if (isMounted) {
        setLoading(true);
      }
      try {
        const qSnap = await getDocs(
          query(collection(db, "questionBank"), where("isApproved", "==", false))
        );
        const list = [];
        
        const { fetchQuestionContent } = await import("../../../shared/data/contentService");
        
        for (const docSnap of qSnap.docs) {
          const data = docSnap.data();
          const content = await fetchQuestionContent(data.storagePath);
          if (content) {
            list.push({
              id: docSnap.id,
              ...data,
              details: content
            });
          }
        }
        
        if (isMounted) {
          setPendingQuestions(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    performFetch();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const loadPendingQuestions = async () => {
    setLoading(true);
    try {
      const qSnap = await getDocs(
        query(collection(db, "questionBank"), where("isApproved", "==", false))
      );
      const list = [];
      
      const { fetchQuestionContent } = await import("../../../shared/data/contentService");
      
      for (const docSnap of qSnap.docs) {
        const data = docSnap.data();
        const content = await fetchQuestionContent(data.storagePath);
        if (content) {
          list.push({
            id: docSnap.id,
            ...data,
            details: content
          });
        }
      }
      setPendingQuestions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveQuestion = async (id) => {
    try {
      await updateDoc(doc(db, "questionBank", id), {
        isApproved: true
      });
      setPendingQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const rejectQuestion = async (id) => {
    try {
      await deleteDoc(doc(db, "questionBank", id));
      setPendingQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      <div className="flex justify-between items-center border-b pb-4 border-slate-100">
        <div>
          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">Панель Основателя</span>
          <h2 className="text-xl font-black mt-2 text-slate-900">Управление платформой Edutech</h2>
        </div>
        <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition">
          Закрыть панель
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-xs font-bold transition-all px-1 relative ${
            activeTab === "users" ? "text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Пользователи и Тарифы
        </button>
        <button
          onClick={() => setActiveTab("moderation")}
          className={`pb-3 text-xs font-bold transition-all px-1 relative ${
            activeTab === "moderation" ? "text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Модерация банка задач ({pendingQuestions.length})
        </button>
      </div>

      {activeTab === "users" && (
        <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl p-8 border">
          Раздел управления аккаунтами пользователей активен в стандартном режиме синхронизации.
        </div>
      )}

      {activeTab === "moderation" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm text-slate-800">Задачи, ожидающие верификации экспертом</h3>
            <button onClick={loadPendingQuestions} className="text-[11px] text-indigo-600 font-bold hover:underline">
              Обновить список 🔄
            </button>
          </div>

          {loading && (
            <div className="py-12 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[11px] text-slate-400 font-medium">Загрузка контента из хранилища...</p>
            </div>
          )}

          {!loading && pendingQuestions.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 italic bg-slate-50 border rounded-2xl">
              Все сгенерированные ИИ вопросы успешно проверены и опубликованы в банк контента.
            </div>
          )}

          {!loading && pendingQuestions.length > 0 && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {pendingQuestions.map((q) => (
                <div key={q.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">{q.subject}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{q.topic}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded ${
                      q.difficulty === "hard" ? "bg-rose-50 text-rose-700 border border-rose-200" : q.difficulty === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>{q.difficulty}</span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {q.details.question}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.details.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs font-medium border ${
                          idx === q.details.correctIndex ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold" : "bg-white border-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-black mr-2 text-slate-400">{String.fromCharCode(65 + idx)})</span>
                        {opt}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] border border-amber-100 bg-amber-50/20 p-3 rounded-xl text-slate-700 leading-relaxed">
                    <span className="font-bold text-amber-800 block mb-0.5">Разбор / Пояснение:</span>
                    {q.details.explanation}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => rejectQuestion(q.id)}
                      className="bg-rose-50 border border-rose-200 text-rose-700 font-bold px-3 py-1.5 rounded-xl text-[11px] hover:bg-rose-100 transition cursor-pointer"
                    >
                      Отклонить (Удалить)
                    </button>
                    <button
                      onClick={() => approveQuestion(q.id)}
                      className="bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-xl text-[11px] hover:bg-indigo-700 shadow-sm transition cursor-pointer"
                    >
                      Одобрить и Опубликовать ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};