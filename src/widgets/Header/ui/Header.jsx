export const Header = ({ onAuthClick }) => {
  return (
    <header className="w-full bg-white backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <span className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black">E</span>
          EduTrack <span className="text-indigo-600">ЕНТ AI</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition">Возможности</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition">Как это работает</a>
        </nav>

        <div className="flex items-center gap-4">
          {/* Добавили экшены клика */}
          <button onClick={onAuthClick} className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition">
            Войти
          </button>
          <button onClick={onAuthClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition">
            Начать бесплатно
          </button>
        </div>

      </div>
    </header>
  );
};