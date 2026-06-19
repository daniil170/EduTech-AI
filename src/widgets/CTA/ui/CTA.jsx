import { useNavigate } from "react-router-dom";

export const CTA = ({ onAuthClick, user }) => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Главный блок CTA с градиентным свечением */}
        <div className="relative bg-gradient-to-tr from-indigo-950 via-slate-950 to-purple-950 rounded-[40px] px-8 py-16 md:p-20 text-center overflow-hidden shadow-2xl border border-slate-800/80 shadow-indigo-900/20">
          
          {/* Световые эффекты на заднем фоне */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-32 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            
            {/* Декоративный бейдж */}
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              🚀 Быстрый старт за 2 минуты
            </span>

            {/* Заголовок */}
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight leading-tight mb-5">
              Готов сдать ЕНТ на максимальный балл?
            </h2>

            {/* Описание */}
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Присоединяйся к EduTrack ЕНТ AI сегодня и начни готовиться по персональному плану, созданному искусственным интеллектом специально под твои цели.
            </p>

            {/* Кнопка */}
            <div className="flex justify-center">
              {user ? (
                <button 
                  onClick={() => navigate("/workspace")}
                  className="bg-white text-indigo-950 hover:bg-slate-50 px-10 py-5 rounded-2xl text-base font-bold shadow-xl shadow-slate-950/20 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] cursor-pointer"
                >
                  Перейти в личный кабинет 🚀
                </button>
              ) : (
                <button 
                  onClick={onAuthClick}
                  className="bg-white text-indigo-950 hover:bg-slate-50 px-10 py-5 rounded-2xl text-base font-bold shadow-xl shadow-slate-950/20 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] cursor-pointer"
                >
                  Начать подготовку бесплатно
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};