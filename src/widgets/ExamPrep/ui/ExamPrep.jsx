import { useState } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  generatePlanGemini, 
  mergePlans, 
  calculateWeightedProgress 
} from "../../../shared/data/planGenerator";

export const ExamPrep = ({ studentStats, geminiKey, user, onStartPractice }) => {
  const [loading, setLoading] = useState(false);

  // Load plan data from student stats in Firestore
  const studyPlan = studentStats?.examPrep?.studyPlan || [];
  const recommendations = studentStats?.examPrep?.recommendations || [];
  const completedPercent = studentStats?.examPrep?.completedPercent || 0;
  const is11th = studentStats?.grade === "11 класс" || !studentStats?.grade;

  // Save updated plan state to Firebase
  const savePlanToFirestore = async (updatedPlan, updatedRecs, nextPercent) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, {
        "examPrep.studyPlan": updatedPlan,
        "examPrep.recommendations": updatedRecs,
        "examPrep.completedPercent": nextPercent
      });
    } catch (e) {
      console.error("Ошибка сохранения плана подготовки в Firestore:", e);
    }
  };

  // Rebuild/generate plan using AI or local formula engine
  const handleGenerateAdvancedPlan = async () => {
    setLoading(true);
    try {
      // Call generator (uses Gemini flash if key available, else local priority formulas)
      const newPlan = await generatePlanGemini(studentStats, geminiKey);
      
      // Merge: retain done/completed steps from the old plan
      const merged = mergePlans(studyPlan, newPlan);
      
      // Calculate weighted progress
      const nextPercent = calculateWeightedProgress(merged.studyPlan);
      
      await savePlanToFirestore(merged.studyPlan, merged.recommendations, nextPercent);
    } catch (e) {
      console.error("Ошибка при генерации или обновлении плана:", e);
    } finally {
      setLoading(false);
    }
  };

  // Manually toggle step completion
  const toggleStepStatus = async (stepId) => {
    const updatedPlan = studyPlan.map(step => {
      if (step.id === stepId) {
        const nextStatus = (step.status === "completed" || step.status === "done") ? "upcoming" : "completed";
        return { 
          ...step, 
          status: nextStatus,
          source: "manual",
          autoCompleted: false 
        };
      }
      return step;
    });

    const nextPercent = calculateWeightedProgress(updatedPlan);
    await savePlanToFirestore(updatedPlan, recommendations, nextPercent);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            🎓 Персональный ИИ-План Подготовки
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {is11th 
              ? "Пошаговая адаптивная траектория по темам кодификатора ЕНТ с динамическими дедлайнами."
              : "Программа накопления и закрепления знаний (spaced repetition) для 9-10 классов."}
          </p>
        </div>
        <button
          onClick={handleGenerateAdvancedPlan}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md hover:shadow-lg transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          {loading ? "Анализ успеваемости..." : "🤖 Перестроить ИИ-План"}
        </button>
      </div>

      {/* 9-10th Grade info banner */}
      {!is11th && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-150 p-4 rounded-2xl text-xs text-indigo-800 leading-normal flex items-start gap-2.5">
          <span className="text-sm">💡</span>
          <div>
            <p className="font-bold">Программа накопления знаний</p>
            <p className="text-indigo-950/70 mt-0.5">
              Для 9-10 классов план фокусируется на последовательном освоении тем и интервальном повторении без жестких таймеров ЕНТ. Мы распределили нагрузку по рекомендуемым учебным неделям.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 border-r-indigo-500 animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold animate-pulse">
            Нейросеть рассчитывает приоритеты и строит дорожную карту по темам...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Steps List */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight mb-2">
              Дорожная карта занятий
            </h3>
            {studyPlan.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                <p className="text-xs text-slate-400 italic">План подготовки пуст.</p>
                <button
                  onClick={handleGenerateAdvancedPlan}
                  className="mt-3 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition"
                >
                  Сгенерировать первый план
                </button>
              </div>
            ) : (
              studyPlan.map((step) => {
                const isCompleted = step.status === "completed" || step.status === "done";
                const isNeedsReview = step.status === "needs_review";
                
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                      isCompleted 
                        ? "bg-emerald-50/30 border-emerald-200/80" 
                        : isNeedsReview 
                          ? "bg-rose-50/30 border-rose-200/80"
                          : "bg-slate-50/50 border-slate-200/60 hover:border-slate-350"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleStepStatus(step.id)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className={`text-xs font-bold truncate ${isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {step.name}
                          </h4>
                          
                          {/* Badges */}
                          {isNeedsReview && (
                            <span className="text-[7px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                              Повторить ⚠️
                            </span>
                          )}
                          {step.autoCompleted && isCompleted && (
                            <span className="text-[7px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                              Закрыто ИИ 🤖
                            </span>
                          )}
                          {step.priority !== undefined && !isCompleted && (
                            <span 
                              title="Приоритет: (1 - Уровень знаний) × Вес темы × Фактор срочности"
                              className="text-[7px] bg-indigo-50 border border-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold"
                            >
                              Приоритет: {Math.round(step.priority * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{step.date}</p>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => onStartPractice(step.topic, step.subject)}
                        className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition shrink-0 cursor-pointer hover:shadow"
                      >
                        Отработать
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Stats & Recommendations */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800/80 shadow-md">
              <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                Взвешенное выполнение плана
              </h3>
              <p className="text-3xl font-black text-indigo-400 mt-2">
                {completedPercent}%
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500" 
                  style={{ width: `${completedPercent}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2.5 leading-normal">
                Прогресс рассчитывается с учетом веса каждой темы на реальном ЕНТ, а не просто количества галочек.
              </p>
            </div>

            <div className="border border-slate-200/80 p-5 rounded-2xl bg-slate-50/40">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight mb-3">
                Советы ИИ-тьютора
              </h3>
              {recommendations.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">
                  Рекомендации появятся после генерации первого плана.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="text-[10px] text-slate-600 leading-relaxed flex items-start gap-2 font-medium">
                      <span className="text-indigo-500 shrink-0 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};