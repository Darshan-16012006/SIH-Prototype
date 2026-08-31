import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Eye, FileText } from 'lucide-react';
import { api } from '../services/api';

export function Reports() {
  const [reportType, setReportType] = useState('portfolio_summary');
  const [projectId, setProjectId] = useState('');
  const [projectsList, setProjectsList] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjectsList();
  }, []);

  const loadProjectsList = async () => {
    try {
      const data = await api.getProjects();
      setProjectsList(data);
    } catch (err) {
      console.error('Error fetching projects list:', err);
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const res = await api.previewReport(reportType, projectId || null);
      setPreviewData(res);
    } catch (err) {
      alert('Failed to generate report preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    api.downloadReport(reportType, projectId || null);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Project Monitoring Report Generation Engine</h2>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
          Generate, preview, and download formal project monitoring reports for government authorities and project officers.
        </p>
      </div>

      {/* Report Options Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="form-label">Report Category</label>
            <select
              className="form-control"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="portfolio_summary">Portfolio Summary Executive Report</option>
              <option value="project_detail">Single Project Monitoring Detailed Report</option>
              <option value="cost_analysis">Financial Cost Overrun Audit Report</option>
              <option value="risk_summary">Portfolio Risk Assessment Report</option>
            </select>
          </div>

          {reportType === 'project_detail' && (
            <div>
              <label className="form-label">Select Project</label>
              <select
                className="form-control"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">-- Choose Project --</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.project_id}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handlePreview} disabled={loading}>
            <Eye size={16} /> {loading ? 'Generating Preview...' : 'Preview Report'}
          </button>

          <button className="btn btn-secondary" onClick={handleDownload}>
            <Download size={16} /> Download CSV Report
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: '#005F73' }} /> Report Content Preview
            </h3>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Rows: {previewData.total_rows}</div>
          </div>

          <pre style={{
            background: '#F8FAFC',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            fontFamily: 'monospace',
            fontSize: '12px',
            overflowX: 'auto',
            maxHeight: '400px'
          }}>
            {previewData.raw_csv}
          </pre>
        </div>
      )}
    </div>
  );
}
