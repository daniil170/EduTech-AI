export const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-100 py-12 text-center text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <span className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px] font-black">
            E
          </span>
          EduTrack ЕНТ AI
        </div>
        <p>
          EduTrack ЕНТ AI. Все права защищены. Специализированная подготовка к ЕНТ.
          <span className="block sm:inline sm:ml-4 text-xs text-indigo-600 font-bold">Developed by Ivakin Daniil</span>
        </p>
      </div>
    </footer>
  );
};