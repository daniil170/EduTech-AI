import { useState, useEffect } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  generatePlanGemini, 
  generatePlanLocal,
  calculateWeightedProgress 
} from "../../../shared/data/planGenerator";

export const ExamPrep = ({ studentStats, geminiKey, user, onStartPractice }) => {
  const [loading, setLoading] = useState(false);
  const [hoveredPriorityId, setHoveredPriorityId] = useState(null);

  const studyPlan = studentStats?.examPrep?.studyPlan || [];
  const recommendations = studentStats?.examPrep?.recommendations || [];
  const completedPercent = studentStats?.examPrep?.completedPercent || 0;
  const is11th = studentStats?.grade === "11 класс" || !studentStats?.grade;

  useEffect(() => {
    const checkAndRefreshPlanUrgency = async () => {
      if (!user || !studentStats?.examPrep) return;

      const lastUpdate = studentStats?.examPrep?.updatedAt;
      const now = Date.now();

      if (!lastUpdate || (now - new Date(lastUpdate).getTime()) > 1000 * 60 * 60 * 24) {
        const refreshedPlan = generatePlanLocal(studentStats, studentStats?.examPrep);
        const userDocRef = doc(db, "users", user.uid);
        try {
          await updateDoc(userDocRef, {
            "examPrep.studyPlan": refreshedPlan.studyPlan,
            "examPrep.completedPercent": refreshedPlan.completedPercent || 0,
            "examPrep.updatedAt": new Date().toISOString()
          });
        } catch (err) {
          console.error(err);
        }
      }
    };

    checkAndRefreshPlanUrgency();
  }, [studentStats, user]);

  const savePlanToFirestore = async (updatedPlan, updatedRecs, nextPercent, nextVersion = 1) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, {
        "examPrep.studyPlan": updatedPlan,
        "examPrep.recommendations": updatedRecs,
        "examPrep.completedPercent": nextPercent,
        "examPrep.planVersion": nextVersion,
        "examPrep.updatedAt": new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAdvancedPlan = async () => {
    setLoading(true);
    try {
      const regeneratedData = await generatePlanGemini(studentStats, geminiKey, studentStats?.examPrep);
      const nextPercent = calculateWeightedProgress(regeneratedData.studyPlan);
      await savePlanToFirestore(
        regeneratedData.studyPlan, 
        regeneratedData.recommendations, 
        nextPercent,
        regeneratedData.planVersion
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPracticeTracked = async (step) => {
    const updatedPlan = studyPlan.map(s => {
      if (s.id === step.id && s.status !== "done") {
        return { ...s, status: "in_progress" };
      }
      return s;
    });
    
    const currentVersion = studentStats?.examPrep?.planVersion || 1;
    await savePlanToFirestore(updatedPlan, recommendations, completedPercent, currentVersion);
    
    if (onStartPractice) {
      onStartPractice(step.topic, step.subject, step.id);
    }
  };

  const toggleStepStatus = async (stepId) => {
    const updatedPlan = studyPlan.map(step => {
      if (step.id === stepId) {
        const isCurrentDone = step.status === "completed" || step.status === "done";
        const nextStatus = isCurrentDone ? "pending" : "done";
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
    const currentVersion = studentStats?.examPrep?.planVersion || 1;
    await savePlanToFirestore(updatedPlan, recommendations, nextPercent, currentVersion);
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

      {!is11th && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl text-xs text-emerald-900 leading-relaxed flex items-start gap-3 shadow-sm">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-black text-sm">Накопительная программа обучения (9-10 классы)</p>
            <p className="text-emerald-950/70 mt-1 font-medium">
              Ваш план полностью освобожден от жестких дедлайнов и таймеров обратного отсчета до ЕНТ. Система фокусируется на постепенном, глубоком разборе кодификатора по недельным спринтам. Нагрузка распределена равномерно (70% времени уделяется изучению новых понятий, 30% — автоматическому интервальному повторению пройденного материала).
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
          
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight mb-2">
              Дорожная карта занятий (Версия: {studentStats?.examPrep?.planVersion || 1})
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
                const isInProgress = step.status === "in_progress";
                
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-2xl border transition flex flex-col space-y-3 ${
                      isCompleted 
                        ? "bg-emerald-50/20 border-emerald-200/60" 
                        : isNeedsReview 
                          ? "bg-rose-50/30 border-rose-200/80 animate-pulse"
                          : isInProgress
                            ? "bg-indigo-50/40 border-indigo-300 shadow-sm"
                            : "bg-slate-50/50 border-slate-200/60 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
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
                            
                            {isNeedsReview && (
                              <span className="text-[7px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                                Повторить ⚠️
                              </span>
                            )}
                            {isInProgress && (
                              <span className="text-[7px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider animate-pulse">
                                В процессе 🔥
                              </span>
                            )}
                            {step.autoCompleted && isCompleted && (
                              <span className="text-[7px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                                Закрыто ИИ 🤖
                              </span>
                            )}
                            {step.priority !== undefined && !isCompleted && (
                              <div className="relative inline-block">
                                <span 
                                  onMouseEnter={() => setHoveredPriorityId(step.id)}
                                  onMouseLeave={() => setHoveredPriorityId(null)}
                                  className="text-[7px] bg-indigo-50 border border-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold cursor-help transition hover:bg-indigo-100"
                                >
                                  Приоритет: {Math.round(step.priority * 100)}%
                                </span>
                                {hoveredPriorityId === step.id && (
                                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 text-white text-[9px] p-2 rounded-lg shadow-xl z-30 leading-normal font-medium">
                                    Вес темы на ЕНТ + Текущий уровень пробелов + Фактор времени и повторения.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{step.date}</p>
                        </div>
                      </div>

                      {!isCompleted && (
                        <button
                          onClick={() => handleStartPracticeTracked(step)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition shrink-0 cursor-pointer hover:shadow ${
                            isInProgress 
                              ? "bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700" 
                              : "bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-400"
                          }`}
                        >
                          {isInProgress ? "Продолжить" : "Отработать"}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100/70 pt-2 text-[9px] font-bold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>Источник темы:</span>
                        {step.source === "trainer_feedback" ? (
                          <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Аналитика тренажёра ⚡</span>
                        ) : step.source === "manual" ? (
                          <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Вручную учеником 👤</span>
                        ) : (
                          <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Стартовый тест 📝</span>
                        )}
                      </div>
                      {step.subject && (
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{step.subject}</span>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

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
                Прогресс рассчитывается на основе веса каждой темы в структуре ЕНТ прошлых лет, а не от простого количества чекбоксов.
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
                  {recommendations.map((rec, i) => {
                    const isAlert = rec.includes("⚠️");
                    return (
                      <li 
                        key={i} 
                        className={`text-[10px] leading-relaxed flex items-start gap-2 font-medium p-2 rounded-lg ${
                          isAlert ? "bg-rose-50 border border-rose-100 text-rose-700" : "text-slate-600"
                        }`}
                      >
                        {!isAlert && <span className="text-indigo-500 shrink-0 mt-0.5">•</span>}
                        <span>{rec}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};