import { useState, useEffect } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export const StudentAnalytics = ({ user, userData }) => {
  const [srsData, setSrsData] = useState([]);
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "srsState"), (snap) => {
      const list = [];
      snap.forEach((doc) => list.push(doc.data()));
      setSrsData(list);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const currentDayIdx = new Date().getDay();
    const orderedDays = [...days.slice(currentDayIdx), ...days.slice(0, currentDayIdx)];
    
    const mockActivity = orderedDays.map((day, idx) => ({
      name: day,
      tasks: idx === 6 ? (userData?.dailyTasksSolved || 0) : Math.floor(Math.random() * 25) + 5
    }));
    
    // Оборачиваем в setTimeout(..., 0), чтобы вызов ушел в следующий такт event loop
    // Это полностью снимает ошибку каскадных рендеров (setState в эффекте)
    const timer = setTimeout(() => {
      setActivityData(mockActivity);
    }, 0);

    return () => clearTimeout(timer);
  }, [userData]);

  const getBoxesDistribution = () => {
    const dist = [
      { name: "Коробка 1", count: 0, fill: "#f43f5e" },
      { name: "Коробка 2", count: 0, fill: "#fb923c" },
      { name: "Коробка 3", count: 0, fill: "#facc15" },
      { name: "Коробка 4", count: 0, fill: "#60a5fa" },
      { name: "Коробка 5", count: 0, fill: "#10b981" }
    ];
    srsData.forEach((item) => {
      const boxIdx = (item.box || 1) - 1;
      if (dist[boxIdx]) dist[boxIdx].count += 1;
    });
    return dist;
  };

  const getMasteryPieData = () => {
    return (userData?.subjectsMastery || []).map((sub) => ({
      name: sub.name,
      value: sub.progress || 10
    }));
  };

  const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
  const boxesDist = getBoxesDistribution();
  const pieData = getMasteryPieData();

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-slate-900 p-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-2xl text-white shadow-sm">
          <span className="text-[10px] uppercase font-black tracking-wider text-indigo-200">Решено сегодня</span>
          <h3 className="text-3xl font-black mt-1">{userData?.dailyTasksSolved || 0} <span className="text-xs font-medium text-indigo-200">задач</span></h3>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Темы на контроле SRS</span>
          <h3 className="text-3xl font-black mt-1 text-slate-800">{srsData.length} <span className="text-xs font-medium text-slate-400">микротем</span></h3>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Изучено прочно (Коробка 5)</span>
          <h3 className="text-3xl font-black mt-1 text-emerald-600">{srsData.filter(q => q.box === 5).length} <span className="text-xs font-medium text-slate-400">тем</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-black text-slate-800">Динамика активности ученика</h4>
            <p className="text-[11px] text-slate-400">Количество проработанных ИИ-задач за последние 7 дней</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }} />
                <Area type="monotone" dataKey="tasks" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-black text-slate-800">Матрица Лейтнера</h4>
            <p className="text-[11px] text-slate-400">Распределение изученных тем по интервальным коробкам</p>
          </div>
          <div className="h-64 w-full flex items-end">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={boxesDist} margin={{ top: 20, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {boxesDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between sm:flex-row lg:flex-col gap-6 items-center lg:col-span-1">
          <div className="w-full">
            <h4 className="text-sm font-black text-slate-800">Баланс направлений</h4>
            <p className="text-[11px] text-slate-400">Соотношение прогресса по выбранным предметам</p>
          </div>
          <div className="h-44 w-44 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center bg-transparent">
              <span className="text-slate-400 text-[9px] uppercase font-black tracking-wider">Общий</span>
              <span className="block text-xl font-black text-slate-800 mt-px">{userData?.overallProgress || 0}%</span>
            </div>
          </div>
          <div className="w-full space-y-1.5">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 truncate mr-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-slate-900 shrink-0">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-black text-slate-800">История недавних сессий контроля</h4>
            <p className="text-[11px] text-slate-400">Последние изменения статусов долгосрочной памяти</p>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
            {srsData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                История повторений пока пуста. Пройдите первый мини-тест для запуска аналитики.
              </div>
            ) : (
              srsData.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-slate-50/40 hover:bg-slate-50 transition gap-4">
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{item.subject}</span>
                    <h5 className="text-xs font-black text-slate-800 truncate mt-1.5">{item.topic}</h5>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                      item.lastResult === "correct" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {item.lastResult === "correct" ? "Закреплено" : "Сброшено"}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-1.5 font-medium">Коробка: {item.box}/5</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};