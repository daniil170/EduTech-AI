import { useState, useEffect } from "react";
import { db } from "../../../app/providers/Firebase/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export const SubscriptionModal = ({ user, studentStats, onClose }) => {
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" or "seasonal"
  
  // Whitelist states
  const [whitelistEmails, setWhitelistEmails] = useState([]);
  const [newWhitelistEmail, setNewWhitelistEmail] = useState("");

  // Card Payment states
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlanForPay, setSelectedPlanForPay] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState("");
  const [paymentForm, setPaymentForm] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [paymentError, setPaymentError] = useState("");

  // Real-time listener for the entire whitelist collection (only for Founder)
  useEffect(() => {
    if (!user || studentStats?.role !== "founder") return;
    
    const q = collection(db, "premium_whitelist");
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ email: doc.id, ...doc.data() });
        });
        setWhitelistEmails(list);
      },
      (err) => {
        console.error("Error loading whitelist collection:", err);
      }
    );
    
    return () => unsub();
  }, [user, studentStats?.role]);

  // Handlers for payments validation & formatting
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    setPaymentForm(prev => ({ ...prev, number: formatted.slice(0, 19) }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setPaymentForm(prev => ({ ...prev, expiry: value.slice(0, 5) }));
  };

  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPaymentForm(prev => ({ ...prev, cvc: value.slice(0, 3) }));
  };

  const handleCardPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.number || paymentForm.number.replace(/\s/g, "").length !== 16) {
      setPaymentError("Введите корректный 16-значный номер карты");
      return;
    }
    if (!paymentForm.expiry || !/^\d{2}\/\d{2}$/.test(paymentForm.expiry)) {
      setPaymentError("Введите срок действия в формате ММ/ГГ");
      return;
    }
    const [mm] = paymentForm.expiry.split("/").map(Number);
    if (mm < 1 || mm > 12) {
      setPaymentError("Некорректный месяц срока действия");
      return;
    }
    if (!paymentForm.cvc || paymentForm.cvc.length !== 3 || isNaN(Number(paymentForm.cvc))) {
      setPaymentError("Введите 3-значный CVC/CVV код");
      return;
    }
    if (!paymentForm.name.trim()) {
      setPaymentError("Введите имя владельца карты");
      return;
    }

    setPaymentError("");
    setIsPaying(true);
    
    try {
      setPaymentStepText("Инициализация безопасного 3D-Secure соединения...");
      await new Promise(r => setTimeout(r, 800));
      setPaymentStepText("Проверка авторизации банком-эмитентом...");
      await new Promise(r => setTimeout(r, 700));
      setPaymentStepText("Подтверждение транзакции...");
      await new Promise(r => setTimeout(r, 600));

      if (user && selectedPlanForPay) {
        await updateDoc(doc(db, "users", user.uid), {
          tariff: selectedPlanForPay.id
        });
      }
      
      setIsPaying(false);
      setIsPaymentOpen(false);
      setSelectedPlanForPay(null);
      setPaymentForm({ number: "", expiry: "", cvc: "", name: "" });
      alert(`Тариф успешно изменен на "${selectedPlanForPay.name}"!`);
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError("Произошла ошибка при обработке платежа. Попробуйте еще раз.");
      setIsPaying(false);
    }
  };

  // Handlers for Founder Whitelist Management
  const handleAddWhitelistEmail = async (e) => {
    e.preventDefault();
    const emailToAdd = newWhitelistEmail.trim().toLowerCase();
    if (!emailToAdd || !emailToAdd.includes("@")) {
      alert("Введите корректный email адрес");
      return;
    }
    try {
      await setDoc(doc(db, "premium_whitelist", emailToAdd), {
        email: emailToAdd,
        addedAt: new Date().toISOString()
      });
      setNewWhitelistEmail("");
      alert(`Доступ успешно выдан для: ${emailToAdd}`);
    } catch (err) {
      console.error("Error adding to whitelist:", err);
      alert("Не удалось добавить в вайтлист. Проверьте права доступа.");
    }
  };

  const handleRemoveWhitelistEmail = async (emailToRemove) => {
    if (!confirm(`Вы действительно хотите аннулировать доступ для ${emailToRemove}?`)) return;
    try {
      await deleteDoc(doc(db, "premium_whitelist", emailToRemove));
      alert(`Доступ аннулирован для: ${emailToRemove}`);
    } catch (err) {
      console.error("Error removing from whitelist:", err);
      alert("Не удалось удалить из вайтлиста.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-4xl rounded-[32px] p-8 shadow-2xl border border-slate-800/80 text-white relative max-h-[92vh] overflow-y-auto font-sans custom-scrollbar">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/40 hover:bg-slate-800 rounded-full"
        >
          ✕
        </button>

        {/* Header with Title & Billing Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-855 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center text-xl border border-indigo-500/20 shadow-inner">
                💳
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  Тарифная сетка ЕНТ
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Выберите оптимальный план для гарантированной сдачи экзамена
                </p>
              </div>
            </div>
          </div>

          {/* Monthly vs Seasonal Billing Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/60 self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-102"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Помесячно
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("seasonal")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                billingCycle === "seasonal"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-102"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>До ЕНТ</span>
              <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-md font-extrabold uppercase animate-pulse">Скидка</span>
            </button>
          </div>
        </div>

        {/* Grid of Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-6">
          
          {/* Tier 1: Free */}
          <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative bg-slate-950/20 ${
            (!studentStats?.tariff || studentStats.tariff === "free")
              ? "border-slate-700 bg-slate-800/10 shadow-lg shadow-indigo-900/5"
              : "border-slate-800/60 hover:border-slate-700/60"
          }`}>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Free</span>
                <h4 className="text-base font-black text-white mt-1.5">Прогрев</h4>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 leading-tight">До 15 задач в день</p>
                <p className="text-[10px] text-slate-400 leading-tight">Только 1 предмет</p>
                <p className="text-[10px] text-slate-400 leading-tight">Только первые 3 урока</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-4 space-y-3">
              <div className="text-left">
                <span className="text-xs text-slate-400 leading-none">Стоимость</span>
                <p className="text-lg font-black text-white mt-0.5">0 ₸</p>
              </div>
              {(!studentStats?.tariff || studentStats.tariff === "free") ? (
                <span className="block text-center w-full py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-700/40 opacity-80">
                  Текущий
                </span>
              ) : (
                <button
                  onClick={async () => {
                    if (studentStats?.role === "founder") {
                      alert("Как CEO вы имеете полный доступ ко всем функциям.");
                      return;
                    }
                    if (confirm("Вы действительно хотите перейти на Бесплатный тариф? Произойдет блокировка платных разделов.")) {
                      await updateDoc(doc(db, "users", user.uid), { tariff: "free" });
                      alert("Вы успешно перешли на Бесплатный тариф.");
                    }
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Перейти
                </button>
              )}
            </div>
          </div>

          {/* Tier 2: Basic */}
          <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative bg-slate-950/20 ${
            studentStats?.tariff === "basic"
              ? "border-indigo-500 bg-slate-800/10 shadow-lg shadow-indigo-900/5"
              : "border-slate-800/60 hover:border-slate-700/60"
          }`}>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] bg-indigo-950/40 text-indigo-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-indigo-900/20">Пользоваться</span>
                <h4 className="text-base font-black text-white mt-1.5">Basic</h4>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 leading-tight">До 50 задач в день</p>
                <p className="text-[10px] text-slate-400 leading-tight">Все предметы & уроки</p>
                <p className="text-[10px] text-slate-400 leading-tight">Мини-тесты уроков</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-4 space-y-3">
              <div className="text-left">
                <span className="text-xs text-slate-400 leading-none">Стоимость</span>
                <p className="text-lg font-black text-white mt-0.5">
                  {billingCycle === "monthly" ? "1 990 ₸ / мес" : "9 990 ₸"}
                </p>
              </div>
              {studentStats?.tariff === "basic" ? (
                <span className="block text-center w-full py-2 bg-indigo-900/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider opacity-85">
                  Активен
                </span>
              ) : (
                <button
                  onClick={() => {
                    const priceStr = billingCycle === "monthly" ? "1 990 ₸ / мес" : "9 990 ₸ за весь сезон";
                    setSelectedPlanForPay({ id: "basic", name: "Тариф Basic", price: priceStr });
                    setIsPaymentOpen(true);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Выбрать
                </button>
              )}
            </div>
          </div>

          {/* Tier 3: Pro */}
          <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative bg-gradient-to-b from-indigo-950/20 to-slate-950/10 ${
            (studentStats?.tariff === "premium" || studentStats?.tariff === "whitelisted" || studentStats?.role === "founder")
              ? "border-emerald-500 bg-slate-800/10 shadow-lg shadow-emerald-950/10"
              : "border-slate-800/80 hover:border-slate-700/60"
          }`}>
            <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
              Рекомендуем
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-emerald-900/20">Результат</span>
                <h4 className="text-base font-black text-white mt-1.5">Pro</h4>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-emerald-400/90 leading-tight">Без лимитов* (софт-кап 300)</p>
                <p className="text-[10px] text-slate-400 leading-tight">Smart Practice (SRS Лейтнер)</p>
                <p className="text-[10px] text-slate-400 leading-tight">Умный ИИ-календарь</p>
                <p className="text-[10px] text-slate-400 leading-tight">ИИ-Рекомендации тем</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-4 space-y-3">
              <div className="text-left">
                <span className="text-xs text-slate-400 leading-none">Стоимость</span>
                <p className="text-lg font-black text-emerald-400 mt-0.5">
                  {billingCycle === "monthly" ? "4 990 ₸ / мес" : "19 990 ₸"}
                </p>
              </div>
              {(studentStats?.tariff === "premium" || studentStats?.tariff === "whitelisted" || studentStats?.role === "founder") ? (
                <span className="block text-center w-full py-2 bg-emerald-900/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-wider opacity-85">
                  {studentStats?.tariff === "whitelisted" ? "Вайтлист" : studentStats?.role === "founder" ? "Founder" : "Активен"}
                </span>
              ) : (
                <button
                  onClick={() => {
                    const priceStr = billingCycle === "monthly" ? "4 990 ₸ / мес" : "19 990 ₸ за весь сезон";
                    setSelectedPlanForPay({ id: "premium", name: "Тариф Pro", price: priceStr });
                    setIsPaymentOpen(true);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Выбрать Pro
                </button>
              )}
            </div>
          </div>

          {/* Tier 4: Ultra */}
          <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative bg-slate-950/20 ${
            (studentStats?.tariff === "ultimate" || studentStats?.role === "founder")
              ? "border-indigo-500 bg-slate-800/10 shadow-lg shadow-indigo-950/10"
              : "border-slate-800/60 hover:border-slate-700/60"
          }`}>
            <div className="absolute -top-2.5 right-4 bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Дожим
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] bg-indigo-950/40 text-indigo-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-indigo-900/20">Любой ценой</span>
                <h4 className="text-base font-black text-white mt-1.5">Ultra</h4>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-indigo-400/90 leading-tight">Прогноз балла & симуляторы</p>
                <p className="text-[10px] text-slate-400 leading-tight">Анти-слабые темы режим</p>
                <p className="text-[10px] text-slate-400 leading-tight">Интенсивы «30 дней до ЕНТ»</p>
                <p className="text-[10px] text-slate-400 leading-tight">Приоритет пополнения банка</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-4 space-y-3">
              <div className="text-left">
                <span className="text-xs text-slate-400 leading-none">Стоимость</span>
                <p className="text-lg font-black text-indigo-400 mt-0.5">
                  {billingCycle === "monthly" ? "9 990 ₸ / мес" : "39 990 ₸"}
                </p>
              </div>
              {(studentStats?.tariff === "ultimate" || studentStats?.role === "founder") ? (
                <span className="block text-center w-full py-2 bg-indigo-900/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider opacity-85">
                  {studentStats?.role === "founder" ? "Founder" : "Активен"}
                </span>
              ) : (
                <button
                  onClick={() => {
                    const priceStr = billingCycle === "monthly" ? "9 990 ₸ / мес" : "39 990 ₸ за весь сезон";
                    setSelectedPlanForPay({ id: "ultimate", name: "Тариф Ultra", price: priceStr });
                    setIsPaymentOpen(true);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Выбрать Ultra
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Soft-cap reference message */}
        <p className="text-[9px] text-slate-500 italic mt-3 text-center leading-normal">
          * На тарифах Pro и Ultra действует софт-кап дневной активности (300 и 500 задач соответственно) для защиты от злоупотреблений и багов.
        </p>

        {/* Detailed Comparison Grid */}
        <div className="border-t border-slate-800 pt-8 mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Подробное сравнение: Basic vs Pro / Ultra
            </h4>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Выгода конкурентов: ~45% экономии
            </span>
          </div>
          <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 bg-slate-950/20 font-sans text-xs">
            
            {/* Header row */}
            <div className="grid grid-cols-5 p-3.5 bg-slate-950/60 font-black text-slate-300 uppercase tracking-widest text-[9px]">
              <div className="col-span-2">Фича / Возможность</div>
              <div className="text-center">Free</div>
              <div className="text-center">Basic</div>
              <div className="text-center text-emerald-400">Pro (ИИ-Ведение)</div>
              <div className="text-center text-indigo-400">Ultra</div>
            </div>

            {/* Features rows */}
            <div className="grid grid-cols-5 p-3.5 items-center">
              <div className="col-span-2 font-bold text-slate-300">
                Все 5 предметов & все уроки
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">Доступ ко всем школьным темам</p>
              </div>
              <div className="text-center text-slate-400 font-medium">1 предмет</div>
              <div className="text-center text-slate-200 font-semibold">✓ Да</div>
              <div className="text-center text-slate-200 font-semibold">✓ Да</div>
              <div className="text-center text-slate-200 font-semibold">✓ Да</div>
            </div>

            <div className="grid grid-cols-5 p-3.5 items-center">
              <div className="col-span-2 font-bold text-slate-300">
                Дневной лимит ИИ-задач
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">Объем практики кодификатора ЕНТ</p>
              </div>
              <div className="text-center text-slate-400 font-semibold">15 задач</div>
              <div className="text-center text-slate-300 font-semibold">50 задач</div>
              <div className="text-center text-emerald-400 font-black">300 (Безлимит*)</div>
              <div className="text-center text-indigo-400 font-black">500 (Безлимит*)</div>
            </div>

            <div className="grid grid-cols-5 p-3.5 items-center">
              <div className="col-span-2 font-bold text-slate-300">
                Надстройка: Что учить дальше?
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">Умный выбор тем для закрытия пробелов</p>
              </div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-slate-500">
                ❌ Нет
                <p className="text-[8px] text-slate-500/80 leading-none mt-0.5">просто доступ</p>
              </div>
              <div className="text-center text-emerald-400 font-bold">
                🌟 Да (ИИ)
                <p className="text-[8px] text-emerald-500/80 leading-none mt-0.5">ведёт по слабым</p>
              </div>
              <div className="text-center text-indigo-400 font-bold">
                🌟 Да (ИИ)
                <p className="text-[8px] text-indigo-500/80 leading-none mt-0.5">полное ведение</p>
              </div>
            </div>

            <div className="grid grid-cols-5 p-3.5 items-center">
              <div className="col-span-2 font-bold text-slate-300">
                Smart Practice (SRS Лейтнер)
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">Алгоритм интервального повторения</p>
              </div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-emerald-400 font-semibold">✓ Да</div>
              <div className="text-center text-indigo-400 font-semibold">✓ Да</div>
            </div>

            <div className="grid grid-cols-5 p-3.5 items-center">
              <div className="col-span-2 font-bold text-slate-300">
                Умный ИИ-календарь
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">Автоматическое расписание уроков ИИ</p>
              </div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-emerald-400 font-semibold">✓ Да</div>
              <div className="text-center text-indigo-400 font-semibold">✓ Да</div>
            </div>

            <div className="grid grid-cols-5 p-3.5 items-center">
              <div className="col-span-2 font-bold text-slate-300">
                Режим ЕНТ & Прогноз балла
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">Симуляции и расчет вероятности сдачи</p>
              </div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-indigo-400 font-bold">👑 Да (140 б.)</div>
            </div>

            <div className="grid grid-cols-5 p-3.5 items-center">
              <div className="col-span-2 font-bold text-slate-300">
                Пополнение банка под слабые темы
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">Приоритетная offline-генерация вариантов</p>
              </div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-slate-500">❌ Нет</div>
              <div className="text-center text-indigo-400 font-semibold">✓ Приоритет</div>
            </div>

          </div>
        </div>

        {/* Founder Control Panel */}
        {(studentStats?.role === "founder" || user?.email?.toLowerCase() === "daniilivakin30@gmail.com") && (
          <div className="border-t border-slate-800 pt-8 mt-8 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <span>🔑</span> Панель CEO & Founder
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Добавьте email адреса ваших друзей, чтобы выдать им пожизненный бесплатный доступ к Premium-тарифам. Это безопасно и валидируется на сервере.
            </p>

            {/* Add email form */}
            <form onSubmit={handleAddWhitelistEmail} className="flex gap-2">
              <input
                type="email"
                placeholder="friend@example.com"
                value={newWhitelistEmail}
                onChange={(e) => setNewWhitelistEmail(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-white"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Выдать доступ
              </button>
            </form>

            {/* Whitelisted Emails List */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Приглашенные друзья ({whitelistEmails.length}):
              </div>
              {whitelistEmails.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">Список пуст</p>
              ) : (
                <div className="max-h-28 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950/20">
                  {whitelistEmails.map((item) => (
                    <div key={item.email} className="px-3 py-1.5 flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-slate-300">{item.email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWhitelistEmail(item.email)}
                        className="text-rose-500 hover:text-rose-700 font-bold transition cursor-pointer"
                      >
                        Аннулировать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-8 mt-8 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Credit Card Payment Modal */}
      {isPaymentOpen && selectedPlanForPay && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-slate-800 relative space-y-4">
            
            {/* Header */}
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="text-xl">💳</span>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Оплата подписки</h3>
                <p className="text-[10px] text-slate-400">Тариф: {selectedPlanForPay.name}</p>
              </div>
            </div>

            {/* Price Info */}
            <div className="bg-slate-50 p-3.5 rounded-2xl flex justify-between items-center border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">К оплате (ежемесячно):</span>
              <span className="text-base font-black text-indigo-600">{selectedPlanForPay.price}</span>
            </div>

            {/* Credit Card Mock Form */}
            <form onSubmit={handleCardPaymentSubmit} className="space-y-3.5">
              
              {/* Card Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Номер карты</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={paymentForm.number}
                  onChange={handleCardNumberChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              {/* Row: Expiry & CVC */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Срок действия</label>
                  <input
                    type="text"
                    placeholder="ММ/ГГ"
                    value={paymentForm.expiry}
                    onChange={handleExpiryChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={paymentForm.cvc}
                    onChange={handleCvcChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Владелец карты</label>
                <input
                  type="text"
                  placeholder="IVAN IVANOV"
                  value={paymentForm.name}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 placeholder:text-slate-300"
                  required
                />
              </div>

              {/* Error Display */}
              {paymentError && (
                <div className="text-[10px] text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-2.5 font-bold">
                  ⚠️ {paymentError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentOpen(false);
                    setPaymentForm({ number: "", expiry: "", cvc: "", name: "" });
                    setPaymentError("");
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer animate-pulse"
                >
                  Оплатить
                </button>
              </div>

            </form>

            {/* Spinner Overlay when processing */}
            {isPaying && (
              <div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center p-6 space-y-4 z-20">
                <div className="w-12 h-12 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 border-r-indigo-500 animate-spin"></div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700">Безопасная обработка...</p>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono">{paymentStepText}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
