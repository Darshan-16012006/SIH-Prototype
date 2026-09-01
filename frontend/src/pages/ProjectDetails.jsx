import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Building2, Calendar, DollarSign, AlertTriangle, ShieldAlert, CheckCircle2, Plus, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';
import { Modal } from '../components/Modal';

export function ProjectDetails({ user, onOpenMonthlyUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // New Milestone Form State
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMName, setNewMName] = useState('');
  const [newMDueDate, setNewMDueDate] = useState('');
  const [newMDesc, setNewMDesc] = useState('');

  const [error, setError] = useState(null);

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, histData, milestonesData, r] = await Promise.all([
        api.getProjectById(id),
        api.getProgressHistory(id),
        api.getMilestones(id),
        api.getProjectRisk(id)
      ]);
      setProject(projData);
      setProgressHistory(histData);
      setMilestones(milestonesData);
      setRiskData(r);
    } catch (err) {
      console.error('Error loading project details:', err);
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      await api.createMilestone(id, {
        name: newMName,
        due_date: newMDueDate,
        description: newMDesc,
        status: 'In Progress'
      });
      setShowMilestoneModal(false);
      setNewMName('');
      setNewMDueDate('');
      setNewMDesc('');
      loadProjectDetails();
    } catch (err) {
      alert(err.message || 'Failed to add milestone');
    }
  };

  const handleToggleMilestoneStatus = async (mId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
      await api.updateMilestone(mId, {
        status: nextStatus,
        completion_date: nextStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null
      });
      loadProjectDetails();
    } catch (err) {
      alert(err.message || 'Failed to update milestone');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        Loading comprehensive project details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
        <h3>Error Loading Project Details</h3>
        <p>{error || 'Project not found.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/projects')} style={{ marginTop: '16px' }}>
          Back to Projects
        </button>
      </div>
    );
  }

  const physicalVar = (project.planned_physical_progress - project.physical_progress).toFixed(1);
  const costOverrun = (project.expenditure - project.approved_budget).toFixed(2);

  return (
    <div>
      {/* Top Navigation */}
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '16px' }}
        onClick={() => navigate('/projects')}
      >
        <ArrowLeft size={14} /> Back to Projects Directory
      </button>

      {/* Project Header Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#005F73', background: '#E0F2F1', padding: '2px 8px', borderRadius: '4px' }}>
                {project.project_id}
              </span>
              <StatusBadge status={project.status} />
              <RiskBadge level={project.risk_level} score={project.risk_score} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>{project.name}</h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
              {project.department} • Implementing Agency: {project.implementing_agency}
            </p>
          </div>

          {user?.role !== 'Viewer' && (
            <button className="btn btn-primary" onClick={() => onOpenMonthlyUpdate(project)}>
              <Calendar size={16} /> Enter Monthly Progress Update
            </button>
          )}
        </div>
      </div>

      {/* Key Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Approved Budget</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', fontFamily: 'Outfit' }}>
            ₹{project.approved_budget} Cr
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '16px', borderLeft: costOverrun > 0 ? '4px solid #EF4444' : '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Cumulative Expenditure</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: costOverrun > 0 ? '#EF4444' : '#1E293B', fontFamily: 'Outfit' }}>
            ₹{project.expenditure} Cr
          </div>
          {costOverrun > 0 ? (
            <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>🔴 OVER BUDGET BY ₹{costOverrun} Cr</div>
          ) : (
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>🟢 WITHIN APPROVED BUDGET</div>
          )}
        </div>

        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Physical Progress</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#005F73', fontFamily: 'Outfit' }}>
            {project.physical_progress}% / {project.planned_physical_progress}%
          </div>
          <div style={{ fontSize: '11px', color: physicalVar > 0 ? '#EF4444' : '#10B981' }}>
            {physicalVar > 0 ? `Lag: ${physicalVar} percentage points` : `On Target`}
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Expected Completion</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
            {project.expected_completion_date}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            Started: {project.start_date}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
          Monthly Progress ({progressHistory.length})
        </button>
        <button className={`tab-btn ${activeTab === 'cost' ? 'active' : ''}`} onClick={() => setActiveTab('cost')}>
          Cost & Budget Analysis
        </button>
        <button className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`} onClick={() => setActiveTab('milestones')}>
          Milestones ({milestones.length})
        </button>
        <button className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`} onClick={() => setActiveTab('risk')}>
          Risk Engine & AI Prediction
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Project Information</h3>
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: 1.6 }}>
            {project.description || 'No detailed description provided.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Project Manager</div>
              <div style={{ fontWeight: 600 }}>{project.manager}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Category</div>
              <div style={{ fontWeight: 600 }}>{project.category}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Location</div>
              <div style={{ fontWeight: 600 }}>{project.location}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Coordinates</div>
              <div style={{ fontWeight: 600 }}>{project.latitude}, {project.longitude}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY PROGRESS */}
      {activeTab === 'progress' && (
        <div>
          {/* Progress Chart */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Physical & Financial Progress Timeline</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressHistory}>
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="planned_physical_progress" name="Planned Physical %" stroke="#0A9396" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual_physical_progress" name="Actual Physical %" stroke="#005F73" strokeWidth={3} />
                  <Line type="monotone" dataKey="actual_financial_progress" name="Actual Financial %" stroke="#F59E0B" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Updates Log</h3>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Planned Physical</th>
                    <th>Actual Physical</th>
                    <th>Variance</th>
                    <th>Expenditure</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {progressHistory.map((h) => {
                    const v = (h.planned_physical_progress - h.actual_physical_progress).toFixed(1);
                    return (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.month}</td>
                        <td>{h.planned_physical_progress}%</td>
                        <td>{h.actual_physical_progress}%</td>
                        <td style={{ color: v > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                          {v > 0 ? `-${v} pts lag` : `On schedule`}
                        </td>
                        <td>₹{h.expenditure} Cr</td>
                        <td>{h.remarks || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COST ANALYSIS */}
      {activeTab === 'cost' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Financial Breakdown & Cost Variance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '13px', color: '#64748B' }}>Approved Project Budget</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#005F73' }}>₹{project.approved_budget} Cr</div>
            </div>

            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '13px', color: '#64748B' }}>Cumulative Expenditure</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>₹{project.expenditure} Cr</div>
            </div>

            <div style={{ padding: '16px', background: costOverrun > 0 ? '#FEF2F2' : '#ECFDF5', borderRadius: '8px', border: `1px solid ${costOverrun > 0 ? '#FCA5A5' : '#6EE7B7'}` }}>
              <div style={{ fontSize: '13px', color: '#64748B' }}>Cost Variance / Overrun</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: costOverrun > 0 ? '#EF4444' : '#10B981' }}>
                {costOverrun > 0 ? `+₹${costOverrun} Cr` : `-₹${Math.abs(costOverrun)} Cr`}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#F1F5F9', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Cost Analysis Summary</h4>
            <p style={{ fontSize: '13px', color: '#475569' }}>
              {costOverrun > 0
                ? `🔴 OVER BUDGET: Project has exceeded the approved budget of ₹${project.approved_budget} Cr by ₹${costOverrun} Cr. Mandatory financial audit and budget re-sanction required.`
                : `🟢 WITHIN BUDGET: Project expenditure is currently within the approved limit of ₹${project.approved_budget} Cr with ₹${Math.abs(costOverrun)} Cr remaining.`}
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Project Milestone Schedule</h3>
            {user?.role !== 'Viewer' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneModal(true)}>
                <Plus size={14} /> Add Milestone
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Milestone Name</th>
                  <th>Due Date</th>
                  <th>Completion Date</th>
                  <th>Status</th>
                  <th>Toggle Action</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.due_date}</td>
                    <td>{m.completion_date || 'Pending'}</td>
                    <td>
                      <span className={`badge ${m.status === 'Completed' ? 'badge-on_track' : m.status === 'Delayed' ? 'badge-delayed' : 'badge-warning'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      {user?.role !== 'Viewer' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleMilestoneStatus(m.id, m.status)}
                        >
                          Mark as {m.status === 'Completed' ? 'Pending' : 'Completed'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RISK ENGINE & AI PREDICTION */}
      {activeTab === 'risk' && riskData && (
        <div>
          {/* Explainable Risk Engine Breakdown */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Explainable Risk Engine Factor Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#005F73' }}>Progress Lag Score (Weight: 35%)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                  {riskData.explainable_risk.factors.progress_score} / 100
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Progress lag: {riskData.explainable_risk.factors.progress_variance_pts} percentage points
                </div>
              </div>

              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#005F73' }}>Cost Overrun Score (Weight: 30%)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                  {riskData.explainable_risk.factors.cost_score} / 100
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Overrun: ₹{riskData.explainable_risk.factors.cost_overrun_cr} Cr ({riskData.explainable_risk.factors.cost_overrun_pct}%)
                </div>
              </div>

              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#005F73' }}>Missed Milestones Score (Weight: 20%)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                  {riskData.explainable_risk.factors.milestone_score} / 100
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Delayed milestones: {riskData.explainable_risk.factors.missed_milestones}
                </div>
              </div>
            </div>
          </div>

          {/* AI/ML Predictive Delay Engine */}
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Scikit-Learn ML Project Delay Prediction</h3>
            <div style={{ padding: '16px', background: '#E0F2F1', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#005F73' }}>
                Predicted Future Completion Delay: {riskData.ml_prediction.predicted_delay_days} Days
              </div>
              <div style={{ fontSize: '13px', color: '#0F172A', marginTop: '4px' }}>
                Predicted Risk Classification: <strong>{riskData.ml_prediction.predicted_risk_level}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>
                💡 <strong>Decision Support Recommendation:</strong> {riskData.ml_prediction.recommendation}
              </div>
            </div>

            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Scikit-Learn Random Forest Feature Importances</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(riskData.ml_prediction.feature_importance).map(([key, val]) => (
                <div key={key} style={{ padding: '10px', background: '#F8FAFC', borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{key}</div>
                  <div style={{ color: '#005F73', fontWeight: 700, marginTop: '2px' }}>{(val * 100).toFixed(1)}% Weight</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      <Modal isOpen={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} title="Add Project Milestone">
        <form onSubmit={handleAddMilestone}>
          <div className="form-group">
            <label className="form-label">Milestone Name</label>
            <input
              type="text"
              className="form-control"
              value={newMName}
              onChange={(e) => setNewMName(e.target.value)}
              placeholder="e.g. Pier Cap & Girders Completion"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={newMDueDate}
              onChange={(e) => setNewMDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={newMDesc}
              onChange={(e) => setNewMDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Milestone</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
