export const CongratsModal = ({ user, onClose }) => {
  const handleStart = () => {
    if (user) {
      localStorage.setItem(`has_seen_congrats_${user.uid}`, "true");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
      <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950 w-full max-w-md rounded-[32px] p-8 shadow-2xl relative border border-indigo-500/30 text-center space-y-6 text-white overflow-hidden">
        
        {/* Background glowing effects */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        {/* Confetti animations / header emoji */}
        <div className="relative">
          <span className="text-6xl filter drop-shadow-lg inline-block animate-bounce [animation-duration:2.5s]">🎉</span>
          <span className="absolute -top-2 left-6 text-2xl animate-ping opacity-60">✨</span>
          <span className="absolute -bottom-2 right-6 text-2xl animate-ping [animation-delay:1s] opacity-60">🌟</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-purple-200">
            Поздравляем с Premium!
          </h2>
          <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mt-2"></div>
        </div>

        {/* Congrats Text */}
        <div className="space-y-4">
          <p className="text-xs text-indigo-200/90 font-medium tracking-wide">
            Вам выдан бесплатный Premium-доступ к образовательной платформе
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 shadow-inner backdrop-blur-sm">
            <p className="text-sm font-black tracking-tight text-indigo-300 uppercase">
              EduTrack ЕНТ AI
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Подарок предоставлен лично основателем проекта:
            </p>
            <p className="text-base font-extrabold text-white tracking-wide bg-gradient-to-r from-indigo-500 to-purple-500 py-1.5 px-4 rounded-xl shadow-sm border border-indigo-400/20 inline-block">
              👑 Ivakin Daniil
            </p>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed italic max-w-sm mx-auto pt-2">
            "Желаю успешной сдачи ЕНТ на 140 баллов, легкого обучения на гранте и безграничных побед! Развивай свой интеллект на максимум вместе с наставником."
            <span className="block mt-2 font-bold text-indigo-400 not-italic font-sans">— Даниил Ивакин, CEO & Founder</span>
          </div>
        </div>

        {/* Accept Button */}
        <div className="pt-2">
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] transform cursor-pointer animate-pulse"
          >
            🚀 Начать подготовку на максимум!
          </button>
        </div>
        
      </div>
    </div>
  );
};
