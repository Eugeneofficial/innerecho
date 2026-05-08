const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'foodsync.db'));

// Инициализация таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    daily_calories INTEGER DEFAULT 2000,
    daily_protein INTEGER DEFAULT 150,
    daily_fats INTEGER DEFAULT 70,
    daily_carbs INTEGER DEFAULT 250,
    current_weight REAL,
    target_weight REAL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER DEFAULT 0,
    fats INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    photo TEXT,
    meal_time TEXT DEFAULT 'other',
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(meal_id, user_id, emoji)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER DEFAULT 0,
    fats INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    meal_time TEXT DEFAULT 'other',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS water_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    glasses INTEGER DEFAULT 1,
    date TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS weight_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    weight REAL NOT NULL,
    date TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    event_time TEXT,
    reminder_minutes INTEGER DEFAULT 30,
    is_completed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    earned_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
  CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at);
  CREATE INDEX IF NOT EXISTS idx_reactions_meal_id ON reactions(meal_id);
  CREATE INDEX IF NOT EXISTS idx_comments_meal_id ON comments(meal_id);
  CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
  CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
`);

// Создать дефолтных пользователей если их нет
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (name, avatar, daily_calories, daily_protein, daily_fats, daily_carbs)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Ты', '👨', 2200, 160, 70, 250);

  db.prepare(`
    INSERT INTO users (name, avatar, daily_calories, daily_protein, daily_fats, daily_carbs)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Жена', '👩', 1800, 120, 60, 200);

  console.log('✅ Созданы дефолтные пользователи');
}

module.exports = db;
