import { useState } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { BlockMath, InlineMath } from "react-katex";

// Локальный фолбек на случай, если ключ не передан или отвалился интернет
const getLocalLessonFallback = (subject, topic) => ({
  theory: "### Основные положения\n\nПри подготовке к ЕНТ важно помнить базовые законы.\n\n### Ключевые формулы\n\nСкорость движения и закон сохранения энергии играют важнейшую роль в расчетных задачах физики и механики.",
  formula: "v = \\frac{s}{t} \\quad \\text{и} \\quad E_k = \\frac{m \\cdot v^2}{2}",
  tasks: [
    { question: `Тестовое задание №1 по теме ${topic}. Какое из следующих утверждений наиболее точно описывает базовый процесс?`, options: ["A) Оптимальный вариант А", "B) Альтернативный вариант Б", "C) Промежуточный вариант В", "D) Вариант Г"], correct: 0, exp: "Разбор: Согласно базовой теории, именно вариант А полностью удовлетворяет начальным критериям." },
    { question: `Тестовое задание №2 по теме ${topic}. Вычислите или определите логическое следствие из условий.`, options: ["A) Первое следствие", "B) Второе следствие (Верно)", "C) Третье следствие", "D) Все варианты неверны"], correct: 1, exp: "Разбор: Второе следствие напрямую вытекает из аксиом текущего раздела." },
    { question: `Тестовое задание №3 по теме ${topic}. Итоговый закрепляющий вопрос на понимание структуры раздела.`, options: ["A) Значение равно 0", "B) Значение стремится к бесконечности", "C) Правильный ответ С", "D) Недостаточно условий для точного ответа"], correct: 2, exp: "Разбор: Системный анализ показывает, что вариант С закрывает цепочку рассуждений." }
  ]
});

