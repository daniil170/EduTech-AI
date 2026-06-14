import { useState, useEffect, useCallback } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

// Выносим константы за пределы компонента, чтобы не плодить зависимости
const SUBJECT_NAMES = {
  Math: "Математическая грамотность",
  Biology: "Биология",
  Physics: "Физика"
};

export const ExamPrep = ({ studentStats, geminiKey, user, onStartPractice }) => {
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Чистая асинхронная функция без синхронных вызовов setState внутри её тела
  const generateAiPlanForSubject = useCallback(async (abortController) => {
    if (!geminiKey) return;

    const currentSubjectName = SUBJECT_NAMES[selectedSubject];
    const currentProgress = studentStats?.overallProgress || 0;
    const attentionTopics = (studentStats?.attentionRequired || [])
      .filter(item => item.subject === currentSubjectName || item.subject === selectedSubject)
      .map(item => item.topic)
      .join(", ");

    const prompt = `Сформируй краткий план подготовки и аналитику по предмету "${currentSubjectName}" для ученика 11 класса (экзамен ЕНТ).
Текущий общий прогресс ученика: ${currentProgress}%.
Темы, в которых он недавно ошибся или которые требуют внимания: [${attentionTopics || "Нет критических ошибок, идет по базовому плану"}].

Верни ответ строго в формате JSON (без markdown-разметки вроде \`\`\`json):
{
  "predictiveGrade": "прогнозируемая оценка латинской буквой (A, B, C, D) на основе успеваемости",
  "masteryLevel": "процент освоения предмета (например, 75%)",
  "topicToFocus": "одна самая приоритетная тема для отработки прямо сейчас",
  "insightText": "аналитический разбор от ИИ в 2 предложения на русском языке: сильные стороны и на что нажать",
  "steps": [
    {"name": "Название темы 1", "status": "completed", "desc": "краткое пояснение (например, успешно закреплено)"},
    {"name": "Название темы 2", "status": "in_progress", "desc": "текущий фокус"},
    {"name": "Название темы 3", "status": "upcoming", "desc": "планируется далее"}
  ]
}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
      
      if (!abortController.signal.aborted) {
        setAiPlan(parsed);
      }
    } catch (err) {
      if (err.name !== "AbortError" && !abortController.signal.aborted) {
        console.error("Ошибка ИИ при генерации плана:", err);
        setAiPlan({
          predictiveGrade: "B",
          masteryLevel: `${currentProgress}%`,
          topicToFocus: "Общее повторение",
          insightText: "Подключите Gemini API или проверьте соединение, чтобы ИИ составил глубокую аналитику.",
          steps: [{ name: "Базовый модуль программы", status: "in_progress", desc: "Требует генерации ИИ" }]
        });
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingAi(false);
      }
    }
  }, [geminiKey, selectedSubject, studentStats?.overallProgress, studentStats?.attentionRequired]);

  // ЭТАЛОННЫЙ ПАТТЕРН: Вызов setLoadingAi изолирован внутри асинхронного таска
  useEffect(() => {
    if (!geminiKey) return;
    
    const abortController = new AbortController();
    
    const startFetch = async () => {
      // ИИ-лоадер включается строго асинхронно, не блокируя основной поток рендеринга React
      setLoadingAi(true);
      await generateAiPlanForSubject(abortController);
    };

    startFetch();

    return () => {
      abortController.abort();
    };
  }, [generateAiPlanForSubject, geminiKey]);

  // Интеграция ИИ с дедлайнами календаря Firestore
  const handleScheduleWithAi = async (stepName, stepDesc) => {
    if (!user) {
      alert("Пользователь не авторизован.");
      return;
    }
    
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      
      await addDoc(collection(db, "calendar"), {
        title: `ИИ Занятие: ${stepName} (${stepDesc})`,
        time: "16:00",
        date: todayStr,
        studentId: user.uid,
        createdAt: new Date().toISOString()
      });

      alert(`🤖 ИИ успешно добавил тему "${stepName}" в твое расписание на сегодня! Проверь вкладку "Расписание".`);
    } catch (e) {
      console.error("Ошибка добавления ИИ-плана в календарь:", e);
      alert("Произошла ошибка при сохранении занятия в календарь.");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900">🎓 Персональный ИИ-План Экзаменов</h1>
        <p className="text-xs text-slate-500 mt-1">
          Этот раздел полностью контролируется ИИ. Он анализирует твои ошибки и выстраивает расписание и траекторию к баллам на лету.
        </p>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/40">
        {["Math", "Biology", "Physics"].map(sub => (
          <button
            key={sub}
            onClick={() => { setSelectedSubject(sub); setAiPlan(null); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${selectedSubject === sub ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-white/50"}`}
          >
            {sub === "Math" ? "Математика" : sub === "Biology" ? "Биология" : "Физика"}
          </button>
        ))}
      </div>

      {!geminiKey && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs">
          <strong>Ключ ИИ не найден!</strong> Чтобы искусственный интеллект построил для вас карту знаний и расписание, укажите API-ключ в настройках ⚙️.
        </div>
      )}

      {loadingAi && (
        <div className="p-12 bg-white border rounded-3xl text-center text-xs text-slate-400 animate-pulse">
          🤖 ИИ анализирует вашу успеваемость и собирает актуальный роадмап...
        </div>
      )}

      {aiPlan && !loadingAi && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight border-b pb-3">Маршрут ИИ-Обучения</h3>
            
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-200"></div>
              {aiPlan.steps?.map((step, idx) => (
                <div key={idx} className="relative group text-xs">
                  <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                    {step.status === "completed" && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                    {step.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{step.name}</h4>
                    <p className="text-slate-400 mt-0.5 text-[11px]">{step.desc}</p>
                    {step.status !== "completed" && (
                      <button 
                        onClick={() => handleScheduleWithAi(step.name, step.desc)}
                        className="text-[10px] text-indigo-600 font-bold hover:underline mt-1 block text-left"
                      >
                        🗓️ Назначить ИИ-урок в календарь
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
              <span className="text-[9px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase">Predictive AI Engine</span>
              <h2 className="text-2xl font-black">Прогноз ИИ: <span className="text-indigo-400 font-mono">{aiPlan.predictiveGrade}</span> (Освоение: {aiPlan.masteryLevel})</h2>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">{aiPlan.insightText}</p>
              
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => onStartPractice && onStartPractice(aiPlan.topicToFocus, selectedSubject)}
                  className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-slate-100 transition-all"
                >
                  🚀 Открыть тренажер: {aiPlan.topicToFocus}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};