import { useState } from "react";

// Добавлен ключевой именованный экспорт 'export', чтобы Workspace.jsx мог его прочитать
export const MockExam = ({ combo, onFinish }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResultsPreview, setShowResultsPreview] = useState(false);

  // Фиксированный пул демонстрационных вопросов для входного ИИ-теста
  const sampleQuestions = [
    {
      id: 1,
      subject: "Обязательный блок",
      text: "В каком году было образовано Казахское ханство под предводительством Керея и Жанибека?",
      options: ["1465 год", "1380 год", "1511 год", "1493 год"],
      correct: 0
    },
    {
      id: 2,
      subject: "Обязательный блок",
      text: "Какое из чисел является наименьшим общим кратным (НОК) для чисел 12 и 18?",
      options: ["6", "24", "36", "72"],
      correct: 2
    },
    {
      id: 3,
      subject: combo,
      text: `Специализированный вопрос по профильной комбинации [${combo}]: Определите верное утверждение для базовых законов данной дисциплины.`,
      options: [
        "Утверждение А (Оптимальный баланс системы)",
        "Утверждение Б (Возрастание энтропии среды)",
        "Утверждение В (Линейная зависимость параметров)",
        "Утверждение Г (Обратная пропорциональность факторов)"
      ],
      correct: 0
    }
  ];

  const handleSelectOption = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResultsPreview(true);
    }
  };

  const calculateScorePercent = () => {
    let correctCount = 0;
    sampleQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount++;
      }
    });
    return Math.round((correctCount / sampleQuestions.length) * 100);
  };

  const handleSubmitDiagnostic = () => {
    const finalScore = calculateScorePercent();
    onFinish(finalScore, combo);
  };

  const currentQ = sampleQuestions[currentQuestion];
  const isSelected = answers[currentQuestion] !== undefined;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-4">
      <div className="bg-[#161F30] border border-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
        
        {!showResultsPreview ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/20">
                  {currentQ.subject}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Вводная ИИ-диагностика</h3>
              </div>
              <span className="text-gray-400 text-sm font-medium">
                Вопрос {currentQuestion + 1} из {sampleQuestions.length}
              </span>
            </div>

            {/* Прогресс-бар */}
            <div className="w-full bg-[#0E1622] h-2 rounded-full mb-8 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%` }}
              ></div>
            </div>

            {/* Текст вопроса */}
            <div className="bg-[#0E1622] border border-gray-800/80 p-6 rounded-2xl mb-6">
              <p className="text-white text-base leading-relaxed font-medium">{currentQ.text}</p>
            </div>

            {/* Варианты ответов */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl text-left border transition-all duration-150 text-sm font-medium flex items-center gap-4 ${
                    answers[currentQuestion] === idx
                      ? "bg-blue-600/10 border-blue-500 text-white shadow-md shadow-blue-500/5"
                      : "bg-[#0E1622] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs border font-bold ${
                    answers[currentQuestion] === idx 
                      ? "bg-blue-500 border-blue-400 text-white" 
                      : "bg-[#161F30] border-gray-700 text-gray-400"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!isSelected}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition text-center shadow-lg ${
                isSelected
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/10"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed shadow-none"
              }`}
            >
              {currentQuestion === sampleQuestions.length - 1 ? "Завершить тест" : "Следующий вопрос →"}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Стартовый тест завершен!</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md mx-auto">
              Отличная работа! Ответы успешно зафиксированы локальной системой. Нажмите кнопку ниже, чтобы запустить искусственный интеллект для построения расписания.
            </p>
            
            <button
              onClick={handleSubmitDiagnostic}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-300 shadow-lg shadow-green-500/20"
            >
              Сгенерировать личный кабинет и календарь ⚡
            </button>
          </div>
        )}

      </div>
    </div>
  );
};