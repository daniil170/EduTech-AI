import { useState } from "react";
import { 
  updateEmail, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  deleteUser
} from "firebase/auth";
import { doc, updateDoc, deleteDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../app/providers/Firebase/firebase";
import { PrivacyPolicyModal } from "../../PrivacyPolicyModal";
import { SubscriptionModal } from "../../SubscriptionModal";

export const ProfileSettingsModal = ({ user, studentStats, onClose }) => {
  const isGrade11 = studentStats?.grade === "11 класс" || studentStats?.grade === 11 || studentStats?.class === 11 || studentStats?.class === "11 класс";
  const [activeTab, setActiveTab] = useState("profile"); // "profile", "security", "parent", "policies", "delete"
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [privacyDocType, setPrivacyDocType] = useState("privacy"); // "privacy", "agreement" или "cookies"
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Profile settings state
  const [nickname, setNickname] = useState(studentStats?.nickname || "");
  const [untDate, setUntDate] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Re-auth & Action flow states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Re-authenticates user for sensitive actions
  const reauthenticate = async (password) => {
    if (!password) {
      throw new Error("Пожалуйста, введите текущий пароль для подтверждения личности.");
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const updates = {};
      const trimmedNickname = nickname.trim();

      // 1. Update Nickname
      if (trimmedNickname && trimmedNickname !== studentStats?.nickname) {
        // Check uniqueness of nickname
        const q = query(
          collection(db, "users"),
          where("nicknameLower", "==", trimmedNickname.toLowerCase())
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          throw new Error("Этот никнейм уже занят другим пользователем.");
        }
        updates.nickname = trimmedNickname;
        updates.nicknameLower = trimmedNickname.toLowerCase();
      }

      // 2. Update ENT Date
      if (isGrade11 && untDate) {
        const today = new Date();
        const target = new Date(untDate);
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        updates.daysToUnt = diffDays > 0 ? diffDays : 0;
      }

      // 3. Update Email
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail && trimmedEmail !== user?.email) {
        if (!currentPassword) {
          throw new Error("Введите текущий пароль в поле ниже, чтобы изменить адрес электронной почты.");
        }
        await reauthenticate(currentPassword);
        await updateEmail(auth.currentUser, trimmedEmail);
        updates.email = trimmedEmail;
      }

      // Apply updates to Firestore
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "users", user.uid), updates);
      }

      setSuccess("Профиль успешно обновлен!");
      setCurrentPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        setError("Неверный текущий пароль.");
      } else {
        setError(err.message || "Не удалось обновить профиль.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Пожалуйста, введите текущий пароль.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Новый пароль должен быть не менее 6 символов.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      await reauthenticate(currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      setSuccess("Пароль успешно изменен!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        setError("Неверный текущий пароль.");
      } else {
        setError(err.message || "Не удалось изменить пароль.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Введите текущий пароль для подтверждения удаления аккаунта.");
      return;
    }

    if (!confirm("Вы абсолютно уверены, что хотите удалить свой аккаунт? Это действие необратимо и сотрет весь ваш учебный прогресс!")) {
      return;
    }

    setLoading(true);
    try {
      // 1. Re-authenticate
      await reauthenticate(currentPassword);

      // 2. Delete Firestore data
      await deleteDoc(doc(db, "users", user.uid));

      // 3. Delete Auth User
      await deleteUser(auth.currentUser);

      alert("Ваш аккаунт был успешно удален.");
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        setError("Неверный текущий пароль.");
      } else {
        setError(err.message || "Не удалось удалить аккаунт.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-slate-800/80 text-white relative max-h-[92vh] overflow-y-auto font-sans custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/40 hover:bg-slate-800 rounded-full"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center text-xl border border-indigo-500/20 shadow-inner">
            ⚙️
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Настройки Профиля
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Управление никнеймом, электронной почтой, паролем и аккаунтом
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800/60 mb-6 shadow-inner text-[10px] font-bold">
          <button
            onClick={() => { setActiveTab("profile"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 rounded-xl transition ${activeTab === "profile" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Профиль
          </button>
          <button
            onClick={() => { setActiveTab("security"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 rounded-xl transition ${activeTab === "security" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Безопасность
          </button>
          <button
            onClick={() => { setActiveTab("parent"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 rounded-xl transition ${activeTab === "parent" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Родителям
          </button>
          <button
            onClick={() => { setActiveTab("policies"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 rounded-xl transition ${activeTab === "policies" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Политики
          </button>
          <button
            onClick={() => { setActiveTab("delete"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 rounded-xl transition ${activeTab === "delete" ? "bg-rose-950/30 border border-rose-500/10 text-rose-400 hover:bg-rose-900/20" : "text-slate-400 hover:text-rose-400/80"}`}
          >
            Удаление
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-semibold">
            ✓ {success}
          </div>
        )}

        {/* TAB 1: Profile Info */}
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Никнейм</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="Новый никнейм"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Электронная почта</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            {isGrade11 && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Дата сдачи ЕНТ</label>
                <input
                  type="date"
                  value={untDate}
                  onChange={(e) => setUntDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white"
                />
                <p className="text-[10px] text-slate-500 font-medium">
                  Текущий таймер ЕНТ: <span className="text-slate-300 font-bold">{studentStats?.daysToUnt || 0} дней осталось</span>
                </p>
              </div>
            )}

            {/* Current Password validation (only required if changing email) */}
            {email.trim().toLowerCase() !== user?.email?.toLowerCase() && (
              <div className="pt-4 border-t border-slate-800/80 space-y-1.5">
                <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Подтверждение пароля (Обязательно для смены почты)
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите ваш текущий пароль"
                  className="w-full bg-slate-950 border border-rose-500/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-rose-500 text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-600/10 cursor-pointer mt-2"
            >
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </form>
        )}

        {/* TAB 2: Change Password */}
        {activeTab === "security" && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Текущий пароль</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Новый пароль</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  {showNewPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Подтверждение нового пароля</label>
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-600/10 cursor-pointer mt-2"
            >
              {loading ? "Изменение пароля..." : "Обновить пароль"}
            </button>
          </form>
        )}

        {/* TAB 3: Delete Account */}
        {activeTab === "delete" && (
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-2xl text-xs font-medium text-rose-300 leading-relaxed">
              <strong>Внимание!</strong> При удалении аккаунта все ваши данные, включая результаты диагностик, решенные задачи, историю активности, XP, уровень и статус подписки будут удалены навсегда без возможности восстановления.
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                Подтверждение пароля (Обязательно для удаления)
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Введите текущий пароль для подтверждения"
                className="w-full bg-slate-950 border border-rose-500/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-rose-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-rose-600/10 cursor-pointer mt-2"
            >
              {loading ? "Удаление..." : "Удалить аккаунт навсегда"}
            </button>
          </form>
        )}
        {/* TAB 3: Policies */}
        {activeTab === "policies" && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-400 font-medium">
              Ознакомьтесь с официальными юридическими документами платформы EduTrack:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPrivacyDocType("privacy");
                  setIsPrivacyOpen(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 rounded-2xl text-left transition duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Политика конфиденциальности</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Правила сбора и защиты персональных данных</p>
                  </div>
                </div>
                <span className="text-slate-500 font-bold text-sm">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrivacyDocType("agreement");
                  setIsPrivacyOpen(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 rounded-2xl text-left transition duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚖️</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Пользовательское соглашение</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Правила и условия использования сервиса</p>
                  </div>
                </div>
                <span className="text-slate-500 font-bold text-sm">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrivacyDocType("cookies");
                  setIsPrivacyOpen(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 rounded-2xl text-left transition duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🍪</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Политика использования cookies</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Информация об использовании технических и аналитических файлов cookie</p>
                  </div>
                </div>
                <span className="text-slate-500 font-bold text-sm">→</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "parent" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {(studentStats?.tariff === "ultimate" || studentStats?.tariff === "whitelisted" || studentStats?.role === "founder") ? (
              <div className="space-y-5">
                <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍👩‍👦</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Мониторинг для родителей подключен</h4>
                      <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Тариф Ultimate активен • Автоотчёты</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    Поделитесь этой реферальной ссылкой с вашим родителем. После перехода по ссылке и нажатия кнопки <b>«Запустить» (Start)</b> в Telegram, родитель начнёт получать еженедельные отчёты об успеваемости и уведомления о ваших пробных экзаменах в реальном времени.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Реферальная ссылка для родителя:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://t.me/UNT_parent_bot?start=ref_${studentStats?.nickname || "student"}`}
                      className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`https://t.me/UNT_parent_bot?start=ref_${studentStats?.nickname || "student"}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          console.error("Copy error:", err);
                        }
                      }}
                      className={`px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm border border-slate-850 ${
                        copied 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500" 
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      }`}
                    >
                      {copied ? "✓" : "Копировать"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative p-6 bg-slate-900/60 border border-slate-800/85 rounded-3xl text-center space-y-4 overflow-hidden">
                <div className="w-14 h-14 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Мониторинг для родителей заблокирован</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                    Родительский контроль и автоматические отчеты об успеваемости ученика в Telegram доступны исключительно на тарифе <b>Ultimate</b>. Улучшите подписку для разблокировки функции.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubscriptionOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 px-6 rounded-xl text-xs font-black transition-all shadow-md hover:shadow-indigo-600/20 cursor-pointer"
                >
                  🚀 Улучшить тариф до Ultimate
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isSubscriptionOpen && (
        <SubscriptionModal
          user={user}
          studentStats={studentStats}
          onClose={() => setIsSubscriptionOpen(false)}
        />
      )}

      {isPrivacyOpen && (
        <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} documentType={privacyDocType} />
      )}
    </div>
  );
};
