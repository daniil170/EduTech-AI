import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../app/providers/Firebase/firebase";

export const UsersAnalytics = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tariffFilter, setTariffFilter] = useState("all");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const querySnap = await getDocs(collection(db, "users"));
        const list = [];
        querySnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setUsers(list);
      } catch (err) {
        console.error("Error fetching users for analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleTariffChange = async (userId, newTariff) => {
    try {
      await updateDoc(doc(db, "users", userId), { tariff: newTariff });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, tariff: newTariff } : u))
      );
    } catch (err) {
      alert("Не удалось обновить тариф: " + err.message);
    }
  };

  // Calculations
  const totalUsers = users.length;
  
  const tariffCounts = users.reduce((acc, u) => {
    const t = u.tariff || "free";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const premiumCount = (tariffCounts.premium || 0) + (tariffCounts.ultimate || 0) + (tariffCounts.whitelisted || 0);
  const totalXp = users.reduce((sum, u) => sum + (u.xp || 0), 0);
  const averageXp = totalUsers > 0 ? Math.round(totalXp / totalUsers) : 0;

  const filteredUsers = users.filter((u) => {
    const emailMatches = u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (tariffFilter === "all") return emailMatches;
    return emailMatches && (u.tariff || "free") === tariffFilter;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Header */}
      <div>
        <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">
          CEO Аналитика
        </span>
        <h2 className="text-xl font-black mt-2 text-slate-900">
          Сводная аналитика пользователей платформы
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Анализируйте активность учеников, распределение тарифов и управляйте доступами в реальном времени.
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-8 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl text-indigo-600">
              👥
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Всего аккаунтов</p>
              <h3 className="text-2xl font-black text-slate-900">{totalUsers}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl text-amber-600">
              ⚡
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Премиум-тарифы</p>
              <h3 className="text-2xl font-black text-slate-900">{premiumCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-xl text-emerald-600">
              🏆
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Суммарный опыт (XP)</p>
              <h3 className="text-2xl font-black text-slate-900">{totalXp.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-xl text-rose-600">
              📊
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Средний XP на ученика</p>
              <h3 className="text-2xl font-black text-slate-900">{averageXp}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Chart & Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Распределение пользователей по тарифам</h3>
            
            <div className="space-y-3 pt-2">
              {[
                { name: "Free (Бесплатный)", key: "free", color: "bg-slate-400" },
                { name: "Basic (Базовый)", key: "basic", color: "bg-blue-500" },
                { name: "Premium (Премиум)", key: "premium", color: "bg-indigo-600" },
                { name: "Ultimate (Максимальный)", key: "ultimate", color: "bg-amber-500" },
                { name: "Whitelisted (Спец-доступ)", key: "whitelisted", color: "bg-emerald-500" },
              ].map((t) => {
                const count = tariffCounts[t.key] || 0;
                const percent = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                return (
                  <div key={t.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">{t.name}</span>
                      <span className="text-slate-900">{count} ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${t.color}`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Быстрые инсайты</h3>
            <div className="space-y-4 pt-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                <span>Доля платных пользователей:</span>
                <span className="font-bold text-slate-900">
                  {totalUsers > 0 ? Math.round((premiumCount / totalUsers) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                <span>Самый популярный тариф:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {Object.entries(tariffCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "free"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span>Прошли диагностику:</span>
                <span className="font-bold text-slate-900">
                  {users.filter(u => u.hasPassedDiagnostic).length} / {totalUsers}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-sm text-slate-900">Список зарегистрированных учеников</h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Поиск по email или ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-4 py-2.5 w-64 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            
            <select
              value={tariffFilter}
              onChange={(e) => setTariffFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все тарифы</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="ultimate">Ultimate</option>
              <option value="whitelisted">Whitelisted</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Загрузка списка пользователей...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 italic">
            Пользователи не найдены.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Ученик (Email/ID)</th>
                  <th className="py-3 px-4">Тариф</th>
                  <th className="py-3 px-4">Уровень / Опыт (XP)</th>
                  <th className="py-3 px-4">Класс</th>
                  <th className="py-3 px-4">Решено за сегодня</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((user) => {
                  const xpVal = user.xp || 0;
                  const currentLvl = Math.floor(xpVal / 1000) + 1;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{user.email || user.displayName || "Без имени"}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.tariff || "free"}
                          onChange={(e) => handleTariffChange(user.id, e.target.value)}
                          className="bg-slate-100 border border-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="free">FREE</option>
                          <option value="basic">BASIC</option>
                          <option value="premium">PREMIUM</option>
                          <option value="ultimate">ULTIMATE</option>
                          <option value="whitelisted">WHITELISTED</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            LVL {currentLvl}
                          </span>
                          <span className="text-slate-500">({xpVal} XP)</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{user.grade || "Не указан"}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">
                        {user.dailyTasksSolved || 0} задач
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
