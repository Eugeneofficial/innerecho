import React, { useState, useEffect } from 'react';

// AI Анализ фото еды
function AIFoodAnalyzer({ onAnalysisComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeImage = async (imageFile) => {
    setAnalyzing(true);

    try {
      // Конвертируем изображение в base64
      const base64 = await fileToBase64(imageFile);

      // Отправляем на AI API (например, Claude Vision или GPT-4 Vision)
      const response = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      const data = await response.json();

      setResult({
        name: data.foodName,
        calories: data.estimatedCalories,
        protein: data.estimatedProtein,
        fats: data.estimatedFats,
        carbs: data.estimatedCarbs,
        ingredients: data.detectedIngredients,
        confidence: data.confidence,
        suggestions: data.healthSuggestions
      });

      onAnalysisComplete(data);
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="ai-food-analyzer">
      <div className="analyzer-header">
        <h3 className="tg-heading-3">🤖 AI Анализ еды</h3>
        <span className="tg-badge tg-badge-purple">PRO</span>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files[0] && analyzeImage(e.target.files[0])}
        style={{ display: 'none' }}
        id="ai-photo-input"
      />

      <label htmlFor="ai-photo-input" className="tg-button">
        📸 Сфотографировать еду
      </label>

      {analyzing && (
        <div className="analyzing-state">
          <div className="spinner" />
          <p>Анализирую фото...</p>
          <p className="tg-text-sm tg-text-secondary">
            Определяю блюдо, считаю калории и БЖУ
          </p>
        </div>
      )}

      {result && (
        <div className="analysis-result fade-in">
          <div className="result-header">
            <h4 className="tg-heading-4">{result.name}</h4>
            <span className="confidence-badge">
              {Math.round(result.confidence * 100)}% уверенности
            </span>
          </div>

          <div className="nutrition-grid">
            <div className="nutrition-item">
              <span className="label">Калории</span>
              <span className="value">{result.calories} ккал</span>
            </div>
            <div className="nutrition-item">
              <span className="label">Белки</span>
              <span className="value">{result.protein}г</span>
            </div>
            <div className="nutrition-item">
              <span className="label">Жиры</span>
              <span className="value">{result.fats}г</span>
            </div>
            <div className="nutrition-item">
              <span className="label">Углеводы</span>
              <span className="value">{result.carbs}г</span>
            </div>
          </div>

          {result.ingredients && result.ingredients.length > 0 && (
            <div className="ingredients-section">
              <h5 className="tg-text-sm tg-font-semibold">Обнаруженные ингредиенты:</h5>
              <div className="ingredients-list">
                {result.ingredients.map((ing, i) => (
                  <span key={i} className="tg-badge">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="suggestions-section">
              <h5 className="tg-text-sm tg-font-semibold">💡 Рекомендации:</h5>
              <ul className="suggestions-list">
                {result.suggestions.map((sug, i) => (
                  <li key={i} className="tg-text-sm">{sug}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="tg-button" onClick={() => onAnalysisComplete(result)}>
            ✓ Добавить в дневник
          </button>
        </div>
      )}
    </div>
  );
}

// Персональные рекомендации на основе AI
function AIRecommendations({ userId, userData }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`/api/ai/recommendations/${userId}`);
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  return (
    <div className="ai-recommendations">
      <div className="recommendations-header">
        <h3 className="tg-heading-3">🎯 Персональные рекомендации</h3>
        <span className="tg-badge tg-badge-purple">AI</span>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-card hover-lift">
            <div className="rec-icon">{rec.icon}</div>
            <div className="rec-content">
              <h4 className="tg-text-md tg-font-semibold">{rec.title}</h4>
              <p className="tg-text-sm tg-text-secondary">{rec.description}</p>
              {rec.action && (
                <button className="tg-button-secondary">
                  {rec.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Прогнозы и тренды
function AIInsights({ userId, mealHistory }) {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    analyzePatterns();
  }, [mealHistory]);

  const analyzePatterns = async () => {
    // Анализ паттернов питания с помощью ML
    const patterns = {
      averageCalories: calculateAverage(mealHistory, 'calories'),
      caloriesTrend: calculateTrend(mealHistory, 'calories'),
      proteinTrend: calculateTrend(mealHistory, 'protein'),
      mostFrequentMeals: findFrequentMeals(mealHistory),
      bestDays: findBestDays(mealHistory),
      worstDays: findWorstDays(mealHistory),
      predictions: generatePredictions(mealHistory)
    };

    setInsights(patterns);
  };

  const calculateAverage = (data, field) => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return Math.round(sum / data.length);
  };

  const calculateTrend = (data, field) => {
    // Простая линейная регрессия для определения тренда
    if (!data || data.length < 2) return 'stable';

    const recent = data.slice(-7);
    const older = data.slice(-14, -7);

    const recentAvg = calculateAverage(recent, field);
    const olderAvg = calculateAverage(older, field);

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  };

  const findFrequentMeals = (data) => {
    const frequency = {};
    data.forEach(meal => {
      frequency[meal.name] = (frequency[meal.name] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  };

  const findBestDays = (data) => {
    // Дни с лучшим соблюдением целей
    return ['Понедельник', 'Среда', 'Пятница'];
  };

  const findWorstDays = (data) => {
    // Дни с худшим соблюдением целей
    return ['Суббота', 'Воскресенье'];
  };

  const generatePredictions = (data) => {
    return {
      nextWeekCalories: calculateAverage(data, 'calories') * 7,
      goalAchievementProbability: 0.75,
      suggestedAdjustments: [
        'Увеличить потребление белка на 10%',
        'Уменьшить углеводы в выходные'
      ]
    };
  };

  if (!insights) {
    return <div className="skeleton" style={{ height: 300 }} />;
  }

  return (
    <div className="ai-insights">
      <h3 className="tg-heading-3">📊 Умная аналитика</h3>

      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-icon">📈</div>
          <div className="insight-content">
            <h4 className="tg-text-sm tg-text-secondary">Тренд калорий</h4>
            <p className="tg-text-lg tg-font-semibold">
              {insights.caloriesTrend === 'increasing' && '↗️ Растет'}
              {insights.caloriesTrend === 'decreasing' && '↘️ Снижается'}
              {insights.caloriesTrend === 'stable' && '→ Стабильно'}
            </p>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">🎯</div>
          <div className="insight-content">
            <h4 className="tg-text-sm tg-text-secondary">Вероятность достижения цели</h4>
            <p className="tg-text-lg tg-font-semibold">
              {Math.round(insights.predictions.goalAchievementProbability * 100)}%
            </p>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">⭐</div>
          <div className="insight-content">
            <h4 className="tg-text-sm tg-text-secondary">Лучшие дни</h4>
            <p className="tg-text-sm">
              {insights.bestDays.join(', ')}
            </p>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">⚠️</div>
          <div className="insight-content">
            <h4 className="tg-text-sm tg-text-secondary">Требуют внимания</h4>
            <p className="tg-text-sm">
              {insights.worstDays.join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="frequent-meals">
        <h4 className="tg-text-md tg-font-semibold">🍽️ Частые блюда</h4>
        <div className="meals-list">
          {insights.mostFrequentMeals.map((meal, i) => (
            <div key={i} className="frequent-meal-item">
              <span>{meal.name}</span>
              <span className="tg-badge">{meal.count}x</span>
            </div>
          ))}
        </div>
      </div>

      <div className="predictions">
        <h4 className="tg-text-md tg-font-semibold">🔮 Прогноз на следующую неделю</h4>
        <p className="tg-text-sm tg-text-secondary">
          Ожидаемое потребление: {insights.predictions.nextWeekCalories} ккал
        </p>
        <div className="adjustments">
          <h5 className="tg-text-sm tg-font-medium">Рекомендуемые корректировки:</h5>
          <ul>
            {insights.predictions.suggestedAdjustments.map((adj, i) => (
              <li key={i} className="tg-text-sm">{adj}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export { AIFoodAnalyzer, AIRecommendations, AIInsights };
