import React, { useState, useEffect } from 'react';

// Apple Health интеграция
function AppleHealthIntegration({ userId }) {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const connectAppleHealth = async () => {
    try {
      // Проверяем доступность HealthKit
      if (!window.webkit?.messageHandlers?.healthKit) {
        alert('Apple Health доступен только на iOS устройствах');
        return;
      }

      // Запрашиваем разрешения
      const permissions = await requestHealthKitPermissions();
      if (permissions.granted) {
        setConnected(true);
        syncData();
      }
    } catch (error) {
      console.error('Apple Health connection failed:', error);
    }
  };

  const requestHealthKitPermissions = () => {
    return new Promise((resolve) => {
      window.webkit.messageHandlers.healthKit.postMessage({
        action: 'requestPermissions',
        types: ['steps', 'calories', 'weight', 'water', 'workouts']
      });
      // Обработчик ответа
      window.healthKitCallback = (result) => resolve(result);
    });
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      const healthData = await fetchHealthKitData();
      await sendToServer(healthData);
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const fetchHealthKitData = () => {
    return new Promise((resolve) => {
      window.webkit.messageHandlers.healthKit.postMessage({
        action: 'fetchData',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });
      window.healthKitDataCallback = (data) => resolve(data);
    });
  };

  const sendToServer = async (data) => {
    await fetch(`/api/integrations/apple-health/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-logo">🍎</div>
        <div className="integration-info">
          <h4 className="tg-text-md tg-font-semibold">Apple Health</h4>
          <p className="tg-text-sm tg-text-secondary">
            Синхронизация шагов, калорий, веса
          </p>
        </div>
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
      </div>

      {connected ? (
        <div className="integration-connected">
          <div className="sync-info">
            <span className="tg-text-sm tg-text-secondary">
              Последняя синхронизация:
            </span>
            <span className="tg-text-sm">
              {lastSync ? lastSync.toLocaleString() : 'Никогда'}
            </span>
          </div>
          <div className="integration-actions">
            <button
              className="tg-button-secondary"
              onClick={syncData}
              disabled={syncing}
            >
              {syncing ? 'Синхронизация...' : '🔄 Синхронизировать'}
            </button>
            <button
              className="tg-button-danger"
              onClick={() => setConnected(false)}
            >
              Отключить
            </button>
          </div>
        </div>
      ) : (
        <button className="tg-button" onClick={connectAppleHealth}>
          Подключить
        </button>
      )}
    </div>
  );
}

// Google Fit интеграция
function GoogleFitIntegration({ userId }) {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const connectGoogleFit = async () => {
    try {
      // Google OAuth
      const auth2 = await window.gapi.auth2.init({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read'
      });

      const user = await auth2.signIn();
      const accessToken = user.getAuthResponse().access_token;

      // Сохраняем токен
      await fetch(`/api/integrations/google-fit/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });

      setConnected(true);
      syncData(accessToken);
    } catch (error) {
      console.error('Google Fit connection failed:', error);
    }
  };

  const syncData = async (accessToken) => {
    setSyncing(true);
    try {
      const response = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataSources',
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();

      await fetch(`/api/integrations/google-fit/${userId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-logo">🏃</div>
        <div className="integration-info">
          <h4 className="tg-text-md tg-font-semibold">Google Fit</h4>
          <p className="tg-text-sm tg-text-secondary">
            Активность, шаги, тренировки
          </p>
        </div>
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
      </div>

      {connected ? (
        <div className="integration-actions">
          <button
            className="tg-button-secondary"
            onClick={() => syncData()}
            disabled={syncing}
          >
            {syncing ? 'Синхронизация...' : '🔄 Синхронизировать'}
          </button>
          <button
            className="tg-button-danger"
            onClick={() => setConnected(false)}
          >
            Отключить
          </button>
        </div>
      ) : (
        <button className="tg-button" onClick={connectGoogleFit}>
          Подключить
        </button>
      )}
    </div>
  );
}

// Fitbit интеграция
function FitbitIntegration({ userId }) {
  const [connected, setConnected] = useState(false);

  const connectFitbit = () => {
    const clientId = 'YOUR_FITBIT_CLIENT_ID';
    const redirectUri = encodeURIComponent(window.location.origin + '/fitbit-callback');
    const scope = 'activity nutrition weight sleep';

    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    window.location.href = authUrl;
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-logo">⌚</div>
        <div className="integration-info">
          <h4 className="tg-text-md tg-font-semibold">Fitbit</h4>
          <p className="tg-text-sm tg-text-secondary">
            Активность, сон, пульс
          </p>
        </div>
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
      </div>

      {!connected && (
        <button className="tg-button" onClick={connectFitbit}>
          Подключить
        </button>
      )}
    </div>
  );
}

// MyFitnessPal интеграция
function MyFitnessPalIntegration({ userId }) {
  const [connected, setConnected] = useState(false);
  const [importing, setImporting] = useState(false);

  const importFromMFP = async () => {
    setImporting(true);
    try {
      // Импорт данных из MyFitnessPal
      const response = await fetch(`/api/integrations/myfitnesspal/${userId}/import`, {
        method: 'POST'
      });
      const data = await response.json();

      alert(`Импортировано ${data.mealsCount} приёмов пищи`);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-logo">📊</div>
        <div className="integration-info">
          <h4 className="tg-text-md tg-font-semibold">MyFitnessPal</h4>
          <p className="tg-text-sm tg-text-secondary">
            Импорт дневника питания
          </p>
        </div>
      </div>

      <button
        className="tg-button"
        onClick={importFromMFP}
        disabled={importing}
      >
        {importing ? 'Импортирую...' : '📥 Импортировать данные'}
      </button>
    </div>
  );
}

// Умные весы интеграция
function SmartScaleIntegration({ userId }) {
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);

  const scanForDevices = async () => {
    setScanning(true);
    try {
      // Bluetooth сканирование
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['weight_scale'] },
          { name: 'Xiaomi Mi Scale' },
          { name: 'Withings' }
        ]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('weight_scale');
      const characteristic = await service.getCharacteristic('weight_measurement');

      // Подписываемся на изменения
      characteristic.addEventListener('characteristicvaluechanged', handleWeightChange);
      await characteristic.startNotifications();

      setConnected(true);
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleWeightChange = async (event) => {
    const value = event.target.value;
    const weight = value.getFloat32(1, true);

    // Отправляем на сервер
    await fetch(`/api/weight/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight, date: new Date() })
    });
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-logo">⚖️</div>
        <div className="integration-info">
          <h4 className="tg-text-md tg-font-semibold">Умные весы</h4>
          <p className="tg-text-sm tg-text-secondary">
            Автоматическая синхронизация веса
          </p>
        </div>
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
      </div>

      {!connected && (
        <button
          className="tg-button"
          onClick={scanForDevices}
          disabled={scanning}
        >
          {scanning ? 'Поиск устройств...' : '🔍 Найти весы'}
        </button>
      )}
    </div>
  );
}

