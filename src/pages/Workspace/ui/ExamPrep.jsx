import { useState, useEffect, useCallback } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

export const ExamPrep = ({ studentStats, geminiKey, user, onStartPractice }) => {
  const subjects = studentStats?.subjectsMastery || [];
  const [selectedSubjectState, setSelectedSubjectState] = useState("");
  const selectedSubject = selectedSubjectState || subjects[0]?.name || "";
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const generateAiPlanForSubject = useCallback(async (abortController) => {
    if (!selectedSubject) return;

    const currentSubjectName = selectedSubject;
    const currentProgress = studentStats?.overallProgress || 0;
    const attentionTopics = (studentStats?.attentionRequired || [])
      .filter(item => item.subject === selectedSubject)
      .map(item => item.topic)
      .join(", ");

    const studentGrade = studentStats?.grade || "11 класс";
    const daysLeftText = studentStats?.daysToUnt ? ` (осталось дней до ЕНТ: ${studentStats.daysToUnt})` : "";

    // If geminiKey is not set, generate mock AI plan client-side (Pacing & Grade based)
    if (!geminiKey) {
      setLoadingAi(true);
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulating AI thinking delay

      const getMockPlanForSubject = (subjectName) => {
        switch (subjectName) {
          case "Математика":
            return {
              predictiveGrade: studentGrade === "11-класс" ? "A" : "B",
              masteryLevel: "68%",
              topicToFocus: "Тригонометрические уравнения",
              insightText: `Ученик показывает хорошие навыки в алгебре. Для ${studentGrade} рекомендуем сфокусироваться на тригонометрических уравнениях и неравенствах${studentStats?.daysToUnt ? `, так как до экзамена осталось всего ${studentStats.daysToUnt} дней` : ""}.`,
              steps: [
                { name: "Системы линейных уравнений", status: "completed", desc: "Закреплено на практике" },
                { name: "Тригонометрические формулы приведения", status: "in_progress", desc: "Текущий фокус, разберите формулы" },
                { name: "Логарифмические неравенства", status: "upcoming", desc: "Рекомендуется разобрать на следующей неделе" }
              ]
            };
          case "Физика":
            return {
              predictiveGrade: "B",
              masteryLevel: "52%",
              topicToFocus: "Законы термодинамики",
              insightText: `Механика усвоена на хорошем уровне. В рамках программы ${studentGrade} необходимо подтянуть законы идеального газа и изопроцессы.`,
              steps: [
                { name: "Кинематика и Динамика материальной точки", status: "completed", desc: "Пройдено без ошибок" },
                { name: "Изопроцессы в идеальном газе", status: "in_progress", desc: "Текущий фокус" },
                { name: "Электростатика и закон Кулона", status: "upcoming", desc: "Запланировано после термодинамики" }
              ]
            };
          case "Биология":
            return {
              predictiveGrade: "A",
              masteryLevel: "74%",
              topicToFocus: "Законы Г. Менделя",
              insightText: `Анатомия и зоология усвоены отлично. Переходите к разделу общей биологии и генетике в соответствии с планом для ${studentGrade}.`,
              steps: [
                { name: "Анатомия человека: Кровеносная система", status: "completed", desc: "Ошибок не обнаружено" },
                { name: "Моногибридное и дигибридное скрещивание", status: "in_progress", desc: "Разберите первый и второй законы Менделя" },
                { name: "Эволюционное учение Ч. Дарвина", status: "upcoming", desc: "Запланировано" }
              ]
            };
          case "Химия":
            return {
              predictiveGrade: "B",
              masteryLevel: "60%",
              topicToFocus: "Классы органических соединений",
              insightText: `Базовая неорганическая химия пройдена. Для сдачи ЕНТ на высокий балл сфокусируйтесь на реакциях органического синтеза.`,
              steps: [
                { name: "Периодический закон и свойства элементов", status: "completed", desc: "Ошибок не обнаружено" },
                { name: "Углеводороды: гомологический ряд алканов", status: "in_progress", desc: "Текущий фокус" },
                { name: "Аминокислоты и белки", status: "upcoming", desc: "Запланировано" }
              ]
            };
          case "География":
            return {
              predictiveGrade: "A",
              masteryLevel: "82%",
              topicToFocus: "География материков и океанов",
              insightText: "Высокий уровень знаний. Для закрепления материала повторите климатологию Южной Америки и экономическое районирование РК.",
              steps: [
                { name: "Политическая карта мира", status: "completed", desc: "Успешное тестирование" },
                { name: "Климатические пояса Земли", status: "in_progress", desc: "Текущий фокус" },
                { name: "Экономическая география Казахстана", status: "upcoming", desc: "Запланировано" }
              ]
            };
          case "История Казахстана":
            return {
              predictiveGrade: "B",
              masteryLevel: "70%",
              topicToFocus: "Образование Казахского ханства",
              insightText: `Отличные знания древней истории. Сфокусируйтесь на деталях образования ханства в XV веке и реформах ханов, это частая тема ЕНТ.`,
              steps: [
                { name: "Эпоха бронзы на территории Казахстана", status: "completed", desc: "Закреплено" },
                { name: "Образование Казахского ханства при Керее и Жанибеке", status: "in_progress", desc: "Текущий фокус, выучите даты" },
                { name: "Казахстан в годы Великой Отечественной войны", status: "upcoming", desc: "Запланировано" }
              ]
            };
          default:
            return {
              predictiveGrade: "A",
              masteryLevel: "65%",
              topicToFocus: "Базовые понятия и терминология",
              insightText: `Рекомендуется начать последовательное изучение разделов в соответствии с планом подготовки для ${studentGrade}.`,
              steps: [
                { name: "Введение в предмет", status: "completed", desc: "Материал усвоен" },
                { name: "Основной раздел курса", status: "in_progress", desc: "Текущий фокус" },
                { name: "Итоговое повторение разделов", status: "upcoming", desc: "Запланировано" }
              ]
            };
        }
      };

      if (!abortController.signal.aborted) {
        setAiPlan(getMockPlanForSubject(currentSubjectName));
        setLoadingAi(false);
      }
      return;
    }

    const prompt = `Сформируй краткий план подготовки и аналитику по предмету "${currentSubjectName}" для ученика ${studentGrade}${daysLeftText} (экзамен ЕНТ).
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
  }, [geminiKey, selectedSubject, studentStats]);

  useEffect(() => {
    if (!selectedSubject) return;
    
    const abortController = new AbortController();
    
    const startFetch = async () => {
      setLoadingAi(true);
      await generateAiPlanForSubject(abortController);
    };

    startFetch();

    return () => {
      abortController.abort();
    };
  }, [generateAiPlanForSubject, selectedSubject]);

  const handleScheduleWithAi = async (stepName) => {
    if (!user) {
      alert("Пользователь не авторизован.");
      return;
    }
    
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      
      await addDoc(collection(db, "calendar"), {
        title: `ИИ Занятие: ${stepName}`,
        subject: selectedSubject,
        topic: stepName,
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

      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/40">
        {subjects.map(sub => (
          <button
            key={sub.id}
            onClick={() => { setSelectedSubjectState(sub.name); setAiPlan(null); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${selectedSubject === sub.name ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-white/50"}`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {!geminiKey && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-700 rounded-2xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>✨</span>
            <strong>Режим EduTrack AI Free:</strong> ИИ-помощник работает в демонстрационном режиме бесплатно и без ограничений.
          </span>
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
                        onClick={() => handleScheduleWithAi(step.name)}
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