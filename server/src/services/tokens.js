const jwt = require('jsonwebtoken');
const env = require('../config/env');
exports.issue = (user) => ({
  accessToken: jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: '12h' }),
  refreshToken: jwt.sign({ sub: user.id }, env.jwtRefreshSecret, { expiresIn: '30d' }),
});
exports.verifyRefresh = (t) => jwt.verify(t, env.jwtRefreshSecret);
