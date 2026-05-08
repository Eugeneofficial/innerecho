import React, { useState, useEffect } from 'react';

// Система достижений
function AchievementsSystem({ userId, stats }) {
  const [achievements, setAchievements] = useState([]);
  const [unlockedToday, setUnlockedToday] = useState([]);

  const allAchievements = [
    {
      id: 'first_meal',
      title: 'Первый шаг',
      description: 'Добавьте первый приём пищи',
      icon: '🎯',
      points: 10,
      condition: (stats) => stats.totalMeals >= 1
    },
    {
      id: 'week_streak',
      title: 'Неделя силы',
      description: 'Ведите дневник 7 дней подряд',
      icon: '🔥',
      points: 50,
      condition: (stats) => stats.currentStreak >= 7
    },
    {
      id: 'month_streak',
      title: 'Месяц дисциплины',
      description: 'Ведите дневник 30 дней подряд',
      icon: '💪',
      points: 200,
      condition: (stats) => stats.currentStreak >= 30
    },
    {
      id: 'goal_week',
      title: 'Целеустремленный',
      description: 'Достигните целей 7 дней подряд',
      icon: '⭐',
      points: 100,
      condition: (stats) => stats.goalsMetStreak >= 7
    },
    {
      id: 'protein_master',
      title: 'Белковый мастер',
      description: 'Достигните цели по белку 10 раз',
      icon: '🥩',
      points: 75,
      condition: (stats) => stats.proteinGoalsMet >= 10
    },
    {
      id: 'water_champion',
      title: 'Водный чемпион',
      description: 'Выпейте 2л воды 5 дней подряд',
      icon: '💧',
      points: 50,
      condition: (stats) => stats.waterStreak >= 5
    },
    {
      id: 'early_bird',
      title: 'Ранняя пташка',
      description: 'Позавтракайте до 8:00 утра 5 раз',
      icon: '🌅',
      points: 30,
      condition: (stats) => stats.earlyBreakfasts >= 5
    },
    {
      id: 'recipe_creator',
      title: 'Шеф-повар',
      description: 'Создайте 10 рецептов',
      icon: '👨‍🍳',
      points: 60,
      condition: (stats) => stats.recipesCreated >= 10
    },
    {
      id: 'social_butterfly',
      title: 'Социальная бабочка',
      description: 'Получите 50 реакций',
      icon: '🦋',
      points: 40,
      condition: (stats) => stats.totalReactions >= 50
    },
    {
      id: 'perfect_week',
      title: 'Идеальная неделя',
      description: 'Достигните всех целей 7 дней подряд',
      icon: '🏆',
      points: 300,
      condition: (stats) => stats.perfectDaysStreak >= 7
    }
  ];

  useEffect(() => {
    checkAchievements();
  }, [stats]);

  const checkAchievements = () => {
    const unlocked = allAchievements.filter(ach =>
      ach.condition(stats) && !achievements.find(a => a.id === ach.id)
    );

    if (unlocked.length > 0) {
      setUnlockedToday(unlocked);
      setAchievements([...achievements, ...unlocked]);
      // Показать уведомление
      unlocked.forEach(ach => showAchievementNotification(ach));
    }
  };

  const showAchievementNotification = (achievement) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Новое достижение!', {
        body: `${achievement.icon} ${achievement.title}\n+${achievement.points} очков`,
        icon: '/icon-192.png'
      });
    }
  };

  const totalPoints = achievements.reduce((sum, ach) => sum + ach.points, 0);
  const progress = (achievements.length / allAchievements.length) * 100;

  return (
    <div className="achievements-system">
      <div className="achievements-header">
        <h2 className="tg-heading-2">🏆 Достижения</h2>
        <div className="points-badge">
          <span className="points-value">{totalPoints}</span>
          <span className="points-label">очков</span>
        </div>
      </div>

      <div className="achievements-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="tg-text-sm tg-text-secondary">
          {achievements.length} из {allAchievements.length} достижений
        </p>
      </div>

      <div className="achievements-grid">
        {allAchievements.map(ach => {
          const isUnlocked = achievements.find(a => a.id === ach.id);
          return (
            <div
              key={ach.id}
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">{ach.icon}</div>
              <div className="achievement-info">
                <h4 className="tg-text-md tg-font-semibold">{ach.title}</h4>
                <p className="tg-text-sm tg-text-secondary">{ach.description}</p>
                <span className="achievement-points">+{ach.points} очков</span>
              </div>
              {isUnlocked && <div className="unlocked-badge">✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Челленджи
function ChallengesSystem({ userId, partnerId }) {
  const [challenges, setChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);

  const availableChallenges = [
    {
      id: 'protein_week',
      title: 'Белковая неделя',
      description: 'Достигайте цели по белку 7 дней подряд',
      duration: 7,
      reward: 100,
      icon: '🥩',
      type: 'personal'
    },
    {
      id: 'water_challenge',
      title: 'Водный марафон',
      description: 'Пейте 2л воды каждый день в течение недели',
      duration: 7,
      reward: 75,
      icon: '💧',
      type: 'personal'
    },
    {
      id: 'couple_goals',
      title: 'Парная цель',
      description: 'Вы и партнёр достигните целей 5 дней подряд',
      duration: 5,
      reward: 200,
      icon: '💑',
      type: 'couple'
    },
    {
      id: 'healthy_week',
      title: 'Здоровая неделя',
      description: 'Ешьте овощи и фрукты каждый день',
      duration: 7,
      reward: 80,
      icon: '🥗',
      type: 'personal'
    },
    {
      id: 'no_sugar',
      title: 'Без сахара',
      description: 'Обходитесь без сладкого 3 дня',
      duration: 3,
      reward: 50,
      icon: '🚫🍰',
      type: 'personal'
    }
  ];

  const startChallenge = (challenge) => {
    const newChallenge = {
      ...challenge,
      startDate: new Date(),
      progress: 0,
      participants: challenge.type === 'couple' ? [userId, partnerId] : [userId]
    };
    setActiveChallenges([...activeChallenges, newChallenge]);
  };

  return (
    <div className="challenges-system">
      <h2 className="tg-heading-2">🎯 Челленджи</h2>

      <div className="active-challenges">
        <h3 className="tg-heading-3">Активные</h3>
        {activeChallenges.length === 0 ? (
          <p className="tg-text-secondary">Нет активных челленджей</p>
        ) : (
          activeChallenges.map(ch => (
            <div key={ch.id} className="challenge-card active">
              <div className="challenge-icon">{ch.icon}</div>
              <div className="challenge-info">
                <h4 className="tg-text-md tg-font-semibold">{ch.title}</h4>
                <p className="tg-text-sm tg-text-secondary">{ch.description}</p>
                <div className="challenge-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(ch.progress / ch.duration) * 100}%` }}
                    />
                  </div>
                  <span className="tg-text-sm">
                    {ch.progress} / {ch.duration} дней
                  </span>
                </div>
              </div>
              <div className="challenge-reward">
                <span className="reward-value">+{ch.reward}</span>
                <span className="reward-label">очков</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="available-challenges">
        <h3 className="tg-heading-3">Доступные</h3>
        <div className="challenges-grid">
          {availableChallenges.map(ch => (
            <div key={ch.id} className="challenge-card">
              <div className="challenge-icon">{ch.icon}</div>
              <div className="challenge-info">
                <h4 className="tg-text-md tg-font-semibold">{ch.title}</h4>
                <p className="tg-text-sm tg-text-secondary">{ch.description}</p>
                <div className="challenge-meta">
                  <span className="tg-badge">{ch.duration} дней</span>
                  {ch.type === 'couple' && (
                    <span className="tg-badge tg-badge-purple">Парный</span>
                  )}
                </div>
              </div>
              <button
                className="tg-button"
                onClick={() => startChallenge(ch)}
              >
                Начать
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Лидерборд
function Leaderboard({ userId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  return (
    <div className="leaderboard">
      <h2 className="tg-heading-2">🏅 Лидерборд</h2>

      <div className="timeframe-tabs">
        <button
          className={`tab ${timeframe === 'week' ? 'active' : ''}`}
          onClick={() => setTimeframe('week')}
        >
          Неделя
        </button>
        <button
          className={`tab ${timeframe === 'month' ? 'active' : ''}`}
          onClick={() => setTimeframe('month')}
        >
          Месяц
        </button>
        <button
          className={`tab ${timeframe === 'all' ? 'active' : ''}`}
          onClick={() => setTimeframe('all')}
        >
          Всё время
        </button>
      </div>

      <div className="leaderboard-list">
        {leaderboard.map((user, index) => (
          <div
            key={user.id}
            className={`leaderboard-item ${user.id === userId ? 'current-user' : ''}`}
          >
            <div className="rank">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && `#${index + 1}`}
            </div>
            <div className="user-avatar">{user.avatar}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-stats tg-text-sm tg-text-secondary">
                {user.streak} дней подряд
              </span>
            </div>
            <div className="user-points">
              <span className="points-value">{user.points}</span>
              <span className="points-label tg-text-sm">очков</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Совместные цели
function CoupleGoals({ userId, partnerId }) {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');

  const createGoal = () => {
    if (newGoal.trim()) {
      const goal = {
        id: Date.now(),
        title: newGoal,
        createdBy: userId,
        progress: { [userId]: 0, [partnerId]: 0 },
        target: 7,
        createdAt: new Date()
      };
      setGoals([...goals, goal]);
      setNewGoal('');
    }
  };

  return (
    <div className="couple-goals">
      <h2 className="tg-heading-2">💑 Совместные цели</h2>

      <div className="create-goal">
        <input
          type="text"
          className="tg-input"
          placeholder="Новая совместная цель..."
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && createGoal()}
        />
        <button className="tg-button" onClick={createGoal}>
          Создать
        </button>
      </div>

      <div className="goals-list">
        {goals.map(goal => {
          const userProgress = goal.progress[userId] || 0;
          const partnerProgress = goal.progress[partnerId] || 0;
          const totalProgress = userProgress + partnerProgress;
          const totalTarget = goal.target * 2;

          return (
            <div key={goal.id} className="goal-card">
              <h4 className="tg-text-md tg-font-semibold">{goal.title}</h4>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(totalProgress / totalTarget) * 100}%` }}
                  />
                </div>
                <span className="tg-text-sm">
                  {totalProgress} / {totalTarget}
                </span>
              </div>
              <div className="participants-progress">
                <div className="participant">
                  <span>Ты</span>
                  <span className="tg-badge">{userProgress}/{goal.target}</span>
                </div>
                <div className="participant">
                  <span>Партнёр</span>
                  <span className="tg-badge">{partnerProgress}/{goal.target}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { AchievementsSystem, ChallengesSystem, Leaderboard, CoupleGoals };
