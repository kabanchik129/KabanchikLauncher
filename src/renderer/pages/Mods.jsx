import React, { useState, useEffect, useCallback } from 'react';

const api = window.KabanchikAPI;

const LOADERS = ['fabric', 'forge', 'quilt', 'neoforge'];
const CATEGORIES = [
  { id: '', label: 'Все' },
  { id: 'optimization', label: '⚡ Оптимизация' },
  { id: 'utility', label: '🔧 Утилиты' },
  { id: 'library', label: '📚 Библиотеки' },
  { id: 'worldgen', label: '🌍 Генерация' },
  { id: 'adventure', label: '⚔️ Приключения' },
  { id: 'tech', label: '⚙️ Технологии' },
];

export default function Mods({ showToast }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [tab, setTab] = useState('search'); // 'search' | 'installed'
  const [installedMods, setInstalledMods] = useState([]);
  const [category, setCategory] = useState('');
  const [versionModal, setVersionModal] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});

  useEffect(() => {
    api.listProfiles().then(p => {
      setProfiles(p);
      if (p.length > 0) setSelectedProfile(p[0]);
    });
    
    api.on('modrinth:downloadProgress', (data) => {
      setDownloadProgress(prev => ({ ...prev, [data.fileName]: data.percent }));
    });
  }, []);

  useEffect(() => {
    if (selectedProfile && tab === 'installed') {
      loadInstalledMods();
    }
  }, [selectedProfile, tab]);

  const loadInstalledMods = async () => {
    if (!selectedProfile) return;
    const mods = await api.getProfileMods(selectedProfile.id);
    setInstalledMods(mods || []);
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim() && !category) return;
    setLoading(true);
    const opts = {
      loader: selectedProfile?.loader !== 'vanilla' ? selectedProfile?.loader : undefined,
      gameVersion: selectedProfile?.version,
      category,
    };
    const res = await api.searchMods(query || category || 'optimization', opts);
    setLoading(false);
    if (res.error) showToast(res.error, 'error');
    else setResults(res.hits || []);
  }, [query, category, selectedProfile]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 600);
    return () => clearTimeout(timer);
  }, [query, category]);

  const handleDownload = async (project) => {
    if (!selectedProfile) { showToast('Выберите профиль', 'warning'); return; }
    
    // Получаем версии мода
    const versions = await api.getModVersions(
      project.project_id,
      selectedProfile.version,
      selectedProfile.loader !== 'vanilla' ? selectedProfile.loader : undefined,
    );
    
    if (versions.error || !versions || versions.length === 0) {
      showToast('Нет версий для этой конфигурации', 'warning');
      return;
    }
    
    // Если одна версия — сразу качаем
    if (versions.length === 1) {
      await doDownload(versions[0].id, project.title);
    } else {
      // Показываем выбор версии
      setVersionModal({ project, versions });
    }
  };

  const doDownload = async (versionId, name) => {
    setDownloading(prev => ({ ...prev, [versionId]: true }));
    const result = await api.downloadMod(versionId, selectedProfile.id);
    setDownloading(prev => ({ ...prev, [versionId]: false }));
    
    if (result.error) showToast(`Ошибка: ${result.error}`, 'error');
    else showToast(`${name} установлен! 🐷`, 'success');
    
    setVersionModal(null);
  };

  const handleDeleteMod = async (modFile) => {
    if (!confirm(`Удалить мод ${modFile}?`)) return;
    const r = await api.deleteMod(selectedProfile.id, modFile);
    if (r.error) showToast(r.error, 'error');
    else { showToast('Мод удалён', 'success'); loadInstalledMods(); }
  };

  const formatDownloads = (n) => {
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(0)}K`;
    return n;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🔧 Моды</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Поиск и установка модов с Modrinth</p>
        
        {/* Profile + Tabs */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <select className="input" style={{ width: 220 }} value={selectedProfile?.id || ''} onChange={e => setSelectedProfile(profiles.find(p => p.id === e.target.value))}>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
          </select>
          
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-800)', padding: 4, borderRadius: 10 }}>
            {['search', 'installed'].map(t => (
              <button key={t} className="btn btn-sm" onClick={() => setTab(t)} style={{
                background: tab === t ? 'var(--bg-500)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
              }}>
                {t === 'search' ? '🔍 Поиск' : `📦 Установлено (${installedMods.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === 'search' && (
          <>
            <input className="input" placeholder="Поиск модов на Modrinth..." value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c.id} className="btn btn-sm" onClick={() => setCategory(c.id)} style={{
                  background: category === c.id ? 'rgba(233,30,140,0.2)' : 'var(--bg-500)',
                  border: category === c.id ? '1px solid var(--pink-500)' : '1px solid var(--border)',
                  color: category === c.id ? 'var(--pink-300)' : 'var(--text-secondary)',
                }}>
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        {tab === 'search' && (
          <>
            {loading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
                <div style={{ marginTop: 8 }}>Ищем моды...</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {results.map(mod => (
                <div key={mod.project_id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {mod.icon_url ? (
                      <img src={mod.icon_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🔧</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {mod.description}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">⬇ {formatDownloads(mod.downloads)}</span>
                    {mod.categories?.slice(0,2).map(c => <span key={c} className="badge badge-pink">{c}</span>)}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDownload(mod)}
                    disabled={downloading[mod.project_id]}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {downloading[mod.project_id] ? '⟳ Скачивание...' : '⬇ Установить'}
                  </button>
                </div>
              ))}
            </div>
            {!loading && results.length === 0 && query && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                <div>Ничего не найдено по запросу «{query}»</div>
              </div>
            )}
          </>
        )}

        {tab === 'installed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {installedMods.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                <div>Нет установленных модов</div>
              </div>
            )}
            {installedMods.map(mod => (
              <div key={mod.filename} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>🔧</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{mod.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mod.filename} · {(mod.size / 1024).toFixed(0)} KB</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMod(mod.filename)}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version modal */}
      {versionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setVersionModal(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: 480, maxHeight: '70vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Выбери версию: {versionModal.project.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {versionModal.versions.slice(0, 20).map(v => (
                <button key={v.id} className="btn btn-secondary" onClick={() => doDownload(v.id, versionModal.project.title)}
                  style={{ justifyContent: 'space-between', textAlign: 'left' }}>
                  <span>{v.name}</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    {v.game_versions?.slice(0,2).map(gv => <span key={gv} className="badge badge-pink">{gv}</span>)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
