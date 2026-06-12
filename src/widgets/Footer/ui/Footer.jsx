export const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-100 py-12 text-center text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <span className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px] font-black">
            E
          </span>
          EduTrack AI
        </div>
        <p>© 2026 EduTrack AI. Все права защищены. Создано для учеников 9–11 классов.</p>
      </div>
    </footer>
  );
};