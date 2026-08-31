// api/lib/helpers.js — shared risk calculation & CORS helpers

function calculateRisk(project) {
  const pPlan = Number(project.planned_physical_progress || 0);
  const pAct = Number(project.physical_progress || 0);
  const budget = Number(project.approved_budget || 0);
  const exp = Number(project.expenditure || 0);

  const variance = Math.round((pPlan - pAct) * 10) / 10;
  const costVar = Math.round((exp - budget) * 100) / 100;
  const costOverrunPct = (budget > 0 && costVar > 0)
    ? Math.round((costVar / budget) * 1000) / 10
    : 0.0;

  const progressScore = Math.min(100.0, Math.max(0.0, variance * 4.0));
  const costScore = Math.min(100.0, Math.max(0.0, costOverrunPct * 10.0));
  const milestoneScore = variance > 10 ? 30.0 : 0.0;
  const scheduleScore = Math.min(100.0, Math.max(0.0, variance * 2.0));

  let score = Math.round(
    ((0.35 * progressScore) + (0.30 * costScore) + (0.20 * milestoneScore) + (0.15 * scheduleScore)) * 10
  ) / 10;
  score = Math.min(100.0, Math.max(0.0, score));

  let level, status;
  if (score > 80) { level = 'CRITICAL'; status = 'HIGH_RISK'; }
  else if (score > 60 || variance > 10 || costVar > 0) { level = 'HIGH'; status = 'DELAYED'; }
  else if (variance > 5) { level = 'MEDIUM'; status = 'WARNING'; }
  else { level = 'LOW'; status = 'ON_TRACK'; }

  return {
    score, level, status, variance, cost_variance: costVar,
    factors: {
      progress_variance_pts: variance,
      progress_score: Math.round(progressScore * 10) / 10,
      cost_overrun_cr: Math.round(Math.max(0, costVar) * 100) / 100,
      cost_overrun_pct: costOverrunPct,
      cost_score: Math.round(costScore * 10) / 10,
      missed_milestones: variance > 10 ? 2 : 0,
      milestone_score: milestoneScore,
      schedule_score: Math.round(scheduleScore * 10) / 10
    }
  };
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function json(res, data, status = 200) {
  setCors(res);
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(data);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

module.exports = { calculateRisk, setCors, json, readBody };
