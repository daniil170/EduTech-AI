import { useNavigate } from "react-router-dom";

export const Hero = ({ onAuthClick, user }) => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-20 sm:pt-32">
      {/* Современный фоновый паттерн с сеткой и цветными сферами */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70"></div>
      
      {/* Размытые сферы для глубины */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full filter blur-[80px] animate-pulse pointer-events-none"></div>
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-200/40 rounded-full filter blur-[80px] animate-pulse [animation-delay:2s] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Теглайн */}
        <div className="inline-flex items-center gap-2 bg-indigo-50/80 border border-indigo-100/80 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold mb-8 shadow-sm backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></span>
          Разработано специально для подготовки к ЕНТ в Казахстане
        </div>

        {/* Заголовок */}
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-6xl max-w-4xl mx-auto leading-[1.1] mb-6">
          Сдавай ЕНТ на <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">140 баллов</span> с персональным AI-наставником
        </h1>

        {/* Описание */}
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
          Выбери свою комбинацию предметов, получи индивидуальную программу подготовки от AI и тренируйся по интерактивному календарю.
        </p>

        {/* Кнопки действия */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {user ? (
            <button 
              onClick={() => navigate("/workspace")}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-4.5 rounded-2xl text-base font-bold shadow-lg shadow-indigo-200/50 hover:shadow-indigo-200/80 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              Перейти в личный кабинет 🚀
            </button>
          ) : (
            <>
              <button 
                onClick={onAuthClick}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-4.5 rounded-2xl text-base font-bold shadow-lg shadow-indigo-200/50 hover:shadow-indigo-200/80 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
              >
                Начать подготовку к ЕНТ
              </button>
              
              <button 
                onClick={onAuthClick}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-10 py-4.5 rounded-2xl text-base font-semibold shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>▶</span> Смотреть демо-версию
              </button>
            </>
          )}
        </div>

        {/* Премиум Макет интерфейса (Ноутбук) */}
        <div className="relative mx-auto max-w-5xl bg-slate-900/5 backdrop-blur p-3 rounded-3xl border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-gradient-to-b from-white/80 to-white/20">
          <div className="w-full rounded-2xl bg-slate-950 overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            
            {/* Панель управления браузера (Шапка макета) */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/90 shadow-sm shadow-rose-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm shadow-amber-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm shadow-emerald-500/20"></div>
              </div>
              <div className="bg-slate-950/80 text-[10px] text-slate-500 px-10 py-1 rounded-md border border-slate-800/40 font-mono select-none">
                edutrack.kz/workspace/dashboard
              </div>
              <div className="w-12"></div>
            </div>

            {/* Внутреннее содержимое интерфейса */}
            <div className="p-5 sm:p-7 flex flex-col gap-5 text-left font-sans text-xs text-slate-400 bg-slate-950 select-none">
              
              {/* Верхняя строка: Метрики */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Прогресс курса</div>
                    <div className="text-lg font-black text-white mt-1">74%</div>
                  </div>
                  <span className="text-xl bg-indigo-500/10 p-2 rounded-lg text-indigo-400">🎯</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Прогноз балла ЕНТ</div>
                    <div className="text-lg font-black text-indigo-400 mt-1">132 / 140</div>
                  </div>
                  <span className="text-xl bg-purple-500/10 p-2 rounded-lg text-purple-400">⚡</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Дней до ЕНТ</div>
                    <div className="text-lg font-black text-emerald-400 mt-1">112 дней</div>
                  </div>
                  <span className="text-xl bg-emerald-500/10 p-2 rounded-lg text-emerald-400">📆</span>
                </div>
              </div>

              {/* Основной контент: График и Чат-Ассистент */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                
                {/* Левая часть: Аналитика успеваемости */}
                <div className="md:col-span-3 bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 flex flex-col justify-between shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-200 font-bold text-xs">Статистика по профильным предметам</span>
                    <span className="text-[10px] text-indigo-400 font-medium">Обновлено только что</span>
                  </div>
                  <div className="h-40 flex items-end gap-3.5 pt-4">
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="w-full bg-indigo-500/80 hover:bg-indigo-500 h-16 rounded-t-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"></div>
                      <span className="text-[9px] text-slate-500 font-mono">Мат.Грам</span>
                    </div>
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="w-full bg-indigo-500/80 hover:bg-indigo-500 h-28 rounded-t-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"></div>
                      <span className="text-[9px] text-slate-500 font-mono">ИсторияК</span>
                    </div>
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="w-full bg-indigo-600 hover:bg-indigo-500 h-24 rounded-t-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
                      <span className="text-[9px] text-slate-500 font-mono">Чит.Грам</span>
                    </div>
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="w-full bg-purple-500/80 hover:bg-purple-500 h-32 rounded-t-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"></div>
                      <span className="text-[9px] text-slate-500 font-mono">Математика</span>
                    </div>
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="w-full bg-purple-600 hover:bg-purple-500 h-36 rounded-t-lg transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
                      <span className="text-[9px] text-slate-500 font-mono">Физика</span>
                    </div>
                  </div>
                </div>

                {/* Правая часть: AI-Ассистент */}
                <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex flex-col justify-between shadow-md">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/50">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                    <span className="text-white font-bold text-xs">AI Наставник EduTrack</span>
                  </div>
                  
                  <div className="my-3 space-y-3 flex-1 flex flex-col justify-center">
                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/30 text-indigo-200 text-[10px] leading-relaxed">
                      💡 <strong>AI разбор темы:</strong> «Даниил, вчера ты сделал 3 ошибки в логарифмах. Я перестроил твой план на сегодня. Начнем с разбора свойств степеней.»
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-300 text-[10px] leading-relaxed flex items-center gap-2.5">
                      <span className="text-base">📅</span>
                      <div>
                        <div className="font-bold text-white">Сегодня по расписанию:</div>
                        <div className="text-[9px] text-slate-500">16:30 • Практика ЕНТ: Логарифмы (ИИ)</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-slate-600 text-[9px] font-mono pl-1">Задать вопрос ИИ по задаче ЕНТ...</span>
                    <button className="bg-indigo-600 text-white px-3 py-1 rounded-md text-[9px] font-bold">Спросить</button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};