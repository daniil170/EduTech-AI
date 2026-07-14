/* global process */
import { initializeApp, cert } from 'firebase-admin/app';
import { seedQuestionBank } from './src/shared/data/databaseSeeder.js';

const dummyQuestions = [
  {
    id: "q_test_001",
    subject: "math",
    topic: "algebra_basics",
    difficulty: "medium",
    question: "Решите уравнение: $2x + 5 = 15$",
    options: ["$x = 3$", "$x = 5$", "$x = 10$", "$x = 4$"],
    correctIndex: 1,
    explanation: "Переносим 5: $2x = 10$, откуда $x = 5$."
  }
];

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount)
});

const run = async () => {
  try {
    const results = await seedQuestionBank(dummyQuestions);
    process.stdout.write(`Успешно проиндексировано задач: ${results.length}\n`);
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Ошибка миграции: ${error.message}\n`);
    process.exit(1);
  }
};

run();