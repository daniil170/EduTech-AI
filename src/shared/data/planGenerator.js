// src/shared/data/planGenerator.js
import { curriculum } from "./curriculum";

/**
 * Проверяет, доступен ли урок пользователю на основе его истории результатов.
 * @param {Object} userProgress - Данные из Firestore вида { lessonId: scorePercent }
 * @param {string} lessonId - ID проверяемого урока
 * @returns {boolean}
 */
export const isLessonUnlocked = (userProgress, lessonId) => {
  const currentLesson = curriculum.lessons.find((l) => l.lessonId === lessonId);
  if (!currentLesson) return false;
  if (currentLesson.unlockThreshold === 0) return true;

  // Находим предыдущий урок по порядку
  const previousLesson = curriculum.lessons.find(
    (l) => l.order === currentLesson.order - 1,
  );
  if (!previousLesson) return true;

  // Проверяем, набрал ли пользователь нужный балл за прошлый урок
  const previousScore = userProgress[previousLesson.lessonId] || 0;
  return previousScore >= currentLesson.unlockThreshold;
};

/**
 * Возвращает список уроков с актуальным статусом блокировки для интерфейса
 */
export const getAvailableLessons = (userProgress = {}) => {
  return curriculum.lessons.map((lesson) => ({
    ...lesson,
    isUnlocked: isLessonUnlocked(userProgress, lesson.lessonId),
    currentScore: userProgress[lesson.lessonId] || null,
  }));
};
