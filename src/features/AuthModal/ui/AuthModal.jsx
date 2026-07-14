import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider, db } from "../../../app/providers/Firebase/firebase";
import { query, collection, where, getDocs } from "firebase/firestore";
import { PrivacyPolicyModal } from "../../PrivacyPolicyModal";

export const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("login"); // "login" или "register"
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState("11 класс");
  const [untDate, setUntDate] = useState("");
  const [studyTimeSlot, setStudyTimeSlot] = useState("14:00 - 20:00");
  const [agreeCookies, setAgreeCookies] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [privacyDocType, setPrivacyDocType] = useState("privacy");

  if (!isOpen) return null;

  // Хэндлер для переключения табов (очищаем ошибки при переключении)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setAgreeCookies(false);
    setAgreePrivacy(false);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Пожалуйста, введите ваш email в поле ввода, чтобы отправить ссылку для восстановления пароля.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      alert(`Ссылка для восстановления пароля успешно отправлена на почту: ${email}`);
    } catch (err) {
      console.error(err);
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Авторизация по Почте и Паролю
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "login") {
        let loginEmail = email.trim();
        
        // Если логин не содержит @, считаем его никнеймом и ищем в Firestore соответствующий email
        if (!loginEmail.includes("@")) {
          const q = query(
            collection(db, "users"),
            where("nicknameLower", "==", loginEmail.toLowerCase())
          );
          const querySnap = await getDocs(q);
          if (querySnap.empty) {
            setError("Пользователь с таким никнеймом не найден.");
            setLoading(false);
            return;
          }
          loginEmail = querySnap.docs[0].data().email;
        }

        await signInWithEmailAndPassword(auth, loginEmail, password);
        alert("Успешный вход!");
      } else {
        if (!agreePrivacy) {
          setError("Вы должны ознакомиться и согласиться с Пользовательским соглашением и Политикой конфиденциальности.");
          setLoading(false);
          return;
        }
        if (!agreeCookies) {
          setError("Вы должны подтвердить согласие на использование файлов cookies для продолжения.");
          setLoading(false);
          return;
        }
        const trimmedNickname = nickname.trim();
        if (!trimmedNickname) {
          setError("Пожалуйста, заполните поле никнейма.");
          setLoading(false);
          return;
        }

        // Проверяем уникальность никнейма
        const q = query(
          collection(db, "users"),
          where("nicknameLower", "==", trimmedNickname.toLowerCase())
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          setError("Этот никнейм уже занят. Пожалуйста, выберите другой.");
          setLoading(false);
          return;
        }

        let calculatedDays = "";
        if (grade === "11 класс" && untDate) {
          const today = new Date();
          const target = new Date(untDate);
          today.setHours(0, 0, 0, 0);
          target.setHours(0, 0, 0, 0);
          const diffTime = target - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          calculatedDays = diffDays > 0 ? String(diffDays) : "0";
        }

        localStorage.setItem("selected_role", "student");
        localStorage.setItem("selected_grade", grade);
        if (grade === "11 класс" && calculatedDays) {
          localStorage.setItem("selected_days_to_unt", calculatedDays);
        } else {
          localStorage.removeItem("selected_days_to_unt");
        }
        localStorage.setItem("selected_study_time_slot", studyTimeSlot);
        localStorage.setItem("selected_nickname", trimmedNickname);

        await createUserWithEmailAndPassword(auth, email.trim(), password);
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
      let calculatedDays = "";
      if (grade === "11 класс" && untDate) {
        const today = new Date();
        const target = new Date(untDate);
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        calculatedDays = diffDays > 0 ? String(diffDays) : "0";
      }

      localStorage.setItem("selected_role", "student");
      localStorage.setItem("selected_grade", grade);
      if (grade === "11 класс" && calculatedDays) {
        localStorage.setItem("selected_days_to_unt", calculatedDays);
      } else {
        localStorage.removeItem("selected_days_to_unt");
      }
      localStorage.setItem("selected_study_time_slot", studyTimeSlot);

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
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-center bg-white max-h-[85vh] md:max-h-[90vh] overflow-y-auto custom-scrollbar">
          
          {/* Табы */}
          <div className="flex gap-6 border-b border-slate-100 mb-4 text-xs font-semibold">
            <button
              onClick={() => handleTabChange("login")}
              className={`pb-2 transition relative ${activeTab === "login" ? "text-indigo-600 font-bold" : "text-slate-450 hover:text-slate-650"}`}
            >
              Вход
              {activeTab === "login" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
            </button>
            <button
              onClick={() => handleTabChange("register")}
              className={`pb-2 transition relative ${activeTab === "register" ? "text-indigo-600 font-bold" : "text-slate-455 hover:text-slate-655"}`}
            >
              Регистрация
              {activeTab === "register" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
            </button>
          </div>

          {/* Приветствие */}
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900 mb-0.5">
              {activeTab === "login" ? "С возвращением!" : "Создать аккаунт"}
            </h2>
            <p className="text-[10px] text-slate-450 font-medium">
              {activeTab === "login" ? "Продолжай свой путь к успешной сдаче экзаменов." : "Начни готовиться к экзаменам на максимум уже сегодня."}
            </p>
          </div>

          {/* Вывод ошибки на русском */}
          {error && (
            <div className="mb-3.5 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {activeTab === "login" ? "Email или Никнейм" : "Email"}
              </label>
              <input
                type={activeTab === "login" ? "text" : "email"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === "login" ? "student@example.com или alex_99" : "student@example.com"}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-300"
              />
            </div>

            {activeTab === "register" ? (
              <>
                {/* Никнейм и Пароль на одной строке */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Никнейм</label>
                    <input
                      type="text"
                      required
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                      placeholder="alex_99"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-350"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Пароль</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-350 pr-9"
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
                </div>

                {/* Класс и Свободное время на одной строке */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Выберите ваш класс</label>
                    <div className="grid grid-cols-3 gap-1">
                      {["9 класс", "10 класс", "11 класс"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGrade(g)}
                          className={`py-2 rounded-xl text-[10px] font-bold border transition ${grade === g ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Свободное время</label>
                    <select
                      value={studyTimeSlot}
                      onChange={(e) => setStudyTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition text-slate-800 bg-white"
                    >
                      <option value="08:00 - 14:00">🌅 Первая смена (08:00 - 14:00)</option>
                      <option value="14:00 - 20:00">🏫 Вторая смена (14:00 - 20:00)</option>
                      <option value="12:00 - 18:00">☀️ Дневное время (12:00 - 18:00)</option>
                      <option value="16:00 - 22:00">🌌 Вечернее время (16:00 - 22:00)</option>
                    </select>
                  </div>
                </div>

                {/* Дата сдачи ЕНТ выводится только для 11 класса */}
                {grade === "11 класс" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Дата сдачи ЕНТ</label>
                    <input
                      type="date"
                      required
                      value={untDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setUntDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition text-slate-800 bg-white"
                    />
                  </div>
                )}

                {/* Privacy and Agreement checkbox */}
                <div className="flex items-start gap-2 pt-1 animate-in fade-in duration-200">
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                    required
                  />
                  <label htmlFor="agreePrivacy" className="text-slate-500 text-[9px] font-medium leading-normal select-none cursor-pointer">
                    Я ознакомлен(а) и соглашаюсь с{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPrivacyDocType("agreement");
                        setIsPrivacyOpen(true);
                      }}
                      className="text-indigo-600 hover:underline font-bold inline border-none bg-transparent p-0 cursor-pointer text-[9px]"
                    >
                      Пользовательским соглашением
                    </button>{" "}
                    и{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPrivacyDocType("privacy");
                        setIsPrivacyOpen(true);
                      }}
                      className="text-indigo-600 hover:underline font-bold inline border-none bg-transparent p-0 cursor-pointer text-[9px]"
                    >
                      Политикой конфиденциальности
                    </button>
                    .
                  </label>
                </div>

                {/* Cookie Consent checkbox */}
                <div className="flex items-start gap-2 pt-0.5 animate-in fade-in duration-200">
                  <input
                    type="checkbox"
                    id="agreeCookies"
                    checked={agreeCookies}
                    onChange={(e) => setAgreeCookies(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                    required
                  />
                  <label htmlFor="agreeCookies" className="text-slate-500 text-[9px] font-medium leading-normal select-none cursor-pointer">
                    Я принимаю условия использования файлов{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPrivacyDocType("cookies");
                        setIsPrivacyOpen(true);
                      }}
                      className="text-indigo-600 hover:underline font-bold inline border-none bg-transparent p-0 cursor-pointer text-[9px]"
                    >
                      cookies
                    </button>{" "}
                    для оптимизации учебного процесса.
                  </label>
                </div>
              </>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">Пароль</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer border-none bg-transparent p-0 font-bold"
                  >
                    Забыли пароль?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-300 pr-9"
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm mt-2 cursor-pointer"
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
            Продолжая, вы соглашаетесь с{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPrivacyDocType("agreement");
                setIsPrivacyOpen(true);
              }}
              className="text-slate-400 hover:text-slate-650 underline inline border-none bg-transparent p-0 cursor-pointer text-[10px] font-bold"
            >
              Пользовательским соглашением
            </button>
            ,{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPrivacyDocType("privacy");
                setIsPrivacyOpen(true);
              }}
              className="text-slate-400 hover:text-slate-650 underline inline border-none bg-transparent p-0 cursor-pointer text-[10px] font-bold"
            >
              Политикой конфиденциальности
            </button>{" "}
            и{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPrivacyDocType("cookies");
                setIsPrivacyOpen(true);
              }}
              className="text-slate-400 hover:text-slate-650 underline inline border-none bg-transparent p-0 cursor-pointer text-[10px] font-bold"
            >
              Политикой файлов cookie
            </button>
            .
          </p>
        </div>
      </div>

      {isPrivacyOpen && (
        <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} documentType={privacyDocType} />
      )}
    </div>
  );
};