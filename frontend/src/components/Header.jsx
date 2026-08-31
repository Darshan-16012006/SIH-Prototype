import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User as UserIcon } from 'lucide-react';

export function Header({ title, user, alertCount = 0 }) {
  const navigate = useNavigate();

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>

      <div className="header-actions">
        {/* Quick Search */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search projects..."
            className="form-control"
            style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/projects?search=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
        </div>

        {/* Notifications Bell */}
        <button
          onClick={() => navigate('/alerts')}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: '#475569'
          }}
          title="Alerts & Notifications"
        >
          <Bell size={20} />
          {alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: '#EF4444',
                color: '#FFF',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {alertCount}
            </span>
          )}
        </button>

        {/* User Info */}
        <div className="user-profile">
          <div className="avatar">
            {user ? user.full_name.charAt(0) : 'U'}
          </div>
          <div style={{ fontSize: '13px' }}>
            <div style={{ fontWeight: 600, color: '#0F172A' }}>{user ? user.full_name : 'Guest'}</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>{user ? user.role : 'Viewer'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
