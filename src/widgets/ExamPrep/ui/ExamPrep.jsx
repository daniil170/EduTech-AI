import { useState } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const ExamPrep = ({ studentStats, geminiKey, user, onStartPractice }) => {
  const [loading, setLoading] = useState(false);

  // Берём актуальные данные из пропсов (Firestore) или ставим пустые дефолты
  const studyPlan = studentStats?.examPrep?.studyPlan || [];
  const recommendations = studentStats?.examPrep?.recommendations || [];
  const completedPercent = studentStats?.examPrep?.completedPercent || 0;

  // Функция сохранения обновленного состояния плана обратно в Firebase
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

  // Живая генерация умного плана через ИИ
  const handleGenerateAdvancedPlan = async () => {
    if (!geminiKey) {
      alert("Для интерактивного ИИ-планирования подключите API-ключ Gemini в настройках!");
      return;
    }
    setLoading(true);

    const subjects = studentStats?.subjectsMastery?.map(s => s.name) || ["История Казахстана"];
    const prompt = `Ты — ведущий ИИ-методолог ЕНТ. Сформируй расширенный индивидуальный пошаговый план подготовки на основе предметов ученика: ${subjects.join(", ")}.
Ответ верни строго в формате JSON без markdown-оберток (без \`\`\`json):
{
  "studyPlan": [
    {"id": "p-1", "name": "Глубокий разбор тригонометрических формул", "status": "upcoming", "date": "Срок: 3 дня", "subject": "${subjects[0]}"},
    {"id": "p-2", "name": "Анализ исторических источников и дат", "status": "upcoming", "date": "Срок: 5 дней", "subject": "${subjects[1] || subjects[0]}"},
    {"id": "p-3", "name": "Отработка систем логических уравнений", "status": "upcoming", "date": "Срок: 1 неделя", "subject": "${subjects[0]}"}
  ],
  "recommendations": [
    "Сделай упор на решение задач повышенной сложности в тренажере",
    "Повторяй конспекты по выходным для закрепления долгосрочной памяти"
  ]
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      let cleanText = data.candidates[0].content.parts[0].text;
      cleanText = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      
      const result = JSON.parse(cleanText);
      
      // Намертво сохраняем в базу данных, стейт обновится автоматически через пропсы
      await savePlanToFirestore(result.studyPlan, result.recommendations, 0);

    } catch (e) {
      console.error(e);
      alert("Не удалось сгенерировать план. Проверьте API-ключ.");
    } finally {
      setLoading(false);
    }
  };

  // Переключение статуса шага (Выполнено / Предстоит)
  const toggleStepStatus = async (stepId) => {
    const updatedPlan = studyPlan.map(step => {
      if (step.id === stepId) {
        return { ...step, status: step.status === "completed" ? "upcoming" : "completed" };
      }
      return step;
    });

    const completedCount = updatedPlan.filter(s => s.status === "completed").length;
    const nextPercent = Math.round((completedCount / updatedPlan.length) * 100);
    
    // Отправляем изменения на сервер, onSnapshot поменяет пропсы сверху, и интерфейс перерендерится
    await savePlanToFirestore(updatedPlan, recommendations, nextPercent);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">🎓 Персональный ИИ-План Подготовки</h1>
          <p className="text-xs text-slate-500 mt-1">Пошаговый трек распределения тем кодификатора ЕНТ.</p>
        </div>
        <button
          onClick={handleGenerateAdvancedPlan}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all whitespace-nowrap"
        >
          {loading ? "Пересчет матрицы..." : "🤖 Перестроить ИИ-План"}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-medium animate-pulse">
          Нейросеть анализирует вашу успеваемость и собирает дорожную карту...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Список шагов */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight mb-2">Дорожная карта занятий</h3>
            {studyPlan.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">План пуст. Нажмите кнопку выше, чтобы ИИ сгенерировал персональные шаги.</p>
            ) : (
              studyPlan.map((step) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                    step.status === "completed" ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50/50 border-slate-200/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={step.status === "completed"}
                      onChange={() => toggleStepStatus(step.id)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <h4 className={`text-xs font-bold ${step.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {step.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{step.date}</p>
                    </div>
                  </div>

                  {step.status !== "completed" && (
                    <button
                      onClick={() => onStartPractice(step.name, step.subject || "Математика")}
                      className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm transition"
                    >
                      Отработать
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Статистика и ИИ-рекомендации */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Выполнение плана</h3>
              <p className="text-3xl font-black text-indigo-400 mt-2">{completedPercent}%</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-indigo-400 h-full transition-all duration-500" style={{ width: `${completedPercent}%` }}></div>
              </div>
            </div>

            <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/30">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight mb-3">Советы тьютора</h3>
              {recommendations.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Рекомендации появятся после генерации плана.</p>
              ) : (
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="text-[11px] text-slate-600 leading-relaxed flex items-start gap-2 font-medium">
                      <span className="text-indigo-500 mt-0.5">•</span>
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