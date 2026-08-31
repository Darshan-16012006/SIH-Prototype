import React from 'react';

export function RiskBadge({ level, score }) {
  const levelMap = {
    LOW: { label: 'Low', class: 'badge-on_track' },
    MEDIUM: { label: 'Medium', class: 'badge-warning' },
    HIGH: { label: 'High', class: 'badge-delayed' },
    CRITICAL: { label: 'Critical', class: 'badge-high_risk' }
  };

  const item = levelMap[level] || { label: level || 'Low', class: 'badge-on_track' };

  return (
    <span className={`badge ${item.class}`}>
      {item.label} {score !== undefined ? `(${score})` : ''}
    </span>
  );
}
