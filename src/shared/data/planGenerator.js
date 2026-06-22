import { defaultTopics, getTopicWeight } from "./codificator";

export const calculatePriority = (level, weight, lastTested) => {
  let urgencyFactor = 1.0;
  if (lastTested) {
    const lastTestedDate = new Date(lastTested);
    if (!isNaN(lastTestedDate.getTime())) {
      const days = (Date.now() - lastTestedDate) / (1000 * 60 * 60 * 24);
      urgencyFactor = 1.0 + Math.min(2.0, days / 30);
    }
  }
  return (1.0 - (level || 0.0)) * (weight || 0.05) * urgencyFactor;
};

export const calculateWeightedProgress = (studyPlan, subjectName) => {
  if (!studyPlan || studyPlan.length === 0) return 0;
  
  const steps = subjectName 
    ? studyPlan.filter(s => s.subject === subjectName)
    : studyPlan;
    
  if (steps.length === 0) return 0;
  
  let totalWeight = 0;
  let completedWeight = 0;
  
  steps.forEach(step => {
    const weight = getTopicWeight(step.subject, step.topic) || 0.05;
    totalWeight += weight;
    if (step.status === "completed" || step.status === "done") {
      completedWeight += weight;
    }
  });
  
  if (totalWeight === 0) return 0;
  return Math.round((completedWeight / totalWeight) * 100);
};

export const mergePlans = (oldPlan, newSteps, newRecommendations, currentVersion = 1) => {
  if (!oldPlan || oldPlan.length === 0) {
    return { studyPlan: newSteps, recommendations: newRecommendations, planVersion: currentVersion };
  }
  
  const completedStepsMap = new Map();
  oldPlan.forEach(step => {
    if (step.status === "done" || step.status === "completed" || step.status === "needs_review") {
      const key = `${step.subject}::${step.topic}`;
      completedStepsMap.set(key, step);
    }
  });
  
  const mergedSteps = newSteps.map(newStep => {
    const key = `${newStep.subject}::${newStep.topic}`;
    if (completedStepsMap.has(key)) {
      const oldStep = completedStepsMap.get(key);
      return {
        ...newStep,
        status: oldStep.status,
        autoCompleted: oldStep.autoCompleted || false,
        source: oldStep.source || "diagnostic"
      };
    }
    return newStep;
  });
  
  completedStepsMap.forEach((oldStep, key) => {
    const alreadyInMerged = mergedSteps.some(s => `${s.subject}::${s.topic}` === key);
    if (!alreadyInMerged) {
      mergedSteps.push(oldStep);
    }
  });
  
  return {
    studyPlan: mergedSteps,
    recommendations: newRecommendations,
    planVersion: currentVersion + 1
  };
};

