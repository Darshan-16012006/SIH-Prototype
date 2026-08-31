import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Cpu, Eye, CheckCircle2, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export function RiskPrediction() {
  const [portfolioRisk, setPortfolioRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      const data = await api.getPortfolioRisk();
      setPortfolioRisk(data);
    } catch (err) {
      console.error('Error fetching risk portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Risk Analysis & AI Delay Prediction Engine</h2>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
          Hybrid risk scoring model combining 100% transparent explainable factor weights with a Scikit-Learn ML predictive regressor.
        </p>
      </div>

      {/* Model Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Explainable Risk Engine Summary */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: '#005F73' }} /> Explainable Risk Scoring Engine
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
            Calculates a 0-100 Risk Score using transparent, weighted factor analysis:
          </p>
          <ul style={{ fontSize: '13px', color: '#1E293B', paddingLeft: '20px', lineHeight: 1.8 }}>
            <li><strong>Physical Progress Variance (35%):</strong> Lags behind target schedule</li>
            <li><strong>Cost Overrun Ratio (30%):</strong> Approved budget vs actual expenditure</li>
            <li><strong>Missed Milestones (20%):</strong> Count of overdue deliverables</li>
            <li><strong>Schedule Urgency (15%):</strong> Elapsed project lifespan vs remaining work</li>
          </ul>
        </div>

        {/* Scikit-Learn ML Model Summary */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} style={{ color: '#0A9396' }} /> Prototype ML Delay Predictor
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
            Scikit-Learn Random Forest Regressor trained on historical infrastructure projects:
          </p>
          <div style={{ padding: '12px', background: '#E0F2F1', borderRadius: '6px', fontSize: '12px', color: '#005F73', fontWeight: 600 }}>
            Predicts future project delay in days and provides automatic decision-support recommendations to authorities.
          </div>
        </div>
      </div>

      {/* Portfolio Risk Rankings Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Portfolio Risk Rankings (Sorted by Risk Score)</h3>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>Loading risk rankings...</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Project ID</th>
                  <th>Project Name</th>
                  <th>Department</th>
                  <th>Physical Lag</th>
                  <th>Cost Overrun</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolioRisk.map((p, idx) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: idx === 0 ? '#EF4444' : '#64748B' }}>#{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: '#005F73' }}>{p.project_id}</td>
                    <td style={{ fontWeight: 600, color: '#1E293B' }}>{p.name}</td>
                    <td>{p.department}</td>
                    <td style={{ color: p.physical_variance > 10 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      {p.physical_variance > 0 ? `-${p.physical_variance} pts` : `On schedule`}
                    </td>
                    <td style={{ color: p.cost_overrun > 0 ? '#EF4444' : '#1E293B', fontWeight: p.cost_overrun > 0 ? 600 : 400 }}>
                      {p.cost_overrun > 0 ? `+₹${p.cost_overrun} Cr` : `₹0 Cr`}
                    </td>
                    <td><RiskBadge level={p.risk_level} score={p.risk_score} /></td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/projects/${p.id}`)}
                      >
                        <Eye size={14} /> Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
