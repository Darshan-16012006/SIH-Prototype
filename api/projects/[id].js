// api/projects/[id].js — GET /api/projects/:id, DELETE /api/projects/:id
const { getStore } = require('../lib/store');
const { json, setCors } = require('../lib/helpers');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  const store = getStore();
  const id = Number(req.query.id);

  if (req.method === 'GET') {
    const project = store.projects.find(p => p.id === id);
    if (!project) return json(res, { detail: 'Project not found' }, 404);
    return json(res, project);
  }

  if (req.method === 'DELETE') {
    const idx = store.projects.findIndex(p => p.id === id);
    if (idx !== -1) store.projects.splice(idx, 1);
    return json(res, { detail: 'Project deleted' });
  }

  return json(res, { detail: 'Method not allowed' }, 405);
};
