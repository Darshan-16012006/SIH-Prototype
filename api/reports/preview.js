// api/reports/preview.js — GET /api/reports/preview
const { getStore } = require('../lib/store');
const { json, setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  const { report_type = 'portfolio_summary' } = req.query;
  const projects = store.projects;

  const csvLines = [
    'SIH 2026 PROJECT MONITORING PORTFOLIO SUMMARY REPORT',
    'Generated Date,' + new Date().toISOString().split('T')[0],
    '',
    'Project ID,Name,Department,Budget (Cr),Expenditure (Cr),Planned %,Actual %,Variance,Status,Risk Level'
  ];
  for (const p of projects) {
    const v = Math.round((p.planned_physical_progress - p.physical_progress) * 10) / 10;
    csvLines.push(`${p.project_id},${p.name},${p.department},${p.approved_budget},${p.expenditure},${p.planned_physical_progress},${p.physical_progress},${v},${p.status},${p.risk_level}`);
  }

  return json(res, { report_type, raw_csv: csvLines.join('\n'), total_rows: projects.length });
};
