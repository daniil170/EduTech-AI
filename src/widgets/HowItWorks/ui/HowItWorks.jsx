export const HowItWorks = () => {
  const steps = [
    {
      id: "01",
      title: "Создание работы",
      description:
        "Учитель или AI мгновенно генерирует проверочную работу по нужной теме, классу и уровню сложности.",
      icon: "📋",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      id: "02",
      title: "Выполнение и проверка",
      description:
        "Ученик решает задачи в удобном интерфейсе. Платформа автоматически проверяет ответы и выставляет баллы.",
      icon: "⚡",
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      id: "03",
      title: "AI-Анализ ошибок",
      description:
        "Искусственный интеллект детально разбирает каждый неверный ответ, объясняя саму суть математического правила.",
      icon: "🧠",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      id: "04",
      title: "Персональный план",
      description:
        "Система автоматически подбирает новые задачи для проработки именно тех тем, где возникли трудности.",
      icon: "🎯",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 bg-slate-50 border-y border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Как устроен процесс обучения
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Всего 4 простых шага, которые превратят пробелы в знаниях в
            уверенные отличные оценки.
          </p>
        </div>

        {/* Сетка шагов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step) => (
            <div
              key={step.id}
              className="bg-white border border-slate-200/60 p-6 rounded-2xl relative shadow-sm hover:shadow-md transition"
            >
              {/* Номер шага и иконка */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-slate-100 font-mono tracking-tight">
                  {step.id}
                </span>
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl ${step.color}`}
                >
                  {step.icon}
                </div>
              </div>

              {/* Текст */}
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
