import React, { useState, useEffect, useMemo } from 'react';

const api = window.KabanchikAPI;

const LOADERS = ['vanilla', 'fabric', 'forge', 'quilt', 'neoforge'];
const ICONS = ['🐷','🎮','⚡','🌿','🔥','✨','🌈','💎','🎯','🏆'];

const VERSION_TYPES = [
  { id: 'release',   label: '✅ Релизы',   color: '#4ade80' },
  { id: 'snapshot',  label: '🧪 Снапшоты', color: '#60a5fa' },
  { id: 'old_beta',  label: '📦 Бета',     color: '#fb923c' },
  { id: 'old_alpha', label: '🦕 Альфа',    color: '#a78bfa' },
];

function CreateModal({ onClose, onCreated, versions, showToast }) {
  const [form, setForm] = useState({
    name: '', version: '1.20.4', loader: 'fabric', ram: 4096, icon: '🎮', description: '',
    windowWidth: 1280, windowHeight: 720,
  });
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [versionFilter, setVersionFilter] = useState('release');
  const [versionSearch, setVersionSearch] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Фильтрация версий
  const filteredVersions = useMemo(() => {
    return (versions || [])
      .filter(v => v.type === versionFilter)
      .filter(v => !versionSearch || v.id.includes(versionSearch));
  }, [versions, versionFilter, versionSearch]);

  const handleCreate = async () => {
    if (!form.name.trim()) { showToast('Введите название', 'warning'); return; }
    setLoading(true);
    
    const result = await api.createProfile(form);
    if (result.error) { showToast(result.error, 'error'); setLoading(false); return; }
    
    if (form.loader === 'fabric') {
      setInstalling(true);
      const r = await api.installFabric(form.version);
      setInstalling(false);
      if (r.error) showToast('Fabric: ' + r.error, 'warning');
      else showToast('Fabric установлен!', 'success');
    } else if (form.loader === 'forge') {
      setInstalling(true);
      const r = await api.installForge(form.version);
      setInstalling(false);
      if (r.error) showToast('Forge: ' + r.error, 'warning');
      else showToast('Forge установлен!', 'success');
    }
    
    onCreated(result);
    setLoading(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20,
        padding: 32, width: 520, maxHeight: '90vh', overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📦</span> Новый профиль
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Icon picker */}
          <div>
            <label className="label">Иконка</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ICONS.map(icon => (
                <button key={icon} onClick={() => set('icon', icon)} style={{
                  width: 40, height: 40, borderRadius: 10,
                  border: form.icon === icon ? '2px solid var(--pink-500)' : '2px solid var(--border)',
                  background: form.icon === icon ? 'rgba(233,30,140,0.15)' : 'var(--bg-input)',
                  cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{icon}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Название</label>
            <input className="input" placeholder="Мой профиль" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <label className="label">Описание</label>
            <input className="input" placeholder="Необязательно" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Version selector */}
          <div>
            <label className="label">Версия Minecraft</label>

            {/* Type filter tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
              {VERSION_TYPES.map(t => (
                <button key={t.id} onClick={() => { setVersionFilter(t.id); setVersionSearch(''); }}
                  style={{
                    flex: 1, padding: '5px 4px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: versionFilter === t.id ? `${t.color}22` : 'transparent',
                    color: versionFilter === t.id ? t.color : 'var(--text-muted)',
                    fontWeight: 700, fontSize: 11, fontFamily: 'inherit', transition: 'all 0.15s',
                    borderBottom: versionFilter === t.id ? `2px solid ${t.color}` : '2px solid transparent',
                  }}>{t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input className="input" placeholder="Поиск версии (1.20, 1.8...)"
              value={versionSearch} onChange={e => setVersionSearch(e.target.value)}
              style={{ marginBottom: 8 }} />

            {/* Version list */}
            <div style={{
              maxHeight: 180, overflow: 'auto', background: 'var(--bg-input)',
              border: '1px solid var(--border)', borderRadius: 10,
            }}>
              {filteredVersions.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Версий не найдено</div>
              ) : filteredVersions.map(v => (
                <div key={v.id} onClick={() => set('version', v.id)}
                  style={{
                    padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: form.version === v.id ? 700 : 400,
                    background: form.version === v.id ? 'rgba(233,30,140,0.12)' : 'transparent',
                    color: form.version === v.id ? 'var(--pink-400)' : 'var(--text-primary)',
                    borderLeft: form.version === v.id ? '3px solid var(--pink-500)' : '3px solid transparent',
                    transition: 'all 0.1s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (form.version !== v.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (form.version !== v.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{v.id}</span>
                  {form.version === v.id && <span style={{ fontSize: 11 }}>✓ Выбрано</span>}
                </div>
              ))}
            </div>

            {/* Selected version badge */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              Выбрано: <span className="badge badge-pink">{form.version}</span>
            </div>
          </div>

          {/* Loader */}
          <div>
            <label className="label">Загрузчик модов</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LOADERS.map(l => {
                const loaderColors = { vanilla: '#4ade80', fabric: '#60a5fa', forge: '#fb923c', quilt: '#a78bfa', neoforge: '#f472b6' };
                const c = loaderColors[l];
                return (
                  <button key={l} onClick={() => set('loader', l)} style={{
                    padding: '7px 14px', borderRadius: 9, border: `1px solid ${form.loader === l ? c : 'var(--border)'}`,
                    background: form.loader === l ? `${c}22` : 'transparent',
                    color: form.loader === l ? c : 'var(--text-muted)',
                    cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}>{l}</button>
                );
              })}
            </div>
            {form.loader !== 'vanilla' && (
              <div style={{ marginTop: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#60a5fa' }}>
                ℹ️ {form.loader.charAt(0).toUpperCase() + form.loader.slice(1)} будет установлен автоматически
              </div>
            )}
          </div>

          {/* RAM */}
          <div>
            <label className="label">RAM: <span style={{ color: 'var(--pink-400)' }}>{form.ram} МБ ({(form.ram/1024).toFixed(1)} ГБ)</span></label>
            <input type="range" min="1024" max="16384" step="512" value={form.ram} onChange={e => set('ram', parseInt(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1 ГБ</span><span>4 ГБ</span><span>8 ГБ</span><span>16 ГБ</span>
            </div>
          </div>

          {/* Resolution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Ширина окна</label>
              <input className="input" type="number" value={form.windowWidth} onChange={e => set('windowWidth', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="label">Высота окна</label>
              <input className="input" type="number" value={form.windowHeight} onChange={e => set('windowHeight', parseInt(e.target.value))} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Отмена</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading || installing} style={{ flex: 2 }}>
            {installing ? '⟳ Установка загрузчика...' : loading ? '⟳ Создание...' : '✓ Создать профиль'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profiles({ showToast, setSelectedProfile, onLaunch, isLaunching }) {
  const [profiles, setProfiles] = useState([]);
  const [versions, setVersions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    loadProfiles();
    api.getVersions().then(v => { if (!v.error) setVersions(v); });
  }, []);

  const loadProfiles = () => {
    api.listProfiles().then(p => setProfiles(p));
  };

  const handleDelete = async (id, isPreset) => {
    if (isPreset) { showToast('Нельзя удалить встроенный пресет', 'warning'); return; }
    if (!confirm('Удалить профиль? Все файлы будут удалены.')) return;
    const r = await api.deleteProfile(id);
    if (r.error) showToast(r.error, 'error');
    else { showToast('Профиль удалён', 'success'); loadProfiles(); }
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>📦 Профили</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Управляй своими сборками</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Создать</button>
      </div>

      {/* Presets section */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        ⚡ Встроенные оптимизированные сборки
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
        {profiles.filter(p => p.isPreset).map(p => (
          <ProfileCard key={p.id} profile={p} onLaunch={onLaunch} isLaunching={isLaunching}
            onDelete={handleDelete} setSelectedProfile={setSelectedProfile} showToast={showToast} />
        ))}
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        🎮 Мои профили
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {profiles.filter(p => !p.isPreset).map(p => (
          <ProfileCard key={p.id} profile={p} onLaunch={onLaunch} isLaunching={isLaunching}
            onDelete={handleDelete} setSelectedProfile={setSelectedProfile} showToast={showToast} />
        ))}
        {profiles.filter(p => !p.isPreset).length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 24 }}>Нет пользовательских профилей. Создай первый!</div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => loadProfiles()} versions={versions} showToast={showToast} />}
    </div>
  );
}

function ProfileCard({ profile, onLaunch, isLaunching, onDelete, setSelectedProfile, showToast }) {
  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 36 }}>{profile.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.description}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="badge badge-pink">{profile.version}</span>
        <span className="badge badge-blue">{profile.loader || 'vanilla'}</span>
        <span className="badge badge-yellow">{profile.ram}MB</span>
        {profile.isPreset && <span className="badge badge-green">⚡ Оптимизирован</span>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onLaunch(profile.id)} disabled={isLaunching}>
          ▶ Играть
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedProfile(profile); api.openFolder(profile.id); }}>
          📁
        </button>
        {!profile.isPreset && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(profile.id, profile.isPreset)}>🗑</button>
        )}
      </div>
    </div>
  );
}
