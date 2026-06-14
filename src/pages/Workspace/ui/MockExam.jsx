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

  // 2. ВСПОМОГАТЕЛЬНЫЙ ГЕНЕРАТОР МАКЕТНЫХ ВОПРОСОВ ДЛЯ БЕСПЛАТНОГО РЕЖИМА
  const getMockQuestions = (targetSubject, targetTitle, count) => {
    if (targetSubject === "Математика" || targetSubject === "Математическая грамотность") {
      return [
        {
          id: 1,
          question: "Найдите корни уравнения: $2\\sin(x) - \\sqrt{3} = 0$ на интервале $[0, \\pi]$.",
          formula: "\\sin(x) = \\frac{\\sqrt{3}}{2}",
          options: [
            "A) $\\frac{\\pi}{3}$ и $\\frac{2\\pi}{3}$",
            "B) $\\frac{\\pi}{6}$ и $\\frac{5\\pi}{6}$",
            "C) $\\frac{\\pi}{4}$ и $\\frac{3\\pi}{4}$",
            "D) $\\frac{\\pi}{2}$"
          ],
          correctIndex: 0,
          explanation: "Уравнение приводится к виду $\\sin(x) = \\frac{\\sqrt{3}}{2}$. Решением на данном интервале являются углы $60^\\circ$ ($\\frac{\\pi}{3}$) и $120^\\circ$ ($\\frac{2\\pi}{3}$)."
        },
        {
          id: 2,
          question: "Дана арифметическая прогрессия: $a_1 = 4$, $d = 3$. Найдите сумму первых 10 членов прогрессии.",
          formula: "S_n = \\frac{2a_1 + (n-1)d}{2} \\cdot n",
          options: [
            "A) 155",
            "B) 175",
            "C) 195",
            "D) 215"
          ],
          correctIndex: 1,
          explanation: "Подставляем значения в формулу: $S_{10} = \\frac{2\\cdot4 + 9\\cdot3}{2} \\cdot 10 = \\frac{8+27}{2} \\cdot 10 = 35 \\cdot 5 = 175$."
        },
        {
          id: 3,
          question: "В баке находится смесь воды и соли. Исходная масса соли 1 кг на 20 кг смеси (5%). Сколько соли нужно добавить, чтобы концентрация стала 10%?",
          formula: "\\text{Концентрация} = \\frac{m_s}{m_t}",
          options: [
            "A) 1.11 кг",
            "B) 1.00 кг",
            "C) 1.25 кг",
            "D) 1.50 кг"
          ],
          correctIndex: 0,
          explanation: "Исходное уравнение: $\\frac{1 + x}{20 + x} = 0.1 \\implies 1 + x = 2 + 0.1x \\implies 0.9x = 1 \\implies x = 1.11$ кг."
        },
        {
          id: 4,
          question: "Вычислите предел последовательности: $\\lim_{n \\to \\infty} \\frac{3n^2 + 5n - 1}{2n^2 - n + 7}$.",
          formula: "\\lim_{n \\to \\infty} \\frac{3n^2}{2n^2} = 1.5",
          options: [
            "A) 0",
            "B) 1.5",
            "C) 3",
            "D) Бесконечность"
          ],
          correctIndex: 1,
          explanation: "Делим числитель и знаменатель на $n^2$, получаем отношение коэффициентов при высших степенях: $3/2 = 1.5$."
        },
        {
          id: 5,
          question: "Чему равна площадь фигуры, ограниченной линиями $y = x^2$ и $y = 2x$?",
          formula: "S = \\int_{0}^{2} (2x - x^2) dx",
          options: [
            "A) $\\frac{4}{3}$",
            "B) $\\frac{2}{3}$",
            "C) $1$",
            "D) $\\frac{5}{3}$"
          ],
          correctIndex: 0,
          explanation: "Интегрируем разность функций на интервале пересечения [0, 2]: $[x^2 - \\frac{x^3}{3}]_0^2 = 4 - \\frac{8}{3} = \\frac{4}{3}$."
        }
      ];
    } else if (targetSubject === "История Казахстана") {
      return [
        {
          id: 1,
          question: "В каком году образовалось Казахское ханство?",
          formula: "XV век",
          options: [
            "A) 1465 г.",
            "B) 1206 г.",
            "C) 1511 г.",
            "D) 1731 г."
          ],
          correctIndex: 0,
          explanation: "Казахское ханство образовалось в 1465 году в результате откочевки султанов Жанибека и Керея в Могулистан."
        },
        {
          id: 2,
          question: "Кто был первым ханом Казахского ханства?",
          formula: "Основатели ханства",
          options: [
            "A) Жанибек",
            "B) Керей",
            "C) Касым",
            "D) Тауке"
          ],
          correctIndex: 1,
          explanation: "Первым ханом молодого Казахского государства стал Керей-хан как старший по возрасту потомок Урус-хана."
        },
        {
          id: 3,
          question: "Какой свод законов обычного права был составлен при хане Тауке?",
          formula: "Жеты Жаргы",
          options: [
            "A) Касым ханнын каска жолы",
            "B) Есим ханнын ески жолы",
            "C) Жеты Жаргы",
            "D) Свод законов Шынгысхана"
          ],
          correctIndex: 2,
          explanation: "Хан Тауке объединил законы кочевников в свод «Жеты Жаргы» для укрепления внутренней стабильности государства."
        },
        {
          id: 4,
          question: "В какой битве казахи нанесли сокрушительное поражение джунгарам в 1729 (1730) году?",
          formula: "Анракайское сражение",
          options: [
            "A) Булантинская битва",
            "B) - Анракайская битва",
            "C) Орбулакское сражение",
            "D) Аягузская битва"
          ],
          correctIndex: 1,
          explanation: "Анракайская битва объединила все три жуза и закончилась полным разгромом джунгарских войск."
        },
        {
          id: 5,
          question: "Кто возглавлял крупнейшее восстание казахов в 1837-1847 гг.?",
          formula: "Кенесары хан",
          options: [
            "A) Сырым Датов",
            "B) Исатай Тайманов",
            "C) Кенесары Касымулы",
            "D) Жанкожа Нурмухамедов"
          ],
          correctIndex: 2,
          explanation: "Кенесары Касымулы возглавил общеказахское движение за восстановление независимости и ханской власти."
        }
      ];
    } else {
      return [
        {
          id: 1,
          question: `Какое из утверждений является верным для темы "${targetTitle || "Проверочная работа"}"?`,
          formula: "",
          options: [
            "A) Неверное суждение",
            "B) Верное суждение (Правильный ответ)",
            "C) Ошибочная гипотеза",
            "D) Неактуальные данные"
          ],
          correctIndex: 1,
          explanation: `Этот вариант является научно и академически обоснованным для дисциплины ${targetSubject} по теме ${targetTitle}.`
        },
        {
          id: 2,
          question: "Какая основная формула описывает поведение системы в рамках данной темы?",
          formula: "F = m \\cdot a",
          options: [
            "A) $E = mc^2$",
            "B) $F = ma$",
            "C) $PV = nRT$",
            "D) $a^2 + b^2 = c^2$"
          ],
          correctIndex: 1,
          explanation: "Уравнение описывает второй закон механики, связывающий силу, массу и приобретаемое телом ускорение."
        },
        {
          id: 3,
          question: "Какое основное практическое применение имеет изученная вами тема?",
          formula: "",
          options: [
            "A) Исключительно теоретическое значение",
            "B) Применяется в космических технологиях",
            "C) Оптимизация процессов обучения и оценки",
            "D) Применение отсутствует"
          ],
          correctIndex: 2,
          explanation: "Использование интеллектуальных систем позволяет автоматизировать и структурировать проверку знаний."
        },
        {
          id: 4,
          question: "В каком веке началось активное научное исследование данных явлений?",
          formula: "XIX век",
          options: [
            "A) В XV веке",
            "B) В XVII веке",
            "C) В XIX веке",
            "D) В XX веке"
          ],
          correctIndex: 2,
          explanation: "Основные прорывы и формулирование законов по теме произошли в ходе промышленной революции XIX века."
        },
        {
          id: 5,
          question: "Какой основной метод используется для анализа процессов в этой теме?",
          formula: "",
          options: [
            "A) Метод случайного поиска",
            "B) Качественный опрос",
            "C) Экспериментальный анализ и моделирование",
            "D) Литературный обзор"
          ],
          correctIndex: 2,
          explanation: "Математическое и физическое моделирование дает наиболее достоверные результаты при анализе систем."
        }
      ];
    }
  };

  // 3. АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ ТЕСТА ОТ УЧИТЕЛЯ ЧЕРЕЗ ИИ
  const generateFullExamViaAi = useCallback(
    async (abortController) => {
      const targetSubject = subject || "Общий предмет";
      const targetTitle = examTitle || "Проверочная работа";

      if (!geminiKey) {
        // Режим EduTrack AI Free - генерируем локальный качественный тест
        setLoadingAi(true);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Симуляция работы ИИ
        
        const mockQs = getMockQuestions(targetSubject, targetTitle, questionsCount);
        if (!abortController.signal.aborted) {
          setQuestions(mockQs.slice(0, questionsCount));
          setLoadingAi(false);
        }
        return;
      }

      setLoadingAi(true);

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
          // В случае ошибки внешнего API также выдаем качественные локальные вопросы
          const fallbackQs = getMockQuestions(targetSubject, targetTitle, questionsCount);
          setQuestions(fallbackQs.slice(0, questionsCount));
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

  // 4. ТАЙМЕР ОБРАТНОГО ОТСЧЕТА (Теперь видит объявленную выше handleAutoFinish)
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

  // 5. РАСЧЕТ РЕЗУЛЬТАТОВ И ОТПРАВКА В WORKSPACE -> FIRESTORE
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
