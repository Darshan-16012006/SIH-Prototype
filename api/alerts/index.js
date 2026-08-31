// api/alerts/index.js — GET /api/alerts
const { getStore } = require('../lib/store');
const { json, setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  const { severity, alert_type, is_read } = req.query;

  // Attach project_name to each alert
  let alerts = store.alerts.map(a => {
    const proj = store.projects.find(p => p.id === a.project_id);
    return { ...a, project_name: proj ? proj.name : 'Unknown' };
  });

  if (severity && severity !== 'All') alerts = alerts.filter(a => a.severity === severity);
  if (alert_type && alert_type !== 'All') alerts = alerts.filter(a => a.alert_type === alert_type);
  if (is_read !== undefined && is_read !== null && is_read !== '') {
    const wantRead = is_read.toLowerCase() === 'true';
    alerts = alerts.filter(a => a.is_read === wantRead);
  }

  return json(res, alerts.reverse());
};
