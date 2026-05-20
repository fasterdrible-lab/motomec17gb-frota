const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

/**
 * Mock de usuários para desenvolvimento
 * Em produção, estes dados viriam de um banco de dados
 */
const mockUsers = [
  {
    id: 1,
    nome: 'Admin Teste',
    email: 'admin@cbmesp.sp.gov.br',
    password: 'admin123',
    cargo: 'Comandante',
    unidade: '17GB',
    perfil: 'admin',
  },
  {
    id: 2,
    nome: 'Operador Teste',
    email: 'operador@cbmesp.sp.gov.br',
    password: 'operador123',
    cargo: 'Sd BM',
    unidade: '17GB',
    perfil: 'operador',
  },
];

/**
 * Busca usuário por email
 */
function findUserByEmail(email) {
  return mockUsers.find(u => u.email === email);
}

/**
 * Valida credenciais e retorna usuário se encontrar
 */
function validateCredentials(email, password) {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return null;
  }
  return user;
}

/**
 * Gera JWT para um usuário
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    nome: user.nome,
    perfil: user.perfil,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Realiza login e retorna token
 */
function login(email, password) {
  const user = validateCredentials(email, password);
  
  if (!user) {
    const err = new Error('Email ou senha incorretos.');
    err.status = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const access_token = generateToken(user);
  
  return {
    access_token,
    token_type: 'bearer',
    expires_in: Number(env.jwtExpiresIn),
  };
}

/**
 * Retorna dados do usuário (extraído do JWT)
 */
function getUser(userId) {
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    const err = new Error('Usuario nao encontrado.');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    cargo: user.cargo,
    unidade: user.unidade,
    perfil: user.perfil,
  };
}

module.exports = {
  login,
  getUser,
  findUserByEmail,
};
