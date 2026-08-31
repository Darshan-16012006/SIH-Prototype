// api/projects/[id]/milestones.js — GET/POST /api/projects/:id/milestones
const { getStore } = require('../../lib/store');
const { json, setCors, readBody } = require('../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  const store = getStore();
  const projId = Number(req.query.id);

  if (req.method === 'GET') {
    const rows = store.milestones
      .filter(m => m.project_id === projId)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    return json(res, rows);
  }

  if (req.method === 'POST') {
    const data = await readBody(req);
    const m = {
      id: store._nextMilestoneId++,
      project_id: projId,
      name: data.name,
      description: data.description || '',
      due_date: data.due_date,
      completion_date: null,
      status: data.status || 'In Progress'
    };
    store.milestones.push(m);
    return json(res, m, 201);
  }

  return json(res, { detail: 'Method not allowed' }, 405);
};
