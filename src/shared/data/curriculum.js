// src/shared/data/curriculum.js

export const curriculum = {
  subjectId: "math",
  subjectName: "Математика",
  lessons: [
    {
      lessonId: "math_01_algebra_basics",
      title: "Базовая алгебра и выражения",
      order: 1,
      unlockThreshold: 0, // Доступен сразу
      topicTags: ["algebra_basics"],
      requiredCorrectPercent: 70, // Нужно набрать 70% в мини-тесте, чтобы открыть следующий
    },
    {
      lessonId: "math_02_linear_equations",
      title: "Линейные уравнения",
      order: 2,
      unlockThreshold: 70, // Откроется, если за прошлый урок набрано >= 70%
      topicTags: ["linear_equations"],
      requiredCorrectPercent: 70,
    },
    {
      lessonId: "math_03_quadratic_equations",
      title: "Квадратные уравнения",
      order: 3,
      unlockThreshold: 70,
      topicTags: ["quadratic_equations"],
      requiredCorrectPercent: 75,
    },
  ],
};
