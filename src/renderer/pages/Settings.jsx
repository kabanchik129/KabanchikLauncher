import React, { useState, useEffect } from 'react';

const api = window.KabanchikAPI;

export default function Settings({ account, showToast }) {
  const [javaList, setJavaList] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [settings, setSettings] = useState({
    defaultJava: '',
    keepLauncherOpen: true,
    language: 'ru',
    theme: 'dark',
    closeOnLaunch: false,
    showConsole: false,
  });

  useEffect(() => {
    api.storeGet('settings').then(s => {
      if (s) setSettings(prev => ({ ...prev, ...s }));
    });
  }, []);

  const saveSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await api.storeSet('settings', updated);
    showToast('Настройки сохранены', 'success');
  };

  const detectJava = async () => {
    setDetecting(true);
    const list = await api.detectJava();
    setJavaList(list || []);
    setDetecting(false);
    if (list?.length === 0) showToast('Java не найдена. Установите Java 17+', 'warning');
    else showToast(`Найдено ${list.length} установок Java`, 'success');
  };

  const selectJava = async () => {
    const path = await api.selectJava();
    if (path) saveSettings({ defaultJava: path });
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>⚙️ Настройки</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Конфигурация лаунчера</p>

      {/* Account */}
      <Section title="👤 Аккаунт">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 700 }}>{account?.username}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {account?.type === 'microsoft' ? '✅ Лицензионный аккаунт Microsoft' : '⚠️ Офлайн режим (пиратка)'}
            </div>
          </div>
          <span className={`badge ${account?.type === 'microsoft' ? 'badge-green' : 'badge-yellow'}`}>
            {account?.type === 'microsoft' ? 'Лицензия' : 'Офлайн'}
          </span>
        </div>
      </Section>

      {/* Java */}
      <Section title="☕ Java">
        <div style={{ marginBottom: 12 }}>
          <label className="label">Путь к Java</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={settings.defaultJava} onChange={e => saveSettings({ defaultJava: e.target.value })} placeholder="Автоопределение (java из PATH)" />
            <button className="btn btn-secondary" onClick={selectJava}>Обзор</button>
          </div>
        </div>
        
        <button className="btn btn-secondary" onClick={detectJava} disabled={detecting}>
          {detecting ? '⟳ Поиск...' : '🔍 Найти Java на компьютере'}
        </button>

        {javaList.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {javaList.map((j, i) => (
              <div key={i} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Java {j.major}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{j.path}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${j.major >= 17 ? 'badge-green' : j.major >= 11 ? 'badge-yellow' : 'badge-pink'}`}>
                    Java {j.major}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => saveSettings({ defaultJava: j.path })}>
                    Использовать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12, padding: 12, background: 'rgba(96,165,250,0.08)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          ℹ️ Рекомендуется <strong style={{color:'var(--info)'}}>Java 17 или 21</strong> для Minecraft 1.17+.<br/>
          Скачать: <a href="https://adoptium.net" style={{ color: 'var(--pink-400)' }}>adoptium.net</a> (Eclipse Temurin — лучший вариант)
        </div>
      </Section>

      {/* Launcher behavior */}
      <Section title="🎛️ Поведение лаунчера">
        <Toggle
          label="Закрывать лаунчер при запуске игры"
          description="Лаунчер свернётся когда Minecraft запустится"
          value={settings.closeOnLaunch}
          onChange={v => saveSettings({ closeOnLaunch: v })}
        />
        <Toggle
          label="Показывать консоль"
          description="Отображать лог Minecraft в лаунчере"
          value={settings.showConsole}
          onChange={v => saveSettings({ showConsole: v })}
        />
      </Section>

      {/* About */}
      <Section title="🐷 О лаунчере">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Лаунчер', 'KabanchikLauncher v1.0.0'],
            ['Разработчик', '🐷 Kabanchik Team'],
            ['Electron', 'v28'],
            ['Node.js', window.KabanchikAPI?.nodeVersion || 'Electron'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{k}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐷</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Хрю-хрю! Кабанчик желает удачи в игре!</div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 12 }}>{title}</h2>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0, position: 'relative',
          background: value ? 'linear-gradient(135deg, var(--pink-500), var(--pink-700))' : 'var(--bg-600)',
          transition: 'background 0.2s',
          border: '1px solid',
          borderColor: value ? 'var(--pink-600)' : 'var(--border)',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 2, left: value ? 22 : 2, transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}
