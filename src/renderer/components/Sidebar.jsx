import React from 'react';

const NAV_ITEMS = [
  { id: 'home', icon: '🏠', label: 'Главная' },
  { id: 'profiles', icon: '📦', label: 'Профили' },
  { id: 'mods', icon: '🔧', label: 'Моды' },
  { id: 'settings', icon: '⚙️', label: 'Настройки' },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside style={{
      width: 80,
      background: 'var(--bg-800)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 12,
      gap: 4,
      flexShrink: 0,
    }}>
      {/* Pig mascot */}
      <div style={{ fontSize: 28, marginBottom: 16, filter: 'drop-shadow(0 0 8px rgba(233,30,140,0.5))' }}>🐷</div>
      
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setPage(item.id)}
          title={item.label}
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            fontSize: 22,
            background: page === item.id
              ? 'linear-gradient(135deg, rgba(233,30,140,0.25), rgba(158,18,99,0.25))'
              : 'transparent',
            borderLeft: page === item.id ? '2px solid var(--pink-500)' : '2px solid transparent',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            if (page !== item.id) e.currentTarget.style.background = 'rgba(233,30,140,0.1)';
          }}
          onMouseLeave={e => {
            if (page !== item.id) e.currentTarget.style.background = 'transparent';
          }}
        >
          <span>{item.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: page === item.id ? 'var(--pink-300)' : 'var(--text-muted)', lineHeight: 1 }}>
            {item.label}
          </span>
        </button>
      ))}

      {/* Bottom pig decoration */}
      <div style={{ marginTop: 'auto', fontSize: 18, opacity: 0.3 }}>🐽</div>
    </aside>
  );
}
