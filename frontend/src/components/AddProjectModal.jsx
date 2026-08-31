import React, { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../services/api';

export function AddProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    department: 'Ministry of Road Transport & Highways',
    implementing_agency: '',
    manager: '',
    category: 'Transport',
    location: '',
    latitude: 21.1458,
    longitude: 79.0882,
    approved_budget: 100.0,
    start_date: '2024-01-01',
    expected_completion_date: '2026-12-31',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' || name === 'approved_budget' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.approved_budget <= 0) {
      setError('Approved budget must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const newProj = await api.createProject(formData);
      onProjectCreated(newProj);
      onClose();
      // Reset form
      setFormData({
        project_id: '',
        name: '',
        department: 'Ministry of Road Transport & Highways',
        implementing_agency: '',
        manager: '',
        category: 'Transport',
        location: '',
        latitude: 21.1458,
        longitude: 79.0882,
        approved_budget: 100.0,
        start_date: '2024-01-01',
        expected_completion_date: '2026-12-31',
        description: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Infrastructure Project">
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Project ID Code *</label>
            <input
              type="text"
              name="project_id"
              placeholder="e.g. PRJ-DEL-010"
              className="form-control"
              value={formData.project_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Yamuna Expressway Solar Grid"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ministry / Department *</label>
            <select name="department" className="form-control" value={formData.department} onChange={handleChange}>
              <option value="Ministry of Road Transport & Highways">Ministry of Road Transport & Highways</option>
              <option value="Ministry of Urban Development">Ministry of Urban Development</option>
              <option value="Jal Shakti Ministry">Jal Shakti Ministry</option>
              <option value="Ministry of Railways">Ministry of Railways</option>
              <option value="Ministry of New and Renewable Energy">Ministry of New and Renewable Energy</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Implementing Agency *</label>
            <input
              type="text"
              name="implementing_agency"
              placeholder="e.g. NHAI / CPWD / DJB"
              className="form-control"
              value={formData.implementing_agency}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Project Manager *</label>
            <input
              type="text"
              name="manager"
              placeholder="Manager Name"
              className="form-control"
              value={formData.manager}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
              <option value="Transport">Transport</option>
              <option value="Metro Rail">Metro Rail</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Smart City">Smart City</option>
              <option value="Energy">Energy</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Location (City, State) *</label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Pune, Maharashtra"
              className="form-control"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Approved Budget (₹ Crores) *</label>
            <input
              type="number"
              step="0.1"
              name="approved_budget"
              className="form-control"
              value={formData.approved_budget}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude *</label>
            <input type="number" step="0.0001" name="latitude" className="form-control" value={formData.latitude} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Longitude *</label>
            <input type="number" step="0.0001" name="longitude" className="form-control" value={formData.longitude} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input type="date" name="start_date" className="form-control" value={formData.start_date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Completion Date *</label>
            <input type="date" name="expected_completion_date" className="form-control" value={formData.expected_completion_date} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Project Description</label>
          <textarea name="description" className="form-control" rows={3} value={formData.description} onChange={handleChange} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Project...' : 'Create Infrastructure Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
