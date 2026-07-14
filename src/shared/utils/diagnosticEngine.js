import { diagnosticQuestions } from "../data/diagnosticQuestions";

export function initializeDiagnosticSession(userProfile) {
  const { grade, selectedSubjects } = userProfile;

  if (grade === 9 || grade === 10) {
    return {
      questions: diagnosticQuestions.filter(
        (q) => q.assessmentType === "orientation",
      ),
      history: {},
      masteryProgress: {},
      isOrientation: true,
    };
  }

  const mandatorySubjects = [
    "kazakhstan_history",
    "reading_literacy",
    "math_literacy",
  ];

  const deepQuestions = diagnosticQuestions.filter(
    (q) => q.assessmentType === "deep" && selectedSubjects.includes(q.subject),
  );

  const lightQuestions = diagnosticQuestions.filter(
    (q) =>
      q.assessmentType === "light" && mandatorySubjects.includes(q.subject),
  );

  return {
    questions: [...deepQuestions, ...lightQuestions],
    history: {},
    topicBlockStats: {},
    masteryProgress: {},
    isOrientation: false,
  };
}

export function shouldSkipRemainingInBlock(
  topicBlock,
  history,
  currentQuestions,
) {
  if (!topicBlock) return false;

  const answeredInBlock = currentQuestions.filter(
    (q) => q.topicBlock === topicBlock && history[q.id] !== undefined,
  );

  if (answeredInBlock.length >= 2) {
    const allCorrect = answeredInBlock.every((q) => history[q.id] === true);
    return allCorrect;
  }

  return false;
}
