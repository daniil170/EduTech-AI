export const Footer = () => {
  return (
    <footer className="bg-slate-50/50 border-t border-slate-100 py-16 text-center text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Бренд */}
        <div className="flex items-center gap-2.5 font-extrabold text-slate-900 select-none">
          <span className="w-6 h-6 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-[11px] font-black shadow-sm">
            E
          </span>
          <span>
            EduTrack <span className="text-indigo-600 font-bold">ЕНТ AI</span>
          </span>
        </div>

        {/* Текст и Вотермарк */}
        <div className="flex flex-col sm:items-end gap-1.5 text-center sm:text-right">
          <p className="text-slate-400 text-xs">
            EduTrack ЕНТ AI. Все права защищены. Специализированная AI-подготовка к ЕНТ.
          </p>
          <p className="text-[11px] text-slate-400">
            Платформа разработана: <span className="text-indigo-600 font-bold hover:text-indigo-500 transition-colors">Ivakin Daniil</span>
          </p>
        </div>

      </div>
    </footer>
  );
};