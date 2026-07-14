import { getDiagnosticQuestions } from '../data/diagnosticQuestions';

export function initializeDiagnosticSession(userProfile) {
  const { grade, profileCombo } = userProfile;
  const isOrientationTrack = grade === 9 || grade === 10;

  const questions = getDiagnosticQuestions(profileCombo, isOrientationTrack);

  return {
    questions,
    history: {},
    topicBlockStats: {},
    masteryProgress: {},
    isOrientation: isOrientationTrack
  };
}

export function shouldSkipRemainingInBlock(topic, history, currentQuestions) {
  if (!topic) return false;

  const answeredInTopic = currentQuestions.filter(
    q => q.topic === topic && history[q.id] !== undefined
  );

  if (answeredInTopic.length >= 2) {
    const allCorrect = answeredInTopic.every(q => history[q.id] === true);
    return allCorrect;
  }

  return false;
}