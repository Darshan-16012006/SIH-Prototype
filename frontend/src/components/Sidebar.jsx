import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  LineChart,
  Bell,
  ShieldAlert,
  MapPin,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';

export function Sidebar({ collapsed, setCollapsed, user, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Risk Prediction', path: '/risk', icon: ShieldAlert },
    { name: 'Project Map', path: '/map', icon: MapPin },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Building2 size={24} />
        </div>
        {!collapsed && (
          <div>
            <div className="sidebar-title">PM-MONITOR</div>
            <div className="sidebar-subtitle">SIH 2026 • TITANS</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.name : ''}
            >
              <Icon className="nav-item-icon" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '16px 10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {!collapsed && user && (
          <div style={{ marginBottom: '12px', padding: '0 8px', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, color: '#FFF' }}>{user.full_name}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{user.role} • {user.department || 'Govt of India'}</div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="nav-item"
          style={{ color: '#EF4444' }}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut className="nav-item-icon" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item"
          style={{ marginTop: '8px', justifyContent: 'center' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
