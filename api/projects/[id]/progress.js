// api/projects/[id]/progress.js — GET/POST /api/projects/:id/progress
const { getStore } = require('../../lib/store');
const { json, setCors, readBody, calculateRisk } = require('../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  const store = getStore();
  const projId = Number(req.query.id);

  if (req.method === 'GET') {
    const rows = store.progress
      .filter(p => p.project_id === projId)
      .sort((a, b) => a.month.localeCompare(b.month));
    return json(res, rows);
  }

  if (req.method === 'POST') {
    const data = await readBody(req);
    const pPlan = Number(data.planned_physical_progress);
    const pAct = Number(data.actual_physical_progress);
    const exp = Number(data.expenditure);

    const entry = {
      id: store._nextProgressId++,
      project_id: projId,
      month: data.month,
      planned_physical_progress: pPlan,
      actual_physical_progress: pAct,
      planned_financial_progress: Number(data.planned_financial_progress || 0),
      actual_financial_progress: Number(data.actual_financial_progress || 0),
      expenditure: exp,
      milestones_completed: 0,
      remarks: data.remarks || '',
      created_at: new Date().toISOString()
    };
    store.progress.push(entry);

    // Update project with new values
    const project = store.projects.find(p => p.id === projId);
    if (project) {
      project.planned_physical_progress = pPlan;
      project.physical_progress = pAct;
      project.expenditure = exp;
      project.updated_at = new Date().toISOString();

      const rEval = calculateRisk(project);
      project.status = rEval.status;
      project.risk_score = rEval.score;
      project.risk_level = rEval.level;

      // Auto-alerts
      const todayStr = new Date().toISOString().split('T')[0];
      if (rEval.variance >= 10.0) {
        store.alerts.push({ id: store._nextAlertId++, project_id: projId, alert_type: 'Progress Delay', severity: 'HIGH', message: `Project '${project.name}' is ${rEval.variance} percentage points behind planned progress.`, date: todayStr, is_read: false, created_at: new Date().toISOString() });
      }
      if (rEval.cost_variance > 0) {
        store.alerts.push({ id: store._nextAlertId++, project_id: projId, alert_type: 'Cost Overrun', severity: 'CRITICAL', message: `Project '${project.name}' has exceeded approved budget by ₹${rEval.cost_variance} Cr.`, date: todayStr, is_read: false, created_at: new Date().toISOString() });
      }
    }
    return json(res, { status: 'success' }, 201);
  }

  return json(res, { detail: 'Method not allowed' }, 405);
};
