// api/auth/login.js
const { getStore } = require('../lib/store');
const { json, setCors, readBody } = require('../lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'POST') return json(res, { detail: 'Method not allowed' }, 405);

  const data = await readBody(req);
  const store = getStore();
  const user = store.users.find(u => u.email === data.email);

  if (user && user.password_hash === data.password) {
    const { password_hash, ...safeUser } = user;
    return json(res, safeUser, 200);
  }
  return json(res, { detail: 'Invalid email or password' }, 401);
};
