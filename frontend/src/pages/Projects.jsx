import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';

export function Projects({ user, onOpenAddProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, [search, statusFilter, deptFilter, riskFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (deptFilter !== 'All') params.department = deptFilter;
      if (riskFilter !== 'All') params.risk_level = riskFilter;

      const data = await api.getProjects(params);
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete project '${name}'?`)) {
      try {
        await api.deleteProject(id);
        loadProjects();
      } catch (err) {
        alert(err.message || 'Failed to delete project');
      }
    }
  };

  return (
    <div>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Infrastructure Projects Directory</h2>

        {user?.role !== 'Viewer' && (
          <button className="btn btn-primary" onClick={onOpenAddProject}>
            <Plus size={16} /> Create New Project
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label className="form-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search name or ID..."
                className="form-control"
                style={{ paddingLeft: '32px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Status Filter</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="ON_TRACK">On Track</option>
              <option value="WARNING">Warning</option>
              <option value="DELAYED">Delayed</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>
          </div>

          <div>
            <label className="form-label">Risk Level</label>
            <select
              className="form-control"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="All">All Risk Levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="form-label">Department</label>
            <select
              className="form-control"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              <option value="Ministry of Road Transport & Highways">MoRTH</option>
              <option value="Ministry of Urban Development">Urban Dev</option>
              <option value="Jal Shakti Ministry">Jal Shakti</option>
              <option value="Ministry of Railways">Railways</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Directory Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>Loading projects list...</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No projects match your filter criteria.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Project Name</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Expenditure</th>
                  <th>Progress (Act/Plan)</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const varPts = (p.planned_physical_progress - p.physical_progress).toFixed(1);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, fontSize: '13px', color: '#005F73' }}>{p.project_id}</td>
                      <td style={{ fontWeight: 600, color: '#1E293B' }}>{p.name}</td>
                      <td style={{ fontSize: '13px' }}>{p.department}</td>
                      <td style={{ fontSize: '13px' }}>{p.location}</td>
                      <td>₹{p.approved_budget} Cr</td>
                      <td style={{ color: p.expenditure > p.approved_budget ? '#EF4444' : '#1E293B', fontWeight: p.expenditure > p.approved_budget ? 600 : 400 }}>
                        ₹{p.expenditure} Cr
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.physical_progress}% / {p.planned_physical_progress}%</div>
                        <div style={{ fontSize: '11px', color: varPts > 0 ? '#EF4444' : '#10B981' }}>
                          {varPts > 0 ? `-${varPts} pts lag` : `On Schedule`}
                        </div>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td><RiskBadge level={p.risk_level} score={p.risk_score} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="View Project Details"
                            onClick={() => navigate(`/projects/${p.id}`)}
                          >
                            <Eye size={14} />
                          </button>
                          {user?.role === 'Admin' && (
                            <button
                              className="btn btn-danger btn-sm"
                              title="Delete Project"
                              onClick={() => handleDelete(p.id, p.name)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
