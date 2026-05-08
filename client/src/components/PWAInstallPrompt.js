import React, { useEffect, useState } from 'react';

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now());
  };

  // Не показывать если уже установлено или недавно отклонено
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      setShowInstallPrompt(false);
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }
  }, []);

  if (!showInstallPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'var(--vk-bg-content)',
      border: '1px solid var(--vk-border)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 16px var(--vk-shadow)',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ fontSize: '32px' }}>📱</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--vk-text)', marginBottom: '4px' }}>
          Установить InnerEcho
        </div>
        <div style={{ fontSize: '13px', color: 'var(--vk-text-secondary)' }}>
          Быстрый доступ с домашнего экрана
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          padding: '8px 16px',
          background: 'var(--vk-blue)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        Установить
      </button>
      <button
        onClick={handleDismiss}
        style={{
          padding: '8px',
          background: 'transparent',
          color: 'var(--vk-text-secondary)',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer'
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default PWAInstallPrompt;
