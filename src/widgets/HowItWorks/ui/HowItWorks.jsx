export const HowItWorks = () => {
  const steps = [
    {
      id: "01",
      title: "Создание работы",
      description:
        "AI мгновенно генерирует проверочную работу по нужной теме, вашему классу и уровню сложности.",
      icon: "📋",
      color: "bg-blue-50 text-blue-600 border-blue-100/50 shadow-sm shadow-blue-100/10",
    },
    {
      id: "02",
      title: "Выполнение и проверка",
      description:
        "Решайте задачи в удобном интерфейсе. Платформа автоматически проверяет ответы и выставляет баллы.",
      icon: "⚡",
      color: "bg-amber-50 text-amber-600 border-amber-100/50 shadow-sm shadow-amber-100/10",
    },
    {
      id: "03",
      title: "AI-Анализ ошибок",
      description:
        "Искусственный интеллект детально разбирает каждый неверный ответ, объясняя саму суть правил кодификатора ЕНТ.",
      icon: "🧠",
      color: "bg-purple-50 text-purple-600 border-purple-100/50 shadow-sm shadow-purple-100/10",
    },
    {
      id: "04",
      title: "Персональный план",
      description:
        "Система автоматически подбирает новые задачи для проработки именно тех тем ЕНТ, где возникли трудности.",
      icon: "🎯",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-sm shadow-emerald-100/10",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-28 bg-slate-50/50 border-y border-slate-100 relative overflow-hidden"
    >
      {/* Сетка размытий на фоне */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Заголовок */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-5xl tracking-tight leading-none mb-5">
            Как устроен процесс обучения
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Всего 4 простых шага, которые превратят пробелы в знаниях в высокий балл на реальном ЕНТ.
          </p>
        </div>

        {/* Сетка шагов с горизонтальной соединительной полосой для десктопов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {/* Декоративная линия соединяющая шаги на больших экранах */}
          <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-indigo-100 via-indigo-200 to-purple-100 -translate-y-12 z-0"></div>

          {steps.map((step) => (
            <div
              key={step.id}
              className="group bg-white border border-slate-200/50 p-7 rounded-3xl relative shadow-sm hover:shadow-xl hover:border-slate-300/40 transition-all duration-300 hover:-translate-y-1.5 z-10 flex flex-col justify-between"
            >
              <div>
                {/* Номер шага и иконка */}
                <div className="flex items-center justify-between mb-8">
                  <span className="text-4xl font-black text-slate-100 font-mono tracking-tight select-none group-hover:text-indigo-500/10 transition-colors">
                    {step.id}
                  </span>
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 ${step.color}`}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Текст */}
                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Декоративный мини-индикатор снизу */}
              <div className="w-10 h-1 bg-slate-100 rounded-full mt-6 group-hover:bg-indigo-500 transition-colors duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
