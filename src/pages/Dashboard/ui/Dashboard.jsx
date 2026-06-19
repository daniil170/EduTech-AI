import { auth } from "../../../app/providers/Firebase/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const userName = user?.email?.split("@")[0] || "Ученик";

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* ХЕДЕР ПАНЕЛИ */}
      <nav className="border-b border-slate-200/60 px-6 py-4 flex justify-between items-center bg-white backdrop-blur-md sticky top-0 z-30 shadow-sm shadow-slate-100/40">
        <div className="flex items-center gap-2 font-black text-xl tracking-tight">
          <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-200">E</span>
          EduTrack <span className="text-indigo-600">AI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/40">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
              {userName[0].toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-600 hidden sm:block">{user?.email}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-100"
          >
            Выйти
          </button>
        </div>
      </nav>

      <main className="space-y-20 pb-24">
        
        {/* HERO БЛОК ПАНЕЛИ */}
        <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-16 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              🇰🇿 Твой персональный трек подготовки в Казахстане
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-slate-900">
              Сдавай <span className="text-indigo-600">ЕНТ и экзамены 9 класса</span> на максимум
            </h1>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Искусственный интеллект EduTrack проанализирует твои знания, выявит пробелы по госпрограмме РК и составит личный пошаговый план до заветных баллов.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => navigate("/workspace")} 
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Начать обучение
              </button>
              <button 
                onClick={() => navigate("/workspace")}
                className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition"
              >
                Открыть тренажер задач
              </button>
            </div>
          </div>
          
          {/* Интерактивный виджет-превью */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-100/80 relative">
            <div className="aspect-[16/10] w-full rounded-2xl bg-slate-900 overflow-hidden relative flex flex-col p-5 font-mono text-[11px] text-slate-400">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-slate-500 font-sans">EduTrack AI Core v4.0</span>
                </div>
                <span className="text-indigo-400 font-sans font-bold">Анализ активен</span>
              </div>
              <div className="space-y-2 font-sans">
                <p className="text-slate-300">⚡ [ИИ]: Загружен последний пробный тест ЕНТ...</p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-emerald-400 font-bold">✓ Слабые места успешно локализованы:</p>
                  <p className="text-slate-400 pl-4">• Математ. грамотность: Текстовые задачи на движение (Приоритет: Высокий)</p>
                  <p className="text-slate-400 pl-4">• История Казахстана: Период Золотой Орды (Приоритет: Средний)</p>
                </div>
                <p className="text-indigo-400 animate-pulse">● Генерация персонального воркспейса для {userName}...</p>
              </div>
            </div>
          </div>
        </section>

        {/* ВОЗВРАЩАЕМ И РАСШИРЯЕМ: ПРОЦЕСС ОБУЧЕНИЯ (3 Простых шага) */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase">Как устроен процесс обучения</h2>
            <p className="text-slate-500 text-sm md:text-base mt-2">Всего 3 шага отделяют тебя от максимального результата на итоговой аттестации</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Шаг 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative group hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-indigo-100 mb-6 group-hover:scale-105 transition-transform">1</div>
              <h4 className="font-bold text-lg text-slate-900">Диагностический тест</h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Наш AI проведет быстрый срез знаний по выбранным предметам 9 или 11 класса и в точности определит твои реальные пробелы.</p>
            </div>
            {/* Шаг 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative group hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-indigo-100 mb-6 group-hover:scale-105 transition-transform">2</div>
              <h4 className="font-bold text-lg text-slate-900">Умная генерация плана</h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Алгоритм подберет только те темы и задачи, в которых ты ошибаешься. Никакой лишней зубрежки и траты времени на то, что ты уже знаешь.</p>
            </div>
            {/* Шаг 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative group hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-indigo-100 mb-6 group-hover:scale-105 transition-transform">3</div>
              <h4 className="font-bold text-lg text-slate-900">Интерактивный тренажер</h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Решай задачи, получай моментальные видео- и текстовые разборы от ИИ 24/7 и следи за ростом своей шкалы готовности до 50 баллов.</p>
            </div>
          </div>
        </section>

        {/* НОВЫЙ БЛОК: КАРТОЧКИ ПРЕДМЕТОВ ДЛЯ КАЗАХСТАНА */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Доступные предметы для подготовки</h2>
              <p className="text-slate-500 text-sm mt-1">Выбирай нужное направление и переходи к практике</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">Каталог обновлен</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Математическая грамотность", qs: "15 вопросов", level: "Обязательный", icon: "📐" },
              { title: "История Казахстана", qs: "20 вопросов", level: "Обязательный", icon: "🇰🇿" },
              { title: "Грамотность чтения", qs: "15 вопросов", level: "Обязательный", icon: "📖" },
              { title: "Профильная Математика/Физика", qs: "Комбо-трек", level: "По выбору", icon: "🚀" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all group">
                <div>
                  <div className="text-2xl mb-4 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
                  <h4 className="font-bold text-slate-800 text-base leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{item.qs}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">{item.level}</span>
                  <button onClick={() => navigate("/workspace")} className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Учить <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* СЕКЦИЯ: ИННОВАЦИИ И АНАЛИТИКА */}
        <section className="bg-slate-900 text-white py-20 rounded-[40px] max-w-7xl mx-auto px-6 relative overflow-hidden shadow-xl shadow-slate-900/10">
          <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs bg-indigo-500/20 text-indigo-400 font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-indigo-500/30">Технологии машинного обучения</span>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Твой результат — наша главная метрика</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                Мы отказались от скучных длинных лекций. Наша ИИ-модель точечно подбирает микро-задания. Система сама понимает, когда ты запутался, и моментально предлагает подсказку или разбор правила на простом языке.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <div className="text-4xl font-black text-indigo-400">94%</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Точность прогноза баллов</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-purple-400">+42%</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">К скорости усвоения тем</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-white/10 p-8 rounded-3xl space-y-4 backdrop-blur-sm">
              <h4 className="font-bold text-lg text-indigo-400">⚡ Смарт-аналитика успеваемости</h4>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-white/5">
                  <span className="text-slate-300">Пройдено тем госпрограммы РК:</span>
                  <span className="font-bold text-white">18 / 45</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-white/5">
                  <span className="text-slate-300">Решено тестовых задач ИИ:</span>
                  <span className="font-bold text-white">248 задач</span>
                </div>
                <div className="w-full bg-white h-2 rounded-full overflow-hidden mt-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[40%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600 rounded-full blur-3xl"></div>
        </section>

        {/* НОВЫЙ БЛОК: ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ (FAQ) */}
        <section className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-black text-center tracking-tight text-slate-900 uppercase mb-12">Часто задаваемые вопросы</h2>
          <div className="space-y-4">
            {[
              { q: "Подходит ли платформа для новой спецификации ЕНТ?", a: "Да, база заданий и ИИ-модель полностью адаптированы под официальные стандарты и спецификации тестового центра Казахстана на текущий учебный год." },
              { q: "Как ИИ понимает мои ошибки?", a: "Система анализирует не только правильность ответа, но и паттерны твоего выбора, время решения и типы допускаемых погрешностей, выстраивая персональное дерево знаний." },
              { q: "Можно ли готовиться к экзаменам 9 класса (итоговая аттестация)?", a: "Абсолютно! При первом входе в рабочую область ты сможешь выбрать свой трек: либо подготовка к ЕНТ (11 класс), либо выпускные экзамены за 9 класс." }
            ].map((faq, index) => (
              <div key={index} className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <span className="text-indigo-600 text-lg">✦</span> {faq.q}
                </h4>
                <p className="text-slate-500 text-xs md:text-sm mt-2 pl-5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ФИНАЛЬНЫЙ CTA (Обновленный до 50 баллов) */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[40px] py-16 px-8 md:p-20 text-center text-white relative overflow-hidden shadow-xl shadow-indigo-100">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Готов(а) к 50 баллам?</h2>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
                Присоединяйся к личному интерактивному пространству. Запусти ИИ-наставника прямо сейчас и переходи в рабочий кабинет.
              </p>
              <div className="pt-4">
                <button 
                  onClick={() => navigate("/workspace")} 
                  className="bg-white text-indigo-600 hover:bg-indigo-50 px-10 py-5 rounded-2xl font-black text-base md:text-lg shadow-xl hover:scale-[1.01] transition transform active:scale-100"
                >
                  Начать обучение сейчас 🚀
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 bg-white rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-40 h-40 bg-purple-500/20 rounded-full blur-xl"></div>
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-200/60 bg-white py-8 px-6 text-center text-slate-400 text-xs font-medium">
        <p>EduTrack AI. Разработано для школьников Казахстана 🇰🇿. Все права защищены. <span className="text-indigo-600 font-bold ml-2">Developed by Ivakin Daniil</span></p>
      </footer>

    </div>
  );
};