const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const userService = require('./userService');

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    nome: user.nome,
    perfil: user.perfil,
    status: user.status,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function login(email, password) {
  const user = userService.validateCredentials(email, password);
  const access_token = generateToken(user);

  return {
    access_token,
    token_type: 'bearer',
    expires_in: Number(env.jwtExpiresIn),
  };
}

function getUser(userId) {
  return userService.getUser(userId);
}

module.exports = {
  login,
  getUser,
  findUserByEmail: userService.findUserByEmail,
};
