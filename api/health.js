// api/health.js
const { json, setCors } = require('./lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  json(res, { status: 'healthy', platform: 'SIH 2026 Project Monitoring', team: 'Titans', problem_statement: '26103' });
};
