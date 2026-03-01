import React from 'react';

const api = window.KabanchikAPI;

export default function TitleBar({ account, onLogout }) {
  return (
    <div style={{
      height: 48,
      background: 'var(--bg-900)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      WebkitAppRegion: 'drag',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🐷</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          Kabanchik<span style={{ color: 'var(--pink-400)' }}>Launcher</span>
        </span>
      </div>

      {/* Account info */}
      {account && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, WebkitAppRegion: 'no-drag' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--pink-600), var(--pink-800))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>
              {account.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{account.username}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                {account.type === 'microsoft' ? '✓ Лицензия' : '⚠ Офлайн'}
              </div>
            </div>
          </div>
          <button onClick={onLogout} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--danger)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >Выйти</button>
        </div>
      )}

      {/* Window controls */}
      <div style={{ display: 'flex', gap: 8, WebkitAppRegion: 'no-drag' }}>
        {[
          { label: '–', action: () => api.minimize(), color: '#fbbf24', hover: '#f59e0b' },
          { label: '□', action: () => api.maximize(), color: '#4ade80', hover: '#22c55e' },
          { label: '×', action: () => api.close(), color: '#f87171', hover: '#ef4444' },
        ].map(({ label, action, color, hover }) => (
          <button key={label} onClick={action} style={{
            width: 24, height: 24, borderRadius: '50%', border: 'none',
            background: color, cursor: 'pointer', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'transparent', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.color = '#000'; e.target.style.background = hover; }}
          onMouseLeave={e => { e.target.style.color = 'transparent'; e.target.style.background = color; }}
          >{label}</button>
        ))}
      </div>
    </div>
  );
}
