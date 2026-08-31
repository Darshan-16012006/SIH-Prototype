import React from 'react';

export function StatusBadge({ status }) {
  const statusMap = {
    ON_TRACK: { label: 'On Track', class: 'badge-on_track' },
    WARNING: { label: 'Warning', class: 'badge-warning' },
    DELAYED: { label: 'Delayed', class: 'badge-delayed' },
    HIGH_RISK: { label: 'High Risk', class: 'badge-high_risk' }
  };

  const item = statusMap[status] || { label: status || 'Unknown', class: 'badge-secondary' };

  return (
    <span className={`badge ${item.class}`}>
      ● {item.label}
    </span>
  );
}

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
