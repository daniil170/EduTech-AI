import { useNavigate } from "react-router-dom";

export const Header = ({ onAuthClick, user }) => {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Логотип */}
        <div className="flex items-center gap-2.5 font-extrabold text-xl text-slate-900 cursor-pointer select-none" onClick={() => navigate("/")}>
          <span className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md shadow-indigo-200/50">
            E
          </span>
          <span className="tracking-tight">
            EduTrack <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">ЕНТ AI</span>
          </span>
        </div>

        {/* Навигация */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-indigo-600 hover:after:w-full after:transition-all after:duration-300 pb-1">
            Возможности
          </a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-indigo-600 hover:after:w-full after:transition-all after:duration-300 pb-1">
            Как это работает
          </a>
        </nav>

        {/* Действия */}
        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={() => navigate("/workspace")}
              className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5.5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200/40 cursor-pointer"
            >
              Личный кабинет
            </button>
          ) : (
            <>
              <button 
                onClick={onAuthClick} 
                className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors duration-200 cursor-pointer"
              >
                Войти
              </button>
              <button 
                onClick={onAuthClick} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200/40 cursor-pointer"
              >
                Начать бесплатно
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};