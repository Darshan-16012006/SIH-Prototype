// api/analytics/overview.js — GET /api/analytics/overview
const { getStore } = require('../lib/store');
const { json, setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  const { department } = req.query;

  let projects = store.projects;
  if (department && department !== 'All') {
    projects = projects.filter(p => p.department === department);
  }

  const totalBudget = Math.round(projects.reduce((acc, p) => acc + (p.approved_budget || 0), 0) * 100) / 100;
  const totalExp = Math.round(projects.reduce((acc, p) => acc + (p.expenditure || 0), 0) * 100) / 100;

  const statusCounts = { ON_TRACK: 0, WARNING: 0, DELAYED: 0, HIGH_RISK: 0 };
  const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const plannedVsActual = [];

  for (const p of projects) {
    if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;
    if (riskCounts[p.risk_level] !== undefined) riskCounts[p.risk_level]++;
    plannedVsActual.push({
      id: p.id, project_id: p.project_id, name: p.name,
      planned: p.planned_physical_progress, actual: p.physical_progress,
      variance: Math.round((p.planned_physical_progress - p.physical_progress) * 10) / 10,
      status: p.status, budget: p.approved_budget
    });
  }

  return json(res, {
    kpis: {
      total_projects: projects.length,
      on_track: statusCounts.ON_TRACK,
      warning: statusCounts.WARNING,
      delayed: statusCounts.DELAYED,
      at_risk: statusCounts.HIGH_RISK,
      total_budget: totalBudget,
      total_expenditure: totalExp,
      remaining_budget: Math.round(Math.max(0, totalBudget - totalExp) * 100) / 100,
      overbudget_count: projects.filter(p => p.expenditure > p.approved_budget).length
    },
    status_distribution: [
      { name: 'On Track', value: statusCounts.ON_TRACK, color: '#10B981' },
      { name: 'Warning', value: statusCounts.WARNING, color: '#F59E0B' },
      { name: 'Delayed', value: statusCounts.DELAYED, color: '#EF4444' },
      { name: 'High Risk', value: statusCounts.HIGH_RISK, color: '#991B1B' }
    ],
    risk_distribution: [
      { name: 'Low', value: riskCounts.LOW, color: '#10B981' },
      { name: 'Medium', value: riskCounts.MEDIUM, color: '#F59E0B' },
      { name: 'High', value: riskCounts.HIGH, color: '#EF4444' },
      { name: 'Critical', value: riskCounts.CRITICAL, color: '#991B1B' }
    ],
    planned_vs_actual: plannedVsActual,
    department_breakdown: [
      { department: 'MoRTH', budget: 920.0, expenditure: 940.0 },
      { department: 'Urban Dev', budget: 1370.0, expenditure: 1218.0 },
      { department: 'Jal Shakti', budget: 350.0, expenditure: 380.0 },
      { department: 'Railways', budget: 850.0, expenditure: 620.0 }
    ]
  });
};
