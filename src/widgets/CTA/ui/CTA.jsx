export const CTA = ({ onAuthClick }) => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl px-6 py-12 md:p-16 text-center relative overflow-hidden shadow-xl shadow-indigo-100">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
              Готов сдать ЕНТ на максимальный балл?
            </h2>
            <p className="mt-4 text-lg text-indigo-100">
              Присоединяйся к EduTrack ЕНТ AI сегодня и начни готовиться по персональному плану, созданному искусственным интеллектом специально для тебя.
            </p>
            <div className="mt-8 flex justify-center">
              <button 
                onClick={onAuthClick}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-2xl text-base font-semibold shadow-md transition transform hover:-translate-y-0.5"
              >
                Начать подготовку бесплатно
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-40 h-40 bg-purple-500/20 rounded-full blur-xl"></div>
        </div>
      </div>
    </section>
  );
};