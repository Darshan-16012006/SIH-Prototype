// api/alerts/read-all.js — PUT /api/alerts/read-all
const { getStore } = require('../lib/store');
const { json, setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'PUT') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  store.alerts.forEach(a => { a.is_read = true; });
  return json(res, { status: 'success' });
};
