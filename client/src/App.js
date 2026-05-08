import React, { useState, useEffect } from 'react';
import StatsView from './components/StatsView';
import ProfileView from './components/ProfileView';
import EventsView from './components/EventsView';
import SearchBar from './components/SearchBar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005/api';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [meals, setMeals] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [view, setView] = useState('feed');
  const [period, setPeriod] = useState('day');
  const [theme, setTheme] = useState(() => localStorage.getItem('foodsync_theme') || 'dark');
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [mealForm, setMealForm] = useState({
    name: '',
    calories: '',
    protein: '',
    fats: '',
    carbs: '',
    meal_time: 'other',
    notes: '',
    photo: ''
  });

  const [searchFilters, setSearchFilters] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (data.length > 0) setCurrentUser(data[0]);
      })
      .catch(err => console.error('Ошибка загрузки пользователей:', err));
  }, []);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    localStorage.setItem('foodsync_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (!currentUser) return;

    // Построить URL с параметрами поиска
    let url = `${API_URL}/meals?period=${period}`;
    if (searchFilters) {
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key]) {
          url += `&${key}=${encodeURIComponent(searchFilters[key])}`;
        }
      });
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Обработать новый формат ответа с пагинацией
        if (data.meals) {
          setMeals(data.meals);
          setHasMore(data.pagination?.hasMore || false);
        } else {
          setMeals(data);
        }
      })
      .catch(err => console.error('Ошибка загрузки приёмов пищи:', err));

    fetch(`${API_URL}/stats/${currentUser.id}?period=${period}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Ошибка загрузки статистики:', err));

    fetch(`${API_URL}/templates/${currentUser.id}`)
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(err => console.error('Ошибка загрузки шаблонов:', err));
  }, [currentUser, period, searchFilters]);

  // Бесконечная прокрутка
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 500) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  // Быстрые клавиши
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Игнорировать если фокус в input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case 'n':
        case 'N':
          setShowAddMeal(true);
          break;
        case '1':
          setView('feed');
          break;
        case '2':
          setView('stats');
          break;
        case '3':
          setView('profile');
          break;
        case '4':
          setView('events');
          break;
        case 'd':
        case 'D':
          setPeriod('day');
          break;
        case 'w':
        case 'W':
          setPeriod('week');
          break;
        case 'm':
        case 'M':
          setPeriod('month');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!currentUser || !mealForm.name || !mealForm.calories) return;

    try {
      const response = await fetch(`${API_URL}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, ...mealForm })
      });

      const newMeal = await response.json();
      setMeals([newMeal, ...meals]);
      setMealForm({ name: '', calories: '', protein: '', fats: '', carbs: '', meal_time: 'other', notes: '', photo: '' });
      setShowAddMeal(false);

      const statsRes = await fetch(`${API_URL}/stats/${currentUser.id}?period=${period}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      // Проверить достижения
      await fetch(`${API_URL}/achievements/check/${currentUser.id}`, { method: 'POST' });
    } catch (err) {
      console.error('Ошибка добавления приёма пищи:', err);
    }
  };

  const handleSearch = (filters) => {
    setSearchFilters(filters);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setMealForm({ ...mealForm, photo: data.url });
    } catch (err) {
      console.error('Ошибка загрузки фото:', err);
      alert('Ошибка загрузки фото');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleReaction = async (mealId, emoji) => {
    if (!currentUser) return;

    try {
      await fetch(`${API_URL}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_id: mealId, user_id: currentUser.id, emoji })
      });

      const response = await fetch(`${API_URL}/meals?period=${period}`);
      const data = await response.json();
      setMeals(data);
    } catch (err) {
      console.error('Ошибка добавления реакции:', err);
    }
  };

  const deleteMeal = async (mealId) => {
    if (!window.confirm('Удалить этот приём пищи?')) return;

    try {
      await fetch(`${API_URL}/meals/${mealId}`, { method: 'DELETE' });
      setMeals(meals.filter(m => m.id !== mealId));

      const statsRes = await fetch(`${API_URL}/stats/${currentUser.id}?period=${period}`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  const loadComments = async (mealId) => {
    try {
      const res = await fetch(`${API_URL}/meals/${mealId}/comments`);
      const data = await res.json();
      setComments(prev => ({ ...prev, [mealId]: data }));
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', err);
    }
  };

  const toggleComments = async (mealId) => {
    const isShowing = showComments[mealId];
    setShowComments(prev => ({ ...prev, [mealId]: !isShowing }));

    if (!isShowing && !comments[mealId]) {
      await loadComments(mealId);
    }
  };

  const addComment = async (mealId) => {
    const text = commentText[mealId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_id: mealId, user_id: currentUser.id, text })
      });
      const newComment = await res.json();

      setComments(prev => ({
        ...prev,
        [mealId]: [...(prev[mealId] || []), newComment]
      }));

      setCommentText(prev => ({ ...prev, [mealId]: '' }));
    } catch (err) {
      console.error('Ошибка добавления комментария:', err);
    }
  };

  const deleteComment = async (mealId, commentId) => {
    try {
      await fetch(`${API_URL}/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => ({
        ...prev,
        [mealId]: prev[mealId].filter(c => c.id !== commentId)
      }));
    } catch (err) {
      console.error('Ошибка удаления комментария:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getMealTimeEmoji = (mealTime) => {
    const emojis = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎',
      other: '🍽️'
    };
    return emojis[mealTime] || '🍽️';
  };

  if (!currentUser) {
    return <div className="vk-loading">Загрузка...</div>;
  }

  return (
    <div className="app">
      {/* Header - VK Style */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>🍽️ InnerEcho</h1>
            <SearchBar onSearch={handleSearch} currentUser={currentUser} />
          </div>
          <div className="header-actions">
            <button className="header-icon-btn" title="Уведомления">🔔</button>
            <button className="header-icon-btn" onClick={toggleTheme} title="Переключить тему">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="user-avatar-btn">{currentUser.avatar}</button>
          </div>
        </div>
      </header>

      {/* VK Layout - 3 колонки */}
      <div className="vk-layout">
        {/* Left Sidebar - Меню */}
        <aside className="vk-sidebar-left">
          <nav className="vk-menu">
            <button
              className={`vk-menu-item ${view === 'feed' ? 'active' : ''}`}
              onClick={() => setView('feed')}
            >
              <span className="vk-menu-icon">📱</span>
              <span>Моя лента</span>
            </button>
            <button
              className={`vk-menu-item ${view === 'stats' ? 'active' : ''}`}
              onClick={() => setView('stats')}
            >
              <span className="vk-menu-icon">📊</span>
              <span>Статистика</span>
            </button>
            <button
              className={`vk-menu-item ${view === 'profile' ? 'active' : ''}`}
              onClick={() => setView('profile')}
            >
              <span className="vk-menu-icon">👤</span>
              <span>Профиль</span>
            </button>
            <button
              className={`vk-menu-item ${view === 'events' ? 'active' : ''}`}
              onClick={() => setView('events')}
            >
              <span className="vk-menu-icon">📅</span>
              <span>События</span>
            </button>
            <div className="vk-menu-divider"></div>
            <button className="vk-menu-item">
              <span className="vk-menu-icon">⚙️</span>
              <span>Настройки</span>
            </button>
          </nav>

          {/* Period Selector */}
          {view === 'feed' && (
            <div className="vk-widget" style={{ marginTop: '12px' }}>
              <h3>Период</h3>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button
                  className={`vk-menu-item ${period === 'day' ? 'active' : ''}`}
                  onClick={() => setPeriod('day')}
                  style={{ padding: '8px 12px' }}
                >
                  День
                </button>
                <button
                  className={`vk-menu-item ${period === 'week' ? 'active' : ''}`}
                  onClick={() => setPeriod('week')}
                  style={{ padding: '8px 12px' }}
                >
                  Неделя
                </button>
                <button
                  className={`vk-menu-item ${period === 'month' ? 'active' : ''}`}
                  onClick={() => setPeriod('month')}
                  style={{ padding: '8px 12px' }}
                >
                  Месяц
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Center Content - Лента */}
        <main className="vk-content">
          {view === 'feed' && (
            <>
              {/* New Post Button */}
              <button className="vk-new-post-btn" onClick={() => setShowAddMeal(true)}>
                Что нового, {currentUser.name}?
              </button>

              {/* Templates */}
              {templates.length > 0 && (
                <div className="vk-post">
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                      ⚡ Быстрый ввод
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setMealForm({
                              name: template.name,
                              calories: template.calories,
                              protein: template.protein,
                              fats: template.fats,
                              carbs: template.carbs,
                              meal_time: template.meal_time,
                              notes: ''
                            });
                            setShowAddMeal(true);
                          }}
                          style={{
                            padding: '10px',
                            background: 'var(--vk-hover)',
                            border: '1px solid var(--vk-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '13px'
                          }}
                        >
                          <div>{getMealTimeEmoji(template.meal_time)} {template.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--vk-text-secondary)', marginTop: '4px' }}>
                            {template.calories} ккал
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Meals Feed */}
              {meals.length === 0 ? (
                <div className="vk-post">
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--vk-text-secondary)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
                    <div style={{ fontSize: '15px' }}>Пока нет записей</div>
                    <div style={{ fontSize: '13px', marginTop: '8px' }}>Добавьте первый приём пищи</div>
                  </div>
                </div>
              ) : (
                meals.map(meal => (
                  <div key={meal.id} className="vk-post">
                    {/* Post Header */}
                    <div className="vk-post-header">
                      <div className="vk-post-avatar">{meal.user_avatar}</div>
                      <div className="vk-post-author">
                        <div className="vk-post-name">{meal.user_name}</div>
                        <div className="vk-post-time">{formatTime(meal.created_at)}</div>
                      </div>
                      {meal.user_id === currentUser.id && (
                        <button className="vk-post-menu" onClick={() => deleteMeal(meal.id)}>
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="vk-post-content">
                      <div className="vk-post-text">
                        <strong>{getMealTimeEmoji(meal.meal_time)} {meal.name}</strong>
                      </div>

                      {meal.photo && (
                        <div style={{ marginTop: '12px' }}>
                          <img
                            src={`http://localhost:3005${meal.photo}`}
                            alt={meal.name}
                            style={{
                              width: '100%',
                              maxHeight: '400px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(`http://localhost:3005${meal.photo}`, '_blank')}
                          />
                        </div>
                      )}

                      <div className="vk-post-tags">
                        <span className="vk-post-tag">🔥 {meal.calories} ккал</span>
                        <span className="vk-post-tag">🥩 {meal.protein}г белка</span>
                        <span className="vk-post-tag">🧈 {meal.fats}г жиров</span>
                        <span className="vk-post-tag">🍞 {meal.carbs}г углеводов</span>
                      </div>

                      {meal.notes && (
                        <div className="vk-post-text" style={{ color: 'var(--vk-text-secondary)' }}>
                          {meal.notes}
                        </div>
                      )}
                    </div>

                    {/* Post Footer - Reactions */}
                    <div className="vk-post-footer">
                      {['👍', '❤️', '🔥', '💪'].map(emoji => {
                        const reaction = meal.reactions?.find(r => r.emoji === emoji);
                        const hasReacted = reaction && reaction.user_id === currentUser.id;
                        return (
                          <button
                            key={emoji}
                            className={`vk-post-action ${hasReacted ? 'active' : ''}`}
                            onClick={() => handleReaction(meal.id, emoji)}
                          >
                            <span className="vk-post-action-icon">{emoji}</span>
                          </button>
                        );
                      })}
                      <button
                        className="vk-post-action"
                        onClick={() => toggleComments(meal.id)}
                      >
                        <span className="vk-post-action-icon">💬</span>
                        <span>{comments[meal.id]?.length || 0}</span>
                      </button>
                    </div>

                    {/* Comments */}
                    {showComments[meal.id] && (
                      <div className="vk-comments">
                        {comments[meal.id]?.map(comment => (
                          <div key={comment.id} className="vk-comment">
                            <div className="vk-comment-avatar">{comment.user_avatar}</div>
                            <div className="vk-comment-content">
                              <div className="vk-comment-bubble">
                                <div className="vk-comment-author">{comment.user_name}</div>
                                <div className="vk-comment-text">{comment.text}</div>
                              </div>
                              <div className="vk-comment-time">
                                {formatTime(comment.created_at)}
                                {comment.user_id === currentUser.id && (
                                  <button
                                    onClick={() => deleteComment(meal.id, comment.id)}
                                    style={{
                                      marginLeft: '12px',
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--vk-text-secondary)',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Удалить
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Comment Form */}
                        <div className="vk-comment-form">
                          <input
                            type="text"
                            className="vk-comment-input"
                            placeholder="Написать комментарий..."
                            value={commentText[meal.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [meal.id]: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && addComment(meal.id)}
                          />
                          <button
                            className="vk-comment-submit"
                            onClick={() => addComment(meal.id)}
                            disabled={!commentText[meal.id]?.trim()}
                          >
                            ➤
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {view === 'stats' && <StatsView currentUser={currentUser} period={period} />}
          {view === 'profile' && <ProfileView currentUser={currentUser} onUserUpdate={setCurrentUser} />}
          {view === 'events' && <EventsView currentUser={currentUser} />}
        </main>

        {/* Right Sidebar - Stats & Users */}
        <aside className="vk-sidebar-right">
          {/* Stats Widget */}
          {stats && (
            <div className="vk-widget">
              <h3>Сегодня</h3>
              <div className="vk-stats">
                <div className="vk-stat-item">
                  <div className="vk-stat-value">{stats.stats.total_calories || 0}</div>
                  <div className="vk-stat-label">Калории</div>
                  <div className="vk-stat-progress">
                    <div className="vk-stat-progress-fill" style={{ width: `${Math.min(stats.progress.calories, 100)}%` }}></div>
                  </div>
                </div>
                <div className="vk-stat-item">
                  <div className="vk-stat-value">{stats.stats.total_protein || 0}г</div>
                  <div className="vk-stat-label">Белки</div>
                  <div className="vk-stat-progress">
                    <div className="vk-stat-progress-fill protein" style={{ width: `${Math.min(stats.progress.protein, 100)}%` }}></div>
                  </div>
                </div>
                <div className="vk-stat-item">
                  <div className="vk-stat-value">{stats.stats.total_fats || 0}г</div>
                  <div className="vk-stat-label">Жиры</div>
                  <div className="vk-stat-progress">
                    <div className="vk-stat-progress-fill fats" style={{ width: `${Math.min(stats.progress.fats, 100)}%` }}></div>
                  </div>
                </div>
                <div className="vk-stat-item">
                  <div className="vk-stat-value">{stats.stats.total_carbs || 0}г</div>
                  <div className="vk-stat-label">Углеводы</div>
                  <div className="vk-stat-progress">
                    <div className="vk-stat-progress-fill carbs" style={{ width: `${Math.min(stats.progress.carbs, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Widget */}
          <div className="vk-widget">
            <h3>Пользователи</h3>
            {users.map(user => (
              <div
                key={user.id}
                className="vk-widget-item"
                onClick={() => setCurrentUser(user)}
              >
                <div className="vk-widget-avatar">{user.avatar}</div>
                <div className="vk-widget-info">
                  <div className="vk-widget-name">{user.name}</div>
                  <div className="vk-widget-status">
                    {user.id === currentUser.id ? 'Вы' : 'Онлайн'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <div className="vk-modal-overlay" onClick={() => setShowAddMeal(false)}>
          <div className="vk-modal" onClick={e => e.stopPropagation()}>
            <div className="vk-modal-header">
              <div className="vk-modal-title">➕ Добавить приём пищи</div>
              <button className="vk-modal-close" onClick={() => setShowAddMeal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMeal}>
              <div className="vk-modal-body">
                <div className="vk-form-group">
                  <label className="vk-form-label">Название</label>
                  <input
                    type="text"
                    className="vk-form-input"
                    value={mealForm.name}
                    onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="vk-form-row">
                  <div className="vk-form-group">
                    <label className="vk-form-label">Калории</label>
                    <input
                      type="number"
                      className="vk-form-input"
                      value={mealForm.calories}
                      onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                      required
                    />
                  </div>
                  <div className="vk-form-group">
                    <label className="vk-form-label">Время приёма</label>
                    <select
                      className="vk-form-select"
                      value={mealForm.meal_time}
                      onChange={(e) => setMealForm({ ...mealForm, meal_time: e.target.value })}
                    >
                      <option value="breakfast">Завтрак</option>
                      <option value="lunch">Обед</option>
                      <option value="dinner">Ужин</option>
                      <option value="snack">Перекус</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                </div>

                <div className="vk-form-row">
                  <div className="vk-form-group">
                    <label className="vk-form-label">Белки (г)</label>
                    <input
                      type="number"
                      className="vk-form-input"
                      value={mealForm.protein}
                      onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                    />
                  </div>
                  <div className="vk-form-group">
                    <label className="vk-form-label">Жиры (г)</label>
                    <input
                      type="number"
                      className="vk-form-input"
                      value={mealForm.fats}
                      onChange={(e) => setMealForm({ ...mealForm, fats: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vk-form-group">
                  <label className="vk-form-label">Углеводы (г)</label>
                  <input
                    type="number"
                    className="vk-form-input"
                    value={mealForm.carbs}
                    onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                  />
                </div>

                <div className="vk-form-group">
                  <label className="vk-form-label">Фото</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="vk-form-input"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto && <div style={{ fontSize: '13px', color: 'var(--vk-text-secondary)', marginTop: '4px' }}>Загрузка...</div>}
                  {mealForm.photo && (
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={`http://localhost:3005${mealForm.photo}`}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setMealForm({ ...mealForm, photo: '' })}
                        style={{
                          marginTop: '8px',
                          padding: '4px 8px',
                          background: 'var(--vk-red)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Удалить фото
                      </button>
                    </div>
                  )}
                </div>

                <div className="vk-form-group">
                  <label className="vk-form-label">Заметки</label>
                  <textarea
                    className="vk-form-textarea"
                    value={mealForm.notes}
                    onChange={(e) => setMealForm({ ...mealForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="vk-modal-footer">
                <button type="button" className="vk-btn vk-btn-secondary" onClick={() => setShowAddMeal(false)}>
                  Отмена
                </button>
                <button type="submit" className="vk-btn vk-btn-primary">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