// Главный компонент интеграций
function IntegrationsHub({ userId }) {
  return (
    <div className="integrations-hub">
      <h2 className="tg-heading-2">🔗 Интеграции</h2>
      <p className="tg-text-sm tg-text-secondary">
        Подключите ваши устройства и приложения для автоматической синхронизации данных
      </p>

      <div className="integrations-grid">
        <AppleHealthIntegration userId={userId} />
        <GoogleFitIntegration userId={userId} />
        <FitbitIntegration userId={userId} />
        <MyFitnessPalIntegration userId={userId} />
        <SmartScaleIntegration userId={userId} />
      </div>

      <div className="integrations-info">
        <h3 className="tg-heading-3">💡 Зачем подключать интеграции?</h3>
        <ul className="benefits-list">
          <li>📊 Автоматический импорт данных о активности</li>
          <li>⚖️ Синхронизация веса с умных весов</li>
          <li>🏃 Учёт сожжённых калорий из тренировок</li>
          <li>💧 Отслеживание водного баланса</li>
          <li>😴 Анализ влияния сна на питание</li>
          <li>📈 Полная картина вашего здоровья</li>
        </ul>
      </div>
    </div>
  );
}

export {
  AppleHealthIntegration,
  GoogleFitIntegration,
  FitbitIntegration,
  MyFitnessPalIntegration,
  SmartScaleIntegration,
  IntegrationsHub
};
