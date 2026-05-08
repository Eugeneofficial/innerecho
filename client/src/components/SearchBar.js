import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005/api';

function SearchBar({ onSearch, currentUser }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ meals: [], templates: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minCalories: '',
    maxCalories: '',
    minProtein: '',
    maxProtein: '',
    minFats: '',
    maxFats: '',
    minCarbs: '',
    maxCarbs: '',
    mealTime: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularMeals, setPopularMeals] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    // Загрузить недавние поиски из localStorage
    const saved = localStorage.getItem('foodsync_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    // Загрузить популярные блюда
    if (currentUser) {
      fetch(`${API_URL}/search/popular?userId=${currentUser.id}&limit=5`)
        .then(res => res.json())
        .then(data => setPopularMeals(data))
        .catch(err => console.error('Ошибка загрузки популярных блюд:', err));
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions({ meals: [], templates: [] });
      return;
    }

    const timer = setTimeout(() => {
      fetch(`${API_URL}/search/autocomplete?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data);
          setShowSuggestions(true);
        })
        .catch(err => console.error('Ошибка автодополнения:', err));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    // Сохранить в недавние поиски
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('foodsync_recent_searches', JSON.stringify(updated));

    // Выполнить поиск
    onSearch({ search: searchQuery, ...filters });
    setShowSuggestions(false);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (query) {
      onSearch({ search: query, ...newFilters });
    }
  };

  const clearFilters = () => {
    setFilters({
      minCalories: '',
      maxCalories: '',
      minProtein: '',
      maxProtein: '',
      minFats: '',
      maxFats: '',
      minCarbs: '',
      maxCarbs: '',
      mealTime: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    if (query) {
      onSearch({ search: query });
    }
  };

  const selectSuggestion = (item) => {
    setQuery(item.name);
    handleSearch(item.name);
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Поиск еды..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => setShowSuggestions(true)}
            className="search-input"
          />
          {query && (
            <button className="search-clear" onClick={() => { setQuery(''); setSuggestions({ meals: [], templates: [] }); }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Фильтры
        </button>
      </div>

      {showSuggestions && (query.length >= 2 || recentSearches.length > 0 || popularMeals.length > 0) && (
        <div className="search-suggestions">
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="suggestion-section">
              <div className="suggestion-header">Недавние поиски</div>
              {recentSearches.map((search, idx) => (
                <div key={idx} className="suggestion-item" onClick={() => { setQuery(search); handleSearch(search); }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>{search}</span>
                </div>
              ))}
            </div>
          )}

          {query.length < 2 && popularMeals.length > 0 && (
            <div className="suggestion-section">
              <div className="suggestion-header">Популярные блюда</div>
              {popularMeals.map((meal, idx) => (
                <div key={idx} className="suggestion-item" onClick={() => selectSuggestion(meal)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L9.5 6H14L10.5 9L12 13L8 10L4 13L5.5 9L2 6H6.5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <div className="suggestion-content">
                    <span className="suggestion-name">{meal.name}</span>
                    <span className="suggestion-meta">{meal.calories} ккал • {meal.count}×</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.meals.length > 0 && (
            <div className="suggestion-section">
              <div className="suggestion-header">Блюда</div>
              {suggestions.meals.map((meal, idx) => (
                <div key={idx} className="suggestion-item" onClick={() => selectSuggestion(meal)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <div className="suggestion-content">
                    <span className="suggestion-name">{meal.name}</span>
                    <span className="suggestion-meta">{meal.calories} ккал • Б: {meal.protein}г Ж: {meal.fats}г У: {meal.carbs}г</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.templates.length > 0 && (
            <div className="suggestion-section">
              <div className="suggestion-header">Шаблоны</div>
              {suggestions.templates.map((template, idx) => (
                <div key={idx} className="suggestion-item" onClick={() => selectSuggestion(template)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <div className="suggestion-content">
                    <span className="suggestion-name">{template.name}</span>
                    <span className="suggestion-meta">{template.calories} ккал</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showFilters && (
        <div className="search-filters">
          <div className="filters-header">
            <span>Фильтры поиска</span>
            <button className="filters-clear" onClick={clearFilters}>Сбросить</button>
          </div>

          <div className="filter-group">
            <label>Калории</label>
            <div className="filter-range">
              <input
                type="number"
                placeholder="От"
                value={filters.minCalories}
                onChange={(e) => handleFilterChange('minCalories', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="До"
                value={filters.maxCalories}
                onChange={(e) => handleFilterChange('maxCalories', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Белки (г)</label>
            <div className="filter-range">
              <input
                type="number"
                placeholder="От"
                value={filters.minProtein}
                onChange={(e) => handleFilterChange('minProtein', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="До"
                value={filters.maxProtein}
                onChange={(e) => handleFilterChange('maxProtein', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Жиры (г)</label>
            <div className="filter-range">
              <input
                type="number"
                placeholder="От"
                value={filters.minFats}
                onChange={(e) => handleFilterChange('minFats', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="До"
                value={filters.maxFats}
                onChange={(e) => handleFilterChange('maxFats', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Углеводы (г)</label>
            <div className="filter-range">
              <input
                type="number"
                placeholder="От"
                value={filters.minCarbs}
                onChange={(e) => handleFilterChange('minCarbs', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="До"
                value={filters.maxCarbs}
                onChange={(e) => handleFilterChange('maxCarbs', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Тип приёма пищи</label>
            <select value={filters.mealTime} onChange={(e) => handleFilterChange('mealTime', e.target.value)}>
              <option value="">Все</option>
              <option value="breakfast">Завтрак</option>
              <option value="lunch">Обед</option>
              <option value="dinner">Ужин</option>
              <option value="snack">Перекус</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Сортировка</label>
            <div className="filter-sort">
              <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                <option value="created_at">По дате</option>
                <option value="calories">По калориям</option>
                <option value="protein">По белкам</option>
                <option value="fats">По жирам</option>
                <option value="carbs">По углеводам</option>
                <option value="name">По названию</option>
              </select>
              <select value={filters.sortOrder} onChange={(e) => handleFilterChange('sortOrder', e.target.value)}>
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
