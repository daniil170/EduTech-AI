// Plan Generator Engine for UNT Preparation
import { defaultTopics, getTopicWeight } from "./codificator";

export const calculatePriority = (level, weight, lastTested) => {
  let urgencyFactor = 1.0;
  if (lastTested) {
    const lastTestedDate = new Date(lastTested);
    if (!isNaN(lastTestedDate.getTime())) {
      const days = (new Date() - lastTestedDate) / (1000 * 60 * 60 * 24);
      urgencyFactor = 1.0 + Math.min(2.0, days / 30); // Up to 3.0 urgency factor after 60 days
    }
  }
  return (1.0 - (level || 0.0)) * (weight || 0.05) * urgencyFactor;
};

export const calculateWeightedProgress = (studyPlan, subjectName) => {
  if (!studyPlan || studyPlan.length === 0) return 0;
  
  // Filter steps by subject if provided
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

export const generatePlanLocal = (studentStats) => {
  const subjects = studentStats?.subjectsMastery?.map(s => s.name) || ["История Казахстана"];
  const topicMastery = studentStats?.topicMastery || {};
  const is11th = studentStats?.grade === "11 класс" || !studentStats?.grade;
  const daysToUnt = studentStats?.daysToUnt || 180;
  
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
  
  // Sort all topics by priority desc
  allTopics.sort((a, b) => b.priority - a.priority);
  
  const studyPlan = [];
  const recommendations = [];
  
  // Recommendations generation
  if (allTopics.length > 0) {
    const weakest = allTopics[0];
    recommendations.push(`Сделайте упор на тему «${weakest.topic}» (${weakest.subject}), так как ее приоритет отработки самый высокий.`);
    recommendations.push("Используйте Умный календарь для ежедневного распределения нагрузки.");
    recommendations.push("Решайте не менее 5-10 задач в день по слабым темам для тренировки долговременной памяти.");
  }
  
  // Deadlines assignment
  let currentDateOffset = 0;
  const today = new Date();
  
  allTopics.forEach((item, index) => {
    const stepId = `step-${index + 1}`;
    
    if (is11th) {
      // 11th grade: strict deadlines based on priority
      // Proportional days allocation (minimum 2 days, maximum 10 days per topic)
      const totalPriority = allTopics.reduce((sum, t) => sum + t.priority, 0) || 1;
      const daysAllocated = Math.max(2, Math.min(10, Math.round((item.priority / totalPriority) * daysToUnt)));
      
      currentDateOffset += daysAllocated;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + currentDateOffset);
      
      const day = String(targetDate.getDate()).padStart(2, '0');
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      
      studyPlan.push({
        id: stepId,
        subject: item.subject,
        topic: item.topic,
        name: `Изучение и отработка темы: ${item.topic} (${item.subject})`,
        priority: Number(item.priority.toFixed(3)),
        date: `Срок: ${day}.${month} (через ${currentDateOffset} дн.)`,
        status: "upcoming",
        source: "diagnostic",
        autoCompleted: false
      });
    } else {
      // 9-10th grades: Recommended week (timeline without unt countdown)
      const weekIndex = Math.floor(index / 2) + 1; // 2 topics per week
      studyPlan.push({
        id: stepId,
        subject: item.subject,
        topic: item.topic,
        name: `Закрепление темы: ${item.topic} (${item.subject})`,
        priority: Number(item.priority.toFixed(3)),
        date: `Рекомендуемая неделя: Неделя ${weekIndex}`,
        status: "upcoming",
        source: "diagnostic",
        autoCompleted: false
      });
    }
  });
  
  return { studyPlan, recommendations };
};

export const generatePlanGemini = async (studentStats, geminiKey) => {
  if (!geminiKey) {
    return generatePlanLocal(studentStats);
  }
  
  const subjects = studentStats?.subjectsMastery?.map(s => s.name) || ["История Казахстана"];
  const topicMastery = studentStats?.topicMastery || {};
  const daysToUnt = studentStats?.daysToUnt || 180;
  const grade = studentStats?.grade || "11 класс";
  const dailyBudgetMinutes = studentStats?.dailyBudgetMinutes || 120;
  
  // Construct topic mastery description for Gemini
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
- Ежедневный лимит занятий: ${dailyBudgetMinutes} минут

Инструкции по генерации:
1. Отсортируй темы логически (сначала пробелы в важных темах с высоким весом topicWeight, затем закрепление).
2. Для каждого шага сформируй понятное название "name" (описывающее, что изучить).
3. Проставь дедлайны "date". Если это 11 класс, пиши в формате "Срок: ДД.ММ (через Х дн.)". Если это 9 или 10 класс, пиши в формате "Рекомендуемая неделя: Неделя Х" (не используй обратный отсчет до ЕНТ).
4. Проставь значение приоритета "priority" (число от 0.0 до 1.0) для каждого шага.
5. Выдай 3 практические рекомендации "recommendations" по улучшению подготовки.

Верни ответ СТРОГО в формате JSON без markdown-разметки (без \`\`\`json):
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
    
    // Ensure all steps have the required fields
    const validatedSteps = (result.studyPlan || []).map((step, idx) => ({
      id: step.id || `step-${idx + 1}`,
      subject: step.subject || subjects[0],
      topic: step.topic || "Общая теория",
      name: step.name || "Изучить раздел",
      priority: step.priority !== undefined ? Number(step.priority) : 0.5,
      date: step.date || "В процессе",
      status: "upcoming",
      source: "diagnostic",
      autoCompleted: false
    }));
    
    return {
      studyPlan: validatedSteps,
      recommendations: result.recommendations || ["Занимайтесь регулярно в тренажере"]
    };
  } catch (e) {
    console.error("[planGenerator] Gemini plan generation failed, falling back to local formulas:", e);
    return generatePlanLocal(studentStats);
  }
};

export const mergePlans = (oldPlan, newPlan) => {
  if (!oldPlan || oldPlan.length === 0) return newPlan;
  
  // Extract completed step subjects and topics to keep them done
  const completedStepsMap = new Map();
  oldPlan.forEach(step => {
    if (step.status === "completed" || step.status === "done") {
      const key = `${step.subject}::${step.topic}`;
      completedStepsMap.set(key, step);
    }
  });
  
  const mergedSteps = newPlan.studyPlan.map(newStep => {
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
  
  return {
    studyPlan: mergedSteps,
    recommendations: newPlan.recommendations
  };
};
