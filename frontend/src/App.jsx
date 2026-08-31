import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AddProjectModal } from './components/AddProjectModal';
import { MonthlyUpdateModal } from './components/MonthlyUpdateModal';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Analytics } from './pages/Analytics';
import { Alerts } from './pages/Alerts';
import { RiskPrediction } from './pages/RiskPrediction';
import { ProjectMap } from './pages/ProjectMap';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sih_user');
    return saved ? JSON.parse(saved) : {
      id: 1,
      email: 'admin@demo.com',
      full_name: 'Admin Director (MoRTH)',
      role: 'Admin',
      department: 'Ministry of Road Transport & Highways'
    };
  });

  const [collapsed, setCollapsed] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Global Modals State
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showMonthlyUpdateModal, setShowMonthlyUpdateModal] = useState(false);
  const [selectedProjectForUpdate, setSelectedProjectForUpdate] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadAlertCount();
    }
  }, [location.pathname, user]);

  const loadAlertCount = async () => {
    try {
      const alerts = await api.getAlerts({ is_read: false });
      setUnreadAlertsCount(alerts.length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('sih_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sih_user');
    navigate('/login');
  };

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Executive Dashboard & Overview';
    if (pathname.startsWith('/projects/')) return 'Detailed Project Monitoring';
    if (pathname.startsWith('/projects')) return 'Infrastructure Projects Directory';
    if (pathname.startsWith('/analytics')) return 'Portfolio Analytics & Visualizations';
    if (pathname.startsWith('/alerts')) return 'Smart Alerts & Risk Center';
    if (pathname.startsWith('/risk')) return 'Explainable Risk Engine & AI Predictor';
    if (pathname.startsWith('/map')) return 'GIS Project Locations & Map';
    if (pathname.startsWith('/reports')) return 'Report Generation & CSV Exports';
    if (pathname.startsWith('/settings')) return 'System Settings & Thresholds';
    return 'Project Monitoring Platform';
  };

  const handleOpenMonthlyUpdate = (project = null) => {
    setSelectedProjectForUpdate(project);
    setShowMonthlyUpdateModal(true);
  };

  const handleUpdateSubmitted = () => {
    loadAlertCount();
    window.location.reload(); // Refresh current view data seamlessly
  };

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        onLogout={handleLogout}
      />

      <div className="main-content">
        <Header
          title={getPageTitle(location.pathname)}
          user={user}
          alertCount={unreadAlertsCount}
        />

        <main className="page-body">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  user={user}
                  onOpenAddProject={() => setShowAddProjectModal(true)}
                  onOpenMonthlyUpdate={handleOpenMonthlyUpdate}
                />
              }
            />
            <Route
              path="/projects"
              element={
                <Projects
                  user={user}
                  onOpenAddProject={() => setShowAddProjectModal(true)}
                />
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProjectDetails
                  user={user}
                  onOpenMonthlyUpdate={handleOpenMonthlyUpdate}
                />
              }
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/risk" element={<RiskPrediction />} />
            <Route path="/map" element={<ProjectMap />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onProjectCreated={() => {
          loadAlertCount();
          navigate('/projects');
        }}
      />

      <MonthlyUpdateModal
        isOpen={showMonthlyUpdateModal}
        onClose={() => setShowMonthlyUpdateModal(false)}
        selectedProject={selectedProjectForUpdate}
        onUpdateSubmitted={handleUpdateSubmitted}
      />
    </div>
  );
}
