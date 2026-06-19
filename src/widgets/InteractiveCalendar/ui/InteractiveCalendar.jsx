import { useState } from "react";

export const InteractiveCalendar = ({ 
  events = [], 
  onAddEvent, 
  onAutoSchedule,
  onEventClick,
  onToggleComplete
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventType, setNewEventType] = useState("lesson");

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (onAddEvent) {
      onAddEvent({
        title: newEventTitle,
        date: newEventDate,
        time: newEventTime,
        type: newEventType, // "lesson", "exam", "personal"
      });
    }
    setIsAddEventOpen(false);
    setNewEventTitle("");
    setNewEventTime("");
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Make Monday the first day
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ empty: true, key: `empty-${i}` });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const dayEvents = events.filter(e => e.date === dateStr);
    const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
    calendarDays.push({ empty: false, day: i, dateStr, events: dayEvents, isToday, key: `day-${i}` });
  }

  const getEventBadgeStyles = (type, completed) => {
    if (completed) {
      return "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60";
    }
    switch (type) {
      case 'exam': return "bg-red-50 text-red-600 border-red-100";
      case 'lesson': return "bg-indigo-50 text-indigo-600 border-indigo-100";
      default: return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
  };

  return (
    <div className="bg-white backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-md shadow-indigo-200">📅</span>
            Календарь подготовки
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Ваш персональный план до экзаменов</p>
        </div>
        
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button 
            onClick={onAutoSchedule}
            className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          >
            🤖 AI Расписание
          </button>
          <button 
            onClick={() => setIsAddEventOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-md"
          >
            + Добавить
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="px-6 py-4 flex justify-between items-center bg-white">
        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{monthNames[month]} {year}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
            ←
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 transition">
            Сегодня
          </button>
          <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
            →
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-6 bg-slate-50/30 overflow-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[700px]">
          {/* Weekday headers */}
          {weekDays.map((day, idx) => (
            <div key={idx} className="text-center pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}

          {/* Days */}
          {calendarDays.map((cell) => (
            <div 
              key={cell.key} 
              className={`min-h-[120px] rounded-2xl border p-2 flex flex-col gap-1 transition-all
                ${cell.empty ? 'bg-transparent border-transparent' : 'bg-white border-slate-200/60 hover:border-indigo-300 hover:shadow-md'}
                ${cell.isToday ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}
              `}
            >
              {!cell.empty && (
                <>
                  <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                    ${cell.isToday ? 'bg-indigo-600 text-white' : 'text-slate-600'}
                  `}>
                    {cell.day}
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                    {cell.events.map((evt, idx) => (
                      <div 
                        key={evt.id || idx} 
                        className={`text-[10px] leading-tight p-1.5 rounded-lg border flex items-center gap-1.5 font-semibold transition-all
                          ${getEventBadgeStyles(evt.type, evt.completed)}
                        `}
                        title={`${evt.title}${evt.completed ? ' (Выполнено)' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!evt.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (onToggleComplete) {
                              onToggleComplete(evt.id, !evt.completed);
                            }
                          }}
                          className="w-3 h-3 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white"
                        />
                        <div 
                          className="truncate flex-1 cursor-pointer hover:opacity-80" 
                          onClick={() => onEventClick && onEventClick(evt)}
                        >
                          {evt.time && <span className="opacity-70 mr-1">{evt.time}</span>}
                          {evt.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900">Новое событие</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Название</label>
                <input 
                  required 
                  value={newEventTitle} 
                  onChange={e => setNewEventTitle(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  placeholder="Например: Пробник по Математике"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Дата</label>
                  <input 
                    type="date" 
                    required 
                    value={newEventDate} 
                    onChange={e => setNewEventDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Время</label>
                  <input 
                    type="time" 
                    value={newEventTime} 
                    onChange={e => setNewEventTime(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Тип события</label>
                <select 
                  value={newEventType} 
                  onChange={e => setNewEventType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="lesson">📚 Урок / Теория</option>
                  <option value="exam">📝 Пробный экзамен</option>
                  <option value="personal">💡 Личное</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md shadow-indigo-200">
                Создать
              </button>
              <button type="button" onClick={() => setIsAddEventOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition">
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
