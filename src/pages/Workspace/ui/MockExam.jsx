import { useState, useEffect, useCallback } from "react";
import "katex/dist/katex.min.css";
import {  BlockMath } from "react-katex";

export const MockExam = ({
  subject,
  examTitle,
  userName,
  examId,
  questionsCount = 5,
  timeLimit = 15,
  geminiKey,
  onClose,
  onFinish,
}) => {
  const [questions, setQuestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIdx: optionIdx }
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [isExamFinished, setIsExamFinished] = useState(false);

  // 1. ФУНКЦИЯ ЗАВЕРШЕНИЯ ЭКЗАМЕНА (Перенесена наверх, чтобы исправить ошибку инициализации)
  const handleAutoFinish = useCallback(() => {
    setIsExamFinished(true);
  }, []);

  // 2. АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ ТЕСТА ОТ УЧИТЕЛЯ ЧЕРЕЗ ИИ
  const generateFullExamViaAi = useCallback(
    async (abortController) => {
      if (!geminiKey) return;
      setLoadingAi(true);

      const targetSubject = subject || "Общий предмет";
      const targetTitle = examTitle || "Проверочная работа";

      const prompt = `Сгенерируй полноценный проверочный тест по предмету "${targetSubject}" на тему "${targetTitle}".
Количество вопросов в тесте: ${questionsCount}.
Уровень сложности: Средний/Выпускной (ориентир на ЕНТ/экзамены).
Ответ должен быть строго на русском языке. 

Верни ответ исключительно в формате JSON (без markdown-разметки типа \`\`\`json):
{
  "examQuestions": [
    {
      "id": 1,
      "question": "Текст учебного вопроса или задачи",
      "formula": "Ключевая формула или выражение в формате LaTeX/текста",
      "options": ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3", "D) Вариант 4"],
      "correctIndex": 0,
      "explanation": "Пошаговый разбор этой конкретной задачи на простом, понятном русском языке. Объясни логику: почему именно этот ответ правильный и как работает формула."
    }
  ]
}`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        if (!response.ok) throw new Error("API failed");
        const data = await response.json();
        const parsed = JSON.parse(data.candidates[0].content.parts[0].text);

        if (!abortController.signal.aborted && parsed.examQuestions) {
          setQuestions(parsed.examQuestions);
        }
      } catch (err) {
        if (err.name !== "AbortError" && !abortController.signal.aborted) {
          console.error("Ошибка генерации экзамена через ИИ:", err);
          setQuestions([
            {
              id: 1,
              question: `Тестовый вопрос по теме: ${targetTitle}. Проверьте подключение к Gemini API.`,
              formula: "",
              options: [
                "A) Вариант А",
                "B) Вариант Б (Правильный)",
                "C) Вариант В",
                "D) Вариант Г",
              ],
              correctIndex: 1,
            },
          ]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingAi(false);
        }
      }
    },
    [geminiKey, subject, examTitle, questionsCount],
  );

  // Эффект безопасного старта генерации теста ИИ
  useEffect(() => {
    const abortController = new AbortController();

    const startExamLoad = async () => {
      generateFullExamViaAi(abortController);
    };

    startExamLoad();

    return () => {
      abortController.abort();
    };
  }, [generateFullExamViaAi]);

  // 3. ТАЙМЕР ОБРАТНОГО ОТСЧЕТА (Теперь видит объявленную выше handleAutoFinish)
  useEffect(() => {
    if (loadingAi || questions.length === 0 || isExamFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadingAi, questions, isExamFinished, handleAutoFinish]);

  // 4. РАСЧЕТ РЕЗУЛЬТАТОВ И ОТПРАВКА В WORKSPACE -> FIRESTORE
  const handleFinishExam = () => {
    if (questions.length === 0) return;

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);

    let grade = "F";
    if (scorePercent >= 90) grade = "A";
    else if (scorePercent >= 75) grade = "B";
    else if (scorePercent >= 50) grade = "C";
    else if (scorePercent >= 35) grade = "D";

    if (onFinish) {
      onFinish(scorePercent, grade, examId);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!geminiKey) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-xl font-black">⚠️ API-ключ Gemini не подключен</p>
          <p className="text-xs text-slate-400">
            Проверочные работы генерируются искусственным интеллектом под
            требования учителя. Пожалуйста, вставьте ваш ключ в настройках
            личного кабинета.
          </p>
          <button
            onClick={onClose}
            className="bg-indigo-600 px-6 py-2 rounded-xl text-xs font-bold"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  if (loadingAi) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black animate-pulse text-indigo-400">
          🤖 ИИ генерирует экзаменационный тест по теме урока...
        </p>
        <p className="text-[11px] text-slate-500">
          Тема задания: "{examTitle || "Проверочная работа"}"
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <p className="text-xs text-slate-400">
          Не удалось загрузить вопросы. Попробуйте перезапустить тест.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full antialiased selection:bg-indigo-500/30">
      {/* ХЕДЕР ТЕСТИРОВАНИЯ */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md">
            📋
          </span>
          <div>
            <h2 className="text-sm font-black tracking-tight max-w-xs sm:max-w-md truncate">
              {examTitle}
            </h2>
            <p className="text-[10px] text-slate-400">
              Студент: {userName} • Предмет: {subject}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-slate-800 border border-slate-700/60 px-4 py-1.5 rounded-xl text-center min-w-[90px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Таймер
            </p>
            <p
              className={`text-xs font-mono font-bold ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-emerald-400"}`}
            >
              {formatTime(timeLeft)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Прервать
          </button>
        </div>
      </header>

      {/* ОСНОВНОЙ СЕТ С ВОПРОСАМИ */}
      <main className="flex-1 p-6 md:p-12 max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Левый блок: Вопрос и варианты */}
        <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-400 font-bold uppercase tracking-wider">
              Вопрос {currentIdx + 1} из {questions.length}
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-base md:text-lg font-bold leading-relaxed text-white">
              {currentQuestion.question}
            </h1>

            {currentQuestion.formula && (
              <div className="p-4 bg-slate-950 text-center rounded-2xl">
                <BlockMath math={currentQuestion.formula} />
              </div>
            )}
          </div>

          {/* Варианты ответов */}
          <div className="flex flex-col gap-3 pt-2">
            {currentQuestion.options?.map((option, oIdx) => {
              const isSelected = selectedAnswers[currentIdx] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() =>
                    setSelectedAnswers({
                      ...selectedAnswers,
                      [currentIdx]: oIdx,
                    })
                  }
                  className={`w-full p-4 rounded-2xl border text-xs text-left font-semibold transition-all duration-200 ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 translate-x-1"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Кнопки навигации */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-xs font-bold rounded-xl disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-700 transition text-slate-200"
            >
              ← Назад
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl text-white shadow-md transition"
              >
                Вперед →
              </button>
            ) : (
              <button
                onClick={handleAutoFinish}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-black rounded-xl text-white shadow-md transition animate-pulse"
              >
                Завершить экзамен
              </button>
            )}
          </div>
        </div>

        {/* Правый блок: Матрица навигации по вопросам */}
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Карта теста
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((_, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCurrent = currentIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-10 text-xs font-mono font-bold rounded-xl transition border ${
                    isCurrent
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                      : isAnswered
                        ? "bg-slate-800 border-slate-700 text-slate-200"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 leading-normal pt-2 border-t border-slate-800/60">
            Вы можете свободно переключаться между вопросами. Ответы сохраняются
            автоматически до окончания времени.
          </p>
        </div>
      </main>

      {/* МОДАЛЬНОЕ ОКНО ОКОНЧАНИЯ ЭКЗАМЕНА */}
      {isExamFinished && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
              🏁
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">
                Тестирование завершено!
              </h2>
              <p className="text-xs text-slate-400">
                Все ваши ответы зафиксированы ИИ-системой проверки EduTrack.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-2">
              <p>
                • Всего вопросов:{" "}
                <span className="font-mono text-white font-bold">
                  {questions.length}
                </span>
              </p>
              <p>
                • Отвечено:{" "}
                <span className="font-mono text-white font-bold">
                  {Object.keys(selectedAnswers).length} из {questions.length}
                </span>
              </p>
            </div>

            <button
              onClick={handleFinishExam}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black shadow-lg transition-all"
            >
              Узнать результат и отправить учителю
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
