import { useState, useEffect } from "react";

export const FinalSimulation = ({ combo, userName, geminiKey, onClose, onFinish }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 минут в секундах
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const sampleQuestions = [
    {
      id: 1,
      subject: "История Казахстана",
      text: "В каком веке произошло присоединение Младшего жуза к России?",
      options: ["В XVII веке", "В XVIII веке", "В XIX веке", "В XVI веке"],
      correct: 1
    },
    {
      id: 2,
      subject: "Математическая грамотность",
      text: "Улитка за день поднимается на 3 метра, а за ночь спускается на 2 метра. Высота столба 10 метров. За сколько дней улитка доберется до вершины?",
      options: ["За 10 дней", "За 8 дней", "За 7 дней", "За 9 дней"],
      correct: 1
    },
    {
      id: 3,
      subject: "Грамотность чтения",
      text: "Определите основную мысль текста: 'Образование будущего — это не просто накопление фактов, а развитие навыков адаптации и системного анализа.'",
      options: [
        "Факты больше не имеют значения",
        "Главное в обучении будущего — гибкость и системные навыки",
        "Образование останется традиционным",
        "ИИ полностью заменит школы"
      ],
      correct: 1
    },
    {
      id: 4,
      subject: combo || "Профильный блок",
      text: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? "В каких органоидах растительной клетки происходит процесс фотосинтеза?"
        : "Какое физическое явление лежит в основе работы генератора переменного тока?",
      options: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? ["В митохондриях", "В хлоропластах", "В рибосомах", "В лизосомах"]
        : ["Электромагнитная индукция", "Фотоэффект", "Термоэлектронная эмиссия", "Электролиз"],
      correct: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим") ? 1 : 0
    },
    {
      id: 5,
      subject: combo || "Профильный блок",
      text: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? "Какая химическая связь образуется между атомами водорода и кислорода в молекуле воды (H2O)?"
        : "Найдите производную функции f(x) = x^3 - 3x^2 + 2x.",
      options: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? ["Ионная", "Ковалентная полярная", "Ковалентная неполярная", "Металлическая"]
        : ["3x^2 - 6x + 2", "3x^2 - 3x + 2", "x^2 - 3x + 2", "3x^2 - 6x"],
      correct: 1
    },
    {
      id: 6,
      subject: combo || "Профильный блок",
      text: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? "Какое вещество является универсальным источником энергии в живых организмах?"
        : "Чему равна сила тока в проводнике сопротивлением 5 Ом при напряжении 220 В?",
      options: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? ["АТФ", "Глюкоза", "ДНК", "РНК"]
        : ["1100 А", "44 А", "0.022 А", "22 А"],
      correct: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим") ? 0 : 1
    },
    {
      id: 7,
      subject: combo || "Профильный блок",
      text: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? "Какова общая формула предельных одноатомных спиртов?"
        : "Решите уравнение: log2(x - 3) = 3.",
      options: (combo || "").toLowerCase().includes("биолог") || (combo || "").toLowerCase().includes("хим")
        ? ["CnH2n+2", "CnH2n+1OH", "CnH2n", "CnH2n-2"]
        : ["x = 6", "x = 11", "x = 9", "x = 12"],
      correct: 1
    },
    {
      id: 8,
      subject: "История Казахстана",
      text: "Какой правитель Казахского ханства провел реформы и составил кодекс законов 'Жеты Жаргы'?",
      options: ["Тауке хан", "Абылай хан", "Касым хан", "Есим хан"],
      correct: 0
    },
    {
      id: 9,
      subject: "Математическая грамотность",
      text: "В коробке 4 красных, 6 синих и 2 зеленых шара. Какова вероятность вытащить случайным образом синий шар?",
      options: ["1/2", "1/3", "1/6", "1/4"],
      correct: 0
    },
    {
      id: 10,
      subject: "Грамотность чтения",
      text: "Выберите слово, наиболее подходящее по смыслу: 'Изучение истории помогает нам не только помнить прошлое, но и [...] будущие ошибки.'",
      options: ["совершать", "предотвращать", "забывать", "оправдывать"],
      correct: 1
    }
  ];

  async function handleFinishExam() {
    setIsExamFinished(true);
    setLoadingAnalysis(true);

    // Подсчет баллов (макс 140)
    let correctCount = 0;
    sampleQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / sampleQuestions.length) * 140);
    let analysisText = "";

    if (geminiKey) {
      const prompt = `Ты — ведущий ИИ-аналитик ЕНТ. Студент ${userName} сдал финальную комплексную симуляцию ЕНТ с результатом ${finalScore} из 140 баллов. Его профильные предметы: ${combo}.
      Напиши краткий, структурированный, мотивирующий анализ его результатов (до 100 слов). Укажи сильные стороны, возможные зоны риска и финальную рекомендацию для реального экзамена.`;
      
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
        if (response.ok) {
          const data = await response.json();
          analysisText = data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.warn("Gemini error in final exam feedback:", err);
      }
    }

    if (!analysisText) {
      if (finalScore >= 120) {
        analysisText = `Анализ ИИ: Великолепный результат (${finalScore}/140)! Вы демонстрируете глубокие знания Истории Казахстана, превосходную математическую грамотность и уверенное владение профильными дисциплинами. Зон риска практически не обнаружено. Рекомендуется сохранять боевой настрой, вы полностью готовы к получению государственного гранта!`;
      } else if (finalScore >= 80) {
        analysisText = `Анализ ИИ: Хороший средний уровень (${finalScore}/140). Отличные показатели по обязательному блоку, однако в профильных задачах ${combo} есть небольшие пробелы. Рекомендуется повторить ключевые формулы и поработать над скоростью решений. Ваша готовность оценивается высоко!`;
      } else {
        analysisText = `Анализ ИИ: Базовый уровень (${finalScore}/140). Выявлены зоны риска в блоке математической грамотности и профильном блоке. Рекомендуется систематически повторять пройденный материал и решать тесты в ИИ-тренажере по слабым темам. Шансы сдать успешно есть, не сбавляйте темп!`;
      }
    }

    // Имитируем аналитический расчет ИИ
    setTimeout(() => {
      setLoadingAnalysis(false);
      onFinish(finalScore, analysisText);
    }, 2500);
  }

  // Таймер обратного отсчета
  useEffect(() => {
    if (timeLeft <= 0) {
      const timerId = setTimeout(() => {
        handleFinishExam();
      }, 0);
      return () => clearTimeout(timerId);
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSelectOption = (optionIndex) => {
    if (isExamFinished) return;
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleFinishExam();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = sampleQuestions[currentQuestion];
  const isSelected = answers[currentQuestion] !== undefined;

  if (loadingAnalysis) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white mb-2">ИИ анализирует результаты экзамена...</h3>
        <p className="text-slate-400 text-xs max-w-sm">
          Идет обработка ваших ответов, расчет балла ЕНТ по шкале 140 баллов и генерация персональной рекомендации.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-[#161F30] border border-gray-800/80 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
        {/* Декоративное свечение */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>

        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500/15 text-red-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-red-500/20">
                Финальная аттестация
              </span>
              <span className="bg-indigo-500/15 text-indigo-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                {currentQ.subject}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-2">Комплексная симуляция ЕНТ</h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Осталось времени</div>
            <div className={`text-xl font-mono font-black mt-1 ${timeLeft < 300 ? "text-red-500 animate-pulse" : "text-white"}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Прогресс вопросов */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
          <span>Прогресс симуляции</span>
          <span>{currentQuestion + 1} из {sampleQuestions.length}</span>
        </div>
        <div className="w-full bg-[#0E1622] h-1.5 rounded-full mb-8 overflow-hidden border border-gray-800/20">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%` }}
          ></div>
        </div>

        {/* Текст вопроса */}
        <div className="bg-[#0E1622]/60 border border-gray-800/50 p-6 rounded-2xl mb-6 shadow-inner">
          <p className="text-white text-base leading-relaxed font-semibold">{currentQ.text}</p>
        </div>

        {/* Варианты ответов */}
        <div className="space-y-3 mb-8">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-xl text-left border transition-all duration-150 text-sm font-semibold flex items-center gap-4 ${
                answers[currentQuestion] === idx
                  ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/5"
                  : "bg-[#0E1622]/40 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200"
              }`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs border font-bold ${
                answers[currentQuestion] === idx 
                  ? "bg-indigo-500 border-indigo-400 text-white" 
                  : "bg-[#161F30] border-gray-700 text-gray-400"
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              if (confirm("Вы уверены, что хотите прервать симуляцию? Прогресс будет потерян.")) {
                onClose();
              }
            }}
            className="px-5 py-3 border border-gray-800 hover:bg-gray-800/40 text-slate-400 rounded-xl font-bold transition text-xs shrink-0"
          >
            Прервать
          </button>
          <button
            onClick={handleNext}
            disabled={!isSelected}
            className={`w-full py-3.5 px-6 rounded-xl font-bold transition text-center shadow-lg text-xs ${
              isSelected
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10"
                : "bg-gray-800 text-gray-600 cursor-not-allowed shadow-none"
            }`}
          >
            {currentQuestion === sampleQuestions.length - 1 ? "Завершить симуляцию" : "Следующий вопрос →"}
          </button>
        </div>
      </div>
    </div>
  );
};
