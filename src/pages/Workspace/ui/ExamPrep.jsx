import { useState } from "react";

export const ExamPrep = ({ onStartPractice, userName }) => {
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  // Кастомные русскоязычные данные для каждого предмета
  const subjectData = {
    Math: {
      title: "Математика",
      grade: "11 класс",
      onTrack: "82% по графику",
      onTrackPercent: 82,
      studyPlan: [
        { id: "math-sp-1", name: "Основы алгебры", status: "completed", desc: "Завершено 12 марта" },
        { id: "math-sp-2", name: "Тригонометрические функции", status: "in_progress", desc: "В процессе • Срок завтра" },
        { id: "math-sp-3", name: "Дифференциальное исчисление", status: "upcoming", desc: "Предстоит • Начало в понедельник" },
      ],
      courses: [
        {
          id: "math-c-1",
          title: "Алгебраические выражения",
          progress: 65,
          students: ["АД", "МИ", "КЛ"],
          hasTime: false,
        },
        {
          id: "math-c-2",
          title: "Геометрия и векторы",
          progress: 32,
          students: [],
          hasTime: true,
          timeEst: "4ч осталось",
        }
      ],
      recommendations: [
        {
          id: "math-r-1",
          title: "Комплексные числа",
          desc: "Слабое понимание темы",
          type: "warning",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-lg">
              ⚠️
            </div>
          )
        },
        {
          id: "math-r-2",
          title: "Статическая механика",
          desc: "40% веса экзамена",
          type: "weight",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-lg">
              ✨
            </div>
          )
        },
        {
          id: "math-r-3",
          title: "Статистика данных",
          desc: "Следующий шаг обучения",
          type: "milestone",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-lg">
              📈
            </div>
          )
        }
      ],
      aiInsights: {
        predictiveGrade: "A-",
        masteryLevel: "92%",
        practiceSessions: 14,
        topicToFocus: "Производные",
        text: "На основе 14 недавних практических занятий наш ИИ прогнозирует 92% уровень освоения материала для предстоящего промежуточного экзамена. Укрепите свои знания по теме 'Производные', чтобы выйти на стабильную оценку A."
      },
      fullTimeline: [
        { name: "Основы алгебры", status: "completed", date: "12 марта" },
        { name: "Уравнения и неравенства", status: "completed", date: "20 марта" },
        { name: "Тригонометрические функции", status: "in_progress", date: "Срок завтра" },
        { name: "Дифференциальное исчисление", status: "upcoming", date: "Начало в понедельник" },
        { name: "Интегрирование", status: "upcoming", date: "10 апреля" },
        { name: "Теория вероятностей и комбинаторика", status: "upcoming", date: "28 апреля" },
        { name: "Векторы и геометрия", status: "upcoming", date: "15 мая" }
      ]
    },
    Biology: {
      title: "Биология",
      grade: "11 класс",
      onTrack: "91% по графику",
      onTrackPercent: 91,
      studyPlan: [
        { id: "bio-sp-1", name: "Структура клетки и органоиды", status: "completed", desc: "Завершено 5 марта" },
        { id: "bio-sp-2", name: "Фотосинтез и дыхание", status: "in_progress", desc: "В процессе • Срок через 2 дня" },
        { id: "bio-sp-3", name: "Генетика и наследование", status: "upcoming", desc: "Предстоит • Начало на след. неделе" },
      ],
      courses: [
        {
          id: "bio-c-1",
          title: "Деление клетки и митоз",
          progress: 88,
          students: ["ОП", "ВК"],
          hasTime: false,
        },
        {
          id: "bio-c-2",
          title: "Физиология растений",
          progress: 15,
          students: [],
          hasTime: true,
          timeEst: "6ч осталось",
        }
      ],
      recommendations: [
        {
          id: "bio-r-1",
          title: "Репликация ДНК",
          desc: "Слабое понимание темы",
          type: "warning",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-lg">
              ⚠️
            </div>
          )
        },
        {
          id: "bio-r-2",
          title: "Анатомия человека",
          desc: "50% веса экзамена",
          type: "weight",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-lg">
              🧬
            </div>
          )
        },
        {
          id: "bio-r-3",
          title: "Экология и экосистемы",
          desc: "Следующий шаг обучения",
          type: "milestone",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-lg">
              🌱
            </div>
          )
        }
      ],
      aiInsights: {
        predictiveGrade: "B+",
        masteryLevel: "84%",
        practiceSessions: 8,
        topicToFocus: "Репликация ДНК",
        text: "На основе 8 недавних практических занятий наш ИИ прогнозирует 84% уровень освоения материала. Повторите репликацию ДНК и синтез белка, чтобы повысить вашу оценку до A."
      },
      fullTimeline: [
        { name: "Структура клетки и органоиды", status: "completed", date: "5 марта" },
        { name: "Транспорт через мембрану клетки", status: "completed", date: "10 марта" },
        { name: "Фотосинтез и дыхание", status: "in_progress", date: "Срок 2 дня" },
        { name: "Генетика и наследование", status: "upcoming", date: "След. неделя" },
        { name: "Эволюционная биология", status: "upcoming", date: "20 апреля" },
        { name: "Экология и экосистемы", status: "upcoming", date: "5 мая" }
      ]
    },
    Physics: {
      title: "Физика",
      grade: "11 класс",
      onTrack: "74% по графику",
      onTrackPercent: 74,
      studyPlan: [
        { id: "phys-sp-1", name: "Классическая механика", status: "completed", desc: "Завершено 18 февраля" },
        { id: "phys-sp-2", name: "Термодинамика и теплота", status: "in_progress", desc: "В процессе • Срок через 3 дня" },
        { id: "phys-sp-3", name: "Электромагнетизм", status: "upcoming", desc: "Предстоит • Начало в пятницу" },
      ],
      courses: [
        {
          id: "phys-c-1",
          title: "Кинематика и динамика",
          progress: 95,
          students: ["АД", "МИ", "ОП", "КЛ"],
          hasTime: false,
        },
        {
          id: "phys-c-2",
          title: "Законы термодинамики",
          progress: 24,
          students: [],
          hasTime: true,
          timeEst: "8ч осталось",
        }
      ],
      recommendations: [
        {
          id: "phys-r-1",
          title: "Квантовая механика",
          desc: "Слабое понимание темы",
          type: "warning",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-lg">
              ⚠️
            </div>
          )
        },
        {
          id: "phys-r-2",
          title: "Волновая оптика",
          desc: "30% веса экзамена",
          type: "weight",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-lg">
              ⚡
            </div>
          )
        },
        {
          id: "phys-r-3",
          title: "Ядерная физика",
          desc: "Следующий шаг обучения",
          type: "milestone",
          icon: (
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-lg">
              ⚛️
            </div>
          )
        }
      ],
      aiInsights: {
        predictiveGrade: "A",
        masteryLevel: "96%",
        practiceSessions: 20,
        topicToFocus: "Квантовая механика",
        text: "На основе 20 недавних практических занятий наш ИИ прогнозирует 96% уровень освоения материала. Вы отлично справляетесь! Закрепите формулы квантовой механики, чтобы зафиксировать балл A."
      },
      fullTimeline: [
        { name: "Классическая механика", status: "completed", date: "18 февраля" },
        { name: "Волны и звук", status: "completed", date: "28 февраля" },
        { name: "Термодинамика и теплота", status: "in_progress", date: "Срок 3 дня" },
        { name: "Электромагнетизм", status: "upcoming", date: "Пятница" },
        { name: "Волновая оптика", status: "upcoming", date: "18 апреля" },
        { name: "Квантовая механика", status: "upcoming", date: "10 мая" },
        { name: "Ядерная физика", status: "upcoming", date: "24 мая" }
      ]
    }
  };

  const currentData = subjectData[selectedSubject];

  const handlePracticeClick = (topic) => {
    if (onStartPractice) {
      onStartPractice(topic, selectedSubject);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* SHIELD HEADER (SEARCH & PROFILE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Поиск предметов или тем..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-sm"
          />
        </div>

        {/* Action icons & Profile */}
        <div className="flex items-center gap-4 justify-end">
          <button 
            onClick={() => setShowNotification(!showNotification)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 relative transition shadow-sm"
          >
            <span>🔔</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600"></span>
          </button>

          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition shadow-sm">
            <span>🕒</span>
          </button>

          <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-[10px]">
              {userName ? userName[0].toUpperCase() : "У"}
            </div>
            <span className="text-xs font-bold text-slate-700">{userName || "Ученик"}</span>
          </div>
        </div>
      </div>

      {/* NOTIFICATION BOX (MOCK) */}
      {showNotification && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-800 flex justify-between items-center animate-fade-in shadow-sm animate-fade-in">
          <span>🔔 <strong>Новое уведомление:</strong> ИИ обновил ваши персональные рекомендации на основе последних решений!</span>
          <button onClick={() => setShowNotification(false)} className="font-bold text-indigo-600 hover:underline ml-4">Закрыть</button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Подготовка к экзаменам</h1>
        <p className="text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">
          Осваивайте учебную программу с помощью траекторий обучения на базе ИИ и прогнозирования результатов выпускных экзаменов 11 класса.
        </p>
      </div>

      {/* SUBJECT TOGGLES */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/40">
        <button
          onClick={() => setSelectedSubject("Math")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSubject === "Math"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-slate-500 hover:bg-white/50"
          }`}
        >
          Математика
        </button>
        <button
          onClick={() => setSelectedSubject("Biology")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSubject === "Biology"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-slate-500 hover:bg-white/50"
          }`}
        >
          Биология
        </button>
        <button
          onClick={() => setSelectedSubject("Physics")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSubject === "Physics"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-slate-500 hover:bg-white/50"
          }`}
        >
          Физика
        </button>
      </div>

      {/* MAIN CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: STUDY PLAN (4/12 width) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-full min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 text-base">План обучения</h3>
              <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold px-2.5 py-1 rounded-lg">
                {currentData.onTrack}
              </span>
            </div>

            {/* TIMELINE */}
            <div className="relative pl-8 space-y-8">
              {/* Vertical line indicator */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-200"></div>

              {currentData.studyPlan.map((item) => {
                const isCompleted = item.status === "completed";
                const isInProgress = item.status === "in_progress";

                return (
                  <div key={item.id} className="relative group">
                    {/* Circle icon */}
                    <div className="absolute -left-[29px] top-0.5 flex items-center justify-center">
                      {isCompleted ? (
                        <div className="w-[23px] h-[23px] rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold shadow-md shadow-indigo-100 border border-indigo-600">
                          ✓
                        </div>
                      ) : isInProgress ? (
                        <div className="w-[23px] h-[23px] rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-md">
                          <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        </div>
                      ) : (
                        <div className="w-[23px] h-[23px] rounded-full bg-white border-2 border-slate-200 flex items-center justify-center"></div>
                      )}
                    </div>

                    {/* Text content */}
                    <div>
                      <h4 className={`text-sm font-bold transition-colors ${isInProgress ? "text-indigo-600" : "text-slate-800"}`}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setIsTimelineOpen(true)}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-2xl text-xs font-bold shadow-sm transition-all duration-200 mt-8"
          >
            Полная программа
          </button>
        </div>

        {/* RIGHT COLUMN: COURSES & RECOMMENDATIONS (8/12 width) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* MIDDLE: TWO COURSE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentData.courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[200px]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-100 border border-slate-200/30 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase">
                      {currentData.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{course.progress}%</span>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mt-3">{course.title}</h3>

                  {/* PROGRESS BAR */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                  {/* Avatars or clock estimate */}
                  {course.hasTime ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <span>🕒</span>
                      <span>{course.timeEst}</span>
                    </div>
                  ) : (
                    <div className="flex -space-x-2 overflow-hidden">
                      {course.students.map((student, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white uppercase shadow-sm ${
                            i === 0
                              ? "bg-indigo-500"
                              : i === 1
                              ? "bg-purple-500"
                              : "bg-teal-500"
                          }`}
                        >
                          {student}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handlePracticeClick(course.title)}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 hover:shadow-indigo-100 transition-all"
                  >
                    Практика
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* BOTTOM-RIGHT: HIGH-YIELD RECOMMENDATIONS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-base">Рекомендации ИИ</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
                <span>Почему эти?</span>
                <span className="w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold">i</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentData.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handlePracticeClick(rec.title)}
                  className="bg-white border border-slate-200/60 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-100 hover:bg-indigo-50/5 cursor-pointer transition-all shadow-sm"
                >
                  {rec.icon}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{rec.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{rec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* HERO BANNER: AI INSIGHTS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-8 md:p-10 shadow-xl border border-slate-800/40">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        {/* Background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-fit">
            ИИ-Аналитика
          </span>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Прогнозируемая оценка: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">{currentData.aiInsights.predictiveGrade}</span>
          </h2>

          <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-2xl">
            {currentData.aiInsights.text}
          </p>

          <button
            onClick={() => handlePracticeClick(currentData.aiInsights.topicToFocus)}
            className="bg-white text-indigo-950 hover:bg-slate-50 active:scale-95 px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:shadow-indigo-500/5 transition-all duration-150 inline-block !mt-6"
          >
            Начать тренировку
          </button>
        </div>
      </div>

      {/* FULL TIMELINE MODAL */}
      {isTimelineOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Программа обучения: {currentData.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Полная траектория подготовки к экзамену</p>
              </div>
              <button
                onClick={() => setIsTimelineOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-2 pr-1">
              {currentData.fullTimeline.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {item.status === "completed" ? "✅" : item.status === "in_progress" ? "⏳" : "🔒"}
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${item.status === "in_progress" ? "text-indigo-600 font-extrabold" : "text-slate-800"}`}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{item.status === "completed" ? "Завершено" : item.status === "in_progress" ? "В процессе" : "Будет открыто"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsTimelineOpen(false)}
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl text-xs font-bold shadow-md hover:bg-indigo-700 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
