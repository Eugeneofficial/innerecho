import React, { useState, useEffect } from 'react';

// Голосовой ввод для добавления еды
function VoiceInput({ onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);

      if (event.results[current].isFinal) {
        onResult(transcriptText);
        setTranscript('');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    window.recognition = recognition;
  }, [onResult]);

  const startListening = () => {
    if (window.recognition) {
      window.recognition.start();
    }
  };

  const stopListening = () => {
    if (window.recognition) {
      window.recognition.stop();
    }
  };

  return (
    <div className="voice-input">
      <button
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
      >
        {isListening ? '🎤 Слушаю...' : '🎤 Голосовой ввод'}
      </button>
      {transcript && (
        <div className="voice-transcript">
          <span className="pulse">🔴</span> {transcript}
        </div>
      )}
    </div>
  );
}

// Сканер штрих-кодов
function BarcodeScanner({ onScan }) {
  const [scanning, setScanning] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanBarcode();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Не удалось получить доступ к камере');
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setScanning(false);
    }
  };

  const scanBarcode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Здесь должна быть библиотека для распознавания штрих-кодов
    // Например: quagga.js или zxing
    // const code = detectBarcode(imageData);
    // if (code) {
    //   onScan(code);
    //   stopScanning();
    // }

    requestAnimationFrame(scanBarcode);
  };

  return (
    <div className="barcode-scanner">
      {!scanning ? (
        <button className="tg-button" onClick={startScanning}>
          📷 Сканировать штрих-код
        </button>
      ) : (
        <div className="scanner-view">
          <video ref={videoRef} className="scanner-video" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="scanner-overlay">
            <div className="scanner-frame" />
            <p>Наведите на штрих-код</p>
          </div>
          <button className="tg-button-danger" onClick={stopScanning}>
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}

// Планировщик меню
function MenuPlanner({ userId }) {
  const [weekMenu, setWeekMenu] = useState({});
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const mealTimes = ['breakfast', 'lunch', 'dinner', 'snack'];

  const addToMenu = (day, mealTime, meal) => {
    setWeekMenu(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealTime]: meal
      }
    }));
  };

  const generateShoppingList = () => {
    const ingredients = new Set();
    Object.values(weekMenu).forEach(day => {
      Object.values(day).forEach(meal => {
        if (meal && meal.ingredients) {
          meal.ingredients.forEach(ing => ingredients.add(ing));
        }
      });
    });
    return Array.from(ingredients);
  };

  return (
    <div className="menu-planner">
      <div className="planner-header">
        <h2 className="tg-heading-2">📅 Планировщик меню</h2>
        <button className="tg-button" onClick={() => {
          const list = generateShoppingList();
          console.log('Shopping list:', list);
        }}>
          🛒 Список покупок
        </button>
      </div>

      <div className="days-tabs">
        {days.map((day, index) => (
          <button
            key={index}
            className={`day-tab ${selectedDay === index ? 'active' : ''}`}
            onClick={() => setSelectedDay(index)}
          >
            {day.slice(0, 2)}
          </button>
        ))}
      </div>

      <div className="day-menu">
        <h3 className="tg-heading-3">{days[selectedDay]}</h3>
        {mealTimes.map(time => (
          <div key={time} className="meal-slot">
            <div className="meal-time-label">
              {time === 'breakfast' && '🌅 Завтрак'}
              {time === 'lunch' && '☀️ Обед'}
              {time === 'dinner' && '🌙 Ужин'}
              {time === 'snack' && '🍎 Перекус'}
            </div>
            {weekMenu[selectedDay]?.[time] ? (
              <div className="planned-meal">
                <span>{weekMenu[selectedDay][time].name}</span>
                <button onClick={() => addToMenu(selectedDay, time, null)}>
                  ✕
                </button>
              </div>
            ) : (
              <button className="add-meal-btn">
                + Добавить блюдо
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Рецепты
function RecipeBook({ onSelectRecipe }) {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    maxTime: null,
    difficulty: 'all'
  });

  const categories = ['Завтрак', 'Обед', 'Ужин', 'Десерт', 'Салат', 'Суп'];
  const difficulties = ['Легко', 'Средне', 'Сложно'];

  return (
    <div className="recipe-book">
      <div className="recipe-header">
        <h2 className="tg-heading-2">📖 Книга рецептов</h2>
        <button className="tg-button">+ Добавить рецепт</button>
      </div>

      <div className="recipe-search">
        <input
          type="text"
          className="tg-input"
          placeholder="Поиск рецептов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="recipe-filters">
        <select
          className="tg-input"
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="all">Все категории</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          className="tg-input"
          value={filters.difficulty}
          onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
        >
          <option value="all">Любая сложность</option>
          {difficulties.map(diff => (
            <option key={diff} value={diff}>{diff}</option>
          ))}
        </select>
      </div>

      <div className="recipes-grid">
        {recipes.map(recipe => (
          <div key={recipe.id} className="recipe-card hover-lift">
            {recipe.image && (
              <img src={recipe.image} alt={recipe.name} className="recipe-image" />
            )}
            <div className="recipe-info">
              <h3 className="tg-heading-4">{recipe.name}</h3>
              <div className="recipe-meta">
                <span>⏱️ {recipe.time} мин</span>
                <span>🔥 {recipe.calories} ккал</span>
                <span>👨‍🍳 {recipe.difficulty}</span>
              </div>
              <button
                className="tg-button"
                onClick={() => onSelectRecipe(recipe)}
              >
                Приготовить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Список покупок
function ShoppingList({ userId }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, {
        id: Date.now(),
        name: newItem,
        checked: false,
        category: 'other'
      }]);
      setNewItem('');
    }
  };

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? {...item, checked: !item.checked} : item
    ));
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const categories = {
    vegetables: '🥬 Овощи',
    fruits: '🍎 Фрукты',
    meat: '🥩 Мясо',
    dairy: '🥛 Молочное',
    bakery: '🍞 Хлеб',
    other: '📦 Другое'
  };

  return (
    <div className="shopping-list">
      <h2 className="tg-heading-2">🛒 Список покупок</h2>

      <div className="add-item">
        <input
          type="text"
          className="tg-input"
          placeholder="Добавить продукт..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
        />
        <button className="tg-button" onClick={addItem}>
          Добавить
        </button>
      </div>

      <div className="list-stats">
        <span>Всего: {items.length}</span>
        <span>Куплено: {items.filter(i => i.checked).length}</span>
      </div>

      {Object.entries(categories).map(([key, label]) => {
        const categoryItems = items.filter(i => i.category === key);
        if (categoryItems.length === 0) return null;

        return (
          <div key={key} className="category-group">
            <h3 className="category-label">{label}</h3>
            {categoryItems.map(item => (
              <div key={item.id} className={`list-item ${item.checked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                />
                <span>{item.name}</span>
                <button onClick={() => deleteItem(item.id)}>✕</button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export { VoiceInput, BarcodeScanner, MenuPlanner, RecipeBook, ShoppingList };
