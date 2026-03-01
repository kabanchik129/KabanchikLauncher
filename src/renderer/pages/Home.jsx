import React, { useState, useEffect } from 'react';

const api = window.KabanchikAPI;

export default function Home({ account, onLaunch, isLaunching, launchProgress, showToast, setSelectedProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [logLines, setLogLines] = useState([]);

  useEffect(() => {
    api.listProfiles().then(p => {
      setProfiles(p);
      if (p.length > 0) setActiveProfile(p[0]);
    });

    api.on('minecraft:log', (data) => {
      setLogLines(prev => [...prev.slice(-50), data.message]);
    });
  }, []);

  const handleLaunch = async () => {
    if (!activeProfile) { showToast('Выберите профиль', 'warning'); return; }
    if (!account) { showToast('Войдите в аккаунт', 'warning'); return; }
    await onLaunch(activeProfile.id);
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(233,30,140,0.15) 0%, rgba(158,18,99,0.08) 50%, rgba(14,6,9,0) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden',
      }}>
        {/* Background pig */}
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 120, opacity: 0.08, userSelect: 'none' }}>🐷</div>
        
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
            Привет, <span style={{ color: 'var(--pink-400)' }}>{account?.username}</span>! 🐷
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Выбери профиль и запусти Minecraft
          </p>

          {/* Profile selector */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="input"
              style={{ width: 260 }}
              value={activeProfile?.id || ''}
              onChange={e => setActiveProfile(profiles.find(p => p.id === e.target.value))}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleLaunch}
              disabled={isLaunching || !activeProfile}
              style={{ minWidth: 160 }}
            >
              {isLaunching ? (
                <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Загрузка...</>
              ) : (
                <><span>▶</span> Играть</>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {launchProgress && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {launchProgress.message || `${launchProgress.type || 'Загрузка'}...`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--pink-400)', fontWeight: 700 }}>
                  {launchProgress.percent || 0}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${launchProgress.percent || 0}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active profile info */}
      {activeProfile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Версия', value: activeProfile.version, icon: '🎮' },
            { label: 'Загрузчик', value: activeProfile.loader || 'Vanilla', icon: '📦' },
            { label: 'RAM', value: `${activeProfile.ram || 4096} МБ`, icon: '💾' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Presets */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚡</span> Оптимизированные сборки
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {profiles.filter(p => p.isPreset).map(p => (
            <div
              key={p.id}
              className="card"
              onClick={() => setActiveProfile(p)}
              style={{
                cursor: 'pointer', padding: 16,
                border: activeProfile?.id === p.id ? '1px solid var(--pink-500)' : '1px solid var(--border)',
                background: activeProfile?.id === p.id ? 'rgba(233,30,140,0.1)' : 'var(--bg-card)',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{p.description}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="badge badge-pink">{p.version}</span>
                <span className="badge badge-blue">{p.loader}</span>
                <span className="badge badge-yellow">{p.ram}MB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Console log */}
      {logLines.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>📋 Лог игры</h2>
          <div style={{
            background: 'var(--bg-900)', border: '1px solid var(--border)', borderRadius: 12,
            padding: 12, maxHeight: 150, overflow: 'auto', fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            {logLines.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
