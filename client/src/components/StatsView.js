import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './StatsView.css';

const API_URL = 'http://localhost:3005/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

function StatsView({ currentUser, period }) {
  const [dailyStats, setDailyStats] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [otherUserStats, setOtherUserStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Загрузить дневную статистику для графиков
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    fetch(`${API_URL}/stats/${currentUser.id}/daily?days=${days}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(d => ({
          date: new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
          calories: d.calories || 0,
          protein: d.protein || 0,
          fats: d.fats || 0,
          carbs: d.carbs || 0,
          meals: d.meal_count || 0
        }));
        setDailyStats(formatted);
      })
      .catch(err => console.error('Ошибка загрузки дневной статистики:', err));

    // Загрузить общую статистику
    fetch(`${API_URL}/stats/${currentUser.id}?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Ошибка загрузки статистики:', err);
        setLoading(false);
      });

    // Загрузить пользователей для сравнения
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Ошибка загрузки пользователей:', err));
  }, [currentUser, period]);

  // Загрузить статистику другого пользователя для сравнения
  useEffect(() => {
    if (!compareMode || !currentUser) {
      setOtherUserStats(null);
      return;
    }

    const otherUser = users.find(u => u.id !== currentUser.id);
    if (!otherUser) return;

    fetch(`${API_URL}/stats/${otherUser.id}?period=${period}`)
      .then(res => res.json())
      .then(data => setOtherUserStats({ ...data, user: otherUser }))
      .catch(err => console.error('Ошибка загрузки статистики другого пользователя:', err));
  }, [compareMode, currentUser, period, users]);

  if (loading) {
    return <div className="stats-loading">Загрузка статистики...</div>;
  }

  if (!stats) {
    return <div className="stats-error">Ошибка загрузки статистики</div>;
  }

  // Данные для круговой диаграммы БЖУ
  const macrosData = [
    { name: 'Белки', value: stats.stats.total_protein || 0, color: '#10b981' },
    { name: 'Жиры', value: stats.stats.total_fats || 0, color: '#f59e0b' },
    { name: 'Углеводы', value: stats.stats.total_carbs || 0, color: '#8b5cf6' }
  ].filter(item => item.value > 0);

  const periodLabel = period === 'day' ? 'сегодня' : period === 'week' ? 'за неделю' : 'за месяц';

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>📊 Статистика {periodLabel}</h2>
        <button
          className={`compare-btn ${compareMode ? 'active' : ''}`}
          onClick={() => setCompareMode(!compareMode)}
        >
          {compareMode ? '👥 Сравнение включено' : '👤 Только я'}
        </button>
      </div>

      {/* Основные показатели */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-icon">🔥</div>
          <div className="stat-card-content">
            <div className="stat-card-label">Калории</div>
            <div className="stat-card-value">{stats.stats.total_calories || 0}</div>
            <div className="stat-card-goal">Цель: {stats.goals.daily_calories}</div>
            <div className="stat-card-progress">
              <div
                className="stat-card-progress-fill"
                style={{ width: `${Math.min(stats.progress.calories, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🥩</div>
          <div className="stat-card-content">
            <div className="stat-card-label">Белки</div>
            <div className="stat-card-value">{stats.stats.total_protein || 0}г</div>
            <div className="stat-card-goal">Цель: {stats.goals.daily_protein}г</div>
            <div className="stat-card-progress">
              <div
                className="stat-card-progress-fill protein"
                style={{ width: `${Math.min(stats.progress.protein, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🥑</div>
          <div className="stat-card-content">
            <div className="stat-card-label">Жиры</div>
            <div className="stat-card-value">{stats.stats.total_fats || 0}г</div>
            <div className="stat-card-goal">Цель: {stats.goals.daily_fats}г</div>
            <div className="stat-card-progress">
              <div
                className="stat-card-progress-fill fats"
                style={{ width: `${Math.min(stats.progress.fats, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🍞</div>
          <div className="stat-card-content">
            <div className="stat-card-label">Углеводы</div>
            <div className="stat-card-value">{stats.stats.total_carbs || 0}г</div>
            <div className="stat-card-goal">Цель: {stats.goals.daily_carbs}г</div>
            <div className="stat-card-progress">
              <div
                className="stat-card-progress-fill carbs"
                style={{ width: `${Math.min(stats.progress.carbs, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🍽️</div>
          <div className="stat-card-content">
            <div className="stat-card-label">Приёмов пищи</div>
            <div className="stat-card-value">{stats.stats.meal_count || 0}</div>
            <div className="stat-card-goal">
              Среднее: {stats.stats.avg_calories ? Math.round(stats.stats.avg_calories) : 0} ккал
            </div>
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="charts-grid">
        {/* График калорий по дням */}
        {dailyStats.length > 0 && (
          <div className="chart-card">
            <h3>📈 Калории по дням</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Калории"
                  dot={{ fill: '#6366f1', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* График БЖУ по дням */}
        {dailyStats.length > 0 && (
          <div className="chart-card">
            <h3>📊 БЖУ по дням</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="protein" fill="#10b981" name="Белки (г)" />
                <Bar dataKey="fats" fill="#f59e0b" name="Жиры (г)" />
                <Bar dataKey="carbs" fill="#8b5cf6" name="Углеводы (г)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Круговая диаграмма БЖУ */}
        {macrosData.length > 0 && (
          <div className="chart-card">
            <h3>🥗 Распределение БЖУ</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={macrosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {macrosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Количество приёмов пищи */}
        {dailyStats.length > 0 && (
          <div className="chart-card">
            <h3>🍽️ Приёмов пищи по дням</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="meals" fill="#6366f1" name="Приёмов пищи" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Сравнение с партнёром */}
      {compareMode && otherUserStats && (
        <div className="comparison-section">
          <h3>👥 Сравнение с {otherUserStats.user.name}</h3>
          <div className="comparison-grid">
            <div className="comparison-card">
              <div className="comparison-label">Калории</div>
              <div className="comparison-values">
                <div className="comparison-value">
                  <span className="comparison-user">{currentUser.avatar} Ты</span>
                  <span className="comparison-number">{stats.stats.total_calories || 0}</span>
                </div>
                <div className="comparison-value">
                  <span className="comparison-user">{otherUserStats.user.avatar} {otherUserStats.user.name}</span>
                  <span className="comparison-number">{otherUserStats.stats.total_calories || 0}</span>
                </div>
              </div>
            </div>

            <div className="comparison-card">
              <div className="comparison-label">Белки</div>
              <div className="comparison-values">
                <div className="comparison-value">
                  <span className="comparison-user">{currentUser.avatar} Ты</span>
                  <span className="comparison-number">{stats.stats.total_protein || 0}г</span>
                </div>
                <div className="comparison-value">
                  <span className="comparison-user">{otherUserStats.user.avatar} {otherUserStats.user.name}</span>
                  <span className="comparison-number">{otherUserStats.stats.total_protein || 0}г</span>
                </div>
              </div>
            </div>

            <div className="comparison-card">
              <div className="comparison-label">Приёмов пищи</div>
              <div className="comparison-values">
                <div className="comparison-value">
                  <span className="comparison-user">{currentUser.avatar} Ты</span>
                  <span className="comparison-number">{stats.stats.meal_count || 0}</span>
                </div>
                <div className="comparison-value">
                  <span className="comparison-user">{otherUserStats.user.avatar} {otherUserStats.user.name}</span>
                  <span className="comparison-number">{otherUserStats.stats.meal_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsView;
