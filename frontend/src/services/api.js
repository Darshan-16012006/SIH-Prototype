const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API request failed with status ${response.status}`);
    }
    
    // Check if response is JSON or blob/text
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // Projects
  getProjects: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/projects${query ? `?${query}` : ''}`);
  },
  getProjectById: (id) => request(`/projects/${id}`),
  getProjectsMap: () => request('/projects/map'),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Progress
  getProgressHistory: (projectId) => request(`/projects/${projectId}/progress`),
  addProgressUpdate: (projectId, data) => request(`/projects/${projectId}/progress`, { method: 'POST', body: JSON.stringify(data) }),

  // Milestones
  getMilestones: (projectId) => request(`/projects/${projectId}/milestones`),
  createMilestone: (projectId, data) => request(`/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (id, data) => request(`/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Analytics
  getAnalyticsOverview: (department) => request(`/analytics/overview${department ? `?department=${department}` : ''}`),
  getProjectAnalytics: (id) => request(`/analytics/project/${id}`),

  // Risk
  getProjectRisk: (id) => request(`/risk/project/${id}`),
  predictProjectRisk: (id) => request(`/risk/project/${id}/predict`, { method: 'POST' }),
  getPortfolioRisk: () => request('/risk/portfolio'),

  // Alerts
  getAlerts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/alerts${query ? `?${query}` : ''}`);
  },
  markAlertRead: (id) => request(`/alerts/${id}/read`, { method: 'PUT' }),
  markAllAlertsRead: () => request('/alerts/read-all', { method: 'PUT' }),

  // Reports
  downloadReport: (reportType, projectId) => {
    const url = `${API_BASE_URL}/reports/download?report_type=${reportType}${projectId ? `&project_id=${projectId}` : ''}`;
    window.open(url, '_blank');
  },
  previewReport: (reportType, projectId) => request(`/reports/preview?report_type=${reportType}${projectId ? `&project_id=${projectId}` : ''}`),

  // Settings
  getThresholds: () => request('/settings/thresholds'),
  updateThresholds: (data) => request('/settings/thresholds', { method: 'PUT', body: JSON.stringify(data) }),
};
