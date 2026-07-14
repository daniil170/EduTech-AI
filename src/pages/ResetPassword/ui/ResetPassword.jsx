import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../../app/providers/Firebase/firebase";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const oobCode = searchParams.get("oobCode");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkCode = async () => {
      if (!oobCode) {
        setError("❌ Неверная или устаревшая ссылка для сброса пароля.");
        setVerifying(false);
        return;
      }
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
      } catch (err) {
        console.error(err);
        setError("❌ Ссылка для сброса пароля недействительна или срок её действия истёк.");
      } finally {
        setVerifying(false);
      }
    };

    checkCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Пароль должен содержать не менее 6 символов.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Не удалось изменить пароль. Ссылка могла устареть.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white relative font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="relative w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-xs text-slate-400 font-bold tracking-wider uppercase">Проверка ссылки безопасности...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full filter blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-8 shadow-2xl space-y-6 mx-4">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center text-xl border border-indigo-500/20 shadow-inner mx-auto mb-2">
            🔐
          </div>
          <h2 className="text-xl font-black text-white">Новый пароль</h2>
          <p className="text-xs text-slate-400 font-medium">
            {success ? "Пароль успешно изменен!" : email ? `Сброс пароля для аккаунта ${email}` : "Установите надежный пароль"}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs font-semibold text-center animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 pt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold text-center">
              ✓ Пароль успешно изменен. Теперь вы можете войти на платформу с новым паролем.
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Перейти к авторизации
            </button>
          </div>
        ) : (
          !error && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white transition placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Подтверждение пароля</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white transition placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-600/10 cursor-pointer mt-2"
              >
                {loading ? "Сохранение..." : "Сохранить новый пароль"}
              </button>
            </form>
          )
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-500 hover:text-slate-300 font-bold transition"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  );
};
