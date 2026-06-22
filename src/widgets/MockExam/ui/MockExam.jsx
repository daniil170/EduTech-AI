import { useState } from "react";
import { getDiagnosticQuestions } from "../../../shared/data/codificator";

export const MockExam = ({ 
  subject, 
  examTitle, 
  userName, 
  onClose, 
  onFinish,
  isOrientationTrack = false,
  initialAnswers = null,
  initialCurrentQuestion = 0
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(initialCurrentQuestion);
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [showResultsPreview, setShowResultsPreview] = useState(false);
  const [skipNotice, setSkipNotice] = useState(null);

  // Check if this is the entrance diagnostic test or a normal mock exam
  const isDiagnostic = subject && (subject.includes("–") || subject.includes("-") || subject === "Творческий экзамен" || isOrientationTrack);

  // Load diagnostic questions from the codificator pool or create a fallback question
  const sampleQuestions = isDiagnostic 
    ? getDiagnosticQuestions(subject, isOrientationTrack)
    : [
        {
          id: "mock-1",
          subject: subject || "Математика",
          topic: "Общая теория",
          text: `Тестовый специализированный вопрос по предмету [${subject || "Дисциплина"}]: Выберите наиболее точное утверждение для законов данной темы.`,
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

  // Adaptive skipping logic helper
  const checkAdaptiveSkip = (newAnswers, currentIdx) => {
    const currentQ = sampleQuestions[currentIdx];
    if (!currentQ || !isDiagnostic || isOrientationTrack) return { skipped: false, updatedAnswers: newAnswers };

    // Do not skip compulsory subjects since they only have 5-6 questions in total
    const isCompulsory = ["История Казахстана", "Математическая грамотность", "Грамотность чтения"].includes(currentQ.subject);
    if (isCompulsory) return { skipped: false, updatedAnswers: newAnswers };

    // Find all questions in this specific topic block
    const blockIndices = sampleQuestions
      .map((q, i) => (q.subject === currentQ.subject && q.topic === currentQ.topic) ? i : -1)
      .filter(i => i !== -1);

    // We apply this if we have exactly 3 questions in this topic block, and the current question is the 2nd one
    if (blockIndices.length === 3 && currentIdx === blockIndices[1]) {
      const idx0 = blockIndices[0];
      const idx1 = blockIndices[1];
      const idx2 = blockIndices[2];

      const ans0 = newAnswers[idx0];
      const ans1 = newAnswers[idx1];

      if (ans0 !== undefined && ans1 !== undefined) {
        const isCorrect0 = ans0 === sampleQuestions[idx0].correct;
        const isCorrect1 = ans1 === sampleQuestions[idx1].correct;

        if (isCorrect0 && isCorrect1) {
          // Both correct: skip the 3rd question and auto-mark it as correct
          const updated = { ...newAnswers, [idx2]: sampleQuestions[idx2].correct };
          return { skipped: true, skippedCorrect: true, updatedAnswers: updated };
        } else if (!isCorrect0 && !isCorrect1) {
          // Both incorrect: skip the 3rd question and auto-mark it as incorrect (-1)
          const updated = { ...newAnswers, [idx2]: -1 };
          return { skipped: true, skippedCorrect: false, updatedAnswers: updated };
        }
      }
    }

    return { skipped: false, updatedAnswers: newAnswers };
  };

  const handleNext = () => {
    const nextAnswers = { ...answers };
    const { skipped, skippedCorrect, updatedAnswers } = checkAdaptiveSkip(nextAnswers, currentQuestion);
    
    setAnswers(updatedAnswers);

    if (skipped) {
      const nextIdx = currentQuestion + 1;
      const skippedQ = sampleQuestions[nextIdx];
      const noticeText = skippedCorrect
        ? `⚡ ИИ: тема «${skippedQ.topic}» усвоена отлично! Следующий вопрос зачтен как верный для экономии времени.`
        : `🎯 ИИ: тема «${skippedQ.topic}» требует внимания. Вопрос пропущен для сокращения времени теста.`;
      
      setSkipNotice(noticeText);

      // Auto-fade notice after 4 seconds
      setTimeout(() => setSkipNotice(null), 4000);

      if (currentQuestion < sampleQuestions.length - 2) {
        setCurrentQuestion(currentQuestion + 2);
      } else {
        setShowResultsPreview(true);
      }
    } else {
      setSkipNotice(null);
      if (currentQuestion < sampleQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResultsPreview(true);
      }
    }
  };

  const handlePause = () => {
    localStorage.setItem("diagnostic_paused_subject", subject);
    localStorage.setItem("diagnostic_paused_answers", JSON.stringify(answers));
    localStorage.setItem("diagnostic_paused_current", currentQuestion.toString());
    localStorage.setItem("diagnostic_paused_is_orientation", isOrientationTrack ? "true" : "false");
    if (onClose) onClose();
  };

  const calculateScorePercent = () => {
    let correctCount = 0;
    let gradedCount = 0;
    
    sampleQuestions.forEach((q, idx) => {
      const userAns = answers[idx];
      if (userAns !== undefined) {
        gradedCount++;
        if (userAns === q.correct) {
          correctCount++;
        }
      }
    });

    if (gradedCount === 0) return 0;
    return Math.round((correctCount / gradedCount) * 100);
  };

  const calculateTopicBreakdown = () => {
    const breakdown = {};
    
    sampleQuestions.forEach((q, idx) => {
      const userAns = answers[idx];
      if (userAns === undefined) return; // not answered or skipped without grading (should not happen for graded items)

      const isCorrect = userAns === q.correct;
      const sub = q.subject;
      const top = q.topic;
      
      if (!breakdown[sub]) {
        breakdown[sub] = {};
      }
      if (!breakdown[sub][top]) {
        breakdown[sub][top] = { correct: 0, total: 0 };
      }
      breakdown[sub][top].total += 1;
      if (isCorrect) {
        breakdown[sub][top].correct += 1;
      }
    });
    
    // Convert to rate (0.0 to 1.0)
    const result = {};
    Object.keys(breakdown).forEach(sub => {
      result[sub] = {};
      Object.keys(breakdown[sub]).forEach(top => {
        const stats = breakdown[sub][top];
        result[sub][top] = stats.total > 0 ? Number((stats.correct / stats.total).toFixed(2)) : 0.0;
      });
    });
    return result;
  };

  const handleSubmitDiagnostic = () => {
    localStorage.removeItem("diagnostic_paused_subject");
    localStorage.removeItem("diagnostic_paused_answers");
    localStorage.removeItem("diagnostic_paused_current");
    localStorage.removeItem("diagnostic_paused_is_orientation");

    const finalScore = calculateScorePercent();
    const topicBreakdown = calculateTopicBreakdown();
    if (onFinish) {
      onFinish(finalScore, subject, topicBreakdown);
    }
  };

  const currentQ = sampleQuestions[currentQuestion] || sampleQuestions[0];
  const isSelected = answers[currentQuestion] !== undefined;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
        
        {/* Header Options */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          {isDiagnostic && (
            <button 
              onClick={handlePause}
              className="text-slate-400 hover:text-white text-xs bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 font-bold transition flex items-center gap-1.5"
            >
              ⏱️ На паузу
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs bg-slate-800/50 hover:bg-slate-800 rounded-full p-2"
            >
              ✕
            </button>
          )}
        </div>

        {!showResultsPreview ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pr-24">
              <div>
                <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-500/20">
                  {currentQ.subject} {currentQ.topic ? `• ${currentQ.topic}` : ""}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 mt-2 leading-tight">
                  {examTitle || "Диагностический тест"}
                </h3>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-2">
                <span>Прогресс прохождения</span>
                <span>Вопрос {currentQuestion + 1} из {sampleQuestions.length}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300 shadow-md shadow-indigo-500/30"
                  style={{ width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Skip Notice Toast */}
            {skipNotice && (
              <div className="bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 px-4 py-3 rounded-2xl mb-5 text-xs font-bold flex items-center gap-2 animate-pulse">
                <span>{skipNotice}</span>
              </div>
            )}

            {/* Question Text */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-5 sm:p-6 rounded-2xl mb-6">
              <p className="text-white text-sm sm:text-base leading-relaxed font-semibold">{currentQ.text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl text-left border transition-all duration-150 text-xs sm:text-sm font-semibold flex items-center gap-4 ${
                    answers[currentQuestion] === idx
                      ? "bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-500/10 scale-[1.01]"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] border font-black ${
                    answers[currentQuestion] === idx 
                      ? "bg-indigo-500 border-indigo-400 text-white" 
                      : "bg-slate-800 border-slate-700 text-slate-400"
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
              className={`w-full py-3.5 px-6 rounded-xl font-bold transition text-xs uppercase tracking-wider text-center shadow-lg ${
                isSelected
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/20 hover:scale-[1.01]"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60"
              }`}
            >
              {currentQuestion === sampleQuestions.length - 1 ? "Завершить тест" : "Следующий вопрос →"}
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 mb-3">
              Диагностика завершена!
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-8 leading-relaxed max-w-md mx-auto">
              Отличная работа, {userName || "ученик"}! Ваши ответы успешно сохранены. Теперь вы можете ознакомиться с подробными результатами разбора вашего уровня знаний по темам кодификатора.
            </p>
            
            <button
              onClick={handleSubmitDiagnostic}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs uppercase tracking-wider font-black py-4 px-6 rounded-xl transition duration-300 shadow-lg shadow-emerald-500/20 hover:scale-[1.01]"
            >
              Посмотреть результаты диагностики ⚡
            </button>
          </div>
        )}

      </div>
    </div>
  );
};