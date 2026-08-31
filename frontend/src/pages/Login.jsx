import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.login({ email, password });
      onLoginSuccess(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E2E8F0',
        width: '100%',
        maxWidth: '440px',
        padding: '32px'
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            background: '#005F73',
            color: '#FFFFFF',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Building2 size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B' }}>
            PM-MONITOR PLATFORM
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            Smart India Hackathon 2026 • Problem ID 26103
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Login to System'}
          </button>
        </form>

        {/* Prototype Demo Quick Credentials */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Select Demo Account (1-Click Fill)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
              onClick={() => handleQuickDemo('admin@demo.com', 'admin123')}
            >
              <ShieldCheck size={14} style={{ color: '#005F73' }} />
              <strong>Admin:</strong> admin@demo.com (Full Access)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
              onClick={() => handleQuickDemo('officer@demo.com', 'officer123')}
            >
              <UserCheck size={14} style={{ color: '#F59E0B' }} />
              <strong>Officer:</strong> officer@demo.com (Progress Entry)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
              onClick={() => handleQuickDemo('viewer@demo.com', 'viewer123')}
            >
              <Building2 size={14} style={{ color: '#64748B' }} />
              <strong>Viewer:</strong> viewer@demo.com (Read Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
