/* eslint-disable */
import https from "https";
import fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 1. Инициализация Firebase Admin
const serviceAccountPath = "./firebase-key.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Ошибка: Файл firebase-key.json не найден в корне проекта.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

// 2. Инициализация Telegram Токена
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Ошибка: Укажите переменную окружения TELEGRAM_BOT_TOKEN.");
  console.log("Запуск: TELEGRAM_BOT_TOKEN=ваш_токен node parentBot.js");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${token}`;

// Вспомогательная функция для HTTP-запросов к Telegram API
const callTelegram = (method, data = {}) => {
  return new Promise((resolve, reject) => {
    const url = `${TELEGRAM_API}/${method}`;
    const payload = JSON.stringify(data);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.ok) {
            resolve(json.result);
          } else {
            reject(new Error(json.description));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
};

// Функция для отправки сообщений в Telegram
const sendMessage = async (chatId, text, options = {}) => {
  try {
    const formattedOptions = { ...options };
    if (formattedOptions.reply_markup && typeof formattedOptions.reply_markup === "object") {
      formattedOptions.reply_markup = JSON.stringify(formattedOptions.reply_markup);
    }
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      ...formattedOptions,
    });
  } catch (err) {
    console.error(`Ошибка отправки сообщения пользователю ${chatId}:`, err.message);
  }
};

// Главная клавиатура меню родителя
const parentKeyboard = {
  keyboard: [
    [{ text: "📊 Статистика успеваемости" }, { text: "🔮 Прогноз баллов ЕНТ" }],
    [{ text: "📝 Активность за неделю" }, { text: "❓ Справка" }]
  ],
  resize_keyboard: true,
};

// Локализация сообщений (RU/KK)
const locales = {
  ru: {
    welcomeNoRef: "👋 *Здравствуйте!*\n\nЭтот бот предназначен для родителей олимпийцев и учеников платформы *EduTrack ЕНТ AI*.\n\nЧтобы начать получать автоматические отчёты об успеваемости вашего ребёнка, перейдите по специальной реферальной ссылке, сгенерированной в его личном кабинете.",
    studentNotFound: "❌ *Ошибка!*\n\nУченик с никнеймом *@{nickname}* не найден на платформе. Пожалуйста, убедитесь в правильности ссылки.",
    linkSuccess: "👨‍👩‍👦 *Подключение успешно!*\n\nВы связали ваш аккаунт с учеником *@{nickname}*.\n\nИспользуйте меню кнопок внизу для просмотра статистики, прогноза баллов ЕНТ и недельной активности.",
    help: "💬 *Справка по командам:*\n\nНажимайте кнопки в меню внизу экрана:\n• *📊 Статистика успеваемости* — сводный отчет по предметам\n• *🔮 Прогноз баллов ЕНТ* — прогнозируемый балл ЕНТ на основе прохождения тем\n• *📝 Активность за неделю* — XP, решенные задачи и статус целей\n• *❓ Справка* — это сообщение",
    notLinked: "⚠️ *У вас нет подключенных учеников.*\n\nИспользуйте реферальную ссылку из личного кабинета ученика.",
    lockUltimate: "🔒 *Прогноз баллов ЕНТ доступен только на тарифе Ultimate.*\n\nУченику необходимо улучшить тариф подписки в личном кабинете на платформе для открытия родительского ИИ-прогнозирования баллов.",
    academicReport: "📊 *Сводный отчет по предметам*\n\nУченик: *@{nickname}*\nКласс: *{grade}*\nСрок до ЕНТ: *{daysLeft} дн.*\n\n📈 *Общий прогресс освоения тем:* {overallProgress}%\n\n📚 *Уровень по предметам:*\n{subjectsProgress}",
    forecastReport: "🔮 *ИИ-Прогноз балла ЕНТ*\n\nУченик: *@{nickname}*\n\n📈 *Прогнозируемый результат:* *{score} из 140 баллов*\n\n_Потемный расчет баллов по предметам:_\n{breakdown}\n\n💡 _Прогноз рассчитывается динамически на основе освоения тем кодификатора ЕНТ. Занимайтесь больше, чтобы повысить прогнозируемый балл!_",
    activityReport: "📝 *Активность ученика за неделю*\n\nУченик: *@{nickname}*\n\n🏆 *Набрано опыта (XP):* {xp}\n🔥 *Решено задач сегодня:* {solvedToday}\n📅 *Дни активности:* {activityDays}\n\n🎯 *Выполнение недельных целей:* \n{weeklyGoals}",
  }
};

// Функция поиска подписки родителя
const getParentSubscription = async (chatId) => {
  const subDoc = await db.collection("parent_subscriptions").doc(`parent_${chatId}`).get();
  return subDoc.exists ? subDoc.data() : null;
};

// Хэндлер команды /start
const handleStartCommand = async (chatId, param) => {
  if (!param || !param.startsWith("ref_")) {
    await sendMessage(chatId, locales.ru.welcomeNoRef, { reply_markup: parentKeyboard });
    return;
  }

  const nickname = param.replace("ref_", "").trim();
  
  // Проверяем существование ученика в Firestore
  const usersRef = db.collection("users");
  const studentSnap = await usersRef.where("nicknameLower", "==", nickname.toLowerCase()).get();

  if (studentSnap.empty) {
    const errorText = locales.ru.studentNotFound.replace("{nickname}", nickname);
    await sendMessage(chatId, errorText, { reply_markup: parentKeyboard });
    return;
  }

  // Создаем или обновляем связь
  const subRef = db.collection("parent_subscriptions").doc(`parent_${chatId}`);
  await subRef.set({
    parent_chat_id: chatId,
    student_nickname: nickname,
    parent_lang: "ru",
    is_active: true,
    createdAt: new Date().toISOString(),
  }, { merge: true });

  const successText = locales.ru.linkSuccess.replace("{nickname}", nickname);
  await sendMessage(chatId, successText, { reply_markup: parentKeyboard });
};

// Хэндлер кнопки "📊 Статистика успеваемости"
const handleStatusCommand = async (chatId) => {
  const sub = await getParentSubscription(chatId);
  if (!sub || !sub.is_active) {
    await sendMessage(chatId, locales.ru.notLinked, { reply_markup: parentKeyboard });
    return;
  }

  const t = locales.ru;

  const usersRef = db.collection("users");
  const studentSnap = await usersRef.where("nicknameLower", "==", sub.student_nickname.toLowerCase()).get();

  if (studentSnap.empty) {
    await sendMessage(chatId, t.studentNotFound.replace("{nickname}", sub.student_nickname), { reply_markup: parentKeyboard });
    return;
  }

  const studentData = studentSnap.docs[0].data();

  // Форматируем прогресс по предметам
  let subjectsProgress = "";
  if (Array.isArray(studentData.subjectsMastery) && studentData.subjectsMastery.length > 0) {
    subjectsProgress = studentData.subjectsMastery
      .map((s) => `• ${s.name}: *${s.progress || 0}%* (Уровень: _${s.level || "Базовый"}_)`)
      .join("\n");
  } else {
    subjectsProgress = "Предметы еще не осваивались.";
  }

  const report = t.academicReport
    .replace("{nickname}", studentData.nickname || sub.student_nickname)
    .replace("{grade}", studentData.grade || "11 класс")
    .replace("{daysLeft}", studentData.daysToUnt || "—")
    .replace("{overallProgress}", studentData.overallProgress || 0)
    .replace("{subjectsProgress}", subjectsProgress);

  await sendMessage(chatId, report, { reply_markup: parentKeyboard });
};

// Хэндлер кнопки "🔮 Прогноз баллов ЕНТ"
const handleForecastCommand = async (chatId) => {
  const sub = await getParentSubscription(chatId);
  if (!sub || !sub.is_active) {
    await sendMessage(chatId, locales.ru.notLinked, { reply_markup: parentKeyboard });
    return;
  }

  const t = locales.ru;

  const usersRef = db.collection("users");
  const studentSnap = await usersRef.where("nicknameLower", "==", sub.student_nickname.toLowerCase()).get();

  if (studentSnap.empty) {
    await sendMessage(chatId, t.studentNotFound.replace("{nickname}", sub.student_nickname), { reply_markup: parentKeyboard });
    return;
  }

  const studentData = studentSnap.docs[0].data();

  // Защита: Доступ к прогнозу только на тарифе Ultimate, Whitelisted или Founder
  const hasUltimateAccess = 
    studentData.tariff === "ultimate" || 
    studentData.tariff === "whitelisted" || 
    studentData.role === "founder";

  if (!hasUltimateAccess) {
    await sendMessage(chatId, t.lockUltimate, { reply_markup: parentKeyboard });
    return;
  }

  // Расчет ИИ-Прогноза балла
  let forecastScore = 0;
  let breakdown = "";

  if (Array.isArray(studentData.subjectsMastery) && studentData.subjectsMastery.length > 0) {
    const profileSubjects = studentData.subjectsMastery.filter(
      (s) =>
        s.name !== "История Казахстана" &&
        s.name !== "Грамотность чтения" &&
        s.name !== "Математическая грамотность"
    );
    const mandatorySubjects = studentData.subjectsMastery.filter(
      (s) =>
        s.name === "История Казахстана" ||
        s.name === "Грамотность чтения" ||
        s.name === "Математическая грамотность"
    );

    // Профильные предметы: вклад до 50 баллов каждый
    const profilePtsList = profileSubjects.map((s) => {
      const pts = Math.round(((s.progress || 0) / 100) * 50);
      return { name: s.name, pts, max: 50 };
    });

    const mandatoryWeights = {
      "История Казахстана": 20,
      "Грамотность чтения": 10,
      "Математическая грамотность": 10,
    };

    // Обязательные предметы: вклад до 20/10/10 баллов
    const mandatoryPtsList = mandatorySubjects.map((s) => {
      const maxPts = mandatoryWeights[s.name] || 10;
      const pts = Math.round(((s.progress || 0) / 100) * maxPts);
      return { name: s.name, pts, max: maxPts };
    });

    const allPtsList = [...profilePtsList, ...mandatoryPtsList];
    forecastScore = allPtsList.reduce((sum, item) => sum + item.pts, 0);

    breakdown = allPtsList
      .map((item) => `• ${item.name}: *${item.pts}* из *${item.max}* баллов`)
      .join("\n");
  } else {
    breakdown = "Прогресс по предметам отсутствует.";
  }

  const report = t.forecastReport
    .replace("{nickname}", studentData.nickname || sub.student_nickname)
    .replace("{score}", forecastScore)
    .replace("{breakdown}", breakdown);

  await sendMessage(chatId, report, { reply_markup: parentKeyboard });
};

// Хэндлер кнопки "📝 Активность за неделю"
const handleActivityCommand = async (chatId) => {
  const sub = await getParentSubscription(chatId);
  if (!sub || !sub.is_active) {
    await sendMessage(chatId, locales.ru.notLinked, { reply_markup: parentKeyboard });
    return;
  }

  const t = locales.ru;

  const usersRef = db.collection("users");
  const studentSnap = await usersRef.where("nicknameLower", "==", sub.student_nickname.toLowerCase()).get();

  if (studentSnap.empty) {
    await sendMessage(chatId, t.studentNotFound.replace("{nickname}", sub.student_nickname), { reply_markup: parentKeyboard });
    return;
  }

  const studentData = studentSnap.docs[0].data();

  // Форматируем дни активности
  let activityDays = "Нет активности";
  if (Array.isArray(studentData.activityDates) && studentData.activityDates.length > 0) {
    activityDays = `${studentData.activityDates.length} дн. (${studentData.activityDates.slice(-3).map(d => d.split("-")[2]).join(", ")} числа)`;
  }

  // Форматируем недельные цели
  let weeklyGoals = "";
  if (Array.isArray(studentData.weeklyGoals) && studentData.weeklyGoals.length > 0) {
    weeklyGoals = studentData.weeklyGoals
      .map((g) => {
        const isDone = g.current >= g.max;
        return `${isDone ? "✅" : "🕒"} ${g.text}: *${g.current}/${g.max}*`;
      })
      .join("\n");
  } else {
    weeklyGoals = "Цели на текущую неделю не установлены.";
  }

  const report = t.activityReport
    .replace("{nickname}", studentData.nickname || sub.student_nickname)
    .replace("{xp}", studentData.xp || 0)
    .replace("{solvedToday}", studentData.dailyTasksSolved || 0)
    .replace("{activityDays}", activityDays)
    .replace("{weeklyGoals}", weeklyGoals);

  await sendMessage(chatId, report, { reply_markup: parentKeyboard });
};

// Основной цикл опроса (Long Polling)
const poll = async () => {
  let offset = 0;
  console.log("Telegram Bot запущен и слушает события...");

  while (true) {
    try {
      const updates = await callTelegram("getUpdates", {
        offset,
        timeout: 10,
      });

      for (const update of updates) {
        offset = update.update_id + 1;

        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text.trim();

          if (text.startsWith("/start")) {
            const parts = text.split(" ");
            const param = parts.length > 1 ? parts[1] : null;
            await handleStartCommand(chatId, param);
          } else if (text === "/status" || text === "📊 Статистика успеваемости") {
            await handleStatusCommand(chatId);
          } else if (text === "🔮 Прогноз баллов ЕНТ") {
            await handleForecastCommand(chatId);
          } else if (text === "📝 Активность за неделю") {
            await handleActivityCommand(chatId);
          } else if (text === "/help" || text === "❓ Справка") {
            await sendMessage(chatId, locales.ru.help, { reply_markup: parentKeyboard });
          } else {
            await sendMessage(chatId, locales.ru.help, { reply_markup: parentKeyboard });
          }
        }
      }
    } catch (err) {
      console.error("Ошибка в цикле Telegram polling:", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
};

poll();
