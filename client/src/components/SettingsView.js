import React, { useState } from 'react';
import { VoiceInput, BarcodeScanner, MenuPlanner, RecipeBook, ShoppingList } from './AdvancedFeatures';
import { AIFoodAnalyzer, AIRecommendations, AIInsights } from './AIFeatures';
import { AchievementsSystem, ChallengesSystem, Leaderboard, CoupleGoals } from './SocialFeatures';
import { DataExport, ThemeCustomizer, AdvancedStats, PrioritySupport, PremiumSubscription } from './PremiumFeatures';
import { IntegrationsHub } from './Integrations';
import './SettingsView.css';

function SettingsView({ currentUser, isPremium = false }) {
  const [activeTab, setActiveTab] = useState('advanced');

  const tabs = [
    { id: 'advanced', name: '🎯 Продвинутые', premium: true },
    { id: 'ai', name: '🤖 AI функции', premium: true },
    { id: 'social', name: '🏆 Социальные', premium: false },
    { id: 'premium', name: '💎 Премиум', premium: true },
    { id: 'integrations', name: '🔗 Интеграции', premium: true },
    { id: 'subscription', name: '⭐ Подписка', premium: false }
  ];

  const renderContent = () => {
    // Проверка премиум доступа
    const needsPremium = tabs.find(t => t.id === activeTab)?.premium;
    if (needsPremium && !isPremium) {
      return (
        <div className="premium-lock">
          <div className="premium-lock-icon">🔒</div>
          <h3 className="tg-heading-3">Премиум функция</h3>
          <p className="tg-text-secondary">
            Эта функция доступна только для PRO подписчиков
          </p>
          <button
            className="tg-button"
            onClick={() => setActiveTab('subscription')}
          >
            Получить PRO
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'advanced':
        return (
          <div className="settings-section">
            <h2 className="tg-heading-2">🎯 Продвинутые функции</h2>

            <div className="feature-card">
              <h3 className="tg-heading-3">🎤 Голосовой ввод</h3>
              <p className="tg-text-sm tg-text-secondary">
                Добавляйте еду голосом - быстро и удобно
              </p>
              <VoiceInput
                onResult={(text) => console.log('Voice:', text)}
              />
            </div>

            <div className="feature-card">
              <h3 className="tg-heading-3">📷 Сканер штрих-кодов</h3>
              <p className="tg-text-sm tg-text-secondary">
                Сканируйте продукты для быстрого добавления
              </p>
              <BarcodeScanner
                onScan={(barcode) => console.log('Barcode:', barcode)}
              />
            </div>

            <div className="feature-card">
              <h3 className="tg-heading-3">📅 Планировщик меню</h3>
              <p className="tg-text-sm tg-text-secondary">
                Планируйте питание на неделю вперёд
              </p>
              <MenuPlanner userId={currentUser.id} />
            </div>

            <div className="feature-card">
              <h3 className="tg-heading-3">📖 Книга рецептов</h3>
              <p className="tg-text-sm tg-text-secondary">
                Сохраняйте любимые рецепты
              </p>
              <RecipeBook userId={currentUser.id} />
            </div>

            <div className="feature-card">
              <h3 className="tg-heading-3">🛒 Список покупок</h3>
              <p className="tg-text-sm tg-text-secondary">
                Автоматический список из планировщика
              </p>
              <ShoppingList userId={currentUser.id} />
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="settings-section">
            <h2 className="tg-heading-2">🤖 AI функции</h2>

            <div className="feature-card">
              <h3 className="tg-heading-3">📸 AI анализ фото</h3>
              <p className="tg-text-sm tg-text-secondary">
                Распознавание еды и автоматический подсчёт калорий
              </p>
              <AIFoodAnalyzer
                userId={currentUser.id}
                onAnalyzed={(result) => console.log('AI:', result)}
              />
            </div>

            <div className="feature-card">
              <h3 className="tg-heading-3">🎯 Персональные рекомендации</h3>
              <p className="tg-text-sm tg-text-secondary">
                Умные советы на основе ваших данных
              </p>
              <AIRecommendations userId={currentUser.id} />
            </div>

            <div className="feature-card">
              <h3 className="tg-heading-3">📊 Умная аналитика</h3>
              <p className="tg-text-sm tg-text-secondary">
                Прогнозы и тренды вашего питания
              </p>
              <AIInsights userId={currentUser.id} />
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="settings-section">
            <h2 className="tg-heading-2">🏆 Социальные функции</h2>

            <div className="feature-card">
              <AchievementsSystem
                userId={currentUser.id}
                stats={{
                  totalMeals: 10,
                  currentStreak: 5,
                  goalsMetStreak: 3,
                  proteinGoalsMet: 7,
                  waterStreak: 4,
                  earlyBreakfasts: 3,
                  recipesCreated: 5,
                  totalReactions: 25,
                  perfectDaysStreak: 2
                }}
              />
            </div>

            <div className="feature-card">
              <ChallengesSystem
                userId={currentUser.id}
                partnerId={null}
              />
            </div>

            <div className="feature-card">
              <Leaderboard userId={currentUser.id} />
            </div>

            <div className="feature-card">
              <CoupleGoals
                userId={currentUser.id}
                partnerId={null}
              />
            </div>
          </div>
        );

      case 'premium':
        return (
          <div className="settings-section">
            <h2 className="tg-heading-2">💎 Премиум функции</h2>

            <div className="feature-card">
              <DataExport userId={currentUser.id} />
            </div>

            <div className="feature-card">
              <ThemeCustomizer
                currentTheme={null}
                onThemeChange={(theme) => console.log('Theme:', theme)}
              />
            </div>

            <div className="feature-card">
              <AdvancedStats
                userId={currentUser.id}
                timeRange="week"
              />
            </div>

            <div className="feature-card">
              <PrioritySupport userId={currentUser.id} />
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="settings-section">
            <IntegrationsHub userId={currentUser.id} />
          </div>
        );

      case 'subscription':
        return (
          <div className="settings-section">
            <PremiumSubscription
              userId={currentUser.id}
              isPremium={isPremium}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h1 className="tg-heading-1">⚙️ Настройки и функции</h1>
        <p className="tg-text-secondary">
          Управляйте всеми возможностями InnerEcho PRO ULTRA
        </p>
      </div>

      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
            {tab.premium && !isPremium && <span className="tab-lock">🔒</span>}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default SettingsView;
