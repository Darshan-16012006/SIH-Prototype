import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export function Settings({ user }) {
  const [thresholds, setThresholds] = useState({
    warning_progress_variance: 5.0,
    delay_progress_variance: 10.0,
    cost_overrun_threshold: 0.0,
    high_risk_score: 60.0,
    critical_risk_score: 80.0
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    try {
      const data = await api.getThresholds();
      setThresholds(data);
    } catch (err) {
      console.error('Error loading thresholds:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateThresholds(thresholds);
      setSuccessMsg('Threshold parameters successfully updated in system backend.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>System Settings & Threshold Configuration</h2>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
          Configure project delay detection rules, risk scoring thresholds, and view active user role permissions.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Current User Profile & Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Full Name</div>
            <div style={{ fontWeight: 600, color: '#1E293B' }}>{user ? user.full_name : 'Guest'}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Email Address</div>
            <div style={{ fontWeight: 600, color: '#1E293B' }}>{user ? user.email : 'N/A'}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Assigned System Role</div>
            <div style={{ fontWeight: 700, color: '#005F73' }}>{user ? user.role : 'Viewer'}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Department</div>
            <div style={{ fontWeight: 600, color: '#1E293B' }}>{user ? user.department : 'All Departments'}</div>
          </div>
        </div>
      </div>

      {/* Monitoring Thresholds Configuration Form */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Project Delay & Risk Score Threshold Configuration</h3>

        {successMsg && (
          <div style={{ padding: '10px 14px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Warning Variance Threshold (% Points)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={thresholds.warning_progress_variance}
                onChange={(e) => setThresholds({ ...thresholds, warning_progress_variance: parseFloat(e.target.value) })}
                required
              />
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Triggers WARNING status when actual physical progress lags by this amount.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Delay Variance Threshold (% Points)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={thresholds.delay_progress_variance}
                onChange={(e) => setThresholds({ ...thresholds, delay_progress_variance: parseFloat(e.target.value) })}
                required
              />
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Triggers DELAYED status and generates HIGH severity alert.</div>
            </div>

            <div className="form-group">
              <label className="form-label">High Risk Score Threshold (0–100)</label>
              <input
                type="number"
                className="form-control"
                value={thresholds.high_risk_score}
                onChange={(e) => setThresholds({ ...thresholds, high_risk_score: parseFloat(e.target.value) })}
                required
              />
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Triggers High Risk alert categorization.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Critical Risk Score Threshold (0–100)</label>
              <input
                type="number"
                className="form-control"
                value={thresholds.critical_risk_score}
                onChange={(e) => setThresholds({ ...thresholds, critical_risk_score: parseFloat(e.target.value) })}
                required
              />
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Triggers Critical Risk alert & executive escalation.</div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Configuration Parameters'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
