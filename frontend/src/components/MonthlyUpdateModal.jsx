import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../services/api';

export function MonthlyUpdateModal({ isOpen, onClose, selectedProject, onUpdateSubmitted }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(selectedProject ? selectedProject.id : '');
  const [month, setMonth] = useState('2026-08');
  const [plannedPhys, setPlannedPhys] = useState(70);
  const [actualPhys, setActualPhys] = useState(60);
  const [plannedFin, setPlannedFin] = useState(75);
  const [actualFin, setActualFin] = useState(65);
  const [expenditure, setExpenditure] = useState(50);
  const [milestonesCompleted, setMilestonesCompleted] = useState(1);
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProject) {
      setProjectId(selectedProject.id);
      setPlannedPhys(selectedProject.planned_physical_progress || 70);
      setActualPhys(selectedProject.physical_progress || 60);
      setPlannedFin(selectedProject.planned_financial_progress || 75);
      setActualFin(selectedProject.financial_progress || 65);
      setExpenditure(selectedProject.expenditure || 50);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (!projectId && data.length > 0) {
        setProjectId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!projectId) {
      setError('Please select a project');
      return;
    }

    if (plannedPhys < 0 || plannedPhys > 100 || actualPhys < 0 || actualPhys > 100) {
      setError('Physical progress must be between 0% and 100%');
      return;
    }

    if (expenditure < 0) {
      setError('Expenditure cannot be negative');
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        month,
        planned_physical_progress: parseFloat(plannedPhys),
        actual_physical_progress: parseFloat(actualPhys),
        planned_financial_progress: parseFloat(plannedFin),
        actual_financial_progress: parseFloat(actualFin),
        expenditure: parseFloat(expenditure),
        milestones_completed: parseInt(milestonesCompleted) || 0,
        remarks
      };

      await api.addProgressUpdate(projectId, updateData);
      onUpdateSubmitted();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit monthly update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter Monthly Progress Update">
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Select Infrastructure Project *</label>
          <select
            className="form-control"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              const found = projects.find(p => p.id === parseInt(e.target.value));
              if (found) {
                setPlannedPhys(found.planned_physical_progress);
                setActualPhys(found.physical_progress);
                setExpenditure(found.expenditure);
              }
            }}
            required
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.project_id}] {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Reporting Month (YYYY-MM) *</label>
            <input
              type="month"
              className="form-control"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cumulative Expenditure (₹ Crores) *</label>
            <input
              type="number"
              step="0.1"
              className="form-control"
              value={expenditure}
              onChange={(e) => setExpenditure(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Planned Physical Progress (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-control"
              value={plannedPhys}
              onChange={(e) => setPlannedPhys(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Actual Physical Progress (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-control"
              value={actualPhys}
              onChange={(e) => setActualPhys(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Planned Financial Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-control"
              value={plannedFin}
              onChange={(e) => setPlannedFin(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Actual Financial Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-control"
              value={actualFin}
              onChange={(e) => setActualFin(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Milestones Completed This Month</label>
          <input
            type="number"
            min="0"
            className="form-control"
            value={milestonesCompleted}
            onChange={(e) => setMilestonesCompleted(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Remarks & Field Inspection Notes</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Describe progress status or reasons for delay..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Recalculating Risk & Updating...' : 'Submit Monthly Progress Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
