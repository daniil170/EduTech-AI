export const Features = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Мощные AI-инструменты для каждого предмета
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Создано, чтобы справиться со всеми сложностями учебной программы
            старших классов.
          </p>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. AI Решатель задач */}
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6 text-xl">
                📷
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                AI-Решатель задач
              </h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Сделай фото любой задачи по математике, физике или химии. Наш AI
                разложит её на простые и понятные визуальные шаги.
              </p>
            </div>
            {/* Имитация тетради с формулами (как на картинке) */}
            <div className="w-full h-40 bg-white rounded-xl border border-slate-200/60 p-4 font-serif text-xs text-slate-500 relative overflow-hidden shadow-inner flex flex-col justify-between">
              <div className="border-b border-indigo-100 pb-2">
                Пример решения:
              </div>
              <div className="italic text-indigo-900 text-center text-sm my-auto">
                {"f'(x) = lim (Δx → 0) [f(x + Δx) - f(x)] / Δx"}
              </div>
              <div className="text-[10px] text-right text-slate-400">
                EduTrack AI Solver
              </div>
            </div>
          </div>

          {/* 2. Аналитика Прогресса */}
          <div className="bg-indigo-50/40 border border-indigo-100/60 p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 text-xl">
                📈
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Аналитика прогресса
              </h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Точно знай, где ты находишься. Прогнозируй свои результаты на
                реальных экзаменах на основе твоего текущего уровня мастерства.
              </p>
            </div>
            {/* Прогресс бар из макета */}
            <div className="w-full bg-white rounded-xl border border-indigo-100 p-6 shadow-sm mt-auto">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Готовность к экзаменам</span>
                <span className="text-indigo-600">84%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                  style={{ width: "84%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижний ряд (Умная подготовка и Интерактивный Тьютор) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* 3. Умная подготовка */}
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl md:col-span-1">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center mb-6 text-xl">
              📝
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Умная подготовка
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Персональные пробные экзамены, которые адаптируются под твои
              слабые места, гарантируя, что ты тратишь время там, где это важнее
              всего.
            </p>
          </div>

          {/* 4. Интерактивный AI-Тьютор (Темная карточка) */}
          <div className="bg-slate-900 text-white p-8 rounded-2xl md:col-span-2 flex items-center justify-between gap-6 relative overflow-hidden">
            <div className="max-w-md relative z-10">
              <h3 className="text-xl font-bold mb-2">
                Интерактивный AI-Тьютор
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Не просто получай готовые ответы. Общайся с искусственным
                интеллектом, чтобы глубже погрузиться в темы, которые кажутся
                тебе сложными.
              </p>
            </div>
            {/* Иконка фиолетового робота/чат-баббла из Figma */}
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-500/20 flex-shrink-0 animate-bounce">
              🤖
            </div>
            {/* Декоративный круг на фоне */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
