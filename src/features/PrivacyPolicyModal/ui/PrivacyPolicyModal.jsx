import { useState, useEffect } from "react";

export const PrivacyPolicyModal = ({ onClose, documentType = "privacy" }) => {
  const [docText, setDocText] = useState("Загрузка документа...");

  const docPath = documentType === "agreement"
    ? "/user-agreement.txt"
    : documentType === "cookies"
      ? "/cookie-policy.txt"
      : "/privacy-policy.txt";
  const docTitle = documentType === "agreement"
    ? "Пользовательское соглашение"
    : documentType === "cookies"
      ? "Политика использования файлов cookie"
      : "Политика конфиденциальности";
  const docSubtitle = documentType === "agreement"
    ? "EduTrack UNT AI — Правила и условия использования сервиса"
    : documentType === "cookies"
      ? "EduTrack UNT AI — Использование технических и аналитических файлов cookie"
      : "EduTrack UNT AI — Защита персональных данных пользователей";

  const isAgreement = documentType === "agreement";

  useEffect(() => {
    fetch(docPath)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить файл.");
        return res.text();
      })
      .then((text) => setDocText(text))
      .catch((err) => {
        console.error(err);
        setDocText("Ошибка при загрузке текста документа. Пожалуйста, попробуйте позже или обратитесь в поддержку.");
      });
  }, [docPath]);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-2xl rounded-[32px] p-8 shadow-2xl border border-slate-800/80 text-white relative flex flex-col max-h-[85vh] font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/40 hover:bg-slate-800 rounded-full cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-5 shrink-0">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center text-xl border border-indigo-500/20 shadow-inner">
            {isAgreement ? "⚖️" : "📄"}
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              {docTitle}
            </h3>
            <p className="text-[11px] text-slate-450 font-medium">
              {docSubtitle}
            </p>
          </div>
        </div>

        {/* Scrollable text container */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-slate-950/40 border border-slate-800/60 p-6 rounded-2xl text-[12px] leading-relaxed text-slate-300 space-y-4 font-normal whitespace-pre-wrap select-text">
          {docText}
        </div>

        {/* Close action */}
        <div className="pt-5 mt-5 border-t border-slate-800 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            Ясно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
