const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3005;

// CORS настройки для production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3005'];

// Создать папку для загрузок
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

app.use(cors({
  origin: function(origin, callback) {
    // Разрешить запросы без origin (мобильные приложения, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(uploadsDir));

// ===== USERS =====

// Получить всех пользователей
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить пользователя по ID
app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать пользователя
app.post('/api/users', (req, res) => {
  try {
    const { name, avatar, daily_calories, daily_protein, daily_fats, daily_carbs, current_weight, target_weight } = req.body;
    const result = db.prepare(`
      INSERT INTO users (name, avatar, daily_calories, daily_protein, daily_fats, daily_carbs, current_weight, target_weight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, avatar, daily_calories, daily_protein, daily_fats, daily_carbs, current_weight, target_weight);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить пользователя
app.put('/api/users/:id', (req, res) => {
  try {
    const { name, avatar, daily_calories, daily_protein, daily_fats, daily_carbs, current_weight, target_weight } = req.body;
    db.prepare(`
      UPDATE users
      SET name = ?, avatar = ?, daily_calories = ?, daily_protein = ?, daily_fats = ?, daily_carbs = ?, current_weight = ?, target_weight = ?
      WHERE id = ?
    `).run(name, avatar, daily_calories, daily_protein, daily_fats, daily_carbs, current_weight, target_weight, req.params.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MEALS =====

// Загрузить фото
app.post('/api/upload', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ url: photoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все приёмы пищи (с фильтрацией и поиском)
app.get('/api/meals', (req, res) => {
  try {
    const { userId, date, period, search, minCalories, maxCalories, minProtein, maxProtein, minFats, maxFats, minCarbs, maxCarbs, mealTime, sortBy, sortOrder, limit, offset } = req.query;
    let query = 'SELECT m.*, u.name as user_name, u.avatar as user_avatar FROM meals m JOIN users u ON m.user_id = u.id';
    const params = [];
    const conditions = [];

    if (userId) {
      conditions.push('m.user_id = ?');
      params.push(userId);
    }

    if (date) {
      const startOfDay = new Date(date).setHours(0, 0, 0, 0) / 1000;
      const endOfDay = new Date(date).setHours(23, 59, 59, 999) / 1000;
      conditions.push('m.created_at BETWEEN ? AND ?');
      params.push(startOfDay, endOfDay);
    }

    if (period === 'week') {
      const weekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
      conditions.push('m.created_at >= ?');
      params.push(weekAgo);
    }

    if (period === 'month') {
      const monthAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      conditions.push('m.created_at >= ?');
      params.push(monthAgo);
    }

    // Поиск по названию и заметкам
    if (search) {
      conditions.push('(m.name LIKE ? OR m.notes LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Фильтры по калориям
    if (minCalories) {
      conditions.push('m.calories >= ?');
      params.push(parseInt(minCalories));
    }
    if (maxCalories) {
      conditions.push('m.calories <= ?');
      params.push(parseInt(maxCalories));
    }

    // Фильтры по белкам
    if (minProtein) {
      conditions.push('m.protein >= ?');
      params.push(parseInt(minProtein));
    }
    if (maxProtein) {
      conditions.push('m.protein <= ?');
      params.push(parseInt(maxProtein));
    }

    // Фильтры по жирам
    if (minFats) {
      conditions.push('m.fats >= ?');
      params.push(parseInt(minFats));
    }
    if (maxFats) {
      conditions.push('m.fats <= ?');
      params.push(parseInt(maxFats));
    }

    // Фильтры по углеводам
    if (minCarbs) {
      conditions.push('m.carbs >= ?');
      params.push(parseInt(minCarbs));
    }
    if (maxCarbs) {
      conditions.push('m.carbs <= ?');
      params.push(parseInt(maxCarbs));
    }

    // Фильтр по типу приёма пищи
    if (mealTime) {
      conditions.push('m.meal_time = ?');
      params.push(mealTime);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Сортировка
    const validSortFields = ['created_at', 'calories', 'protein', 'fats', 'carbs', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY m.${sortField} ${sortDirection}`;

    // Пагинация
    const limitValue = parseInt(limit) || 50;
    const offsetValue = parseInt(offset) || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitValue, offsetValue);

    const meals = db.prepare(query).all(...params);

    // Добавить реакции к каждому приёму пищи
    meals.forEach(meal => {
      const reactions = db.prepare('SELECT * FROM reactions WHERE meal_id = ?').all(meal.id);
      meal.reactions = reactions;
    });

    // Получить общее количество для пагинации
    let countQuery = 'SELECT COUNT(*) as total FROM meals m';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countParams = params.slice(0, params.length - 2); // Убрать limit и offset
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      meals,
      pagination: {
        total,
        limit: limitValue,
        offset: offsetValue,
        hasMore: offsetValue + meals.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить приём пищи по ID
app.get('/api/meals/:id', (req, res) => {
  try {
    const meal = db.prepare('SELECT m.*, u.name as user_name, u.avatar as user_avatar FROM meals m JOIN users u ON m.user_id = u.id WHERE m.id = ?').get(req.params.id);
    if (!meal) return res.status(404).json({ error: 'Приём пищи не найден' });

    const reactions = db.prepare('SELECT * FROM reactions WHERE meal_id = ?').all(meal.id);
    meal.reactions = reactions;

    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить приём пищи
app.post('/api/meals', (req, res) => {
  try {
    const { user_id, name, calories, protein, fats, carbs, photo, meal_time, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO meals (user_id, name, calories, protein, fats, carbs, photo, meal_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, name, calories, protein || 0, fats || 0, carbs || 0, photo, meal_time || 'other', notes);

    const meal = db.prepare('SELECT m.*, u.name as user_name, u.avatar as user_avatar FROM meals m JOIN users u ON m.user_id = u.id WHERE m.id = ?').get(result.lastInsertRowid);
    meal.reactions = [];
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить приём пищи
app.put('/api/meals/:id', (req, res) => {
  try {
    const { name, calories, protein, fats, carbs, photo, meal_time, notes } = req.body;
    db.prepare(`
      UPDATE meals
      SET name = ?, calories = ?, protein = ?, fats = ?, carbs = ?, photo = ?, meal_time = ?, notes = ?
      WHERE id = ?
    `).run(name, calories, protein, fats, carbs, photo, meal_time, notes, req.params.id);

    const meal = db.prepare('SELECT m.*, u.name as user_name, u.avatar as user_avatar FROM meals m JOIN users u ON m.user_id = u.id WHERE m.id = ?').get(req.params.id);
    const reactions = db.prepare('SELECT * FROM reactions WHERE meal_id = ?').all(meal.id);
    meal.reactions = reactions;
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить приём пищи
app.delete('/api/meals/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM meals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== REACTIONS =====

// Добавить/удалить реакцию
app.post('/api/reactions', (req, res) => {
  try {
    const { meal_id, user_id, emoji } = req.body;

    // Проверить существует ли уже такая реакция
    const existing = db.prepare('SELECT * FROM reactions WHERE meal_id = ? AND user_id = ? AND emoji = ?').get(meal_id, user_id, emoji);

    if (existing) {
      // Удалить реакцию
      db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
      res.json({ action: 'removed', reaction: existing });
    } else {
      // Добавить реакцию
      const result = db.prepare('INSERT INTO reactions (meal_id, user_id, emoji) VALUES (?, ?, ?)').run(meal_id, user_id, emoji);
      const reaction = db.prepare('SELECT * FROM reactions WHERE id = ?').get(result.lastInsertRowid);
      res.json({ action: 'added', reaction });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== COMMENTS =====

// Получить комментарии к приёму пищи
app.get('/api/meals/:mealId/comments', (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.meal_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.mealId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить комментарий
app.post('/api/comments', (req, res) => {
  try {
    const { meal_id, user_id, text } = req.body;
    const result = db.prepare('INSERT INTO comments (meal_id, user_id, text) VALUES (?, ?, ?)').run(meal_id, user_id, text);

    const comment = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить комментарий
app.delete('/api/comments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TEMPLATES =====

// Получить шаблоны пользователя
app.get('/api/templates/:userId', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать шаблон
app.post('/api/templates', (req, res) => {
  try {
    const { user_id, name, calories, protein, fats, carbs, meal_time } = req.body;
    const result = db.prepare(`
      INSERT INTO templates (user_id, name, calories, protein, fats, carbs, meal_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, name, calories, protein || 0, fats || 0, carbs || 0, meal_time || 'other');

    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить шаблон
app.delete('/api/templates/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== WATER LOG =====

// Получить водный баланс за дату
app.get('/api/water/:userId', (req, res) => {
  try {
    const { date } = req.query;
    const waterLog = db.prepare('SELECT * FROM water_log WHERE user_id = ? AND date = ?').get(req.params.userId, date || new Date().toISOString().split('T')[0]);
    res.json(waterLog || { glasses: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить водный баланс
app.post('/api/water', (req, res) => {
  try {
    const { user_id, glasses, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const existing = db.prepare('SELECT * FROM water_log WHERE user_id = ? AND date = ?').get(user_id, targetDate);

    if (existing) {
      db.prepare('UPDATE water_log SET glasses = ? WHERE id = ?').run(glasses, existing.id);
      const updated = db.prepare('SELECT * FROM water_log WHERE id = ?').get(existing.id);
      res.json(updated);
    } else {
      const result = db.prepare('INSERT INTO water_log (user_id, glasses, date) VALUES (?, ?, ?)').run(user_id, glasses, targetDate);
      const waterLog = db.prepare('SELECT * FROM water_log WHERE id = ?').get(result.lastInsertRowid);
      res.json(waterLog);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== WEIGHT LOG =====

// Получить историю веса
app.get('/api/weight/:userId', (req, res) => {
  try {
    const { period } = req.query;
    let query = 'SELECT * FROM weight_log WHERE user_id = ?';
    const params = [req.params.userId];

    if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query += ' AND date >= ?';
      params.push(weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query += ' AND date >= ?';
      params.push(monthAgo);
    }

    query += ' ORDER BY date DESC';

    const weightLog = db.prepare(query).all(...params);
    res.json(weightLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить запись веса
app.post('/api/weight', (req, res) => {
  try {
    const { user_id, weight, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = db.prepare('INSERT INTO weight_log (user_id, weight, date) VALUES (?, ?, ?)').run(user_id, weight, targetDate);
    const weightLog = db.prepare('SELECT * FROM weight_log WHERE id = ?').get(result.lastInsertRowid);

    // Обновить текущий вес пользователя
    db.prepare('UPDATE users SET current_weight = ? WHERE id = ?').run(weight, user_id);

    res.json(weightLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== EVENTS =====

// Получить события пользователя
app.get('/api/events/:userId', (req, res) => {
  try {
    const { date, upcoming } = req.query;
    let query = 'SELECT * FROM events WHERE user_id = ?';
    const params = [req.params.userId];

    if (date) {
      query += ' AND event_date = ?';
      params.push(date);
    } else if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query += ' AND event_date >= ? AND is_completed = 0';
      params.push(today);
    }

    query += ' ORDER BY event_date ASC, event_time ASC';

    const events = db.prepare(query).all(...params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать событие
app.post('/api/events', (req, res) => {
  try {
    const { user_id, title, description, event_date, event_time, reminder_minutes } = req.body;
    const result = db.prepare(`
      INSERT INTO events (user_id, title, description, event_date, event_time, reminder_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user_id, title, description || '', event_date, event_time || null, reminder_minutes || 30);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить событие
app.put('/api/events/:id', (req, res) => {
  try {
    const { title, description, event_date, event_time, reminder_minutes, is_completed } = req.body;
    db.prepare(`
      UPDATE events
      SET title = ?, description = ?, event_date = ?, event_time = ?, reminder_minutes = ?, is_completed = ?
      WHERE id = ?
    `).run(title, description, event_date, event_time, reminder_minutes, is_completed ? 1 : 0, req.params.id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить событие
app.delete('/api/events/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ACHIEVEMENTS =====

// Получить достижения пользователя
app.get('/api/achievements/:userId', (req, res) => {
  try {
    const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC').all(req.params.userId);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Проверить и выдать достижения
app.post('/api/achievements/check/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const newAchievements = [];

    // Получить статистику пользователя
    const mealCount = db.prepare('SELECT COUNT(*) as count FROM meals WHERE user_id = ?').get(userId).count;
    const totalCalories = db.prepare('SELECT SUM(calories) as total FROM meals WHERE user_id = ?').get(userId).total || 0;
    const daysWithMeals = db.prepare('SELECT COUNT(DISTINCT date(created_at, "unixepoch")) as days FROM meals WHERE user_id = ?').get(userId).days;
    const commentsCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE user_id = ?').get(userId).count;

    // Проверить существующие достижения
    const existingAchievements = db.prepare('SELECT achievement_type FROM achievements WHERE user_id = ?').all(userId).map(a => a.achievement_type);

    // Первый приём пищи
    if (mealCount >= 1 && !existingAchievements.includes('first_meal')) {
      db.prepare('INSERT INTO achievements (user_id, achievement_type, title, description, icon) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'first_meal', 'Первый шаг', 'Добавлен первый приём пищи', '🎯'
      );
      newAchievements.push({ type: 'first_meal', title: 'Первый шаг' });
    }

    // 10 приёмов пищи
    if (mealCount >= 10 && !existingAchievements.includes('meals_10')) {
      db.prepare('INSERT INTO achievements (user_id, achievement_type, title, description, icon) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'meals_10', 'Начинающий', 'Добавлено 10 приёмов пищи', '🌱'
      );
      newAchievements.push({ type: 'meals_10', title: 'Начинающий' });
    }

    // 50 приёмов пищи
    if (mealCount >= 50 && !existingAchievements.includes('meals_50')) {
      db.prepare('INSERT INTO achievements (user_id, achievement_type, title, description, icon) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'meals_50', 'Опытный', 'Добавлено 50 приёмов пищи', '⭐'
      );
      newAchievements.push({ type: 'meals_50', title: 'Опытный' });
    }

    // 100 приёмов пищи
    if (mealCount >= 100 && !existingAchievements.includes('meals_100')) {
      db.prepare('INSERT INTO achievements (user_id, achievement_type, title, description, icon) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'meals_100', 'Мастер', 'Добавлено 100 приёмов пищи', '🏆'
      );
      newAchievements.push({ type: 'meals_100', title: 'Мастер' });
    }

    // 7 дней подряд
    if (daysWithMeals >= 7 && !existingAchievements.includes('week_streak')) {
      db.prepare('INSERT INTO achievements (user_id, achievement_type, title, description, icon) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'week_streak', 'Неделя силы', 'Записи 7 дней подряд', '🔥'
      );
      newAchievements.push({ type: 'week_streak', title: 'Неделя силы' });
    }

    // 30 дней подряд
    if (daysWithMeals >= 30 && !existingAchievements.includes('month_streak')) {
      db.prepare('INSERT INTO achievements (user_id, achievement_type, title, description, icon) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'month_streak', 'Месяц дисциплины', 'Записи 30 дней подряд', '💪'
      );
      newAchievements.push({ type: 'month_streak', title: 'Месяц дисциплины' });
    }

    // Социальный
    if (commentsCount >= 10 && !existingAchievements.includes('social')) {
      db.prepare('INSERT INTO achievements (user_id, achievement_type, title, description, icon) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'social', 'Общительный', 'Оставлено 10 комментариев', '💬'
      );
      newAchievements.push({ type: 'social', title: 'Общительный' });
    }

    res.json({ newAchievements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== STATISTICS =====

// Поиск с автодополнением (для поисковой строки)
app.get('/api/search/autocomplete', (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const searchPattern = `%${query}%`;

    // Поиск по названиям блюд
    const meals = db.prepare(`
      SELECT DISTINCT name, calories, protein, fats, carbs
      FROM meals
      WHERE name LIKE ?
      ORDER BY name
      LIMIT 10
    `).all(searchPattern);

    // Поиск по шаблонам
    const templates = db.prepare(`
      SELECT DISTINCT name, calories, protein, fats, carbs
      FROM templates
      WHERE name LIKE ?
      ORDER BY name
      LIMIT 5
    `).all(searchPattern);

    res.json({
      meals: meals.map(m => ({ ...m, type: 'meal' })),
      templates: templates.map(t => ({ ...t, type: 'template' }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Популярные блюда (топ по частоте)
app.get('/api/search/popular', (req, res) => {
  try {
    const { userId, limit } = req.query;
    const limitValue = parseInt(limit) || 10;

    let query = `
      SELECT name, calories, protein, fats, carbs, COUNT(*) as count
      FROM meals
    `;
    const params = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += `
      GROUP BY name, calories, protein, fats, carbs
      ORDER BY count DESC
      LIMIT ?
    `;
    params.push(limitValue);

    const popular = db.prepare(query).all(...params);
    res.json(popular);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Недавние блюда
app.get('/api/search/recent', (req, res) => {
  try {
    const { userId, limit } = req.query;
    const limitValue = parseInt(limit) || 10;

    let query = `
      SELECT DISTINCT name, calories, protein, fats, carbs, MAX(created_at) as last_used
      FROM meals
    `;
    const params = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += `
      GROUP BY name, calories, protein, fats, carbs
      ORDER BY last_used DESC
      LIMIT ?
    `;
    params.push(limitValue);

    const recent = db.prepare(query).all(...params);
    res.json(recent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== STATISTICS =====

// Получить статистику
app.get('/api/stats/:userId', (req, res) => {
  try {
    const { period } = req.query;
    let timeFilter = '';
    const params = [req.params.userId];

    if (period === 'day') {
      const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      timeFilter = 'AND created_at >= ?';
      params.push(startOfDay);
    } else if (period === 'week') {
      const weekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
      timeFilter = 'AND created_at >= ?';
      params.push(weekAgo);
    } else if (period === 'month') {
      const monthAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      timeFilter = 'AND created_at >= ?';
      params.push(monthAgo);
    }

    const stats = db.prepare(`
      SELECT
        COUNT(*) as meal_count,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(fats) as total_fats,
        SUM(carbs) as total_carbs,
        AVG(calories) as avg_calories
      FROM meals
      WHERE user_id = ? ${timeFilter}
    `).get(...params);

    // Получить цели пользователя
    const user = db.prepare('SELECT daily_calories, daily_protein, daily_fats, daily_carbs FROM users WHERE id = ?').get(req.params.userId);

    res.json({
      stats,
      goals: user,
      progress: {
        calories: user.daily_calories > 0 ? ((stats.total_calories || 0) / user.daily_calories * 100).toFixed(1) : 0,
        protein: user.daily_protein > 0 ? ((stats.total_protein || 0) / user.daily_protein * 100).toFixed(1) : 0,
        fats: user.daily_fats > 0 ? ((stats.total_fats || 0) / user.daily_fats * 100).toFixed(1) : 0,
        carbs: user.daily_carbs > 0 ? ((stats.total_carbs || 0) / user.daily_carbs * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить дневную статистику по дням (для графиков)
app.get('/api/stats/:userId/daily', (req, res) => {
  try {
    const { days } = req.query;
    const daysCount = parseInt(days) || 7;
    const daysAgo = Math.floor(Date.now() / 1000) - (daysCount * 24 * 60 * 60);

    const dailyStats = db.prepare(`
      SELECT
        date(created_at, 'unixepoch') as date,
        SUM(calories) as calories,
        SUM(protein) as protein,
        SUM(fats) as fats,
        SUM(carbs) as carbs,
        COUNT(*) as meal_count
      FROM meals
      WHERE user_id = ? AND created_at >= ?
      GROUP BY date(created_at, 'unixepoch')
      ORDER BY date ASC
    `).all(req.params.userId, daysAgo);

    res.json(dailyStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 FoodSync Server запущен на http://localhost:${PORT}`);
  console.log(`📊 База данных: SQLite`);
  console.log(`💚 Готов к работе!\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Порт ${PORT} занят, пробую ${PORT + 1}...`);
    PORT++;
    server.listen(PORT);
  } else {
    console.error('Ошибка сервера:', err);
  }
});