export const generatePlanLocal = (studentStats, currentExamPrep = null) => {
  const subjects = studentStats?.subjectsMastery?.map(s => s.name) || ["История Казахстана"];
  const topicMastery = studentStats?.topicMastery || {};
  const is11th = studentStats?.grade === "11 класс" || !studentStats?.grade;
  const daysToUnt = studentStats?.daysToUnt || 180;
  
  let dailyBudgetMinutes = 120;
  if (studentStats?.schoolScheduleType === "first_shift") {
    dailyBudgetMinutes = 180;
  } else if (studentStats?.schoolScheduleType === "second_shift") {
    dailyBudgetMinutes = 90;
  }

  const allTopics = [];
  
  subjects.forEach(sub => {
    const topics = defaultTopics[sub] || [];
    const subMastery = topicMastery[sub] || {};
    
    topics.forEach(t => {
      const state = subMastery[t.name] || {};
      const level = state.level !== undefined ? state.level : 0.0;
      const lastTested = state.lastTested || null;
      const priority = calculatePriority(level, t.weight, lastTested);
      
      allTopics.push({
        subject: sub,
        topic: t.name,
        weight: t.weight,
        level,
        lastTested,
        priority,
        attempts: state.attempts || 0
      });
    });
  });
  
  allTopics.sort((a, b) => b.priority - a.priority);
  
  const rawSteps = [];
  const recommendations = [];
  
  if (allTopics.length > 0) {
    const weakest = allTopics[0];
    recommendations.push(`Сделайте упор на тему «${weakest.topic}» (${weakest.subject}), так как ее приоритет отработки самый высокий.`);
    recommendations.push("Используйте Умный календарь для ежедневного распределения нагрузки.");
    recommendations.push("Решайте не менее 5-10 задач в день по слабым темам для тренировки долговременной памяти.");
  }

  if (is11th && allTopics.length > daysToUnt) {
    recommendations.unshift(`⚠️ Внимание: Количество оставшихся тем (${allTopics.length}) превышает количество дней до ЕНТ (${daysToUnt}). ИИ прогнозирует критический дефицит времени. Увеличьте лимит ежедневных занятий!`);
  }
  
  let currentDateOffset = 0;
  const today = new Date();
  
  allTopics.forEach((item, index) => {
    const stepId = `step-${index + 1}-${Date.now()}`;
    
    if (is11th) {
      const totalPriority = allTopics.reduce((sum, t) => sum + t.priority, 0) || 1;
      const daysAllocated = Math.max(2, Math.min(10, Math.round((item.priority / totalPriority) * daysToUnt)));
      
      currentDateOffset += daysAllocated;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + currentDateOffset);
      
      const day = String(targetDate.getDate()).padStart(2, '0');
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      
      rawSteps.push({
        id: stepId,
        subject: item.subject,
        topic: item.topic,
        name: `Изучение и отработка темы: ${item.topic} (${item.subject})`,
        priority: Number(item.priority.toFixed(3)),
        date: `Срок: ${day}.${month} (через ${currentDateOffset} дн.)`,
        status: "pending",
        source: "diagnostic",
        autoCompleted: false
      });
    } else {
      const weekIndex = Math.floor(index / 2) + 1;
      rawSteps.push({
        id: stepId,
        subject: item.subject,
        topic: item.topic,
        name: `Закрепление темы: ${item.topic} (${item.subject})`,
        priority: Number(item.priority.toFixed(3)),
        date: `Рекомендуемая неделя: Неделя ${weekIndex}`,
        status: "pending",
        source: "diagnostic",
        autoCompleted: false
      });
    }
  });
  
  const currentVersion = currentExamPrep?.planVersion || 0;
  const mergedResult = mergePlans(currentExamPrep?.studyPlan || [], rawSteps, recommendations, currentVersion);
  
  return {
    ...mergedResult,
    dailyBudgetMinutes
  };
};

