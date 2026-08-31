import React from 'react';

export function StatCard({ icon: Icon, label, value, color = '#005F73', subtext }) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon-wrapper"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <Icon size={24} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtext && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{subtext}</div>}
      </div>
    </div>
  );
}
