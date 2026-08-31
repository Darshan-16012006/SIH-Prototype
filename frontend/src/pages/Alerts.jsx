import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ShieldAlert, ExternalLink, CheckCheck } from 'lucide-react';
import { api } from '../services/api';

export function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, typeFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (severityFilter !== 'All') params.severity = severityFilter;
      if (typeFilter !== 'All') params.alert_type = typeFilter;

      const data = await api.getAlerts(params);
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      await api.markAlertRead(alertId);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>System Smart Alerts & Notifications Center</h2>

        <button className="btn btn-secondary" onClick={handleMarkAllRead}>
          <CheckCheck size={16} /> Mark All as Read
        </button>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Severity Level</label>
            <select
              className="form-control"
              style={{ width: '180px' }}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="form-label">Alert Type</label>
            <select
              className="form-control"
              style={{ width: '200px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Progress Delay">Progress Delay</option>
              <option value="Cost Overrun">Cost Overrun</option>
              <option value="Missed Milestone">Missed Milestone</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading smart alerts feed...</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No system alerts match the selected filters.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((a) => {
              const isCritical = a.severity === 'CRITICAL';
              const isHigh = a.severity === 'HIGH';
              return (
                <div
                  key={a.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: `1px solid ${isCritical ? '#FCA5A5' : isHigh ? '#FDE68A' : '#E2E8F0'}`,
                    backgroundColor: isCritical ? '#FEF2F2' : isHigh ? '#FFFBEB' : a.is_read ? '#FAFAFA' : '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span className={`badge ${isCritical ? 'badge-high_risk' : isHigh ? 'badge-delayed' : 'badge-warning'}`}>
                        {a.severity}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#005F73' }}>
                        {a.project_name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{a.date}</span>
                    </div>

                    <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: a.is_read ? 400 : 600 }}>
                      [{a.alert_type}] {a.message}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!a.is_read && (
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Mark as Read"
                        onClick={() => handleMarkRead(a.id)}
                      >
                        <CheckCircle2 size={14} /> Read
                      </button>
                    )}

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/projects/${a.project_id}`)}
                    >
                      <ExternalLink size={14} /> Open Project
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
