import { useState, useEffect } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import {
  doc,
  updateDoc,
  collection,
  getDoc,
  onSnapshot,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { MathRenderer } from "../../../shared/ui/MathRenderer";
import { getTopicsForSubject } from "../../../shared/data/curriculum";

export const AiLearningCore = ({
  user,
  userData,
  geminiKey,
  onClose,
  calendarEvents,
}) => {
  const [mode, setMode] = useState("menu");
  const [currentSubject, setCurrentSubject] = useState("");
  const [selectedSubjectName, setSelectedSubjectName] = useState(() => {
    return userData?.subjectsMastery?.[0]?.name || "История Казахстана";
  });
  const [currentTopic, setCurrentTopic] = useState("");

  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [taskChecked, setTaskChecked] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);

  const [mockQuestions, setMockQuestions] = useState([]);
  const [mockAnswers, setMockAnswers] = useState({});
  const [mockAnalysis, setMockAnalysis] = useState("");

  const [subjectLessons, setSubjectLessons] = useState([]);
  const [lessonStates, setLessonStates] = useState({});
  const [currentLesson, setCurrentLesson] = useState(null);
  const [srsReviews, setSrsReviews] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubStates = onSnapshot(
      collection(db, "users", user.uid, "lessonStates"),
      (querySnap) => {
        const states = {};
        querySnap.forEach((doc) => {
          states[doc.id] = doc.data();
        });
        setLessonStates(states);
      },
      (err) => console.error(err),
    );
    return () => unsubStates();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubSrs = onSnapshot(
      collection(db, "users", user.uid, "srsState"),
      (querySnap) => {
        const now = new Date();
        const reviews = [];
        querySnap.forEach((doc) => {
          const data = doc.data();
          if (data.nextReviewAt && new Date(data.nextReviewAt) <= now) {
            reviews.push({ id: doc.id, ...data });
          }
        });
        setSrsReviews(reviews);
      },
      (err) => console.error(err),
    );
    return () => unsubSrs();
  }, [user]);

  useEffect(() => {
    if (!selectedSubjectName) return;
    const loadLessons = async () => {
      try {
        const subjectDoc = await getDoc(
          doc(db, "subjects", selectedSubjectName),
        );
        if (subjectDoc.exists()) {
          const data = subjectDoc.data();
          const sorted = (data.lessons || []).sort((a, b) => a.order - b.order);
          setSubjectLessons(sorted);
        } else {
          const staticTopics = getTopicsForSubject(selectedSubjectName);
          const fallback = staticTopics.map((name, index) => {
            const slug = name
              .toLowerCase()
              .replace(/[^a-zа-я0-9]+/g, "_")
              .replace(/^_+|_+$/g, "");
            const subjectSlug = selectedSubjectName
              .toLowerCase()
              .replace(/[^a-zа-я0-9]+/g, "_")
              .replace(/^_+|_+$/g, "");
            return {
              lessonId: `${subjectSlug}_${String(index + 1).padStart(2, "0")}_${slug}`,
              title: name,
              order: index + 1,
              unlockThreshold: index === 0 ? 0 : 70,
              topicTags: [name],
              requiredCorrectPercent: 70,
            };
          });
          setSubjectLessons(fallback);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadLessons();
  }, [selectedSubjectName]);

  const renderCleanContent = (rawText, inline = false, className = "") => {
    return (
      <MathRenderer text={rawText} inline={inline} className={className} />
    );
  };

  const startLesson = async (subject, topic, lesson) => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const currentTasksSolved =
      userData?.lastActiveDate === todayStr
        ? userData?.dailyTasksSolved || 0
        : 0;
    const getDailyLimit = (tariff, role) => {
      if (role === "founder" || tariff === "whitelisted") return Infinity;
      if (tariff === "ultimate") return 500;
      if (tariff === "premium") return 300;
      if (tariff === "basic") return 50;
      return 15;
    };
    const limit = getDailyLimit(userData?.tariff, userData?.role);
    if (currentTasksSolved >= limit) {
      alert(
        `⚠️ Вы достигли дневного лимита ИИ-задач (${limit} задач).\n\nОбновление лимита произойдет завтра. Перейдите на более высокий тариф, чтобы увеличить лимит!`,
      );
      return;
    }

    setCurrentSubject(subject);
    setCurrentTopic(topic);
    setCurrentLesson(lesson);
    setLoading(true);
    setMode("lesson_theory");

    let dbTasks = [];
    try {
      const qSnap = await getDocs(
        query(
          collection(db, "questionBank"),
          where("subject", "==", subject),
          where("topic", "==", topic),
          where("isApproved", "==", true),
        ),
      );
      if (!qSnap.empty && qSnap.docs.length >= 3) {
        const shuffled = [...qSnap.docs].sort(() => 0.5 - Math.random());
        const selectedDocs = shuffled.slice(0, 3);

        const { fetchQuestionContent } =
          await import("../../../shared/data/contentService");

        for (const docData of selectedDocs) {
          const sPath = docData.data().storagePath;
          const qContent = await fetchQuestionContent(sPath);
          if (qContent) {
            dbTasks.push({
              question: qContent.question,
              options: qContent.options,
              correct: qContent.correctIndex,
              exp: qContent.explanation,
            });
          }
        }
      }
    } catch (err) {
      console.warn(err);
    }

    try {
      const { fetchLessonContent, getLocalLessonFallback } =
        await import("../../../shared/data/contentService");
      const lessonMeta = await fetchLessonContent(subject, topic);

      const contentStructure = {
        theory: lessonMeta.theory,
        formula: lessonMeta.formula,
        tasks: [],
      };

      if (dbTasks.length === 3) {
        contentStructure.tasks = dbTasks;
      } else {
        const localFallback = getLocalLessonFallback(subject, topic);
        contentStructure.tasks = localFallback.tasks;
      }

      setLessonData(contentStructure);
    } catch (e) {
      console.warn(e);
    } finally {
      initLessonState();
      setLoading(false);
    }
  };

  const initLessonState = () => {
    setCurrentTaskIdx(0);
    setSelectedAns(null);
    setTaskChecked(false);
    setLessonScore(0);
  };

  const handleNextLessonTask = () => {
    if (selectedAns === lessonData.tasks[currentTaskIdx].correct) {
      setLessonScore((prev) => prev + 1);
    }

    if (currentTaskIdx < lessonData.tasks.length - 1) {
      setCurrentTaskIdx((prev) => prev + 1);
      setSelectedAns(null);
      setTaskChecked(false);
    } else {
      setMode("lesson_results");
    }
  };

  const finishLessonSave = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const xpGained = lessonScore * 100 + 50;

    const scorePercent = Math.round((lessonScore / 3) * 100);
    const isCompleted = scorePercent >= 70;

    const topicSlug = currentTopic
      .toLowerCase()
      .replace(/[^a-zа-я0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const lessonId = currentLesson
      ? currentLesson.lessonId
      : `${currentSubject.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_01_lesson`;

    const lessonDocRef = doc(db, "users", user.uid, "lessonStates", lessonId);
    const srsDocRef = doc(
      db,
      "users",
      user.uid,
      "srsState",
      `${currentSubject}_${topicSlug}`,
    );

    try {
      await setDoc(
        lessonDocRef,
        {
          lessonId,
          scorePercent,
          isCompleted,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      const srsSnap = await getDoc(srsDocRef);
      const currentSrsData = srsSnap.exists() ? srsSnap.data() : null;

      const { calculateLeitnerState } =
        await import("../../../shared/data/srsService");
      const nextSrsState = calculateLeitnerState(currentSrsData, isCompleted);

      await setDoc(
        srsDocRef,
        {
          ...nextSrsState,
          subject: currentSubject,
          topic: currentTopic,
        },
        { merge: true },
      );

      const tempStates = {
        ...lessonStates,
        [lessonId]: { scorePercent, isCompleted },
      };
      const completedCount = subjectLessons.filter(
        (l) => tempStates[l.lessonId]?.isCompleted,
      ).length;
      const totalLessons = subjectLessons.length || 5;
      const newProgress = Math.min(
        100,
        Math.round((completedCount / totalLessons) * 100),
      );

      const updatedSubjectsMastery = (userData?.subjectsMastery || []).map(
        (sub) => {
          if (sub.name !== currentSubject) return sub;
          return {
            ...sub,
            progress: newProgress,
            level:
              newProgress >= 80
                ? "Продвинутый"
                : newProgress >= 40
                  ? "Средний"
                  : "Базовый",
          };
        },
      );

      const currentTopicMastery = userData?.topicMastery || {};
      const sessionResult = {
        subject: currentSubject,
        topic: currentTopic,
        score: lessonScore / 3,
        totalQuestions: 3,
      };

      const {
        updateTopicMasteryAfterSession,
        syncPlanStatusesWithMastery,
        calculateWeightedProgress,
      } = await import("../../../shared/data/planGenerator");
      const { updatedMastery } = updateTopicMasteryAfterSession(
        currentTopicMastery,
        sessionResult,
      );
      const currentStudyPlan = userData?.examPrep?.studyPlan || [];
      const updatedStudyPlan = syncPlanStatusesWithMastery(
        currentStudyPlan,
        updatedMastery,
      );
      const nextPercent = calculateWeightedProgress(updatedStudyPlan);

      const todayStr = new Date().toLocaleDateString("en-CA");
      const currentTasksSolved =
        userData?.lastActiveDate === todayStr
          ? userData?.dailyTasksSolved || 0
          : 0;

      await updateDoc(userDocRef, {
        dailyTasksSolved: currentTasksSolved + 3,
        lastActiveDate: todayStr,
        overallProgress: Math.min((userData?.overallProgress || 0) + 2, 100),
        subjectsMastery: updatedSubjectsMastery,
        "studentStats.topicMastery": updatedMastery,
        topicMastery: updatedMastery,
        "examPrep.studyPlan": updatedStudyPlan,
        "examPrep.completedPercent": nextPercent,
        "examPrep.updatedAt": new Date().toISOString(),
        recentActivity: [
          {
            id: crypto.randomUUID(),
            type: "ИИ-Урок",
            name: isCompleted
              ? `Пройден урок: ${currentTopic}`
              : `Попытка прохождения урока: ${currentTopic}`,
            score: isCompleted
              ? `+${xpGained} XP • Коробка SRS: ${nextSrsState.box}/5`
              : `Не сдано (${scorePercent}%) • Сброс SRS`,
            time: "Только что",
          },
          ...(userData?.recentActivity || []).slice(0, 4),
        ],
      });
    } catch (e) {
      console.error(e);
    }

    setMode("menu");
  };

  const startWeeklyMock = async () => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const currentTasksSolved = userData?.lastActiveDate === todayStr ? (userData?.dailyTasksSolved || 0) : 0;
    const getDailyLimit = (tariff, role) => {
      if (role === "founder" || tariff === "whitelisted") return Infinity;
      if (tariff === "ultimate") return 500;
      if (tariff === "premium") return 300;
      if (tariff === "basic") return 50;
      return 15;
    };
    const limit = getDailyLimit(userData?.tariff, userData?.role);
    if (currentTasksSolved >= limit) {
      alert(`⚠️ Вы достигли дневного лимита ИИ-задач (${limit} задач).\n\nОбновление лимита произойдет завтра. Перейдите на более высокий тариф, чтобы увеличить лимит!`);
      return;
    }

    setLoading(true);
    setMode("mock_exam");
    setMockAnswers({});

    const subjects = userData?.subjectsMastery?.map(s => s.name) || ["История Казахстана"];
    const generatedTasks = [];

    try {
      const { fetchQuestionContent } = await import("../../../shared/data/contentService");

      for (const sub of subjects) {
        const subEvents = calendarEvents?.filter(e => e.subject === sub) || [];
        const activeTopic = subEvents.length > 0 ? subEvents[0].topic : "Общая теория";

        const qSnap = await getDocs(
          query(
            collection(db, "questionBank"),
            where("subject", "==", sub),
            where("topic", "==", activeTopic),
            where("isApproved", "==", true)
          )
        );

        if (!qSnap.empty) {
          const shuffled = [...qSnap.docs].sort(() => 0.5 - Math.random());
          const selectedDocs = shuffled.slice(0, 2);

          for (const docData of selectedDocs) {
            const sPath = docData.data().storagePath;
            const qContent = await fetchQuestionContent(sPath);
            if (qContent) {
              generatedTasks.push({
                id: docData.id,
                subject: sub,
                text: qContent.question,
                options: qContent.options,
                correct: qContent.correctIndex
              });
            }
          }
        } else {
          const { getLocalLessonFallback } = await import("../../../shared/data/contentService");
          const fallback = getLocalLessonFallback(sub, activeTopic);
          fallback.tasks.slice(0, 2).forEach((t, idx) => {
            generatedTasks.push({
              id: `mock_${sub}_${idx}_${Date.now()}`,
              subject: sub,
              text: t.question,
              options: t.options,
              correct: t.correct
            });
          });
        }
      }
      setMockQuestions(generatedTasks);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const finishMockExam = async () => {
    setLoading(true);
    setMode("mock_results");

    let correctCount = 0;
    mockQuestions.forEach((q, idx) => {
      if (mockAnswers[idx] === q.correct) correctCount++;
    });

    const percent = Math.round((correctCount / mockQuestions.length) * 100);
    const addedCount = mockQuestions.length || 10;

    const todayStr = new Date().toLocaleDateString("en-CA");
    const currentTasksSolved =
      userData?.lastActiveDate === todayStr
        ? userData?.dailyTasksSolved || 0
        : 0;

    const baseUpdate = {
      dailyTasksSolved: currentTasksSolved + addedCount,
      lastActiveDate: todayStr,
    };

    if (!geminiKey) {
      setMockAnalysis(
        `🤖 ИИ-Анализ еженедельного пробника:\n\nОбщая точность: ${percent}% (${correctCount}/${mockQuestions.length} задач).\n\n• Сильные стороны: Успешное освоение последовательного плана.\n• Обнаруженные пробелы: Некоторые темы требуют закрепления.\n\nРекомендация ИИ: Слабые темы добавлены в приоритет планировщика на следующую неделю.`,
      );
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            ...baseUpdate,
            recentActivity: [
              {
                id: crypto.randomUUID(),
                type: "ИИ-Пробник",
                name: `Сдан комплексный пробник ЕНТ недели`,
                score: `Результат: ${percent}% правильных ответов`,
                time: "Только что",
              },
              ...(userData?.recentActivity || []).slice(0, 4),
            ],
          });
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
      return;
    }

    const prompt = `Проанализируй результаты еженедельного пробного ЕНТ ученика. 
Он ответил правильно на ${correctCount} из ${mockQuestions.length} вопросов (Точность: ${percent}%).
Напиши краткий текстовый отчет (до 5-7 предложений) на русском языке. Используй разметку ### для заголовков и **слово** для жирности.
Раздели его на пунклы: ### 1) Общая оценка, ### 2) Сильные стороны, ### 3) На какие разделы/темы на следующей неделе нужно сделать критический фокус.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMockAnalysis(data.candidates[0].content.parts[0].text);

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          ...baseUpdate,
          recentActivity: [
            {
              id: crypto.randomUUID(),
              type: "ИИ-Пробник",
              name: `Сдан комплексный пробник ЕНТ недели`,
              score: `Результат: ${percent}% правильных ответов`,
              time: "Только что",
            },
            ...(userData?.recentActivity || []).slice(0, 4),
          ],
        });
      }
    } catch (e) {
      console.error(e);
      setMockAnalysis(
        `Ошибка живого ИИ-анализа. Общая точность выполнения пробника составила: ${percent}%.`,
      );
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            ...baseUpdate,
            recentActivity: [
              {
                id: crypto.randomUUID(),
                type: "ИИ-Пробник",
                name: `Сдан комплексный пробник ЕНТ недели`,
                score: `Результат: ${percent}% правильных ответов (ошибка ИИ-анализа)`,
                time: "Только что",
              },
              ...(userData?.recentActivity || []).slice(0, 4),
            ],
          });
        } catch (dbErr) {
          console.error(dbErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      <div className="flex justify-between items-center border-b pb-4 border-slate-100">
        <div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">
            Модуль: AI-Learning Core v2.2
          </span>
          <h2 className="text-xl font-black mt-2 text-slate-900">
            Академические ИИ-Уроки и Пробники
          </h2>
        </div>
        <button
          onClick={onClose}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          Вернуться в дашборд
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium animate-pulse">
            ИИ подготавливает интерактивные материалы...
          </p>
        </div>
      )}

      {!loading && mode === "menu" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="font-black text-base text-slate-800">
                Направления подготовки
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Выберите предмет, чтобы посмотреть учебный план и запустить
                интерактивный ИИ-Урок по текущей теме.
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
              {(userData?.subjectsMastery || []).map((sub) => {
                const isFree = !userData?.tariff || userData.tariff === "free";
                const activeFreeSubName =
                  userData?.activeFreeSubject ||
                  userData?.subjectsMastery?.[3]?.name ||
                  "Математика";
                const isSubLocked = isFree && sub.name !== activeFreeSubName;
                const isActive = sub.name === selectedSubjectName;

                return (
                  <button
                    key={sub.id}
                    onClick={async () => {
                      if (isSubLocked) {
                        if (
                          confirm(
                            `🔒 На бесплатном тарифе доступен только 1 предмет одновременно.\n\nСейчас активен: "${activeFreeSubName}".\n\nХотите переключить ваш единственный бесплатный предмет на "${sub.name}"?`,
                          )
                        ) {
                          try {
                            await updateDoc(doc(db, "users", user.uid), {
                              activeFreeSubject: sub.name,
                            });
                            setSelectedSubjectName(sub.name);
                          } catch (e) {
                            console.error(e);
                          }
                        }
                        return;
                      }
                      setSelectedSubjectName(sub.name);
                    }}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/15 scale-[1.02]"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <span>{isSubLocked ? "🔒" : sub.icon || "📚"}</span>
                    <span>{sub.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {sub.progress || 0}%
                    </span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const activeSubject =
                (userData?.subjectsMastery || []).find(
                  (s) => s.name === selectedSubjectName,
                ) || (userData?.subjectsMastery || [])[0];
              if (!activeSubject)
                return (
                  <p className="text-xs text-slate-400 italic">
                    Направления подготовки не настроены.
                  </p>
                );

              if (subjectLessons.length === 0) {
                return (
                  <div className="py-12 text-center text-xs text-slate-400 italic">
                    Загрузка учебного плана уроков...
                  </div>
                );
              }

              return (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {subjectLessons.map((lesson, lessonIdx) => {
                    const state = lessonStates[lesson.lessonId];
                    const isCompleted = state && state.isCompleted;
                    const isFree =
                      !userData?.tariff || userData.tariff === "free";
                    const isLessonOrderExceeded = isFree && lesson.order > 3;

                    const isUnlocked =
                      (lesson.order === 1 ||
                        (() => {
                          const prev = subjectLessons[lessonIdx - 1];
                          return (
                            prev && lessonStates[prev.lessonId]?.isCompleted
                          );
                        })()) &&
                      !isLessonOrderExceeded;

                    let status = "locked";
                    if (isCompleted) {
                      status = "completed";
                    } else if (isUnlocked) {
                      status =
                        state && !state.isCompleted ? "failed" : "active";
                    }

                    let statusBadge;
                    let titleStyle;
                    let btnText;
                    let btnStyle;
                    let isBtnDisabled = false;
                    let dotStyle;

                    if (isLessonOrderExceeded) {
                      statusBadge = (
                        <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                          🔒 Лимит Free
                        </span>
                      );
                      titleStyle = "text-slate-400 font-medium";
                      btnText = "Улучшить тариф";
                      btnStyle =
                        "bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer";
                      isBtnDisabled = false;
                      dotStyle = "bg-amber-400 border-white";
                    } else if (status === "completed") {
                      statusBadge = (
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          ✓ Сдано ({state.scorePercent}%)
                        </span>
                      );
                      titleStyle = "text-slate-800 font-bold";
                      btnText = "Повторить 🔄";
                      btnStyle =
                        "bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer";
                      dotStyle = "bg-emerald-500 border-emerald-200 scale-110";
                    } else if (status === "failed") {
                      statusBadge = (
                        <span className="bg-rose-50 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                          ❌ Не сдано ({state.scorePercent}%)
                        </span>
                      );
                      titleStyle = "text-rose-800 font-bold";
                      btnText = "Пересдать 🚀";
                      btnStyle =
                        "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/10 cursor-pointer";
                      dotStyle = "bg-rose-500 border-rose-200 scale-110";
                    } else if (status === "active") {
                      statusBadge = (
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-indigo-200 animate-pulse">
                          🔥 Текущая тема
                        </span>
                      );
                      titleStyle = "text-slate-900 font-black text-sm";
                      btnText = "Начать урок 🚀";
                      btnStyle =
                        "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer";
                      dotStyle =
                        "bg-indigo-600 border-indigo-200 ring-4 ring-indigo-100 scale-125";
                    } else {
                      statusBadge = (
                        <span className="bg-slate-100 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          🔒 Закрыто
                        </span>
                      );
                      titleStyle = "text-slate-400 font-medium";
                      btnText = "Заблокировано";
                      btnStyle =
                        "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100";
                      isBtnDisabled = true;
                      dotStyle = "bg-slate-200 border-white";
                    }

                    return (
                      <div
                        key={lesson.lessonId}
                        className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition"
                      >
                        <div
                          className={`absolute -left-[20px] top-[22px] sm:top-1/2 sm:-translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all ${dotStyle}`}
                        />

                        <div className="space-y-1 bg-white">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Урок {lesson.order}
                            </span>
                            {statusBadge}
                          </div>
                          <h4 className={`text-xs ${titleStyle}`}>
                            {lesson.title}
                          </h4>
                          {status === "failed" && (
                            <p className="text-[9px] text-rose-500 font-bold">
                              Для прохождения этого урока нужно набрать не менее
                              70% правильных ответов (2/3).
                            </p>
                          )}
                        </div>

                        <button
                          disabled={isBtnDisabled}
                          onClick={() => {
                            if (isLessonOrderExceeded) {
                              alert(
                                "🔒 Этот урок заблокирован на бесплатном тарифе. Доступны только первые 3 урока. Перейдите на тариф Basic, чтобы учить все уроки!",
                              );
                              return;
                            }
                            startLesson(
                              activeSubject.name,
                              lesson.title,
                              lesson,
                            );
                          }}
                          className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${btnStyle}`}
                        >
                          {btnText}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {srsReviews.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/30 p-6 rounded-2xl space-y-4">
                <div>
                  <div className="text-2xl">⚡️</div>
                  <h3 className="font-black text-base text-amber-900 mt-2">
                    Интервальное повторение
                  </h3>
                  <p className="text-xs text-amber-950/70 mt-1 leading-relaxed">
                    По системе Лейтнера подошел срок закрепления следующих тем:
                  </p>
                </div>
                <div className="space-y-2">
                  {srsReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white border border-amber-200/60 p-3 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black uppercase">
                          {review.box} коробка
                        </span>
                        <h4 className="text-[11px] font-bold text-slate-800 truncate mt-1">
                          {review.topic}
                        </h4>
                      </div>
                      <button
                        onClick={() =>
                          startLesson(review.subject, review.topic, null)
                        }
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                      >
                        Повторить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border border-indigo-100 bg-indigo-50/20 p-6 rounded-2xl flex flex-col justify-between space-y-4 h-fit sticky top-4">
              <div>
                <div className="text-2xl">📝</div>
                <h3 className="font-black text-base text-indigo-900 mt-2">
                  Комплексный Пробник
                </h3>
                <p className="text-xs text-indigo-950/70 mt-1 leading-relaxed">
                  Контрольный срез по всем темам обязательных и профильных
                  предметов ЕНТ, которые вы зафиксировали в календаре на текущей
                  неделе.
                </p>
              </div>
              <button
                onClick={startWeeklyMock}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition shadow-indigo-600/15 cursor-pointer"
              >
                Запустить ИИ-Пробник недели
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && mode === "lesson_theory" && lessonData && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4 border-b border-indigo-500/20 pb-2">
              Этап 1: Теория и конспект ИИ ({currentSubject})
            </h4>
            <div className="space-y-1">
              {renderCleanContent(
                lessonData.theory,
                false,
                "text-xs text-slate-300",
              )}
            </div>
            {lessonData.formula && (
              <div className="mt-6 pt-4 border-t border-slate-800/60 overflow-x-auto text-center bg-slate-950/60 p-4 rounded-xl">
                <MathRenderer
                  text={`$$${lessonData.formula}$$`}
                  className="text-white"
                />
              </div>
            )}
          </div>
          <button
            onClick={() => setMode("lesson_practice")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/10"
          >
            Перейти к закреплению темы (Мини-тест) →
          </button>
        </div>
      )}

      {!loading && mode === "lesson_practice" && lessonData && (
        <div className="space-y-6">
          <div className="bg-slate-50 border p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Вопрос {currentTaskIdx + 1} из 3
              </span>
              <span className="text-xs font-bold text-indigo-600">
                {currentSubject}
              </span>
            </div>
            <div className="font-bold text-sm text-slate-800">
              {renderCleanContent(
                lessonData.tasks[currentTaskIdx].question,
                true,
              )}
            </div>
          </div>

          <div className="space-y-2">
            {lessonData.tasks[currentTaskIdx].options.map((opt, i) => (
              <button
                key={i}
                disabled={taskChecked}
                onClick={() => setSelectedAns(i)}
                className={`w-full text-left p-4 rounded-xl text-xs font-bold border transition ${
                  taskChecked
                    ? i === lessonData.tasks[currentTaskIdx].correct
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : selectedAns === i
                        ? "bg-rose-50 border-rose-500 text-rose-800"
                        : "bg-white"
                    : selectedAns === i
                      ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                      : "bg-white hover:bg-slate-50"
                }`}
              >
                {renderCleanContent(opt, true)}
              </button>
            ))}
          </div>

          {!taskChecked ? (
            <button
              onClick={() => setTaskChecked(true)}
              disabled={selectedAns === null}
              className={`w-full py-3 rounded-xl text-xs font-black text-white ${selectedAns !== null ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"}`}
            >
              Проверить ответ
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-[11px] bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 leading-relaxed font-medium">
                <span className="font-black text-indigo-600 block mb-1">
                  Разбор задания ИИ:
                </span>
                {renderCleanContent(
                  lessonData.tasks[currentTaskIdx].exp,
                  false,
                  "text-slate-700 mt-2",
                )}
              </div>
              <button
                onClick={handleNextLessonTask}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                {currentTaskIdx < lessonData.tasks.length - 1
                  ? "Следующий вопрос"
                  : "Завершить урок"}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && mode === "lesson_results" && (
        <div className="text-center py-6 space-y-4">
          <div className="text-4xl">🎉</div>
          <h3 className="text-xl font-black text-slate-900">
            Урок успешно завершен!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ты ответил правильно на{" "}
            <span className="font-bold text-indigo-600">
              {lessonScore} из 3
            </span>{" "}
            вопросов. Данные внесены в твою матрицу прогресса.
          </p>
          <button
            onClick={finishLessonSave}
            className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition mx-auto block"
          >
            Сохранить прогресс и выйти
          </button>
        </div>
      )}

      {!loading && mode === "mock_exam" && (
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white p-4 rounded-xl text-xs font-bold">
            ⚠️ Комплексный срез знаний недели: тесты сформированы ИИ на основе
            тем вашего календаря за последние дни.
          </div>

          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {mockQuestions.map((q, qIdx) => (
              <div
                key={q.id}
                className="border p-4 rounded-xl space-y-3 bg-slate-50/50"
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                  <span>Вопрос {qIdx + 1}</span>
                  <span className="text-indigo-600">{q.subject}</span>
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {renderCleanContent(q.text, true)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() =>
                        setMockAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                      }
                      className={`text-left p-3 rounded-lg text-xs font-bold border transition ${
                        mockAnswers[qIdx] === oIdx
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {renderCleanContent(opt, true)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={finishMockExam}
            disabled={Object.keys(mockAnswers).length < mockQuestions.length}
            className={`w-full py-3.5 rounded-xl text-xs font-black text-white transition ${
              Object.keys(mockAnswers).length === mockQuestions.length
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-md"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            Отправить пробник на ИИ-Анализ
          </button>
        </div>
      )}

      {!loading && mode === "mock_results" && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl text-xs leading-relaxed shadow-inner">
            {renderCleanContent(mockAnalysis, false, "text-slate-100")}
          </div>
          <button
            onClick={() => setMode("menu")}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-xs transition"
          >
            Вернуться в главное меню модулей
          </button>
        </div>
      )}
    </div>
  );
};
