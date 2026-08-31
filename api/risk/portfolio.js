// api/risk/portfolio.js — GET /api/risk/portfolio
const { getStore } = require('../lib/store');
const { json, setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  const rankings = [...store.projects]
    .sort((a, b) => b.risk_score - a.risk_score)
    .map(p => ({
      id: p.id, project_id: p.project_id, name: p.name,
      department: p.department, status: p.status,
      risk_score: p.risk_score, risk_level: p.risk_level,
      physical_variance: Math.round((p.planned_physical_progress - p.physical_progress) * 10) / 10,
      cost_overrun: Math.round((p.expenditure - p.approved_budget) * 100) / 100
    }));

  return json(res, rankings);
};
