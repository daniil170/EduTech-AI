import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { auth, googleProvider } from "../../../app/providers/Firebase/firebase";

export const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("login"); // "login" или "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState("11 класс");
  const [daysToUnt, setDaysToUnt] = useState("");

  if (!isOpen) return null;

  // Хэндлер для переключения табов (очищаем ошибки при переключении)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
  };

  // Перевод ошибок Firebase на человеческий русский язык
  const translateError = (code) => {
    switch (code) {
      case "auth/invalid-email": return "Неверный формат почты.";
      case "auth/user-not-found": return "Пользователь с таким email не найден.";
      case "auth/wrong-password": return "Неверный пароль.";
      case "auth/email-already-in-use": return "Этот email уже зарегистрирован.";
      case "auth/weak-password": return "Пароль должен быть не менее 6 символов.";
      case "auth/invalid-credential": return "Неверные данные аккаунта или пароль.";
      default: return "Произошла ошибка. Попробуйте еще раз.";
    }
  };

  // Авторизация по Почте и Паролю
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Успешный вход!");
      } else {
        localStorage.setItem("selected_role", "student");
        localStorage.setItem("selected_grade", grade);
        if (grade === "11 класс") {
          localStorage.setItem("selected_days_to_unt", daysToUnt);
        } else {
          localStorage.removeItem("selected_days_to_unt");
        }
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Успешная регистрация!");
      }
      onClose(); // Закрываем модалку при успехе
    } catch (err) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Авторизация через Google
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      localStorage.setItem("selected_role", "student");
      localStorage.setItem("selected_grade", grade);
      if (grade === "11 класс") {
        localStorage.setItem("selected_days_to_unt", daysToUnt);
      } else {
        localStorage.removeItem("selected_days_to_unt");
      }
      await signInWithPopup(auth, googleProvider);
      alert("Успешный вход через Google!");
      onClose();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Не удалось войти через Google.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-20 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
        >
          ✕
        </button>

        {/* ЛЕВАЯ СЕКЦИЯ */}
        <div className="w-full md:w-5/12 bg-indigo-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 font-bold text-lg mb-6">
              <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-indigo-600 text-xs font-black">E</span>
              EduTrack AI
            </div>
            <h3 className="text-xl font-medium leading-relaxed text-indigo-100">
              Повышай свою успеваемость с помощью персонального AI-анализа и профессионального отслеживания прогресса.
            </h3>
          </div>

          <div className="bg-white backdrop-blur-md border border-white/10 p-5 rounded-2xl relative z-10 mt-8 md:mt-0">
            <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-white">
              <span>✨</span> Прогнозирование баллов
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Наш AI анализирует твои домашние задания и тесты, чтобы спрогнозировать финальные результаты экзаменов с точностью до 94%.
            </p>
          </div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/30 rounded-full blur-2xl"></div>
        </div>

        {/* ПРАВАЯ СЕКЦИЯ */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white">
          
          {/* Табы */}
          <div className="flex gap-6 border-b border-slate-100 mb-8 text-sm font-medium">
            <button
              onClick={() => handleTabChange("login")}
              className={`pb-3 transition relative ${activeTab === "login" ? "text-indigo-600 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
            >
              Вход
              {activeTab === "login" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
            </button>
            <button
              onClick={() => handleTabChange("register")}
              className={`pb-3 transition relative ${activeTab === "register" ? "text-indigo-600 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
            >
              Регистрация
              {activeTab === "register" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
            </button>
          </div>

          {/* Приветствие */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {activeTab === "login" ? "С возвращением!" : "Создать аккаунт"}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === "login" ? "Продолжай свой путь к успешной сдаче экзаменов." : "Начни готовиться к экзаменам на максимум уже сегодня."}
            </p>
          </div>

          {/* Вывод ошибки на русском */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-300"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Пароль</label>
                {activeTab === "login" && (
                  <a href="#forgot" className="text-[11px] text-indigo-600 hover:underline">Забыли пароль?</a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            
            {activeTab === "register" && (
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Выберите ваш класс</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["9 класс", "10 класс", "11 класс"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition ${grade === g ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {grade === "11 класс" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Сколько дней осталось до ЕНТ?</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      required
                      value={daysToUnt}
                      onChange={(e) => setDaysToUnt(e.target.value)}
                      placeholder="Например: 120"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-300"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition shadow-sm mt-2"
            >
              <span>{loading ? "Загрузка..." : activeTab === "login" ? "Войти" : "Зарегистрироваться"}</span>
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">или</span>
          </div>

          {/* Кнопка Google */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4"/>
            <span>Войти через Google</span>
          </button>

          <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed">
            Продолжая, вы соглашаетесь с нашими <a href="#terms" className="underline hover:text-slate-600">Условиями использования</a> и <a href="#privacy" className="underline hover:text-slate-600">Политикой конфиденциальности</a>.
          </p>
        </div>
      </div>
    </div>
  );
};