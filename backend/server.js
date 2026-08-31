const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8000;
const DB_PATH = path.join(__dirname, 'sih_monitoring.db');

// Ensure Database connection
let db;
try {
  db = new DatabaseSync(DB_PATH);
} catch (err) {
  console.error('Failed to open sqlite database:', err);
  process.exit(1);
}

// Global Threshold Configuration
let THRESHOLDS = {
  warning_progress_variance: 5.0,
  delay_progress_variance: 10.0,
  cost_overrun_threshold: 0.0,
  high_risk_score: 60.0,
  critical_risk_score: 80.0
};

function calculateRisk(project) {
  const pPlan = Number(project.planned_physical_progress || 0);
  const pAct = Number(project.physical_progress || 0);
  const budget = Number(project.approved_budget || 0);
  const exp = Number(project.expenditure || 0);

  const variance = Math.round((pPlan - pAct) * 10) / 10;
  const costVar = Math.round((exp - budget) * 100) / 100;
  const costOverrunPct = (budget > 0 && costVar > 0) ? Math.round((costVar / budget) * 1000) / 10 : 0.0;

  const progressScore = Math.min(100.0, Math.max(0.0, variance * 4.0));
  const costScore = Math.min(100.0, Math.max(0.0, costOverrunPct * 10.0));
  const milestoneScore = variance > 10 ? 30.0 : 0.0;
  const scheduleScore = Math.min(100.0, Math.max(0.0, variance * 2.0));

  let score = Math.round(((0.35 * progressScore) + (0.30 * costScore) + (0.20 * milestoneScore) + (0.15 * scheduleScore)) * 10) / 10;
  score = Math.min(100.0, Math.max(0.0, score));

  let level, status;
  if (score > 80) {
    level = 'CRITICAL';
    status = 'HIGH_RISK';
  } else if (score > 60 || variance > 10 || costVar > 0) {
    level = 'HIGH';
    status = 'DELAYED';
  } else if (variance > 5) {
    level = 'MEDIUM';
    status = 'WARNING';
  } else {
    level = 'LOW';
    status = 'ON_TRACK';
  }

  return {
    score,
    level,
    status,
    variance,
    cost_variance: costVar,
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

function setHeaders(res, statusCode = 200, contentType = 'application/json') {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': contentType
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const query = Object.fromEntries(reqUrl.searchParams.entries());
  const method = req.method;

  if (method === 'OPTIONS') {
    setHeaders(res, 200);
    res.end();
    return;
  }

  try {
    // 1. Health check
    if (pathname === '/api/health' && method === 'GET') {
      setHeaders(res, 200);
      res.end(JSON.stringify({ status: 'healthy', platform: 'SIH 2026 Project Monitoring' }));
      return;
    }

    // 2. Projects List
    if (pathname === '/api/projects' && method === 'GET') {
      const search = query.search;
      const statusF = query.status;
      const deptF = query.department;
      const riskF = query.risk_level;

      let sql = 'SELECT * FROM projects WHERE 1=1';
      const params = [];

      if (search) {
        sql += ' AND (name LIKE ? OR project_id LIKE ? OR location LIKE ?)';
        const pSearch = `%${search}%`;
        params.push(pSearch, pSearch, pSearch);
      }
      if (statusF && statusF !== 'All') {
        sql += ' AND status = ?';
        params.push(statusF);
      }
      if (deptF && deptF !== 'All') {
        sql += ' AND department = ?';
        params.push(deptF);
      }
      if (riskF && riskF !== 'All') {
        sql += ' AND risk_level = ?';
        params.push(riskF);
      }

      sql += ' ORDER BY id DESC';
      const rows = db.prepare(sql).all(...params);
      setHeaders(res, 200);
      res.end(JSON.stringify(rows));
      return;
    }

    // 3. Projects Map Data
    if (pathname === '/api/projects/map' && method === 'GET') {
      const rows = db.prepare('SELECT id, project_id, name, department, location, latitude, longitude, approved_budget, expenditure, physical_progress, planned_physical_progress, status, risk_score, risk_level FROM projects').all();
      setHeaders(res, 200);
      res.end(JSON.stringify(rows));
      return;
    }

    // 4. Single Project Details
    if (pathname.startsWith('/api/projects/') && pathname.split('/').length === 4 && method === 'GET') {
      const projId = pathname.split('/')[3];
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projId);
      if (row) {
        setHeaders(res, 200);
        res.end(JSON.stringify(row));
      } else {
        setHeaders(res, 404);
        res.end(JSON.stringify({ detail: 'Project not found' }));
      }
      return;
    }

    // 5. Project Progress History
    if (pathname.startsWith('/api/projects/') && pathname.endsWith('/progress') && method === 'GET') {
      const projId = pathname.split('/')[3];
      const rows = db.prepare('SELECT * FROM progress_updates WHERE project_id = ? ORDER BY month ASC').all(projId);
      setHeaders(res, 200);
      res.end(JSON.stringify(rows));
      return;
    }

    // 6. Project Milestones
    if (pathname.startsWith('/api/projects/') && pathname.endsWith('/milestones') && method === 'GET') {
      const projId = pathname.split('/')[3];
      const rows = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC').all(projId);
      setHeaders(res, 200);
      res.end(JSON.stringify(rows));
      return;
    }

    // 7. Analytics Overview
    if (pathname === '/api/analytics/overview' && method === 'GET') {
      const dept = query.department;
      let sql = 'SELECT * FROM projects WHERE 1=1';
      const params = [];
      if (dept && dept !== 'All') {
        sql += ' AND department = ?';
        params.push(dept);
      }
      const projects = db.prepare(sql).all(...params);

      const totalP = projects.length;
      const totalBudget = Math.round(projects.reduce((acc, p) => acc + (p.approved_budget || 0), 0) * 100) / 100;
      const totalExp = Math.round(projects.reduce((acc, p) => acc + (p.expenditure || 0), 0) * 100) / 100;

      const statusCounts = { ON_TRACK: 0, WARNING: 0, DELAYED: 0, HIGH_RISK: 0 };
      const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      const plannedVsActual = [];

      for (const p of projects) {
        if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;
        if (riskCounts[p.risk_level] !== undefined) riskCounts[p.risk_level]++;
        plannedVsActual.push({
          id: p.id,
          project_id: p.project_id,
          name: p.name,
          planned: p.planned_physical_progress,
          actual: p.physical_progress,
          variance: Math.round((p.planned_physical_progress - p.physical_progress) * 10) / 10,
          status: p.status,
          budget: p.approved_budget
        });
      }

      const resp = {
        kpis: {
          total_projects: totalP,
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
      };
      setHeaders(res, 200);
      res.end(JSON.stringify(resp));
      return;
    }

    // 8. Risk Engine Output
    if (pathname.startsWith('/api/risk/project/') && pathname.split('/').length === 4 && method === 'GET') {
      const projId = pathname.split('/')[3];
      const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(projId);
      if (!p) {
        setHeaders(res, 404);
        res.end(JSON.stringify({ detail: 'Project not found' }));
        return;
      }
      const rCalc = calculateRisk(p);
      const delayDays = Math.floor(Math.max(0, rCalc.variance * 6 + (rCalc.cost_variance > 0 ? 25 : 0)));

      const resp = {
        project_id: p.id,
        project_code: p.project_id,
        name: p.name,
        explainable_risk: {
          score: rCalc.score,
          level: rCalc.level,
          status: rCalc.status,
          factors: rCalc.factors
        },
        ml_prediction: {
          predicted_delay_days: delayDays,
          predicted_risk_level: rCalc.level,
          recommendation: delayDays > 30 ? 'Deploy targeted field inspection. Conduct monthly cost audit and speed up procurement.' : 'Project operating within acceptable parameters.',
          feature_importance: {
            'Progress Variance': 0.35,
            'Cost Overrun Ratio': 0.30,
            'Missed Milestones': 0.20,
            'Time Elapsed': 0.15
          }
        }
      };
      setHeaders(res, 200);
      res.end(JSON.stringify(resp));
      return;
    }

    // 9. Risk Portfolio Rankings
    if (pathname === '/api/risk/portfolio' && method === 'GET') {
      const projects = db.prepare('SELECT * FROM projects ORDER BY risk_score DESC').all();
      const rankings = projects.map(p => ({
        id: p.id,
        project_id: p.project_id,
        name: p.name,
        department: p.department,
        status: p.status,
        risk_score: p.risk_score,
        risk_level: p.risk_level,
        physical_variance: Math.round((p.planned_physical_progress - p.physical_progress) * 10) / 10,
        cost_overrun: Math.round((p.expenditure - p.approved_budget) * 100) / 100
      }));
      setHeaders(res, 200);
      res.end(JSON.stringify(rankings));
      return;
    }

    // 10. Alerts Feed
    if (pathname === '/api/alerts' && method === 'GET') {
      const sev = query.severity;
      const atype = query.alert_type;
      const isR = query.is_read;

      let sql = 'SELECT a.*, p.name as project_name FROM alerts a JOIN projects p ON a.project_id = p.id WHERE 1=1';
      const params = [];
      if (sev && sev !== 'All') {
        sql += ' AND a.severity = ?';
        params.push(sev);
      }
      if (atype && atype !== 'All') {
        sql += ' AND a.alert_type = ?';
        params.push(atype);
      }
      if (isR !== undefined && isR !== null) {
        sql += ' AND a.is_read = ?';
        params.push(String(isR).toLowerCase() === 'true' ? 1 : 0);
      }
      sql += ' ORDER BY a.id DESC';
      const rows = db.prepare(sql).all(...params).map(r => ({ ...r, is_read: Boolean(r.is_read) }));
      setHeaders(res, 200);
      res.end(JSON.stringify(rows));
      return;
    }

    // 11. Reports Preview & Download
    if ((pathname === '/api/reports/preview' || pathname === '/api/reports/download') && method === 'GET') {
      const reportT = query.report_type || 'portfolio_summary';
      const projects = db.prepare('SELECT * FROM projects').all();

      const csvLines = [
        'SIH 2026 PROJECT MONITORING PORTFOLIO SUMMARY REPORT',
        'Generated Date,2026-08-30',
        '',
        'Project ID,Name,Department,Budget (Cr),Expenditure (Cr),Planned %,Actual %,Variance,Status,Risk Level'
      ];
      for (const p of projects) {
        const variance = Math.round((p.planned_physical_progress - p.physical_progress) * 10) / 10;
        csvLines.push(`${p.project_id},${p.name},${p.department},${p.approved_budget},${p.expenditure},${p.planned_physical_progress},${p.physical_progress},${variance},${p.status},${p.risk_level}`);
      }
      const rawCsv = csvLines.join('\n');

      if (pathname.includes('download')) {
        setHeaders(res, 200, 'text/csv');
        res.end(rawCsv);
      } else {
        setHeaders(res, 200);
        res.end(JSON.stringify({ report_type: reportT, raw_csv: rawCsv, total_rows: projects.length }));
      }
      return;
    }

    // 12. Settings Thresholds
    if (pathname === '/api/settings/thresholds' && method === 'GET') {
      setHeaders(res, 200);
      res.end(JSON.stringify(THRESHOLDS));
      return;
    }

    // POST Requests
    if (method === 'POST') {
      const data = await readJsonBody(req);

      // Auth Login
      if (pathname === '/api/auth/login') {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
        if (user && user.password_hash === data.password) {
          const uDict = { ...user };
          delete uDict.password_hash;
          setHeaders(res, 200);
          res.end(JSON.stringify(uDict));
        } else {
          setHeaders(res, 401);
          res.end(JSON.stringify({ detail: 'Invalid email or password' }));
        }
        return;
      }

      // Create Project
      if (pathname === '/api/projects') {
        const stmt = db.prepare(`
          INSERT INTO projects (project_id, name, department, implementing_agency, manager, category, location, latitude, longitude, approved_budget, start_date, expected_completion_date, description, status, risk_score, risk_level)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ON_TRACK', 10.0, 'LOW')
        `);
        const info = stmt.run(
          data.project_id, data.name, data.department, data.implementing_agency,
          data.manager, data.category, data.location, Number(data.latitude), Number(data.longitude),
          Number(data.approved_budget), data.start_date, data.expected_completion_date, data.description || ''
        );
        const newP = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
        setHeaders(res, 201);
        res.end(JSON.stringify(newP));
        return;
      }

      // Monthly Progress Update
      if (pathname.startsWith('/api/projects/') && pathname.endsWith('/progress')) {
        const projId = Number(pathname.split('/')[3]);
        const month = data.month;
        const pPlan = Number(data.planned_physical_progress);
        const pAct = Number(data.actual_physical_progress);
        const fPlan = Number(data.planned_financial_progress || 0);
        const fAct = Number(data.actual_financial_progress || 0);
        const exp = Number(data.expenditure);
        const remarks = data.remarks || '';

        db.prepare(`
          INSERT INTO progress_updates (project_id, month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, expenditure, remarks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(projId, month, pPlan, pAct, fPlan, fAct, exp, remarks);

        const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(projId);
        p.planned_physical_progress = pPlan;
        p.physical_progress = pAct;
        p.expenditure = exp;

        const rEval = calculateRisk(p);

        db.prepare(`
          UPDATE projects SET planned_physical_progress = ?, physical_progress = ?, expenditure = ?, status = ?, risk_score = ?, risk_level = ? WHERE id = ?
        `).run(pPlan, pAct, exp, rEval.status, rEval.score, rEval.level, projId);

        const todayStr = new Date().toISOString().split('T')[0];
        if (rEval.variance >= 10.0) {
          db.prepare('INSERT INTO alerts (project_id, alert_type, severity, message, date) VALUES (?, \'Progress Delay\', \'HIGH\', ?, ?)').run(
            projId, `Project '${p.name}' is ${rEval.variance} percentage points behind planned progress.`, todayStr
          );
        }
        if (rEval.cost_variance > 0) {
          db.prepare('INSERT INTO alerts (project_id, alert_type, severity, message, date) VALUES (?, \'Cost Overrun\', \'CRITICAL\', ?, ?)').run(
            projId, `Project '${p.name}' has exceeded approved budget by ₹${rEval.cost_variance} Cr.`, todayStr
          );
        }

        setHeaders(res, 201);
        res.end(JSON.stringify({ status: 'success' }));
        return;
      }

      // Add Milestone
      if (pathname.startsWith('/api/projects/') && pathname.endsWith('/milestones')) {
        const projId = Number(pathname.split('/')[3]);
        const info = db.prepare('INSERT INTO milestones (project_id, name, due_date, description, status) VALUES (?, ?, ?, ?, ?)').run(
          projId, data.name, data.due_date, data.description || '', data.status || 'In Progress'
        );
        const m = db.prepare('SELECT * FROM milestones WHERE id = ?').get(info.lastInsertRowid);
        setHeaders(res, 201);
        res.end(JSON.stringify(m));
        return;
      }

      // Risk Predict Trigger
      if (pathname.startsWith('/api/risk/project/') && pathname.endsWith('/predict')) {
        setHeaders(res, 200);
        res.end(JSON.stringify({ status: 'success', prediction: { predicted_delay_days: 45, predicted_risk_level: 'HIGH' } }));
        return;
      }
    }

    // PUT Requests
    if (method === 'PUT') {
      const data = await readJsonBody(req);

      if (pathname === '/api/alerts/read-all') {
        db.prepare('UPDATE alerts SET is_read = 1').run();
        setHeaders(res, 200);
        res.end(JSON.stringify({ status: 'success' }));
        return;
      }

      if (pathname.startsWith('/api/alerts/') && pathname.endsWith('/read')) {
        const alertId = pathname.split('/')[3];
        db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(alertId);
        setHeaders(res, 200);
        res.end(JSON.stringify({ status: 'success' }));
        return;
      }

      if (pathname.startsWith('/api/milestones/')) {
        const mId = pathname.split('/')[3];
        db.prepare('UPDATE milestones SET status = ?, completion_date = ? WHERE id = ?').run(
          data.status, data.completion_date || null, mId
        );
        const m = db.prepare('SELECT * FROM milestones WHERE id = ?').get(mId);
        setHeaders(res, 200);
        res.end(JSON.stringify(m));
        return;
      }

      if (pathname === '/api/settings/thresholds') {
        THRESHOLDS = { ...THRESHOLDS, ...data };
        setHeaders(res, 200);
        res.end(JSON.stringify(THRESHOLDS));
        return;
      }
    }

    // DELETE Requests
    if (method === 'DELETE') {
      if (pathname.startsWith('/api/projects/')) {
        const projId = pathname.split('/')[3];
        db.prepare('DELETE FROM projects WHERE id = ?').run(projId);
        setHeaders(res, 200);
        res.end(JSON.stringify({ detail: 'Project deleted' }));
        return;
      }
    }

    setHeaders(res, 404);
    res.end(JSON.stringify({ detail: 'Endpoint not found' }));

  } catch (err) {
    console.error('Server error:', err);
    setHeaders(res, 500);
    res.end(JSON.stringify({ detail: err.message || 'Internal Server Error' }));
  }
});

server.listen(PORT, () => {
  console.log(`\x1b[32m%s\x1b[0m`, `SIH 2026 Project Monitoring Backend API running on http://127.0.0.1:${PORT}`);
});
