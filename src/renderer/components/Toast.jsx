import React from 'react';

const COLORS = {
  success: { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.4)', color: '#4ade80', icon: '✓' },
  error:   { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', color: '#f87171', icon: '✕' },
  info:    { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.4)',  color: '#60a5fa', icon: 'ℹ' },
  warning: { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)',  color: '#fbbf24', icon: '⚠' },
};

export default function Toast({ message, type = 'success' }) {
  const s = COLORS[type] || COLORS.success;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      padding: '12px 18px', borderRadius: 12,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, fontWeight: 700, fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 8,
      zIndex: 9999, animation: 'slideIn 0.3s ease',
      backdropFilter: 'blur(8px)', maxWidth: 350,
      boxShadow: `0 8px 32px ${s.border}`,
    }}>
      <span style={{ fontSize: 16 }}>{s.icon}</span>
      {message}
    </div>
  );
}
