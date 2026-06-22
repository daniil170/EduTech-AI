import { useState, useEffect } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  writeBatch,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { MathRenderer } from "../../../shared/ui/MathRenderer";
import { getTopicsForSubject } from "../../../shared/data/curriculum";
import { generateAiPromptForSimilarTask } from "../../../shared/data/entBase";
import "katex/dist/katex.min.css";

export const CeoPanel = ({ user, studentStats, geminiKey }) => {
  const [ceoSubTab, setCeoSubTab] = useState("moderation");
  const [unapprovedQuestions, setUnapprovedQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [simulatorLogs, setSimulatorLogs] = useState([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [explorerSubject, setExplorerSubject] = useState("");
  const [explorerTopic, setExplorerTopic] = useState("");

  // Real-time listener for questionBank (only when CEO tab is active/mounted)
  useEffect(() => {
    if (!user) return;
    const isFounder = studentStats?.role === "founder" || user?.email?.toLowerCase() === "daniilivakin30@gmail.com";
    if (!isFounder) return;

    const unsubUnapproved = onSnapshot(
      query(collection(db, "questionBank"), where("isApproved", "==", false)),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUnapprovedQuestions(list);
      },
      (err) => console.error("Error loading unapproved questions:", err)
    );

    const unsubAll = onSnapshot(
      collection(db, "questionBank"),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllQuestions(list);
      },
      (err) => console.error("Error loading all questions:", err)
    );

    return () => {
      unsubUnapproved();
      unsubAll();
    };
  }, [user, studentStats]);

  const runPipelineSimulation = async () => {
    if (simulationRunning) return;
    setSimulationRunning(true);
    setSimulatorLogs([]);

    const log = (msg) => {
      setSimulatorLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    // Step 1: Scheduler checks
    log("⏰ [Cloud Scheduler] Триггер по расписанию: запуск ночной проверки наполненности банка вопросов...");
    
    await new Promise(r => setTimeout(r, 800));
    
    // Scan topics
    const subjectsList = ["Математика", "История Казахстана", "Математическая грамотность"];
    const topicCounts = {};
    subjectsList.forEach(sub => {
      getTopicsForSubject(sub).forEach(topic => {
        topicCounts[`${sub}::${topic}`] = 0;
      });
    });

    allQuestions.forEach(q => {
      if (q.isApproved) {
        const key = `${q.subject}::${q.topic}`;
        if (topicCounts[key] !== undefined) {
          topicCounts[key]++;
        }
      }
    });

    // Find the topic with the lowest count
    let targetSubject = "Математика";
    let targetTopic = "Тригонометрия";
    let minCount = 999;
    
    Object.entries(topicCounts).forEach(([key, count]) => {
      if (count < minCount) {
        minCount = count;
        const [sub, topic] = key.split("::");
        targetSubject = sub;
        targetTopic = topic;
      }
    });

    log(`🔍 [Cloud Scheduler] Сканирование завершено. Дефицитная тема: "${targetSubject} -> ${targetTopic}" (Количество одобренных в Firestore: ${minCount} < 20)`);
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 2: Cloud Tasks Queue
    log(`📥 [Cloud Tasks] Создана асинхронная задача пополнения банка: task_replenish_${Date.now().toString().slice(-6)}`);
    log(`📥 [Cloud Tasks] Задача добавлена в очередь 'question-generation-queue'`);
    log(`📥 [Cloud Tasks] Передача управления воркеру Cloud Run...`);
    
    await new Promise(r => setTimeout(r, 1000));

    // Step 3: Cloud Run Job
    log(`⚙️ [Cloud Run Job] Запуск Docker-контейнера 'gcr.io/edutrack/generator:latest'...`);
    log(`⚙️ [Cloud Run Job] Переменные окружения: SUBJECT="${targetSubject}", TOPIC="${targetTopic}", LIMIT=1`);
    
    await new Promise(r => setTimeout(r, 800));

    // Step 4: Gemini Call
    log(`🤖 [Gemini API] Вызов Gemini 2.5 Flash с response_schema (Structured JSON Output)...`);
    
    let generatedObj = null;
    if (geminiKey) {
      log(`🤖 [Gemini API] Отправка запроса к модели для генерации по теме: ${targetTopic}...`);
      const prompt = generateAiPromptForSimilarTask(targetSubject, targetTopic, "medium");
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
        if (!response.ok) throw new Error("Gemini API call failed");
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
        generatedObj = JSON.parse(text);
        log(`🤖 [Gemini API] Получен структурированный JSON ответ от модели.`);
      } catch {
        log(`⚠️ [Gemini API] Ошибка живого ИИ-запроса, переключение на локальный резервный генератор.`);
      }
    }

    if (!generatedObj) {
      // Use fallback question
      generatedObj = {
        question: `Практическая задача по теме "${targetTopic}" (${targetSubject}): найдите верное решение или значение выражения.`,
        formula: "x^2 - 5x + 6 = 0",
        options: [
          "A) x = 2; x = 3",
          "B) x = 1; x = 5",
          "C) Корней нет",
          "D) x = 0"
        ],
        correctIndex: 0,
        explanation: "Разбор: Разложим на множители: $(x-2)(x-3) = 0$, откуда получаем корни $x_1 = 2$ и $x_2 = 3$."
      };
      await new Promise(r => setTimeout(r, 1200));
    }

    // Step 5: Validation
    log(`🛡️ [Zod Validator] Запуск проверки схемы ответа модели (Zod Schema Validation)...`);
    await new Promise(r => setTimeout(r, 600));

    try {
      if (!generatedObj.question || typeof generatedObj.question !== "string") throw new Error("Missing 'question' field");
      if (!generatedObj.options || !Array.isArray(generatedObj.options) || generatedObj.options.length !== 4) throw new Error("Invalid 'options' field (must contain 4 choices)");
      
      let correctIndexVal = generatedObj.correctIndex;
      if (correctIndexVal === undefined && generatedObj.correct !== undefined) {
        correctIndexVal = generatedObj.correct;
      }
      if (correctIndexVal === undefined || typeof correctIndexVal !== "number") throw new Error("Invalid 'correctIndex' field");
      
      log(`🛡️ [Zod Validator] Спецификация пройдена: correctIndex=${correctIndexVal}, optionsCount=4.`);
      
      // Step 6: Commit
      const qId = `gen_${crypto.randomUUID().slice(0, 8)}`;
      log(`💾 [Firestore/Storage] Запись метаданных в Firestore: questionBank/${qId} (isApproved: false)`);
      log(`💾 [Firestore/Storage] Симуляция загрузки полного JSON-файла в Cloud Storage по пути: gs://bank/${targetSubject}/${targetTopic}/${qId}.json`.toLowerCase());
      
      await setDoc(doc(db, "questionBank", qId), {
        subject: targetSubject,
        topic: targetTopic,
        difficulty: "medium",
        storagePath: `gs://bank/${targetSubject}/${targetTopic}/${qId}.json`.toLowerCase(),
        isApproved: false,
        timesShown: 0,
        createdAt: new Date().toISOString(),
        storageMockContent: {
          question: generatedObj.question,
          options: generatedObj.options,
          correctIndex: correctIndexVal,
          explanation: generatedObj.explanation || "",
          difficulty: "medium",
          topic: targetTopic
        }
      });

      log(`✓ [Пайплайн завершен] Вопрос успешно сохранен в банк и ожидает модерации.`);
    } catch (err) {
      log(`❌ [Ошибка валидации Zod] Сгенерированный JSON некорректен: ${err.message}`);
    } finally {
      setSimulationRunning(false);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`Одобрить все ${unapprovedQuestions.length} вопросов?`)) return;
    const batch = writeBatch(db);
    unapprovedQuestions.forEach(q => {
      batch.update(doc(db, "questionBank", q.id), { isApproved: true });
    });
    await batch.commit();
    alert("Все вопросы успешно одобрены!");
  };

  const handleApproveQuestion = async (qId) => {
    await updateDoc(doc(db, "questionBank", qId), { isApproved: true });
  };

  const handleRejectQuestion = async (qId) => {
    if (!confirm("Удалить этот вопрос?")) return;
    await deleteDoc(doc(db, "questionBank", qId));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h1 className="text-2xl font-black text-slate-900">
              Панель Управления CEO & Founder
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Администрирование контента, модерация генераций и симуляция фоновых GCP микросервисов.
          </p>
        </div>
      </div>

      {/* Subtabs Selection */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "moderation", label: `Модерация вопросов (${unapprovedQuestions.length})`, icon: "⚖️" },
          { id: "simulator", label: "Симулятор пайплайна (GCP)", icon: "⚙️" },
          { id: "explorer", label: `Исследователь банка (${allQuestions.length})`, icon: "📁" }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setCeoSubTab(subTab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ceoSubTab === subTab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{subTab.icon}</span>
            <span>{subTab.label}</span>
          </button>
        ))}
      </div>

      {/* Subtab 1: Moderation */}
      {ceoSubTab === "moderation" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-800">Очередь модерации эксперта</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Вопросы, добавленные генератором со статусом isApproved=false. Только после одобрения они попадут ученикам.</p>
            </div>
            {unapprovedQuestions.length > 0 && (
              <button
                onClick={handleApproveAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition shadow-md shadow-emerald-600/15 cursor-pointer"
              >
                ✓ Одобрить все
              </button>
            )}
          </div>

          {unapprovedQuestions.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/40 rounded-3xl p-12 text-center text-slate-400 font-medium">
              ☕ Очередь пуста. Вопросы для модерации отсутствуют. Запустите генератор в Симуляторе пайплайна!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {unapprovedQuestions.map(q => {
                const content = q.storageMockContent;
                return (
                  <div key={q.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-3 border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                          {q.subject}
                        </span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                          {q.topic}
                        </span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded uppercase">
                          {q.difficulty}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">Path: {q.storagePath}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-xs font-black text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <MathRenderer text={content.question} inline />
                        {content.formula && (
                          <div className="p-3 bg-slate-900 text-center rounded-xl my-2 overflow-x-auto">
                            <MathRenderer text={`$$${content.formula}$$`} className="text-white text-center" />
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {content.options.map((opt, oIdx) => (
                          <div 
                            key={oIdx} 
                            className={`p-3 rounded-xl border text-xs leading-normal font-semibold ${
                              oIdx === content.correctIndex 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" 
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] leading-relaxed text-slate-600">
                        <strong className="font-bold text-slate-700 block mb-1">Разбор (explanation):</strong>
                        <MathRenderer text={content.explanation} />
                      </div>
                    </div>

                    <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100 font-sans">
                      <button
                        onClick={() => handleRejectQuestion(q.id)}
                        className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        ✕ Отклонить
                      </button>
                      <button
                        onClick={() => handleApproveQuestion(q.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2 rounded-xl transition shadow-md shadow-emerald-600/15 cursor-pointer"
                      >
                        ✓ Одобрить вопрос
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Pipeline Simulator */}
      {ceoSubTab === "simulator" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Visual Scheme & Controls */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200/60 p-5 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Пайплайн архитектуры</h3>
              
              {/* Interactive Diagram */}
              <div className="space-y-4 relative pl-3 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {[
                  { id: "scheduler", label: "Cloud Scheduler", desc: "Cron: 0 0 * * * ежедневно", icon: "⏰" },
                  { id: "tasks", label: "Cloud Tasks Queue", desc: "Очередь задач пополнения", icon: "📥" },
                  { id: "run", label: "Cloud Run Job", desc: "Контейнер микросервиса", icon: "⚙️" },
                  { id: "gemini", label: "Gemini Structured API", desc: "Генерация по схеме JSON", icon: "🤖" },
                  { id: "zod", label: "Zod Schema Validator", desc: "Проверка структуры", icon: "🛡️" },
                  { id: "firestore", label: "Firestore Write", desc: "Сохранение с isApproved=false", icon: "💾" }
                ].map((node) => (
                  <div key={node.id} className="relative flex items-start gap-3">
                    {/* Dot indicator */}
                    <div className="absolute -left-[14px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border-2 border-white ring-2 ring-slate-100"></div>
                    <span className="text-sm shrink-0">{node.icon}</span>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-700 leading-tight">{node.label}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">{node.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={runPipelineSimulation}
                disabled={simulationRunning}
                className={`w-full py-3.5 rounded-2xl text-xs font-black transition shadow-md ${
                  simulationRunning 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/15 cursor-pointer"
                }`}
              >
                {simulationRunning ? "Выполняется пайплайн..." : "Запустить генератор ИИ"}
              </button>
            </div>
          </div>

          {/* Right Column: Console/Logs */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl h-[420px] flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                </div>
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">GCP Job Terminal</span>
              </div>
              
              {/* Logs Screen */}
              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-2 py-4 custom-scrollbar leading-relaxed">
                {simulatorLogs.length === 0 ? (
                  <div className="text-slate-600 italic">
                    $ systemctl start edutrack-pipeline.service
                    <br />
                    Ожидание запуска. Нажмите левую кнопку для запуска ночной генерации вопросов.
                  </div>
                ) : (
                  simulatorLogs.map((logLine, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">{logLine}</div>
                  ))
                )}
                {simulationRunning && (
                  <div className="text-slate-500 animate-pulse">▋ Загрузка данных...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Explorer */}
      {ceoSubTab === "explorer" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/60 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">Проводник базы данных банка</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Поиск и инспекция всех вопросов банка (как одобренных, так и не одобренных).</p>
            </div>

            {/* Filter Inputs */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={explorerSubject}
                onChange={(e) => {
                  setExplorerSubject(e.target.value);
                  setExplorerTopic("");
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="">Все предметы</option>
                {["Математика", "История Казахстана", "Математическая грамотность"].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              <select
                value={explorerTopic}
                onChange={(e) => setExplorerTopic(e.target.value)}
                disabled={!explorerSubject}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none disabled:opacity-50"
              >
                <option value="">Все темы</option>
                {explorerSubject && getTopicsForSubject(explorerSubject).map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of questions */}
          {(() => {
            const filtered = allQuestions.filter(q => {
              if (explorerSubject && q.subject !== explorerSubject) return false;
              if (explorerTopic && q.topic !== explorerTopic) return false;
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-slate-50 border border-slate-200/40 rounded-3xl p-12 text-center text-slate-400 font-medium">
                  🔎 По данным фильтрам вопросов не найдено.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 gap-4 font-sans">
                {filtered.map(q => {
                  const content = q.storageMockContent;
                  return (
                    <div key={q.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b pb-2.5 border-slate-100 text-[10px] flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap font-bold">
                          <span className="text-slate-500">{q.subject}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-indigo-600">{q.topic}</span>
                          <span className="text-slate-300">•</span>
                          <span className="uppercase text-amber-600">{q.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black tracking-wide ${
                            q.isApproved 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {q.isApproved ? "✓ Одобрен" : "⏳ Ожидает модерации"}
                          </span>
                          <span className="font-mono text-slate-400">Показов: {q.timesShown || 0}</span>
                        </div>
                      </div>
                      <div className="text-xs leading-relaxed text-slate-800">
                        <MathRenderer text={content.question} inline />
                        {content.formula && (
                          <div className="p-3 bg-slate-900 text-center rounded-xl my-2 overflow-x-auto font-sans">
                            <MathRenderer text={`$$${content.formula}$$`} className="text-white text-center" />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {content.options.map((opt, oIdx) => (
                          <div 
                            key={oIdx} 
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold ${
                              oIdx === content.correctIndex 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" 
                                : "bg-white border-slate-200 text-slate-500"
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
