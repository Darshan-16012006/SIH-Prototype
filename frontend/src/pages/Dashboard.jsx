import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  FolderKanban, CheckCircle2, AlertTriangle, AlertOctagon, DollarSign, TrendingUp,
  PlusCircle, Calendar, ShieldAlert, FileText, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';

export function Dashboard({ user, onOpenAddProject, onOpenMonthlyUpdate }) {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overview, alertsList] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAlerts()
      ]);
      setData(overview);
      setAlerts(alertsList.slice(0, 5)); // Latest 5 alerts
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        Loading project monitoring dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
        <h3>Error Loading Dashboard</h3>
        <p>{error || 'No data available.'}</p>
        <button className="btn btn-primary" onClick={loadDashboardData} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  const { kpis, status_distribution, planned_vs_actual } = data;

  return (
    <div>
      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {user?.role !== 'Viewer' && (
          <>
            <button className="btn btn-primary" onClick={onOpenAddProject}>
              <PlusCircle size={16} /> Add New Project
            </button>
            <button className="btn btn-secondary" onClick={onOpenMonthlyUpdate}>
              <Calendar size={16} /> Add Monthly Update
            </button>
          </>
        )}
        <button className="btn btn-secondary" onClick={() => navigate('/projects?status=DELAYED')}>
          <AlertTriangle size={16} style={{ color: '#EF4444' }} /> View Delayed Projects ({kpis.delayed})
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/alerts')}>
          <ShieldAlert size={16} style={{ color: '#F59E0B' }} /> View All Alerts
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
          <FileText size={16} /> Generate Reports
        </button>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="kpi-grid">
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={kpis.total_projects}
          color="#005F73"
          subtext="Active infrastructure portfolio"
        />
        <StatCard
          icon={CheckCircle2}
          label="On Track"
          value={kpis.on_track}
          color="#10B981"
          subtext="Meeting target milestones"
        />
        <StatCard
          icon={AlertTriangle}
          label="Delayed Projects"
          value={kpis.delayed}
          color="#F59E0B"
          subtext="Lagging >10% variance"
        />
        <StatCard
          icon={AlertOctagon}
          label="At Risk Projects"
          value={kpis.at_risk}
          color="#EF4444"
          subtext="Critical risk score >80"
        />
        <StatCard
          icon={DollarSign}
          label="Approved Budget"
          value={`₹${kpis.total_budget} Cr`}
          color="#0A9396"
          subtext="Total allocated funds"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Expenditure"
          value={`₹${kpis.total_expenditure} Cr`}
          color="#2B2D42"
          subtext={`Over-budget projects: ${kpis.overbudget_count}`}
        />
      </div>

      {/* Main Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Planned vs Actual Physical Progress Chart */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Planned vs Actual Physical Progress (%)</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planned_vs_actual.slice(0, 6)} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="project_id" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}%`]} />
                <Legend />
                <Bar dataKey="planned" name="Planned Progress (%)" fill="#0A9396" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Progress (%)" fill="#005F73" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status Distribution */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Project Status Portfolio Distribution</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={status_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Smart Alerts & High Risk Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Recent Alerts Feed */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Recent Smart System Alerts</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/alerts')}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.length === 0 ? (
              <div style={{ padding: '20px', color: '#64748B', textAlign: 'center' }}>No active alerts</div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: a.severity === 'CRITICAL' ? '#FEF2F2' : a.severity === 'HIGH' ? '#FFFBEB' : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                      [{a.alert_type}] {a.project_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                      {a.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      Date: {a.date}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                    onClick={() => navigate(`/projects/${a.project_id}`)}
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Risk Projects Table */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Top Risk Infrastructure Projects</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
              All Projects
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Budget</th>
                  <th>Var (%)</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {planned_vs_actual.slice(0, 5).map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                    <td style={{ fontWeight: 600, color: '#005F73' }}>{p.name}</td>
                    <td>₹{data.planned_vs_actual.find(item => item.id === p.id)?.budget || 500} Cr</td>
                    <td style={{ color: p.variance > 10 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      {p.variance > 0 ? `+${p.variance}%` : `${p.variance}%`}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td><RiskBadge level={p.status === 'HIGH_RISK' ? 'CRITICAL' : p.status === 'DELAYED' ? 'HIGH' : 'MEDIUM'} score={p.status === 'HIGH_RISK' ? 82 : 65} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
