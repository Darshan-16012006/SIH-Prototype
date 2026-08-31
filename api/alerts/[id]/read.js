// api/alerts/[id]/read.js — PUT /api/alerts/:id/read
const { getStore } = require('../../../lib/store');
const { json, setCors } = require('../../../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'PUT') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  const id = Number(req.query.id);
  const alert = store.alerts.find(a => a.id === id);
  if (alert) alert.is_read = true;
  return json(res, { status: 'success' });
};
