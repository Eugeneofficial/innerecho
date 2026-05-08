import React, { useState, useEffect } from 'react';
import './EventsView.css';

const API_URL = 'http://localhost:3005/api';

function EventsView({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '',
    reminder_minutes: 30
  });
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    if (!currentUser) return;
    loadEvents();
  }, [currentUser, filter]);

  const loadEvents = () => {
    const params = filter === 'upcoming' ? '?upcoming=true' : '';
    fetch(`${API_URL}/events/${currentUser.id}${params}`)
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error('Ошибка загрузки событий:', err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          ...eventForm
        })
      });
      const newEvent = await response.json();
      setEvents([...events, newEvent]);
      setShowAddEvent(false);
      setEventForm({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '',
        reminder_minutes: 30
      });
    } catch (error) {
      console.error('Ошибка создания события:', error);
    }
  };

  const toggleComplete = async (event) => {
    try {
      const response = await fetch(`${API_URL}/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          is_completed: event.is_completed ? 0 : 1
        })
      });
      const updated = await response.json();
      setEvents(events.map(e => e.id === updated.id ? updated : e));
    } catch (error) {
      console.error('Ошибка обновления события:', error);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Удалить событие?')) return;
    try {
      await fetch(`${API_URL}/events/${eventId}`, { method: 'DELETE' });
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Ошибка удаления события:', error);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === tomorrow.toDateString()) return 'Завтра';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const groupedEvents = events.reduce((acc, event) => {
    const date = event.event_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  return (
    <div className="events-view">
      <div className="events-header">
        <h2>📅 События и напоминания</h2>
        <button className="vk-btn vk-btn-primary" onClick={() => setShowAddEvent(true)}>
          + Добавить событие
        </button>
      </div>

      <div className="events-filters">
        <button
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Предстоящие
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все события
        </button>
      </div>

      <div className="events-list">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="events-empty">
            <div className="events-empty-icon">📅</div>
            <div className="events-empty-text">Нет событий</div>
            <button className="vk-btn vk-btn-primary" onClick={() => setShowAddEvent(true)}>
              Создать первое событие
            </button>
          </div>
        ) : (
          Object.keys(groupedEvents).sort().map(date => (
            <div key={date} className="events-group">
              <div className="events-date-header">{formatDate(date)}</div>
              {groupedEvents[date].map(event => (
                <div key={event.id} className={`event-card ${event.is_completed ? 'completed' : ''}`}>
                  <div className="event-checkbox" onClick={() => toggleComplete(event)}>
                    {event.is_completed ? '✓' : ''}
                  </div>
                  <div className="event-content">
                    <div className="event-title">{event.title}</div>
                    {event.description && (
                      <div className="event-description">{event.description}</div>
                    )}
                    <div className="event-meta">
                      {event.event_time && (
                        <span className="event-time">🕐 {event.event_time}</span>
                      )}
                      {event.reminder_minutes > 0 && (
                        <span className="event-reminder">🔔 За {event.reminder_minutes} мин</span>
                      )}
                    </div>
                  </div>
                  <button className="event-delete" onClick={() => deleteEvent(event.id)}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {showAddEvent && (
        <div className="vk-modal-overlay" onClick={() => setShowAddEvent(false)}>
          <div className="vk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vk-modal-header">
              <div className="vk-modal-title">Новое событие</div>
              <button className="vk-modal-close" onClick={() => setShowAddEvent(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="vk-modal-body">
                <div className="vk-form-group">
                  <label className="vk-form-label">Название *</label>
                  <input
                    type="text"
                    className="vk-form-input"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Например: Тренировка"
                    required
                  />
                </div>

                <div className="vk-form-group">
                  <label className="vk-form-label">Описание</label>
                  <textarea
                    className="vk-form-textarea"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Дополнительная информация"
                  />
                </div>

                <div className="vk-form-row">
                  <div className="vk-form-group">
                    <label className="vk-form-label">Дата *</label>
                    <input
                      type="date"
                      className="vk-form-input"
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vk-form-group">
                    <label className="vk-form-label">Время</label>
                    <input
                      type="time"
                      className="vk-form-input"
                      value={eventForm.event_time}
                      onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vk-form-group">
                  <label className="vk-form-label">Напомнить за</label>
                  <select
                    className="vk-form-select"
                    value={eventForm.reminder_minutes}
                    onChange={(e) => setEventForm({ ...eventForm, reminder_minutes: parseInt(e.target.value) })}
                  >
                    <option value="0">Без напоминания</option>
                    <option value="15">15 минут</option>
                    <option value="30">30 минут</option>
                    <option value="60">1 час</option>
                    <option value="120">2 часа</option>
                    <option value="1440">1 день</option>
                  </select>
                </div>
              </div>

              <div className="vk-modal-footer">
                <button type="button" className="vk-btn vk-btn-secondary" onClick={() => setShowAddEvent(false)}>
                  Отмена
                </button>
                <button type="submit" className="vk-btn vk-btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsView;
