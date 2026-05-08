import React, { useState, useEffect } from 'react';
import './ProfileView.css';

const API_URL = 'http://localhost:3001/api';

function ProfileView({ currentUser, onUserUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar: '',
    daily_calories: '',
    daily_protein: '',
    daily_fats: '',
    daily_carbs: '',
    current_weight: '',
    target_weight: ''
  });
  const [weightLog, setWeightLog] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        avatar: currentUser.avatar || '👤',
        daily_calories: currentUser.daily_calories || '',
        daily_protein: currentUser.daily_protein || '',
        daily_fats: currentUser.daily_fats || '',
        daily_carbs: currentUser.daily_carbs || '',
        current_weight: currentUser.current_weight || '',
        target_weight: currentUser.target_weight || ''
      });

      // Загрузить историю веса
      fetch(`${API_URL}/weight/${currentUser.id}?period=month`)
        .then(res => res.json())
        .then(data => setWeightLog(data))
        .catch(err => console.error('Ошибка загрузки истории веса:', err));
    }
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const updatedUser = await response.json();
      if (onUserUpdate) onUserUpdate(updatedUser);
      setEditing(false);
    } catch (err) {
      console.error('Ошибка сохранения профиля:', err);
      alert('Ошибка сохранения профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight || !currentUser) return;

    try {
      await fetch(`${API_URL}/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          weight: parseFloat(newWeight),
          date: new Date().toISOString().split('T')[0]
        })
      });

      // Обновить историю веса
      const response = await fetch(`${API_URL}/weight/${currentUser.id}?period=month`);
      const data = await response.json();
      setWeightLog(data);
      setNewWeight('');

      // Обновить текущий вес в форме
      setFormData({ ...formData, current_weight: parseFloat(newWeight) });
    } catch (err) {
      console.error('Ошибка добавления веса:', err);
    }
  };

  const avatarOptions = ['👨', '👩', '🧑', '👦', '👧', '🧔', '👱', '👴', '👵', '🤵', '👰', '🧑‍🦰', '🧑‍🦱', '🧑‍🦳', '🧑‍🦲'];

  if (!currentUser) return null;

  return (
    <div className="profile-view">
      <div className="profile-header">
        <h2>👤 Профиль</h2>
        {!editing && (
          <button className="edit-btn" onClick={() => setEditing(true)}>
            ✏️ Редактировать
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-section">
            <h3>Основная информация</h3>

            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Аватар</label>
              <div className="avatar-picker">
                {avatarOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`avatar-option ${formData.avatar === emoji ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, avatar: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Дневные цели</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Калории</label>
                <input
                  type="number"
                  value={formData.daily_calories}
                  onChange={e => setFormData({ ...formData, daily_calories: e.target.value })}
                  placeholder="2000"
                />
              </div>
              <div className="form-group">
                <label>Белки (г)</label>
                <input
                  type="number"
                  value={formData.daily_protein}
                  onChange={e => setFormData({ ...formData, daily_protein: e.target.value })}
                  placeholder="150"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Жиры (г)</label>
                <input
                  type="number"
                  value={formData.daily_fats}
                  onChange={e => setFormData({ ...formData, daily_fats: e.target.value })}
                  placeholder="70"
                />
              </div>
              <div className="form-group">
                <label>Углеводы (г)</label>
                <input
                  type="number"
                  value={formData.daily_carbs}
                  onChange={e => setFormData({ ...formData, daily_carbs: e.target.value })}
                  placeholder="250"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Вес</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Текущий вес (кг)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.current_weight}
                  onChange={e => setFormData({ ...formData, current_weight: e.target.value })}
                  placeholder="70.0"
                />
              </div>
              <div className="form-group">
                <label>Целевой вес (кг)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.target_weight}
                  onChange={e => setFormData({ ...formData, target_weight: e.target.value })}
                  placeholder="65.0"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? '💾 Сохранение...' : '💾 Сохранить'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="profile-card">
            <div className="profile-avatar-large">{currentUser.avatar}</div>
            <h3>{currentUser.name}</h3>
          </div>

          <div className="info-section">
            <h3>🎯 Дневные цели</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Калории</span>
                <span className="info-value">{currentUser.daily_calories} ккал</span>
              </div>
              <div className="info-item">
                <span className="info-label">Белки</span>
                <span className="info-value">{currentUser.daily_protein}г</span>
              </div>
              <div className="info-item">
                <span className="info-label">Жиры</span>
                <span className="info-value">{currentUser.daily_fats}г</span>
              </div>
              <div className="info-item">
                <span className="info-label">Углеводы</span>
                <span className="info-value">{currentUser.daily_carbs}г</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>⚖️ Вес</h3>
            <div className="weight-info">
              {currentUser.current_weight && (
                <div className="weight-current">
                  <span className="weight-label">Текущий</span>
                  <span className="weight-value">{currentUser.current_weight} кг</span>
                </div>
              )}
              {currentUser.target_weight && (
                <div className="weight-target">
                  <span className="weight-label">Цель</span>
                  <span className="weight-value">{currentUser.target_weight} кг</span>
                </div>
              )}
              {currentUser.current_weight && currentUser.target_weight && (
                <div className="weight-diff">
                  <span className="weight-label">Осталось</span>
                  <span className="weight-value">
                    {Math.abs(currentUser.current_weight - currentUser.target_weight).toFixed(1)} кг
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleAddWeight} className="add-weight-form">
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="Добавить новый вес..."
              />
              <button type="submit">➕</button>
            </form>

            {weightLog.length > 0 && (
              <div className="weight-history">
                <h4>История взвешиваний</h4>
                <div className="weight-list">
                  {weightLog.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="weight-entry">
                      <span className="weight-date">
                        {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="weight-entry-value">{entry.weight} кг</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileView;
