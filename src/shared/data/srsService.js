import { db } from "../../app/providers/Firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const BOX_INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

export const getSrsState = async (uid, topicTag) => {
  const docRef = doc(db, "users", uid, "srsState", topicTag);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return {
      box: 1,
      nextReviewAt: new Date(),
      lastResult: null,
      attemptsTotal: 0,
      correctTotal: 0,
    };
  }

  const data = docSnap.data();
  return {
    ...data,
    nextReviewAt: data.nextReviewAt.toDate(),
  };
};

export const updateSrsState = async (uid, topicTag, isCorrect) => {
  const docRef = doc(db, "users", uid, "srsState", topicTag);
  const currentState = await getSrsState(uid, topicTag);

  const newBox = isCorrect ? Math.min(5, currentState.box + 1) : 1;
  const daysInterval = BOX_INTERVALS[newBox];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + daysInterval);

  const updatedData = {
    box: newBox,
    nextReviewAt: nextReviewDate,
    lastResult: isCorrect ? "correct" : "incorrect",
    attemptsTotal: currentState.attemptsTotal + 1,
    correctTotal: currentState.correctTotal + (isCorrect ? 1 : 0),
  };

  await setDoc(docRef, updatedData, { merge: true });
  return updatedData;
};
