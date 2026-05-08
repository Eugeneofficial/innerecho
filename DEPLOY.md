# InnerEcho - Деплой на Vercel + Render

## 🚀 Быстрый старт

### 1️⃣ Подготовка (уже сделано ✅)

- ✅ Frontend настроен для переменных окружения
- ✅ Backend настроен для CORS и production
- ✅ Созданы конфигурационные файлы

---

## 📦 Деплой Backend на Render

### Шаг 1: Создай аккаунт на Render
1. Перейди на https://render.com
2. Нажми **Sign Up** → войди через GitHub
3. Подтверди email

### Шаг 2: Загрузи код на GitHub
```bash
cd "C:\Users\mrjek\OneDrive\Рабочий стол\InnerEcho"

# Инициализируй git (если еще не сделано)
git init
git add .
git commit -m "Initial commit - InnerEcho app"

# Создай репозиторий на GitHub и залей код
git remote add origin https://github.com/ТвойUsername/innerecho.git
git branch -M main
git push -u origin main
```

### Шаг 3: Создай Web Service на Render
1. На Render нажми **New +** → **Web Service**
2. Подключи свой GitHub репозиторий
3. Настрой параметры:
   - **Name:** `innerecho-backend`
   - **Region:** Frankfurt (ближе к России)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Добавь переменные окружения (Environment Variables):
   ```
   PORT = 3005
   NODE_ENV = production
   ALLOWED_ORIGINS = https://your-app.vercel.app
   ```
   (ALLOWED_ORIGINS обновишь после деплоя frontend)

5. Нажми **Create Web Service**

6. Дождись деплоя (3-5 минут)

7. **Скопируй URL** (будет типа `https://innerecho-backend.onrender.com`)

---

## 🌐 Деплой Frontend на Vercel

### Шаг 1: Создай аккаунт на Vercel
1. Перейди на https://vercel.com
2. Нажми **Sign Up** → войди через GitHub
3. Подтверди email

### Шаг 2: Импортируй проект
1. На Vercel нажми **Add New** → **Project**
2. Выбери свой репозиторий `innerecho`
3. Настрой параметры:
   - **Framework Preset:** Create React App
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

4. Добавь переменную окружения:
   ```
   REACT_APP_API_URL = https://innerecho-backend.onrender.com/api
   ```
   (Используй URL из Render, который скопировал выше)

5. Нажми **Deploy**

6. Дождись деплоя (2-3 минуты)

7. **Скопируй URL** (будет типа `https://innerecho.vercel.app`)

---

## 🔄 Обновление CORS на Backend

### После деплоя frontend:
1. Вернись на Render → твой Web Service
2. Перейди в **Environment**
3. Обнови переменную `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS = https://innerecho.vercel.app,http://localhost:3000
   ```
4. Сохрани → сервис автоматически перезапустится

---

## 📱 Установка PWA на телефон

### Android:
1. Открой `https://innerecho.vercel.app` в Chrome
2. Нажми меню (⋮) → **Добавить на главный экран**
3. Готово! Иконка появится на рабочем столе

### iPhone:
1. Открой в Safari
2. Нажми кнопку "Поделиться" 
3. Выбери **На экран "Домой"**
4. Готово!

---

## 🎯 Проверка работы

После деплоя проверь:
- ✅ Frontend открывается по URL
- ✅ Можно создать пользователя
- ✅ Можно добавить приём пищи
- ✅ Статистика загружается
- ✅ PWA устанавливается на телефон

---

## ⚠️ Важные моменты

### Render Free Plan:
- ⏰ Сервер "засыпает" после 15 минут неактивности
- 🐌 Первый запрос после сна = 30-60 секунд загрузки
- 💾 База данных SQLite сохраняется на диске
- 🔄 750 часов/месяц бесплатно (достаточно)

### Vercel Free Plan:
- ⚡ Мгновенная загрузка (CDN)
- 🚀 100 GB bandwidth/месяц
- 🔄 Автоматический деплой при push в GitHub

### Обновление приложения:
```bash
# Внеси изменения в код
git add .
git commit -m "Update: описание изменений"
git push

# Vercel и Render автоматически задеплоят новую версию!
```

---

## 🆘 Если что-то не работает

### Backend не запускается:
- Проверь логи на Render (Logs tab)
- Убедись что `Root Directory = server`
- Проверь что все зависимости в `package.json`

### Frontend не подключается к Backend:
- Проверь `REACT_APP_API_URL` в Vercel
- Проверь `ALLOWED_ORIGINS` в Render
- Открой DevTools (F12) → Console для ошибок

### База данных пустая:
- Render создаст новую базу при первом запуске
- Дефолтные пользователи создадутся автоматически

---

## 🎉 Готово!

Теперь у тебя:
- ✅ Приложение доступно из любой точки мира
- ✅ Работает на телефоне как нативное
- ✅ Автоматические обновления через git push
- ✅ Бесплатный хостинг

**URL твоего приложения:** `https://innerecho.vercel.app`

Наслаждайся! 🍽️
