import React, { useState } from 'react';

const api = window.KabanchikAPI;

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('choice'); // 'choice' | 'offline'
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMicrosoft = async () => {
    setLoading(true);
    setError('');
    const result = await api.loginMicrosoft();
    setLoading(false);
    if (result.error) setError(result.error);
    else onLogin(result);
  };

  const handleOffline = async () => {
    if (!username.trim()) { setError('Введите никнейм'); return; }
    setLoading(true);
    const result = await api.loginOffline(username.trim());
    setLoading(false);
    if (result.error) setError(result.error);
    else onLogin(result);
  };

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 50%, rgba(233,30,140,0.08) 0%, transparent 70%)',
      flexDirection: 'column', gap: 32,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 16, filter: 'drop-shadow(0 0 24px rgba(233,30,140,0.6))' }}>🐷</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Kabanchik<span style={{ color: 'var(--pink-400)' }}>Launcher</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
          Оптимизированный лаунчер Minecraft
        </p>
      </div>

      {/* Auth card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: 380 }}>
        {mode === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Войти в аккаунт</h2>

            <button className="btn btn-primary btn-lg" onClick={handleMicrosoft} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? (
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 21 21" fill="none"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
                  Войти через Microsoft
                </>
              )}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>или</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button className="btn btn-secondary" onClick={() => setMode('offline')} style={{ width: '100%', justifyContent: 'center' }}>
              🐷 Играть без лицензии
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              Microsoft — для лицензионного аккаунта.<br/>Без лицензии — только на пиратских серверах.
            </p>
          </div>
        )}

        {mode === 'offline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setMode('choice')} className="btn btn-ghost btn-sm">← Назад</button>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Офлайн режим</h2>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fbbf24' }}>
              ⚠️ Без лицензии вы не сможете заходить на лицензионные сервера
            </div>

            <div>
              <label className="label">Никнейм (3-16 символов)</label>
              <input
                className="input"
                placeholder="KabanchikPlayer"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOffline()}
                maxLength={16}
              />
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>⚠ {error}</div>}

            <button className="btn btn-primary" onClick={handleOffline} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? '⟳ Вход...' : '🐷 Войти'}
            </button>
          </div>
        )}

        {error && mode !== 'offline' && (
          <div style={{ marginTop: 12, color: 'var(--danger)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>⚠ {error}</div>
        )}
      </div>
    </div>
  );
}
