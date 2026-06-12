export const Hero = ({ onAuthClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-purple-50 to-white pt-24 pb-12 sm:pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium mb-6">
          Разработано для учеников 9 и 11 классов
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-6xl max-w-4xl mx-auto leading-tight">
          Сдавай экзамены на максимум с <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI-подготовкой</span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Загрузи любую задачу, получи мгновенное визуальное объяснение и персональный план подготовки. Твой личный AI-репетитор доступен 24/7.
        </p>

        {/* Кнопки действия */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Попробовать бесплатно теперь открывает модалку */}
          <button 
            onClick={onAuthClick}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
          >
            Попробовать бесплатно
          </button>
          
          {/* Смотреть демо тоже можно привязать к авторизации или оставить как заглушку */}
          <button 
            onClick={onAuthClick}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl text-base font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>▶</span> Смотреть демо
          </button>
        </div>

        {/* Интерактивный макет ноутбука */}
        <div className="mt-16 relative mx-auto max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-4 bg-gradient-to-tr from-slate-100 to-white">
          <div className="aspect-[16/10] w-full rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col gap-4 text-left font-mono text-xs text-slate-400">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-slate-500 text-[10px]">EduTrack AI — Панель Аналитики Ученика</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 h-full pt-2">
                <div className="col-span-2 border border-slate-800 rounded-lg p-4 bg-slate-900/50 flex flex-col justify-between">
                  <div className="text-slate-200 font-sans font-bold text-sm">График успеваемости (Теория вероятностей)</div>
                  <div className="h-32 flex items-end gap-3 pt-4">
                    <div className="w-full bg-indigo-500 h-[40%] rounded-t"></div>
                    <div className="w-full bg-indigo-500 h-[55%] rounded-t"></div>
                    <div className="w-full bg-indigo-500 h-[45%] rounded-t"></div>
                    <div className="w-full bg-indigo-600 h-[75%] rounded-t"></div>
                    <div className="w-full bg-purple-500 h-[90%] rounded-t"></div>
                  </div>
                </div>
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/50 flex flex-col gap-3">
                  <div className="text-slate-200 font-sans font-bold text-xs">Слабые темы</div>
                  <div className="space-y-2 font-sans text-[11px]">
                    <div className="p-2 bg-red-950/40 text-red-400 rounded border border-red-900/30">✕ Логарифмы (42%)</div>
                    <div className="p-2 bg-amber-950/40 text-amber-400 rounded border border-amber-900/30">⚠ Стереометрия (65%)</div>
                    <div className="p-2 bg-green-950/40 text-green-400 rounded border border-green-900/30">✓ Производная (92%)</div>
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