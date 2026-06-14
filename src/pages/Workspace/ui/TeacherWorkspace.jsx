import { useState, useEffect } from "react";
import { auth, db } from "../../../app/providers/Firebase/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";

const generateClassCode = (subject) => {
  const prefix = subject === "Math" ? "МАТ" : subject === "Biology" ? "БИО" : "ФИЗ";
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
};

export const TeacherWorkspace = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Преподаватель";

  // Табы: "dashboard", "classes", "create_exam", "results"
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Состояния БД
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);

  // Формы
  const [newClassName, setNewClassName] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("Math");
  const [examQuestions, setExamQuestions] = useState(10);
  const [examTime, setExamTime] = useState(45);
  const [selectedClassCode, setSelectedClassCode] = useState("");

  const [loading, setLoading] = useState(true);

  // Подгрузка данных в реальном времени из Firestore
  useEffect(() => {
    if (!user) return;

    // 1. Слушаем классы учителя
    const qClasses = query(collection(db, "classes"), where("teacherId", "==", user.uid));
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setClasses(list);
      setLoading(false);
    });

    // 2. Слушаем созданные тесты
    const qExams = query(collection(db, "exams"), where("teacherId", "==", user.uid));
    const unsubExams = onSnapshot(qExams, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setExams(list);
    });

    // 3. Слушаем сданные результаты учеников
    const qResults = query(collection(db, "exam_results"), where("teacherId", "==", user.uid));
    const unsubResults = onSnapshot(qResults, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setResults(list);
    });

    return () => {
      unsubClasses();
      unsubExams();
      unsubResults();
    };
  }, [user]);

  // Создание нового класса
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !user) return;

    const classCode = generateClassCode(examSubject);

    try {
      await addDoc(collection(db, "classes"), {
        name: newClassName,
        code: classCode,
        teacherId: user.uid,
        teacherName: userName,
        studentsCount: 0,
        createdAt: new Date().toISOString()
      });
      setNewClassName("");
      alert(`Класс создан! Код для приглашения учеников: ${classCode}`);
    } catch (err) {
      console.error("Ошибка при создании класса:", err);
    }
  };

  // Создание новой проверочной работы
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examTitle.trim() || !selectedClassCode || !user) {
      alert("Заполните все поля и выберите класс!");
      return;
    }

    try {
      await addDoc(collection(db, "exams"), {
        title: examTitle,
        subject: examSubject,
        questionsCount: Number(examQuestions),
        timeLimit: Number(examTime),
        classCode: selectedClassCode,
        teacherId: user.uid,
        teacherName: userName,
        createdAt: new Date().toISOString()
      });
      setExamTitle("");
      alert("Проверочная работа успешно опубликована для класса!");
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Ошибка при создании теста:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Расчет показателей дашборда
  const avgScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.scorePercent, 0) / results.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans text-slate-900 w-full antialiased">
      
      {/* САЙДБАР */}
      <aside className="w-64 bg-white border-r border-slate-200/60 p-6 flex flex-col justify-between hidden lg:flex sticky top-0 h-screen z-30">
        <div className="space-y-8">
          <div>
            <div onClick={() => setActiveTab("dashboard")} className="flex items-center gap-2 font-black text-xl tracking-tight cursor-pointer">
              <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black">E</span>
              EduTrack <span className="text-indigo-600">AI</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                Преподаватель
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "dashboard" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📊</span> Дашборд
            </button>
            <button 
              onClick={() => setActiveTab("classes")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "classes" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>🏫</span> Мои Классы
            </button>
            <button 
              onClick={() => setActiveTab("create_exam")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "create_exam" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📝</span> Назначить Тест
            </button>
            <button 
              onClick={() => setActiveTab("results")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === "results" ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 rounded-r-none font-bold" : "text-slate-500 hover:bg-slate-50 font-medium"}`}
            >
              <span>📈</span> Результаты
            </button>
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition text-left">
            <span>🏠</span> На главную страницу
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition text-left">
            <span>🚪</span> Выйти из аккаунта
          </button>
        </div>
      </aside>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200/60 bg-white px-8 flex items-center justify-between sticky top-0 z-20">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            Панель управления преподавателя
          </span>
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/40 px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-[10px]">
              {userName[0].toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-700">{userName}</span>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-6xl w-full mx-auto flex-1">
          
          {/* ТАБ 1: ДАШБОРД */}
          {activeTab === "dashboard" && (
            <>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Добро пожаловать, {userName}!</h1>
                <p className="text-sm text-slate-500 mt-1">Отслеживайте успехи учеников и управляйте учебным процессом с ИИ.</p>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Всего классов</h3>
                  <p className="text-5xl font-black text-indigo-600 mt-2">{classes.length}</p>
                </div>
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Назначено тестов</h3>
                  <p className="text-5xl font-black text-indigo-600 mt-2">{exams.length}</p>
                </div>
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Средний балл классов</h3>
                  <p className="text-5xl font-black text-emerald-600 mt-2">{avgScore}%</p>
                </div>
              </div>

              {/* Последние сданные работы */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Последние активности учеников</h3>
                {results.length === 0 ? (
                  <p className="text-xs text-slate-400">Ученики пока не сдали ни одного теста.</p>
                ) : (
                  <div className="space-y-3">
                    {results.slice(0, 5).map((res) => (
                      <div key={res.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center bg-slate-50/30">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{res.studentName} ({res.studentEmail})</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Тест: «{res.examTitle}» • Код класса: {res.classCode}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-lg">
                            {res.scorePercent}% (Оценка {res.grade})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ТАБ 2: УПРАВЛЕНИЕ КЛАССАМИ */}
          {activeTab === "classes" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Лево: Форма создания класса */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 text-base">Создать новый класс</h3>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Название класса</label>
                    <input
                      type="text"
                      required
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Например: 11 А, 9 Б"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Специализация (Предмет)</label>
                    <select
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="Math">Математика</option>
                      <option value="Biology">Биология</option>
                      <option value="Physics">Физика</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-black shadow-md transition">
                    Сгенерировать класс
                  </button>
                </form>
              </div>

              {/* Право: Список классов */}
              <div className="md:col-span-2 bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 text-base">Ваши зарегистрированные классы</h3>
                {classes.length === 0 ? (
                  <p className="text-xs text-slate-400">У вас пока нет созданных классов.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {classes.map((cls) => (
                      <div key={cls.id} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/50 flex flex-col justify-between gap-4">
                        <div>
                          <p className="text-xs font-black text-slate-900">{cls.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Спец: {cls.subject === "Biology" ? "Биология" : cls.subject === "Physics" ? "Физика" : "Математика"}</p>
                        </div>
                        <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/30">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Код для приглашения</p>
                          <p className="text-lg font-black text-indigo-600 font-mono tracking-wider mt-0.5">{cls.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ТАБ 3: НАЗНАЧЕНИЕ РАБОТ */}
          {activeTab === "create_exam" && (
            <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Создать проверочную работу</h2>
                <p className="text-xs text-slate-500 mt-1">Опубликованный тест мгновенно появится в кабинетах учеников выбранного класса.</p>
              </div>

              <form onSubmit={handleCreateExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Название проверочной работы</label>
                  <input
                    type="text"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Например: Промежуточный контроль по геометрии"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Предмет</label>
                    <select
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="Math">Математика</option>
                      <option value="Biology">Биология</option>
                      <option value="Physics">Физика</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Назначить классу</label>
                    <select
                      value={selectedClassCode}
                      required
                      onChange={(e) => setSelectedClassCode(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">Выберите класс...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.code}>{cls.name} ({cls.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Количество вопросов</label>
                    <select
                      value={examQuestions}
                      onChange={(e) => setExamQuestions(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value={10}>10 вопросов</option>
                      <option value={15}>15 вопросов</option>
                      <option value={40}>40 вопросов (Полная симуляция)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ограничение времени</label>
                    <select
                      value={examTime}
                      onChange={(e) => setExamTime(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value={15}>15 минут</option>
                      <option value={30}>30 минут</option>
                      <option value={45}>45 минут</option>
                      <option value={60}>60 минут</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black shadow-md transition pt-2">
                  Опубликовать тест
                </button>
              </form>
            </div>
          )}

          {/* ТАБ 4: ТАБЛИЦА РЕЗУЛЬТАТОВ */}
          {activeTab === "results" && (
            <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="font-black text-slate-800 text-base">Таблица результатов сдачи экзаменов</h3>
                <p className="text-xs text-slate-400 mt-0.5">В реальном времени отображает результаты сданных тестов учеников.</p>
              </div>

              {results.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Результатов пока нет.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Имя ученика</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Название работы</th>
                        <th className="py-3 px-4">Класс</th>
                        <th className="py-3 px-4 text-center">Процент</th>
                        <th className="py-3 px-4 text-center">Оценка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((res) => (
                        <tr key={res.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{res.studentName}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{res.studentEmail}</td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">{res.examTitle}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-bold">{res.classCode}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">{res.scorePercent}%</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-indigo-50 text-indigo-600 text-xs font-black px-2 py-0.5 rounded-md border border-indigo-100">
                              {res.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
