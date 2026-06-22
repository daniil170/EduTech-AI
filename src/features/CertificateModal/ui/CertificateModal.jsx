export const CertificateModal = ({ userName, studentStats, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative border-8 border-double border-amber-500/30 text-center space-y-6 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 print:hidden"
        >
          ✕
        </button>
        
        {/* Certificate border decoration */}
        <div className="absolute inset-2 border border-amber-500/20 rounded-2xl pointer-events-none"></div>

        <div className="space-y-2">
          <span className="text-4xl text-amber-500">🏆</span>
          <h2 className="text-2xl font-serif font-black tracking-wide uppercase text-amber-800">
            Сертификат об окончании курса
          </h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            EduTrack ЕНТ AI • Подготовка к ЕНТ 2027
          </p>
        </div>

        <div className="py-6 space-y-4">
          <p className="text-xs italic text-slate-500">Настоящим подтверждается, что</p>
          <h3 className="text-xl font-bold text-slate-900 underline decoration-amber-500/40 decoration-2 underline-offset-8">
            {userName}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            успешно завершил индивидуальную траекторию подготовки по направлению <br />
            <span className="font-bold text-indigo-600">{studentStats?.profileCombination || "Математика и Физика"}</span>, <br />
            прошел еженедельные срезы знаний и сдал комплексную финальную симуляцию ЕНТ с результатом
          </p>
          <div className="w-fit mx-auto bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-2xl px-6 py-2.5 rounded-2xl shadow-md border border-amber-600/30">
            {studentStats?.finalExamScore || 0} / 140 баллов
          </div>
        </div>

        <div className="flex justify-between items-end pt-8 border-t border-slate-100 max-w-md mx-auto text-left text-[10px]">
          <div>
            <p className="text-slate-400 font-bold uppercase">Платформа обучения</p>
            <p className="font-bold text-slate-700 mt-1">EduTrack AI ЕНТ</p>
            <p className="text-slate-400">Дата: {studentStats?.finalExamPassedAt ? new Date(studentStats.finalExamPassedAt).toLocaleDateString("ru-RU") : new Date().toLocaleDateString("ru-RU")}</p>
          </div>
          <div className="text-center relative">
            <div className="absolute -top-6 left-4 w-12 h-12 bg-indigo-500/5 rounded-full border border-indigo-500/10 flex items-center justify-center font-serif text-[8px] font-black text-indigo-600/30 select-none uppercase tracking-tight -rotate-12 pointer-events-none">
              Разработано Даниилом Ивакиным
            </div>
            <p className="text-slate-400 font-bold uppercase">Ведущий ИИ-Куратор</p>
            <div className="font-serif italic font-bold text-slate-800 mt-1 border-b border-slate-300 pb-0.5 px-4">
              Gemini-2.5-Flash
            </div>
            <p className="text-[8px] text-slate-400 mt-0.5">Цифровая подпись подтверждена</p>
          </div>
        </div>

        {/* Watermark */}
        <div className="pt-2 text-center text-[8px] text-slate-300 font-bold uppercase tracking-widest select-none pointer-events-none">
          developed by Ivakin Daniil
        </div>

        <div className="flex justify-center gap-3 pt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            🖨️ Распечатать сертификат
          </button>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
