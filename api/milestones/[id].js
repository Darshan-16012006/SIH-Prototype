// api/milestones/[id].js — PUT /api/milestones/:id
const { getStore } = require('../../lib/store');
const { json, setCors, readBody } = require('../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'PUT') return json(res, { detail: 'Method not allowed' }, 405);

  const store = getStore();
  const id = Number(req.query.id);
  const data = await readBody(req);
  const milestone = store.milestones.find(m => m.id === id);
  if (!milestone) return json(res, { detail: 'Milestone not found' }, 404);

  if (data.status) milestone.status = data.status;
  if (data.completion_date !== undefined) milestone.completion_date = data.completion_date;
  return json(res, milestone);
};
