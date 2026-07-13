import { db } from '../../app/providers/Firebase/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export const seedQuestionBank = async (localQuestions) => {
  const batchPromises = localQuestions.map(async (q) => {
    const questionId = q.id || `q_${Math.random().toString(36).substring(2, 11)}`;
    const storagePath = `https://firebasestorage.googleapis.com/v0/b/YOUR_BUCKET/o/${q.subject}%2F${q.topic}%2F${questionId}.json?alt=media`;

    const indexData = {
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty || 'medium',
      storagePath,
      isApproved: true,
      timesShown: 0,
      createdAt: new Date()
    };

    const fullContent = {
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium',
      topic: q.topic
    };

    await setDoc(doc(collection(db, 'questionBank'), questionId), indexData);

    return {
      path: `${q.subject}/${q.topic}/${questionId}.json`,
      content: fullContent
    };
  });

  return Promise.all(batchPromises);
};