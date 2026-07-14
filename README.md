# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Telegram-бот для родителей (ЕНТ)

Мы написали автономный, легковесный Node.js-скрипт бота (`parentBot.js`), который работает напрямую с вашей базой данных Firestore и не требует установки дополнительных библиотек.

### Настройка и запуск бота:

1. **Создайте бота в Telegram:**
   - Откройте Telegram и найдите [@BotFather](https://t.me/BotFather).
   - Отправьте команду `/newbot` и следуйте инструкциям для создания бота.
   - Запишите полученный токен API (например, `1234567890:ABCdef...`).
   - Назовите бота `edutrack_parent_bot` или измените имя ссылки в файлах настроек проекта на ваше.

2. **Запуск бота локально:**
   - Откройте терминал в корне проекта и выполните:
     ```bash
     TELEGRAM_BOT_TOKEN="ВАШ_ТОКЕН_API" node parentBot.js
     ```
   - Бот успешно запустится, подключится к Firestore через `firebase-key.json` и начнет обрабатывать входящие сообщения в реальном времени.

3. **Возможности бота:**
   - **Автоматическая связка (Deep Linking):** Когда родитель переходит по ссылке `https://t.me/edutrack_parent_bot?start=ref_nickname`, бот связывает его `chatId` с профилем ученика.
   - **Академический отчет (/status):** Родитель может в любой момент запросить актуальные баллы, XP, ежедневную активность и цели ученика на текущую неделю.

