import { useState } from "react";

export const ParentTelegramModal = ({ onClose, nickname = "" }) => {
  const [copied, setCopied] = useState(false);
  const botLink = `https://t.me/UNT_parent_bot?start=ref_${nickname || "student"}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(botLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 w-full max-w-md rounded-[32px] p-8 shadow-2xl relative border border-indigo-500/20 text-white overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Decorative background glows */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Header Icon */}
        <div className="text-center relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 transform hover:rotate-6 transition duration-300">
            <span className="text-3xl">👨‍👩‍👦</span>
          </div>
          <span className="absolute -top-2 left-[56%] text-xl animate-ping opacity-60">✨</span>
        </div>

        <div className="space-y-2 text-center mt-5">
          <h3 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-purple-200">
            Telegram для родителей
          </h3>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
            Доступно на тарифе Ultimate
          </p>
          <div className="h-0.5 w-12 bg-indigo-500/30 mx-auto rounded-full mt-2"></div>
        </div>

        <div className="space-y-4 my-6">
          <p className="text-xs text-slate-300 leading-relaxed text-center font-medium">
            Отправьте специальную ссылку вашему родителю. После запуска бота он будет получать еженедельные отчёты об успеваемости и результатах ваших пробных тестов.
          </p>

          {/* Stepper */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3.5 shadow-inner backdrop-blur-sm">
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 bg-indigo-600/30 text-indigo-400 text-[10px] font-black rounded-lg shrink-0 mt-0.5">1</span>
              <p className="text-[11px] text-slate-300 font-medium">Скопируйте ссылку ниже</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 bg-indigo-600/30 text-indigo-400 text-[10px] font-black rounded-lg shrink-0 mt-0.5">2</span>
              <p className="text-[11px] text-slate-300 font-medium">Отправьте её родителю (WhatsApp, Telegram и др.)</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 bg-indigo-600/30 text-indigo-400 text-[10px] font-black rounded-lg shrink-0 mt-0.5">3</span>
              <p className="text-[11px] text-slate-300 font-medium">Родитель перейдет по ней и нажмет <b>«Запустить» (Start)</b></p>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Ваша уникальная реферальная ссылка:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={botLink}
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm border border-slate-800 ${
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

        {/* Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-indigo-600/20 cursor-pointer"
          >
            Отлично, всё понятно!
          </button>
        </div>
        
      </div>
    </div>
  );
};