export const generatePlanGemini = async (studentStats, geminiKey, currentExamPrep = null) => {
  if (!geminiKey) {
    return generatePlanLocal(studentStats, currentExamPrep);
  }
  
  const subjects = studentStats?.subjectsMastery?.map(s => s.name) || ["История Казахстана"];
  const topicMastery = studentStats?.topicMastery || {};
  const daysToUnt = studentStats?.daysToUnt || 180;
  const grade = studentStats?.grade || "11 класс";
  
  let dailyBudgetMinutes = 120;
  if (studentStats?.schoolScheduleType === "first_shift") {
    dailyBudgetMinutes = 180;
  } else if (studentStats?.schoolScheduleType === "second_shift") {
    dailyBudgetMinutes = 90;
  }
  
  const masteryDescription = {};
  subjects.forEach(sub => {
    masteryDescription[sub] = {};
    const topics = defaultTopics[sub] || [];
    const subMastery = topicMastery[sub] || {};
    topics.forEach(t => {
      const state = subMastery[t.name] || {};
      masteryDescription[sub][t.name] = {
        masteryLevel: state.level !== undefined ? state.level : 0.0,
        attempts: state.attempts || 0,
        topicWeight: t.weight
      };
    });
  });
  
  const prompt = `Ты — ведущий ИИ-методолог ЕНТ. Сформируй индивидуальный пошаговый план подготовки по темам кодификатора ЕНТ.
Данные ученика:
- Выбранные предметы и текущее мастерство по темам (scale 0.0 - 1.0): ${JSON.stringify(masteryDescription)}
- Класс обучения: ${grade}
- Оставшееся время до ЕНТ: ${daysToUnt} дней
- Ежедневный лимит минут занятий: ${dailyBudgetMinutes} минут

Инструкции по генерации:
1. Отсортируй темы логически (сначала пробелы в важных темах с высоким весом topicWeight, затем закрепление).
2. Для каждого шага сформируй понятное название "name" (описывающее, что изучить).
3. Проставь дедлайны "date". Если это 11 класс, пиши в формате "Срок: ДД.ММ (через Х дн.)". Если это 9 или 10 класс, пиши в формате "Рекомендуемая неделя: Неделя Х".
4. Проставь значение приоритета "priority" (число от 0.0 до 1.0) для каждого шага.
5. Выдай 3 практические рекомендации "recommendations" по улучшению подготовки. Если тем много, а дней мало, первым пунктом выдай критическое предупреждение о дефиците времени.

Верни ответ СТРОГО в формате JSON без markdown-разметки:
{
  "studyPlan": [
    {
      "id": "step-1",
      "subject": "Математика",
      "topic": "Тригонометрия",
      "name": "Изучить тригонометрические формулы и базовые уравнения",
      "priority": 0.85,
      "date": "Срок: 25.06 (через 4 дня)"
    }
  ],
  "recommendations": [
    "Уделяй 20 минут в день тригонометрии в тренажере",
    "Повторяй формулы по выходным"
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    if (!response.ok) throw new Error("Gemini API request failed");
    
    const data = await response.json();
    let cleanText = data.candidates[0].content.parts[0].text;
    cleanText = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    
    const result = JSON.parse(cleanText);
    
    const validatedSteps = (result.studyPlan || []).map((step, idx) => ({
      id: step.id || `step-${idx + 1}-${Date.now()}`,
      subject: step.subject || subjects[0],
      topic: step.topic || "Общая теория",
      name: step.name || "Изучить раздел",
      priority: step.priority !== undefined ? Number(step.priority) : 0.5,
      date: step.date || "В процессе",
      status: "pending",
      source: "diagnostic",
      autoCompleted: false
    }));
    
    const currentVersion = currentExamPrep?.planVersion || 0;
    const mergedResult = mergePlans(
      currentExamPrep?.studyPlan || [], 
      validatedSteps, 
      result.recommendations || ["Занимайтесь регулярно в тренажере"],
      currentVersion
    );
    
    return {
      ...mergedResult,
      dailyBudgetMinutes
    };
  } catch (e) {
    console.error(e);
    return generatePlanLocal(studentStats, currentExamPrep);
  }
};

export const updateTopicMasteryAfterSession = (currentTopicMastery, sessionResult) => {
  const { subject, topic, score, totalQuestions } = sessionResult;
  
  const updatedMastery = { ...currentTopicMastery };
  if (!updatedMastery[subject]) updatedMastery[subject] = {};
  
  const oldState = updatedMastery[subject][topic] || { 
    level: 0.0, 
    attempts: 0, 
    lastTested: null,
    questionsSolved: 0 
  };
  
  const newAttempts = oldState.attempts + 1;
  const newQuestionsSolved = (oldState.questionsSolved || 0) + (totalQuestions || 0);
  
  let newLevel = oldState.attempts === 0 
    ? score 
    : (oldState.level * 0.7) + (score * 0.3);
    
  newLevel = Math.max(0.0, Math.min(1.0, Number(newLevel.toFixed(3))));
  
  updatedMastery[subject][topic] = {
    level: newLevel,
    attempts: newAttempts,
    questionsSolved: newQuestionsSolved,
    lastTested: new Date().toISOString()
  };
  
  return {
    updatedMastery,
    newLevel,
    newAttempts,
    newQuestionsSolved
  };
};

export const syncPlanStatusesWithMastery = (studyPlan, updatedTopicMastery) => {
  return studyPlan.map(step => {
    const state = updatedTopicMastery[step.subject]?.[step.topic];
    if (!state) return step;
    
    if (state.level >= 0.75 && state.attempts >= 5 && (state.questionsSolved || 0) >= 20 && step.status !== "done") {
      return {
        ...step,
        status: "done",
        autoCompleted: true,
        source: "trainer_feedback"
      };
    }
    
    if (state.level < 0.40 && state.attempts >= 3 && step.status === "done") {
      return {
        ...step,
        status: "needs_review",
        autoCompleted: false,
        source: "trainer_feedback"
      };
    }
    
    return step;
  });
};