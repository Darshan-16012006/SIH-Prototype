// api/settings/thresholds.js — GET/PUT /api/settings/thresholds
const { json, setCors, readBody } = require('../lib/helpers');

let THRESHOLDS = {
  warning_progress_variance: 5.0,
  delay_progress_variance: 10.0,
  cost_overrun_threshold: 0.0,
  high_risk_score: 60.0,
  critical_risk_score: 80.0
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }

  if (req.method === 'GET') return json(res, THRESHOLDS);

  if (req.method === 'PUT') {
    const data = await readBody(req);
    THRESHOLDS = { ...THRESHOLDS, ...data };
    return json(res, THRESHOLDS);
  }

  return json(res, { detail: 'Method not allowed' }, 405);
};
