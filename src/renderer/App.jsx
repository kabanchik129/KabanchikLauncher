import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TitleBar from './components/TitleBar';
import Toast from './components/Toast';
import Home from './pages/Home';
import Profiles from './pages/Profiles';
import Mods from './pages/Mods';
import Settings from './pages/Settings';
import Login from './pages/Login';

const api = window.KabanchikAPI;

export default function App() {
  const [page, setPage] = useState('home');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [launchProgress, setLaunchProgress] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    api.getAccount().then(acc => {
      setAccount(acc);
      setLoading(false);
    });

    // Слушаем прогресс запуска
    api.on('minecraft:progress', (data) => {
      setLaunchProgress(data);
    });
    api.on('minecraft:log', (data) => {
      console.log('[MC]', data.message);
    });
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = (acc) => {
    setAccount(acc);
    api.saveAccount(acc);
    setPage('home');
    showToast(`Добро пожаловать, ${acc.username}! 🐷`, 'success');
  };

  const handleLogout = async () => {
    await api.logout();
    setAccount(null);
    showToast('Вы вышли из аккаунта', 'info');
  };

  const handleLaunch = async (profileId) => {
    if (isLaunching) return;
    setIsLaunching(true);
    setLaunchProgress({ percent: 0, message: 'Подготовка...' });

    const result = await api.launchGame(profileId);
    
    if (result.error) {
      showToast('Ошибка запуска: ' + result.error, 'error');
    } else {
      showToast('Игра запущена! Удачи! 🐷', 'success');
      setTimeout(() => setLaunchProgress(null), 2000);
    }
    setIsLaunching(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 64, animation: 'spin 2s linear infinite' }}>🐷</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Загрузка KabanchikLauncher...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <>
        <TitleBar account={null} />
        <Login onLogin={handleLogin} />
        {toast && <Toast {...toast} />}
      </>
    );
  }

  const pageProps = { account, showToast, selectedProfile, setSelectedProfile, onLaunch: handleLaunch, isLaunching, launchProgress };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <TitleBar account={account} onLogout={handleLogout} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar page={page} setPage={setPage} account={account} />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {page === 'home' && <Home {...pageProps} />}
          {page === 'profiles' && <Profiles {...pageProps} />}
          {page === 'mods' && <Mods {...pageProps} />}
          {page === 'settings' && <Settings {...pageProps} />}
        </main>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );
}
