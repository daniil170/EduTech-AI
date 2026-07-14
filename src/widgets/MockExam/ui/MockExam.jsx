import { useState } from "react";
import {
  initializeDiagnosticSession,
  shouldSkipRemainingInBlock,
} from "../../../shared/utils/diagnosticEngine";

export function MockExam({ user, onComplete }) {
  const [session] = useState(() =>
    initializeDiagnosticSession({
      grade: user.grade || 11,
      profileCombo: user.profileCombo || "Математика – Физика",
    }),
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState({});
  const [skippedTopics, setSkippedTopics] = useState(new Set());

  if (!session) return <div>Загрузка диагностики...</div>;

  const currentQuestion = session.questions[currentIndex];

  const handleAnswerSelect = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const handleNext = () => {
    const isCorrect = answers[currentQuestion.id] === currentQuestion.correct;

    const updatedHistory = { ...history, [currentQuestion.id]: isCorrect };
    setHistory(updatedHistory);

    const currentTopic = currentQuestion.topic;
    const newSkippedTopics = new Set(skippedTopics);

    if (
      shouldSkipRemainingInBlock(
        currentTopic,
        updatedHistory,
        session.questions,
      )
    ) {
      newSkippedTopics.add(currentTopic);
      setSkippedTopics(newSkippedTopics);
    }

    let nextIndex = currentIndex + 1;
    while (nextIndex < session.questions.length) {
      const nextQ = session.questions[nextIndex];
      if (!newSkippedTopics.has(nextQ.topic)) {
        break;
      }
      nextIndex++;
    }

    if (nextIndex < session.questions.length) {
      setCurrentIndex(nextIndex);
    } else {
      finishDiagnostic(updatedHistory, newSkippedTopics);
    }
  };

  const finishDiagnostic = (finalHistory, finalSkippedTopics) => {
    const topicMastery = {};

    session.questions.forEach((q) => {
      if (!topicMastery[q.subject]) {
        topicMastery[q.subject] = {};
      }

      if (finalSkippedTopics.has(q.topic)) {
        topicMastery[q.subject][q.topic] = 1.0;
      } else {
        const wasCorrect = finalHistory[q.id];
        topicMastery[q.subject][q.topic] = wasCorrect ? 1.0 : 0.2;
      }
    });

    onComplete(topicMastery);
  };

  return (
    <div className="diagnostic-container p-6 bg-white rounded-xl shadow-md">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800">
          Настройка твоего личного плана
        </h3>
        <p className="text-sm text-slate-500">
          Ответь на вопросы, чтобы мы не тратили твоё время на темы, которые ты
          уже отлично знаешь.
        </p>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-6">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / session.questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="question-section mb-6">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800">
          {currentQuestion.subject} • Тема: {currentQuestion.topic}
        </span>
        <h4 className="text-lg mt-3 text-slate-700">{currentQuestion.text}</h4>

        <div className="options-list mt-4 space-y-2">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswerSelect(i)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                answers[currentQuestion.id] === i
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={answers[currentQuestion.id] === undefined}
        onClick={handleNext}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-200"
      >
        {currentIndex === session.questions.length - 1
          ? "Завершить настройку"
          : "Дальше"}
      </button>
    </div>
  );
}
