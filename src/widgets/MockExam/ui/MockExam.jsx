import { useState, useEffect } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getSrsState, updateSrsState } from "../../../shared/data/srsService";
import { MathRenderer } from "../../../shared/ui/MathRenderer";

export const MockExam = ({ uid, topicTag }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExamQuestions = async () => {
      const srsState = await getSrsState(uid, topicTag);
      const now = new Date();

      if (srsState.nextReviewAt > now && srsState.attemptsTotal > 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "questionBank"),
        where("topic", "==", topicTag),
        where("isApproved", "==", true),
      );

      const querySnapshot = await getDocs(q);
      const loadedQuestions = [];

      for (const docSnapshot of querySnapshot.docs) {
        const indexData = docSnapshot.data();
        const response = await fetch(indexData.storagePath);
        const fullQuestion = await response.json();
        loadedQuestions.push({ id: docSnapshot.id, ...fullQuestion });
      }

      setQuestions(loadedQuestions);
      setLoading(false);
    };

    loadExamQuestions();
  }, [uid, topicTag]);

  const handleAnswerSubmit = async () => {
    if (selectedOption === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctIndex;

    await updateSrsState(uid, topicTag, isCorrect);
    setIsSubmitted(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  if (loading) return <div>Загрузка...</div>;
  if (questions.length === 0)
    return <div>Все задачи по этой теме повторены! Возвращайтесь позже.</div>;
  if (currentQuestionIndex >= questions.length)
    return <div>Тест завершен!</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <div className="mb-4">
        <MathRenderer content={currentQuestion.question} />
      </div>
      <div className="space-y-2 mb-6">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isSubmitted && setSelectedOption(index)}
            className={`w-full text-left p-3 rounded-lg border ${
              selectedOption === index
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            } ${isSubmitted && index === currentQuestion.correctIndex ? "bg-green-100 border-green-500" : ""}`}
            disabled={isSubmitted}
          >
            <MathRenderer content={option} />
          </button>
        ))}
      </div>
      {!isSubmitted ? (
        <button
          onClick={handleAnswerSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          disabled={selectedOption === null}
        >
          Проверить
        </button>
      ) : (
        <div>
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <MathRenderer content={currentQuestion.explanation} />
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Далее
          </button>
        </div>
      )}
    </div>
  );
};
