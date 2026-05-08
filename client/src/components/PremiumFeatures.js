import React, { useState } from 'react';

// Экспорт данных
function DataExport({ userId }) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('json');

  const exportData = async () => {
    setExporting(true);

    try {
      const response = await fetch(`/api/export/${userId}?format=${format}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `innerecho-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Ошибка экспорта данных');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="data-export premium-feature">
      <div className="feature-header">
        <h3 className="tg-heading-3">📥 Экспорт данных</h3>
        <span className="tg-badge tg-badge-orange">PRO</span>
      </div>

      <p className="tg-text-sm tg-text-secondary">
        Экспортируйте все ваши данные в удобном формате
      </p>

      <div className="export-options">
        <label className="export-option">
          <input
            type="radio"
            name="format"
            value="json"
            checked={format === 'json'}
            onChange={(e) => setFormat(e.target.value)}
          />
          <div className="option-info">
            <span className="option-name">JSON</span>
            <span className="option-desc">Для разработчиков</span>
          </div>
        </label>

        <label className="export-option">
          <input
            type="radio"
            name="format"
            value="csv"
            checked={format === 'csv'}
            onChange={(e) => setFormat(e.target.value)}
          />
          <div className="option-info">
            <span className="option-name">CSV</span>
            <span className="option-desc">Для Excel/Google Sheets</span>
          </div>
        </label>

        <label className="export-option">
          <input
            type="radio"
            name="format"
            value="pdf"
            checked={format === 'pdf'}
            onChange={(e) => setFormat(e.target.value)}
          />
          <div className="option-info">
            <span className="option-name">PDF</span>
            <span className="option-desc">Красивый отчёт</span>
          </div>
        </label>
      </div>

      <button
        className="tg-button"
        onClick={exportData}
        disabled={exporting}
      >
        {exporting ? 'Экспортирую...' : '📥 Экспортировать'}
      </button>
    </div>
  );
}

// Кастомные темы
function ThemeCustomizer({ currentTheme, onThemeChange }) {
  const [customColors, setCustomColors] = useState({
    primary: '#3390EC',
    background: '#F4F4F5',
    text: '#000000',
    accent: '#4DCD5E'
  });

  const presetThemes = [
    {
      id: 'telegram',
      name: 'Telegram',
      colors: {
        primary: '#3390EC',
        background: '#F4F4F5',
        text: '#000000',
        accent: '#4DCD5E'
      }
    },
    {
      id: 'dark',
      name: 'Темная',
      colors: {
        primary: '#3390EC',
        background: '#0E1621',
        text: '#FFFFFF',
        accent: '#4DCD5E'
      }
    },
    {
      id: 'purple',
      name: 'Фиолетовая',
      colors: {
        primary: '#9C27B0',
        background: '#F3E5F5',
        text: '#000000',
        accent: '#7B1FA2'
      }
    },
    {
      id: 'green',
      name: 'Зелёная',
      colors: {
        primary: '#4CAF50',
        background: '#E8F5E9',
        text: '#000000',
        accent: '#388E3C'
      }
    },
    {
      id: 'ocean',
      name: 'Океан',
      colors: {
        primary: '#0288D1',
        background: '#E1F5FE',
        text: '#000000',
        accent: '#0277BD'
      }
    },
    {
      id: 'sunset',
      name: 'Закат',
      colors: {
        primary: '#FF6F00',
        background: '#FFF3E0',
        text: '#000000',
        accent: '#F57C00'
      }
    }
  ];

  const applyTheme = (theme) => {
    Object.entries(theme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--tg-${key}`, value);
    });
    onThemeChange(theme);
  };

  const applyCustomTheme = () => {
    Object.entries(customColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--tg-${key}`, value);
    });
    onThemeChange({ id: 'custom', name: 'Своя тема', colors: customColors });
  };

  return (
    <div className="theme-customizer premium-feature">
      <div className="feature-header">
        <h3 className="tg-heading-3">🎨 Кастомные темы</h3>
        <span className="tg-badge tg-badge-orange">PRO</span>
      </div>

      <div className="preset-themes">
        <h4 className="tg-text-md tg-font-semibold">Готовые темы</h4>
        <div className="themes-grid">
          {presetThemes.map(theme => (
            <div
              key={theme.id}
              className={`theme-card ${currentTheme?.id === theme.id ? 'active' : ''}`}
              onClick={() => applyTheme(theme)}
            >
              <div className="theme-preview">
                <div className="preview-color" style={{ background: theme.colors.primary }} />
                <div className="preview-color" style={{ background: theme.colors.background }} />
                <div className="preview-color" style={{ background: theme.colors.accent }} />
              </div>
              <span className="theme-name">{theme.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="custom-theme">
        <h4 className="tg-text-md tg-font-semibold">Создать свою тему</h4>
        <div className="color-pickers">
          <div className="color-picker">
            <label>Основной цвет</label>
            <input
              type="color"
              value={customColors.primary}
              onChange={(e) => setCustomColors({...customColors, primary: e.target.value})}
            />
          </div>
          <div className="color-picker">
            <label>Фон</label>
            <input
              type="color"
              value={customColors.background}
              onChange={(e) => setCustomColors({...customColors, background: e.target.value})}
            />
          </div>
          <div className="color-picker">
            <label>Текст</label>
            <input
              type="color"
              value={customColors.text}
              onChange={(e) => setCustomColors({...customColors, text: e.target.value})}
            />
          </div>
          <div className="color-picker">
            <label>Акцент</label>
            <input
              type="color"
              value={customColors.accent}
              onChange={(e) => setCustomColors({...customColors, accent: e.target.value})}
            />
          </div>
        </div>
        <button className="tg-button" onClick={applyCustomTheme}>
          Применить свою тему
        </button>
      </div>
    </div>
  );
}

// Расширенная статистика
function AdvancedStats({ userId, timeRange }) {
  const [stats, setStats] = useState(null);

  const metrics = [
    {
      title: 'Средние калории',
      value: '2,150',
      change: '+5%',
      trend: 'up',
      icon: '🔥'
    },
    {
      title: 'Соблюдение целей',
      value: '85%',
      change: '+12%',
      trend: 'up',
      icon: '🎯'
    },
    {
      title: 'Белок/день',
      value: '145г',
      change: '-3%',
      trend: 'down',
      icon: '🥩'
    },
    {
      title: 'Вода/день',
      value: '2.1л',
      change: '+8%',
      trend: 'up',
      icon: '💧'
    },
    {
      title: 'Приёмов пищи',
      value: '4.2',
      change: '0%',
      trend: 'stable',
      icon: '🍽️'
    },
    {
      title: 'Разнообразие',
      value: '32',
      change: '+15%',
      trend: 'up',
      icon: '🌈'
    }
  ];

  return (
    <div className="advanced-stats premium-feature">
      <div className="feature-header">
        <h3 className="tg-heading-3">📊 Расширенная статистика</h3>
        <span className="tg-badge tg-badge-orange">PRO</span>
      </div>

      <div className="stats-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{metric.icon}</div>
            <div className="stat-content">
              <span className="stat-label tg-text-sm tg-text-secondary">
                {metric.title}
              </span>
              <span className="stat-value tg-text-xl tg-font-bold">
                {metric.value}
              </span>
              <span className={`stat-change ${metric.trend}`}>
                {metric.trend === 'up' && '↗️'}
                {metric.trend === 'down' && '↘️'}
                {metric.trend === 'stable' && '→'}
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="detailed-charts">
        <h4 className="tg-text-md tg-font-semibold">Детальные графики</h4>
        <div className="charts-placeholder">
          <p className="tg-text-secondary">
            Графики калорий, БЖУ, веса, воды по дням/неделям/месяцам
          </p>
        </div>
      </div>

      <div className="nutrition-breakdown">
        <h4 className="tg-text-md tg-font-semibold">Распределение питания</h4>
        <div className="breakdown-chart">
          <div className="pie-chart-placeholder">
            <p className="tg-text-secondary">Круговая диаграмма БЖУ</p>
          </div>
        </div>
      </div>

      <div className="meal-timing">
        <h4 className="tg-text-md tg-font-semibold">Время приёмов пищи</h4>
        <div className="timing-chart">
          <p className="tg-text-secondary">
            Тепловая карта времени приёмов пищи
          </p>
        </div>
      </div>
    </div>
  );
}

// Приоритетная поддержка
function PrioritySupport({ userId }) {
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);

  const sendMessage = async () => {
    if (message.trim()) {
      const ticket = {
        id: Date.now(),
        message,
        status: 'open',
        priority: 'high',
        createdAt: new Date()
      };

      try {
        await fetch('/api/support/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticket)
        });

        setTickets([ticket, ...tickets]);
        setMessage('');
        alert('Ваше сообщение отправлено! Ответим в течение 1 часа.');
      } catch (error) {
        console.error('Failed to send ticket:', error);
      }
    }
  };

  return (
    <div className="priority-support premium-feature">
      <div className="feature-header">
        <h3 className="tg-heading-3">💬 Приоритетная поддержка</h3>
        <span className="tg-badge tg-badge-orange">PRO</span>
      </div>

      <div className="support-info">
        <div className="info-card">
          <span className="info-icon">⚡</span>
          <div>
            <h4 className="tg-text-sm tg-font-semibold">Быстрый ответ</h4>
            <p className="tg-text-sm tg-text-secondary">В течение 1 часа</p>
          </div>
        </div>
        <div className="info-card">
          <span className="info-icon">👨‍💻</span>
          <div>
            <h4 className="tg-text-sm tg-font-semibold">Личный менеджер</h4>
            <p className="tg-text-sm tg-text-secondary">Персональная помощь</p>
          </div>
        </div>
      </div>

      <div className="send-message">
        <textarea
          className="tg-input"
          placeholder="Опишите вашу проблему или вопрос..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <button className="tg-button" onClick={sendMessage}>
          Отправить
        </button>
      </div>

      <div className="tickets-list">
        <h4 className="tg-text-md tg-font-semibold">Ваши обращения</h4>
        {tickets.length === 0 ? (
          <p className="tg-text-secondary">Нет обращений</p>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <span className={`status-badge ${ticket.status}`}>
                  {ticket.status === 'open' && '🟡 Открыт'}
                  {ticket.status === 'in_progress' && '🔵 В работе'}
                  {ticket.status === 'resolved' && '🟢 Решён'}
                </span>
                <span className="ticket-date tg-text-sm tg-text-secondary">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="ticket-message tg-text-sm">{ticket.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Премиум подписка
function PremiumSubscription({ userId, isPremium }) {
  const features = [
    '🤖 AI анализ фото еды',
    '📊 Расширенная статистика',
    '📥 Экспорт данных (JSON, CSV, PDF)',
    '🎨 Кастомные темы',
    '💬 Приоритетная поддержка (1 час)',
    '🔔 Умные уведомления',
    '📈 Прогнозы и тренды',
    '🏆 Эксклюзивные достижения',
    '🎯 Персональные рекомендации',
    '☁️ Безлимитное облачное хранилище'
  ];

  return (
    <div className="premium-subscription">
      <div className="premium-header">
        <h2 className="tg-heading-2">⭐ InnerEcho PRO</h2>
        {isPremium && <span className="tg-badge tg-badge-orange">Активна</span>}
      </div>

      <div className="pricing-card">
        <div className="price">
          <span className="price-value">299₽</span>
          <span className="price-period">/месяц</span>
        </div>
        <p className="tg-text-sm tg-text-secondary">
          Или 2,990₽/год (экономия 30%)
        </p>
      </div>

      <div className="features-list">
        {features.map((feature, index) => (
          <div key={index} className="feature-item">
            <span className="feature-check">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {!isPremium && (
        <button className="tg-button premium-button">
          🚀 Получить PRO
        </button>
      )}

      <p className="tg-text-sm tg-text-secondary" style={{ textAlign: 'center', marginTop: 16 }}>
        Первые 7 дней бесплатно • Отмена в любой момент
      </p>
    </div>
  );
}

export {
  DataExport,
  ThemeCustomizer,
  AdvancedStats,
  PrioritySupport,
  PremiumSubscription
};
