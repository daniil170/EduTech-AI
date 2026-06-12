import { useState } from "react";

export const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("login"); // "login" или "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Если модалка закрыта, ничего не рендерим
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "login") {
      console.log("Логин через Firebase:", { email, password });
    } else {
      console.log("Регистрация через Firebase:", { email, password });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      {/* Задний фон-оверлей для закрытия при клике мимо */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Контейнер модалки (точно как на макете) */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Кнопка закрытия модалки (крестик) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-20 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
        >
          ✕
        </button>

        {/* ЛЕВАЯ СЕКЦИЯ (Фиолетовая, с бенефитами) */}
        <div className="w-full md:w-5/12 bg-indigo-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 font-bold text-lg mb-6">
              <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-indigo-600 text-xs font-black">
                E
              </span>
              EduTrack AI
            </div>
            <h3 className="text-xl font-medium leading-relaxed text-indigo-100">
              Повышай свою успеваемость с помощью персонального AI-анализа и профессионального отслеживания прогресса.
            </h3>
          </div>

          {/* Карточка Predictive Scoring внутри фиолетового блока */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl relative z-10 mt-8 md:mt-0">
            <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-white">
              <span>✨</span> Прогнозирование баллов
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Наш AI анализирует твои домашние задания и тесты, чтобы спрогнозировать финальные результаты экзаменов с точностью до 94%.
            </p>
          </div>

          {/* Декоративный бэкграунд */}
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/30 rounded-full blur-2xl"></div>
        </div>

        {/* ПРАВАЯ СЕКЦИЯ (Форма) */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white">
          
          {/* Табы: Вход / Регистрация */}
          <div className="flex gap-6 border-b border-slate-100 mb-8 text-sm font-medium">
            <button
              onClick={() => setActiveTab("login")}
              className={`pb-3 transition relative ${
                activeTab === "login" ? "text-indigo-600 font-semibold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Вход
              {activeTab === "login" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`pb-3 transition relative ${
                activeTab === "register" ? "text-indigo-600 font-semibold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Регистрация
              {activeTab === "register" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>
              )}
            </button>
          </div>

          {/* Приветственный текст */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {activeTab === "login" ? "С возвращением!" : "Создать аккаунт"}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === "login" 
                ? "Продолжай свой путь к успешной сдаче экзаменов." 
                : "Начни готовиться к экзаменам на максимум уже сегодня."}
            </p>
          </div>

          {/* Форма ввода */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.value)}
                placeholder="student@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-300"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Пароль</label>
                {activeTab === "login" && (
                  <a href="#forgot" className="text-[11px] text-indigo-600 hover:underline">
                    Забыли пароль?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Главная кнопка сабмита */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition shadow-sm mt-2"
            >
              <span>{activeTab === "login" ? "Войти" : "Зарегистрироваться"}</span>
              <span>→</span>
            </button>
          </form>

          {/* Разделитель "ИЛИ" */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              или
            </span>
          </div>

          {/* Кнопка войти через Google */}
          <button className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition">
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-4 h-4"
            />
            <span>Войти через Google</span>
          </button>

          {/* Соглашение внизу */}
          <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed">
            Продолжая, вы соглашаетесь с нашими{" "}
            <a href="#terms" className="underline hover:text-slate-600">Условиями использования</a>{" "}
            и <a href="#privacy" className="underline hover:text-slate-600">Политикой конфиденциальности</a>.
          </p>

        </div>
      </div>
    </div>
  );
};