import { getDetailedTopicsForSubject } from "./curriculum";

export const generateLessonTimes = (timeSlot, lessonsCount) => {
  const defaultTimes = ["14:00", "15:30", "17:00", "18:30", "20:00", "21:30", "23:00"];
  if (!timeSlot || !timeSlot.includes("-")) return defaultTimes.slice(0, lessonsCount);

  try {
    const parts = timeSlot.split("-");
    const startStr = parts[0].trim();
    const endStr = parts[1].trim();

    const parseTime = (str) => {
      const [h, m] = str.split(":").map(Number);
      return h * 60 + m;
    };

    const formatTime = (minutes) => {
      const h = Math.floor(minutes / 60) % 24;
      const m = minutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const startMinutes = parseTime(startStr);
    const endMinutes = parseTime(endStr);

    let totalDuration = endMinutes - startMinutes;
    if (totalDuration <= 0) {
      totalDuration += 24 * 60;
    }

    if (lessonsCount <= 1) {
      return [startStr];
    }

    const interval = totalDuration / (lessonsCount - 1);
    const times = [];
    for (let i = 0; i < lessonsCount; i++) {
      times.push(formatTime(startMinutes + i * interval));
    }
    return times;
  } catch (e) {
    console.error("Error parsing study time slot, using defaults:", e);
    return defaultTimes.slice(0, lessonsCount);
  }
};

export const generateLocalSchedule = (stats, events, timeSlot, srsList = [], numDays = 7) => {
  const subjectsMastery = stats.subjectsMastery || [];
  if (subjectsMastery.length === 0) return [];

  let lessonsPerDay;
  if (stats.grade === "11 класс") {
    const days = parseInt(stats.daysToUnt, 10) || 120;
    if (days < 30) {
      lessonsPerDay = 7;
    } else if (days < 90) {
      lessonsPerDay = 5;
    } else {
      lessonsPerDay = 4;
    }
  } else if (stats.grade === "10 класс") {
    lessonsPerDay = 3;
  } else {
    lessonsPerDay = 2;
  }

  const timeSlotStr = timeSlot || "14:00 - 20:00";
  const times = generateLessonTimes(timeSlotStr, lessonsPerDay);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const completedReviewDates = {};
  events.forEach(evt => {
    if (evt.completed && evt.type === "lesson" && evt.topic) {
      const existingDate = completedReviewDates[evt.topic];
      if (!existingDate || evt.date > existingDate) {
        completedReviewDates[evt.topic] = evt.date;
      }
    }
  });

  // Map srsList for O(1) lookups
  const srsMap = {};
  srsList.forEach(item => {
    if (item && item.subject && item.topic) {
      const key = `${item.subject}::${item.topic}`;
      srsMap[key] = item;
    }
  });

  const candidates = [];

  subjectsMastery.forEach(sub => {
    const subProgress = sub.progress || 0;
    const detailedTopics = getDetailedTopicsForSubject(sub.name);
    const subMastery = stats.topicMastery?.[sub.name] || {};

    // Find the first topic with level < 0.75 (sequential mastery-progression)
    let activeTopicIndex = -1;
    for (let idx = 0; idx < detailedTopics.length; idx++) {
      const topicObj = detailedTopics[idx];
      const state = subMastery[topicObj.name] || {};
      const level = state.level !== undefined ? state.level : 0.0;
      if (level < 0.75) {
        activeTopicIndex = idx;
        break;
      }
    }

    detailedTopics.forEach((topicObj, idx) => {
      const state = subMastery[topicObj.name] || {};
      const level = state.level !== undefined ? state.level : 0.0;

      // Active topic: first uncompleted topic in the subject
      if (idx === activeTopicIndex) {
        const priorityScore = (100 - subProgress) * 0.5 + topicObj.weight * 10 + 50;
        candidates.push({
          subject: sub.name,
          topic: topicObj.name,
          motivatingTitle: topicObj.motivatingTitle,
          weight: topicObj.weight,
          priority: priorityScore,
          type: "active"
        });
      }
      // Completed topics (all indices before the active topic index, or all if none is active)
      else if (idx < activeTopicIndex || activeTopicIndex === -1) {
        const srsState = srsMap[`${sub.name}::${topicObj.name}`];
        if (srsState) {
          const nextReview = srsState.nextReviewAt ? new Date(srsState.nextReviewAt) : null;
          if (nextReview && nextReview <= new Date()) {
            const daysOverdue = Math.max(0, Math.ceil((Date.now() - nextReview.getTime()) / (1000 * 60 * 60 * 24)));
            const priorityScore = (1.0 - level) * 40 + topicObj.weight * 10 + 35 + daysOverdue * 2;
            candidates.push({
              subject: sub.name,
              topic: topicObj.name,
              motivatingTitle: `Повторение: ${topicObj.motivatingTitle}`,
              weight: topicObj.weight,
              priority: priorityScore,
              type: "repetition_srs"
            });
          }
        } else {
          // Fallback if no SRS record found: check if has not been reviewed recently
          const lastReviewDate = completedReviewDates[topicObj.name];
          let daysSinceReview = 999;
          if (lastReviewDate) {
            const diffTime = Math.abs(new Date(todayStr) - new Date(lastReviewDate));
            daysSinceReview = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          if (daysSinceReview >= 3) {
            const priorityScore = (100 - subProgress) * 0.5 + topicObj.weight * 10 + 25 + Math.min(daysSinceReview, 10);
            candidates.push({
              subject: sub.name,
              topic: topicObj.name,
              motivatingTitle: `Повторение: ${topicObj.motivatingTitle}`,
              weight: topicObj.weight,
              priority: priorityScore,
              type: "repetition_fallback"
            });
          }
        }
      }
    });
  });

  candidates.sort((a, b) => b.priority - a.priority);

  if (candidates.length === 0) {
    subjectsMastery.forEach(sub => {
      const detailedTopics = getDetailedTopicsForSubject(sub.name);
      detailedTopics.forEach(topicObj => {
        candidates.push({
          subject: sub.name,
          topic: topicObj.name,
          motivatingTitle: topicObj.motivatingTitle,
          weight: topicObj.weight,
          priority: topicObj.weight * 10,
          type: "fallback"
        });
      });
    });
    candidates.sort((a, b) => b.priority - a.priority);
  }

  const newEvents = [];
  let candidateIndex = 0;

  for (let d = 0; d < numDays; d++) {
    const targetDay = new Date(today);
    targetDay.setDate(today.getDate() + d);
    const dateStr = targetDay.toISOString().split("T")[0];

    const dailyEvents = [];
    const usedSubjectsThisDay = new Set();

    for (let slot = 0; slot < lessonsPerDay; slot++) {
      const timeStr = times[slot] || "15:00";

      let selectedCandidate = null;
      let checkIndex = 0;
      while (checkIndex < candidates.length) {
        const cand = candidates[(candidateIndex + checkIndex) % candidates.length];
        if (!usedSubjectsThisDay.has(cand.subject) || usedSubjectsThisDay.size >= subjectsMastery.length) {
          selectedCandidate = cand;
          candidateIndex = (candidateIndex + checkIndex + 1) % candidates.length;
          break;
        }
        checkIndex++;
      }

      if (!selectedCandidate) {
        selectedCandidate = candidates[candidateIndex];
        candidateIndex = (candidateIndex + 1) % candidates.length;
      }

      if (selectedCandidate) {
        usedSubjectsThisDay.add(selectedCandidate.subject);
        dailyEvents.push({
          title: selectedCandidate.motivatingTitle,
          subject: selectedCandidate.subject,
          topic: selectedCandidate.topic,
          time: timeStr,
          date: dateStr,
          type: "lesson",
          completed: false,
          createdAt: new Date().toISOString()
        });
      }
    }
    newEvents.push(...dailyEvents);
  }

  return newEvents;
};