export const AiLearningCore = ({ user, userData, geminiKey, onClose }) => {
  const [mode, setMode] = useState("menu"); // menu, lesson_theory, lesson_practice, lesson_results, mock_exam, mock_results
  const [currentSubject, setCurrentSubject] = useState("");
  const [currentTopic, setCurrentTopic] = useState("");
  
  // Состояния урока
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [taskChecked, setTaskChecked] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);

  // Состояния еженедельного пробника
  const [mockQuestions, setMockQuestions] = useState([]);
  const [mockAnswers, setMockAnswers] = useState({});
  const [mockAnalysis, setMockAnalysis] = useState("");

  // === УМНЫЙ СУПЕР-ПАРСЕР ДЛЯ ОЧИСТКИ ТЕКСТА И LATEX ===
  const cleanLatexString = (str) => {
    if (!str) return "";
    return str
      .toString()
      .replace(/\\\\/g, "\\") // Превращаем двойные слэши ИИ в одинарные
      .replace(/\\n/g, "\n")  // Исправляем баганые переносы строк
      .trim();
  };

  const renderCleanContent = (rawText) => {
    if (!rawText) return null;
    
    // Чистим текст от системного мусора ИИ
    const text = cleanLatexString(rawText);

    // Делим текст на строки, чтобы обрабатывать абзацы, списки и заголовки
    const lines = text.split("\n");

    return lines.map((line, lineIdx) => {
      let currentLine = line.trim();
      if (!currentLine) return <div key={lineIdx} className="h-2" />;

      // Проверяем заголовки (### Текст)
      let isHeader = false;
      if (currentLine.startsWith("###")) {
        isHeader = true;
        currentLine = currentLine.replace(/^###\s*/, "");
      } else if (currentLine.startsWith("##")) {
        isHeader = true;
        currentLine = currentLine.replace(/^##\s*/, "");
      }

      // Выделяем формулы внутри строки по знакам $
      const parts = currentLine.split(/(\$[^$]+\$)/g);
      
      const inlineRendered = parts.map((part, partIdx) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            return <InlineMath key={partIdx} math={cleanLatexString(formula)} />;
          } catch {
            return <span key={partIdx} className="font-mono text-amber-400">{part}</span>;
          }
        }

        // Поддержка жирного текста **текст** внутри строк
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith("**") && bPart.endsWith("**")) {
            return <strong key={bIdx} className="font-black text-white">{bPart.slice(2, -2)}</strong>;
          }
          return bPart;
        });
      });

      if (isHeader) {
        return (
          <h4 key={lineIdx} className="text-sm font-black text-indigo-400 uppercase tracking-wider mt-4 mb-2 border-b border-slate-800 pb-1">
            {inlineRendered}
          </h4>
        );
      }

      // Если строка начинается со списка (* или -)
      if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
        return (
          <div key={lineIdx} className="flex items-start gap-2 text-xs text-slate-300 pl-2 my-1">
            <span className="text-indigo-500">•</span>
            <div className="flex-1">{inlineRendered}</div>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="text-xs text-slate-300 leading-relaxed mb-2">
          {inlineRendered}
        </p>
      );
    });
  };

  // === ЖИВАЯ ИИ-ГЕНЕРАЦИЯ ПОЛНОЦЕННОГО УРОКА ЧЕРЕЗ GEMINI ===
  const startLesson = async (subject, topic) => {
    setCurrentSubject(subject);
    setCurrentTopic(topic);
    setLoading(true);
    setMode("lesson_theory");

    if (!geminiKey) {
      setTimeout(() => {
        setLessonData(getLocalLessonFallback(subject, topic));
        initLessonState();
        setLoading(false);
      }, 1000);
      return;
    }

    const prompt = `Ты — профессиональный ИИ-преподаватель ЕНТ. Сгенерируй полноценный интерактивный урок по предмету "${subject}" на тему "${topic}".
Ответ верни СТРОГО в формате JSON без каких-либо markdown-оберток (без \`\`\`json):
{
  "theory": "### Введение\\nНапиши развернутый структурированный теоретический материал (5-7 предложений). Используй переносы строк \\\\n для читаемости. Каждую формулу или переменную ОБЯЗАТЕЛЬНО оборачивай в одиночные знаки $, например: $v = s / t$ или $E = m \\\\cdot c^2$. Ключевые термины выделяй жирным через **слово**.",
  "formula": "Главная базовая формула раздела в LaTeX БЕЗ знаков доллара (пример: v = \\\\frac{s}{t})",
  "tasks": [
    {
      "question": "Условие сложной задачи ЕНТ №1. Если есть формулы — оборачивай в $...$",
      "options": ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3", "D) Вариант 4"],
      "correct": 0,
      "exp": "Подробный разбор решения задачи. Формулы пиши строго внутри $...$"
    },
    {
      "question": "Условие задачи ЕНТ №2",
      "options": ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3", "D) Вариант 4"],
      "correct": 1,
      "exp": "Подробный разбор решения задачи №2."
    },
    {
      "question": "Условие задачи ЕНТ №3",
      "options": ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3", "D) Вариант 4"],
      "correct": 2,
      "exp": "Подробный разбор решения задачи №3."
    }
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
      setLessonData(JSON.parse(cleanText));
    } catch (e) {
      console.warn("Gemini API error, fallback to mock data", e);
      setLessonData(getLocalLessonFallback(subject, topic));
    } finally {
      initLessonState();
      setLoading(false);
    }
  };

  const initLessonState = () => {
    setCurrentTaskIdx(0);
    setSelectedAns(null);
    setTaskChecked(false);
    setLessonScore(0);
  };

  const handleNextLessonTask = () => {
    if (selectedAns === lessonData.tasks[currentTaskIdx].correct) {
      setLessonScore(prev => prev + 1);
    }
    
    if (currentTaskIdx < lessonData.tasks.length - 1) {
      setCurrentTaskIdx(prev => prev + 1);
      setSelectedAns(null);
      setTaskChecked(false);
    } else {
      setMode("lesson_results");
    }
  };

  const finishLessonSave = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const xpGained = lessonScore * 100 + 50;
    
    try {
      await updateDoc(userDocRef, {
        overallProgress: Math.min((userData?.overallProgress || 0) + 2, 100),
        recentActivity: [
          {
            id: crypto.randomUUID(),
            type: "ИИ-Урок",
            name: `Завершен полноценный урок по теме: ${currentTopic}`,
            score: `+${xpGained} XP (Результат: ${lessonScore}/3)`,
            time: "Только что"
          },
          ...(userData?.recentActivity || []).slice(0, 4)
        ]
      });
    } catch (e) {
      console.error(e);
    }
    setMode("menu");
  };

  // === ЖИВАЯ ИИ-ГЕНЕРАЦИЯ ЕЖЕНЕДЕЛЬНОГО ПРОБНИКА ===
  const startWeeklyMock = async () => {
    setLoading(true);
    setMode("mock_exam");
    setMockAnswers({});

    const subjects = userData?.subjectsMastery?.map(s => s.name) || ["История Казахстана", "Математическая грамотность"];
    
    if (!geminiKey) {
      const generated = subjects.flatMap((sub, sIdx) => [
        { id: sIdx * 2 + 1, subject: sub, text: `Комплексный вопрос ЕНТ по предмету ${sub}. Проверка системного мышления и профильных знаний кодификатора.`, options: ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"], correct: 1 },
        { id: sIdx * 2 + 2, subject: sub, text: `Сложная расчетная задача ЕНТ по предмету ${sub}. Проанализируйте переменные перед выбором ответа.`, options: ["Ответ 1", "Ответ 2", "Ответ 3", "Ответ 4"], correct: 0 }
      ]);
      setTimeout(() => {
        setMockQuestions(generated);
        setLoading(false);
      }, 1000);
      return;
    }

    const prompt = `Ты — эксперт ЕНТ. Сгенерируй еженедельный пробный срез знаний для ученика. 
Ученик сдает следующие предметы: ${subjects.join(", ")}.
Сгенерируй строго по 2 качественных вопроса на каждый из этих предметов. Формулы и математические символы ОБЯЗАТЕЛЬНО оборачивай в $...$.
Ответ верни СТРОГО в формате JSON без markdown-оберток (без \`\`\`json):
[
  {
    "id": 1,
    "subject": "Название предмета",
    "text": "Условие тестового задания ЕНТ",
    "options": ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3", "D) Вариант 4"],
    "correct": 0
  }
]`;

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
      setMockQuestions(JSON.parse(cleanText));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const finishMockExam = async () => {
    setLoading(true);
    setMode("mock_results");

    let correctCount = 0;
    mockQuestions.forEach((q, idx) => {
      if (mockAnswers[idx] === q.correct) correctCount++;
    });
    
    const percent = Math.round((correctCount / mockQuestions.length) * 100);

    if (!geminiKey) {
      setMockAnalysis(`🤖 ИИ-Анализ еженедельного пробника:\n\nОбщая точность: ${percent}% (${correctCount}/${mockQuestions.length} задач).\n\n• Сильные стороны: Хорошая динамика решения.\n• Обнаруженные пробелы: Требуется более глубокая проработка формул.\n\nРекомендация ИИ: План подготовки на следующую неделю обновлен. Фокус смещен на слабые разделы профильных предметов.`);
      setLoading(false);
      return;
    }

    const prompt = `Проанализируй результаты еженедельного пробного ЕНТ ученика. 
Он ответил правильно на ${correctCount} из ${mockQuestions.length} вопросов (Точность: ${percent}%).
Напиши краткий текстовый отчет (до 5-7 предложений) на русском языке. Используй разметку ### для заголовков и **слово** для жирности.
Раздели его на пункты: ### 1) Общая оценка, ### 2) Сильные стороны, ### 3) На какие разделы/темы на следующей неделе нужно сделать критический фокус.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMockAnalysis(data.candidates[0].content.parts[0].text);

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          recentActivity: [
            {
              id: crypto.randomUUID(),
              type: "ИИ-Пробник",
              name: `Сдан комплексный пробник ЕНТ недели`,
              score: `Результат: ${percent}% правильных ответов`,
              time: "Только что"
            },
            ...(userData?.recentActivity || []).slice(0, 4)
          ]
        });
      }
    } catch (e) {
      console.error(e);
      setMockAnalysis(`Ошибка живого ИИ-анализа. Общая точность выполнения пробника составила: ${percent}%.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-100">
        <div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">Модуль: AI-Learning Core v2.0</span>
          <h2 className="text-xl font-black mt-2 text-slate-900">Академические ИИ-Уроки и Пробники</h2>
        </div>
        <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition">
          Вернуться в дашборд
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium animate-pulse">ИИ подготавливает интерактивные материалы...</p>
        </div>
      )}

      {/* МЕНЮ ВЫБОРА */}
      {!loading && mode === "menu" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Блок Уроков */}
          <div className="border border-slate-200 bg-slate-50/40 p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="text-2xl">📖</div>
              <h3 className="font-black text-base text-slate-800 mt-2">Полноценные ИИ-Уроки</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Каждый урок состоит из структурированного экспресс-конспекта с формулами, разбора примеров и мини-теста из 3 задач с ИИ-аналитикой для закрепления темы.
              </p>
              <div className="mt-4 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase block">Доступные темы из твоего расписания:</label>
                {(userData?.subjectsMastery || []).slice(0, 3).map((sub, idx) => (
                  <button 
                    key={idx}
                    onClick={() => startLesson(sub.name, `Интерактивный разбор разделов: ${sub.name}`)}
                    className="w-full text-left bg-white border hover:border-indigo-400 p-3 rounded-xl text-xs font-bold text-slate-700 flex justify-between items-center transition"
                  >
                    <span>{sub.name}</span>
                    <span className="text-indigo-600 text-[11px]">Начать урок →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Блок Еженедельного Пробника */}
          <div className="border border-indigo-100 bg-indigo-50/20 p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="text-2xl">📝</div>
              <h3 className="font-black text-base text-indigo-900 mt-2">Еженедельный Комплексный Пробник</h3>
              <p className="text-xs text-indigo-950/70 mt-1 leading-relaxed">
                Срез знаний по всем твоим обязательным и профильным предметам ЕНТ за прошедшую неделю. По результатам пробника ИИ полностью перестроит стратегию и расписание уроков.
              </p>
            </div>
            <button 
              onClick={startWeeklyMock}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition"
            >
              Запустить ИИ-Пробник недели
            </button>
          </div>
        </div>
      )}

      {/* ЭКРАН УРОКА: ЭТАП 1 - ТЕОРИЯ */}
      {!loading && mode === "lesson_theory" && lessonData && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4 border-b border-indigo-500/20 pb-2">Этап 1: Теория и конспект ИИ</h4>
            <div className="space-y-1">
              {renderCleanContent(lessonData.theory)}
            </div>
            {lessonData.formula && (
              <div className="mt-6 pt-4 border-t border-slate-800/60 overflow-x-auto text-center bg-slate-950/60 p-4 rounded-xl">
                <BlockMath math={cleanLatexString(lessonData.formula)} />
              </div>
            )}
          </div>
          <button 
            onClick={() => setMode("lesson_practice")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/10"
          >
            Перейти к закреплению темы (Мини-тест) →
          </button>
        </div>
      )}

      {/* ЭКРАН УРОКА: ЭТАП 2 - ЗАКРЕПЛЕНИЕ (ПРАКТИКА) */}
      {!loading && mode === "lesson_practice" && lessonData && (
        <div className="space-y-6">
          <div className="bg-slate-50 border p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Вопрос {currentTaskIdx + 1} из 3</span>
              <span className="text-xs font-bold text-indigo-600">{currentSubject}</span>
            </div>
            <div className="font-bold text-sm text-slate-800">
              {renderCleanContent(lessonData.tasks[currentTaskIdx].question)}
            </div>
          </div>

          <div className="space-y-2">
            {lessonData.tasks[currentTaskIdx].options.map((opt, i) => (
              <button
                key={i}
                disabled={taskChecked}
                onClick={() => setSelectedAns(i)}
                className={`w-full text-left p-4 rounded-xl text-xs font-bold border transition ${
                  taskChecked 
                    ? i === lessonData.tasks[currentTaskIdx].correct
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : selectedAns === i ? "bg-rose-50 border-rose-500 text-rose-800" : "bg-white"
                    : selectedAns === i ? "bg-indigo-50 border-indigo-500 text-indigo-900" : "bg-white hover:bg-slate-50"
                }`}
              >
                {renderCleanContent(opt)}
              </button>
            ))}
          </div>

          {!taskChecked ? (
            <button
              onClick={() => setTaskChecked(true)}
              disabled={selectedAns === null}
              className={`w-full py-3 rounded-xl text-xs font-black text-white ${selectedAns !== null ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"}`}
            >
              Проверить ответ
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-[11px] bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 leading-relaxed font-medium">
                <span className="font-black text-indigo-600 block mb-1">Разбор задания ИИ:</span>
                {renderCleanContent(lessonData.tasks[currentTaskIdx].exp)}
              </div>
              <button
                onClick={handleNextLessonTask}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                {currentTaskIdx < lessonData.tasks.length - 1 ? "Следующий вопрос" : "Завершить урок"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ЭКРАН УРОКА: ЭТАП 3 - РЕЗУЛЬТАТЫ */}
      {!loading && mode === "lesson_results" && (
        <div className="text-center py-6 space-y-4">
          <div className="text-4xl">🎉</div>
          <h3 className="text-xl font-black text-slate-900">Урок успешно завершен!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ты ответил правильно на <span className="font-bold text-indigo-600">{lessonScore} из 3</span> вопросов. Материал зафиксирован в твоей матрице знаний.
          </p>
          <button 
            onClick={finishLessonSave}
            className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition mx-auto block"
          >
            Сохранить прогресс и выйти
          </button>
        </div>
      )}

      {/* ЭКРАН ЕЖЕНЕДЕЛЬНОГО ПРОБНИКА */}
      {!loading && mode === "mock_exam" && (
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white p-4 rounded-xl text-xs font-bold">
            ⚠️ Внимание: Идет комплексный срез знаний за неделю. Ответьте на все вопросы для формирования корректной рекомендации ИИ.
          </div>
          
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {mockQuestions.map((q, qIdx) => (
              <div key={q.id} className="border p-4 rounded-xl space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                  <span>Вопрос {qIdx + 1}</span>
                  <span className="text-indigo-600">{q.subject}</span>
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {renderCleanContent(q.text)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => setMockAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                      className={`text-left p-3 rounded-lg text-xs font-bold border transition ${
                        mockAnswers[qIdx] === oIdx ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {renderCleanContent(opt)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={finishMockExam}
            disabled={Object.keys(mockAnswers).length < mockQuestions.length}
            className={`w-full py-3.5 rounded-xl text-xs font-black text-white transition ${
              Object.keys(mockAnswers).length === mockQuestions.length ? "bg-indigo-600 hover:bg-indigo-700 shadow-md" : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            Отправить пробник на ИИ-Анализ
          </button>
        </div>
      )}

      {/* ЭКРАН РЕЗУЛЬТАТОВ ПРОБНИКА */}
      {!loading && mode === "mock_results" && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl text-xs whitespace-pre-line leading-relaxed shadow-inner">
            {renderCleanContent(mockAnalysis)}
          </div>
          <button
            onClick={() => setMode("menu")}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-xs transition"
          >
            Вернуться в главное меню модулей
          </button>
        </div>
      )}

    </div>
  );
};