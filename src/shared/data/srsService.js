const BOX_INTERVALS_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
};

export function calculateLeitnerState(currentState, isPassed) {
  const now = new Date();
  
  const state = currentState ? { ...currentState } : {
    box: 1,
    attemptsTotal: 0,
    correctTotal: 0,
    history: []
  };

  state.attemptsTotal += 1;
  if (isPassed) {
    state.correctTotal += 1;
  }

  if (isPassed) {
    state.box = Math.min(5, state.box + 1);
    state.lastResult = "correct";
  } else {
    state.box = 1;
    state.lastResult = "incorrect";
  }

  const daysToWait = BOX_INTERVALS_DAYS[state.box];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(now.getDate() + daysToWait);

  state.nextReviewAt = nextReviewDate.toISOString();
  state.lastTestedAt = now.toISOString();

  const sessionLog = {
    date: now.toISOString(),
    result: isPassed ? "correct" : "incorrect",
    movedToBox: state.box
  };
  state.history = [sessionLog, ...(state.history || [])].slice(0, 5);

  return state;
}