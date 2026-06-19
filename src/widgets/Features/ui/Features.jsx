export const Features = () => {
  return (
    <section id="features" className="py-28 bg-white relative overflow-hidden">
      {/* Мягкие декоративные фоновые элементы */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-purple-100/30 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-100/30 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Заголовок секции */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-5xl tracking-tight leading-none mb-5">
            Мощные AI-инструменты для подготовки
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Интеллектуальная подготовка ко всем предметам тестирования ЕНТ с учетом твоей индивидуальной специализации.
          </p>
        </div>

        {/* Сетка карточек (Первый ряд) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* 1. AI Решатель задач */}
          <div className="group bg-slate-50/70 border border-slate-100 p-8 rounded-3xl flex flex-col justify-between hover:bg-white hover:border-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/35 transition-all duration-300 hover:-translate-y-1">
            <div className="mb-8">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/80 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 text-2xl shadow-sm">
                🤖
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                AI-Тренажер задач ЕНТ
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Генерируй бесконечные тестовые задания по спецификации ЕНТ. AI мгновенно проверяет ответы и выдает подробнейший пошаговый разбор каждого решения.
              </p>
            </div>
            
            {/* Имитация тетради с формулами (Premium дизайн) */}
            <div className="w-full h-44 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:10px_10px] bg-slate-50 rounded-2xl border border-slate-200/60 p-5 font-serif text-xs text-slate-500 relative overflow-hidden shadow-inner flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-indigo-100/40 pb-2.5">
                <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-400">Формула разбора</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="italic text-indigo-950 font-bold text-center text-sm md:text-base my-auto bg-white/60 py-2.5 rounded-xl border border-slate-100/80 shadow-sm backdrop-blur-sm">
                {"f'(x) = lim (Δx → 0) [f(x + Δx) - f(x)] / Δx"}
              </div>
              <div className="flex items-center justify-between font-sans text-[9px] text-slate-400">
                <span>Математика • Производная</span>
                <span>EduTrack ЕНТ AI</span>
              </div>
            </div>
          </div>

          {/* 2. Аналитика Прогресса */}
          <div className="group bg-indigo-50/30 border border-indigo-100/50 p-8 rounded-3xl flex flex-col justify-between hover:bg-white hover:border-indigo-200/40 hover:shadow-xl hover:shadow-indigo-100/35 transition-all duration-300 hover:-translate-y-1">
            <div className="mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-sm shadow-indigo-100">
                📈
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                Анализ и прогноз баллов
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Следи за ростом своей успеваемости. Наш искусственный интеллект глубоко анализирует результаты тренировок и прогнозирует итоговый балл ЕНТ.
              </p>
            </div>
            
            {/* Прогресс бар из макета (Premium дизайн) */}
            <div className="w-full bg-white rounded-2xl border border-indigo-100/60 p-6 shadow-sm shadow-indigo-100/10 mt-auto">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  Текущая готовность к ЕНТ
                </span>
                <span className="text-indigo-600 font-black text-sm">84%</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-[2px]">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500"
                  style={{ width: "84%" }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-medium">
                <span>0 баллов</span>
                <span>Цель: 140 баллов</span>
              </div>
            </div>
          </div>
        </div>

        {/* Сетка карточек (Второй ряд) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 3. Умная подготовка */}
          <div className="group bg-slate-50/70 border border-slate-100 p-8 rounded-3xl hover:bg-white hover:border-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/35 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-sm">
              📝
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
              Умное планирование
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              AI автоматически генерирует расписание подготовки и темы для изучения, распределяя их по календарю с учетом оставшегося до ЕНТ времени.
            </p>
          </div>

          {/* 4. Интерактивный AI-Тьютор (Темная премиум-карточка) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-8 rounded-3xl md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl border border-slate-800 transition-all duration-300 hover:border-indigo-500/40">
            <div className="max-w-md relative z-10">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 inline-block">
                Премиум AI
              </span>
              <h3 className="text-2xl font-extrabold mb-3 tracking-tight">
                Интерактивный AI-Тьютор
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Задавай любые вопросы и общайся с ИИ напрямую. Бот поможет тебе разобрать даже самые сложные законы физики, правила грамматики и исторические даты.
              </p>
            </div>
            
            {/* Иконка фиолетового робота с анимацией и тенью */}
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-[0_4px_25px_rgba(99,102,241,0.55)] flex-shrink-0 animate-bounce relative z-10 border border-indigo-400/20">
              🤖
            </div>
            
            {/* Декоративные световые круги */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>

        </div>

      </div>
    </section>
  );
};
