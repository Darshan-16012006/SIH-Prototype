// api/reports/download.js — GET /api/reports/download
const { getStore } = require('../lib/store');
const { setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') { setCors(res); res.status(405).end(); return; }

  const store = getStore();
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

  setCors(res);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sih_portfolio_report.csv"');
  res.status(200).end(csvLines.join('\n'));
};
