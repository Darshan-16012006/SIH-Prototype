// api/projects/map.js — GET /api/projects/map
const { getStore } = require('../lib/store');
const { json, setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  const rows = store.projects.map(p => ({
    id: p.id,
    project_id: p.project_id,
    name: p.name,
    department: p.department,
    location: p.location,
    latitude: p.latitude,
    longitude: p.longitude,
    approved_budget: p.approved_budget,
    expenditure: p.expenditure,
    physical_progress: p.physical_progress,
    planned_physical_progress: p.planned_physical_progress,
    status: p.status,
    risk_score: p.risk_score,
    risk_level: p.risk_level
  }));
  return json(res, rows);
};
