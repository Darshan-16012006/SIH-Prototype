// api/projects/index.js — GET /api/projects, POST /api/projects
const { getStore } = require('../lib/store');
const { json, setCors, readBody, calculateRisk } = require('../lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  const store = getStore();

  // GET — list projects with optional filtering
  if (req.method === 'GET') {
    const { search, status, department, risk_level } = req.query;
    let projects = [...store.projects];

    if (search) {
      const s = search.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.project_id.toLowerCase().includes(s) ||
        p.location.toLowerCase().includes(s)
      );
    }
    if (status && status !== 'All') projects = projects.filter(p => p.status === status);
    if (department && department !== 'All') projects = projects.filter(p => p.department === department);
    if (risk_level && risk_level !== 'All') projects = projects.filter(p => p.risk_level === risk_level);

    return json(res, projects.reverse());
  }

  // POST — create project
  if (req.method === 'POST') {
    const data = await readBody(req);
    const newProject = {
      id: store._nextProjectId++,
      project_id: data.project_id,
      name: data.name,
      department: data.department,
      implementing_agency: data.implementing_agency,
      manager: data.manager,
      category: data.category,
      location: data.location,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      approved_budget: Number(data.approved_budget),
      expenditure: 0,
      physical_progress: 0,
      planned_physical_progress: 0,
      financial_progress: 0,
      planned_financial_progress: 0,
      start_date: data.start_date,
      expected_completion_date: data.expected_completion_date,
      description: data.description || '',
      status: 'ON_TRACK',
      risk_score: 10.0,
      risk_level: 'LOW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.projects.push(newProject);
    return json(res, newProject, 201);
  }

  return json(res, { detail: 'Method not allowed' }, 405);
};
