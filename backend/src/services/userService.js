const crypto = require('crypto');
const { pool } = require('../db/connection');

const VALID_PERFIS = ['admin', 'operador', 'visualizador'];
const VALID_STATUSES = ['pendente', 'ativo', 'inativo'];

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

function createHttpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function normalizePerfil(value) {
  const perfil = String(value || '').trim().toLowerCase();
  return VALID_PERFIS.includes(perfil) ? perfil : null;
}

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return VALID_STATUSES.includes(status) ? status : null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    cargo: row.cargo ?? null,
    unidade: row.unidade ?? null,
    perfil: row.perfil,
    status: row.status,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
  };
}

function assertUserCanAuthenticate(user) {
  if (!user) {
    throw createHttpError(401, 'INVALID_CREDENTIALS', 'Email ou senha incorretos.');
  }
  if (user.status === 'pendente') {
    throw createHttpError(403, 'USER_PENDING', 'Cadastro aguardando liberação do administrador.');
  }
  if (user.status === 'inativo') {
    throw createHttpError(403, 'USER_INACTIVE', 'Usuário inativo. Solicite suporte ao administrador.');
  }
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE email = ? LIMIT 1',
    [normalizeEmail(email)]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE id = ? LIMIT 1',
    [Number(id)]
  );
  return rows[0] || null;
}

async function createPendingUser(payload) {
  const email = normalizeEmail(payload.email);
  const nome = String(payload.nome || '').trim();
  const password = String(payload.password || '');

  if (!nome || !email || !password) {
    throw createHttpError(400, 'MISSING_FIELDS', 'Nome, email e senha são obrigatórios.');
  }
  if (nome.length < 3) {
    throw createHttpError(400, 'INVALID_NAME', 'Informe o nome completo do usuário.');
  }
  if (!isValidEmail(email)) {
    throw createHttpError(400, 'INVALID_EMAIL', 'Informe um email válido.');
  }
  if (password.length < 6) {
    throw createHttpError(400, 'INVALID_PASSWORD', 'A senha deve ter pelo menos 6 caracteres.');
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw createHttpError(409, 'EMAIL_ALREADY_EXISTS', 'Já existe um usuário cadastrado com este email.');
  }

  const cargo = normalizeText(payload.cargo);
  const unidade = normalizeText(payload.unidade);
  const senhaHash = hashPassword(password);

  const [result] = await pool.execute(
    `INSERT INTO usuarios (nome, email, senha_hash, cargo, unidade, perfil, status)
     VALUES (?, ?, ?, ?, ?, 'operador', 'pendente')`,
    [nome, email, senhaHash, cargo, unidade]
  );

  return sanitizeUser(await findUserById(result.insertId));
}

async function listUsers(filters = {}) {
  const status = filters.status ? normalizeStatus(filters.status) : null;

  if (filters.status && !status) {
    throw createHttpError(400, 'INVALID_STATUS', 'Status de filtro inválido.');
  }

  let sql = 'SELECT * FROM usuarios';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at ASC';

  const [rows] = await pool.execute(sql, params);
  return rows.map(sanitizeUser);
}

async function updateUser(id, payload, actorId) {
  const user = await findUserById(id);
  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
  }

  const isSelfUpdate = Number(id) === Number(actorId);
  const updates = [];
  const values = [];

  if (payload.nome !== undefined) {
    const nome = String(payload.nome || '').trim();
    if (nome.length < 3) {
      throw createHttpError(400, 'INVALID_NAME', 'Informe o nome completo do usuário.');
    }
    updates.push('nome = ?');
    values.push(nome);
  }

  if (payload.cargo !== undefined) {
    updates.push('cargo = ?');
    values.push(normalizeText(payload.cargo));
  }

  if (payload.unidade !== undefined) {
    updates.push('unidade = ?');
    values.push(normalizeText(payload.unidade));
  }

  if (payload.perfil !== undefined || payload.role !== undefined) {
    const perfil = normalizePerfil(payload.perfil ?? payload.role);
    if (!perfil) {
      throw createHttpError(400, 'INVALID_PROFILE', 'Perfil de usuário inválido.');
    }
    if (isSelfUpdate && perfil !== 'admin') {
      throw createHttpError(400, 'CANNOT_DEMOTE_SELF', 'Administrador não pode remover o próprio perfil admin.');
    }
    updates.push('perfil = ?');
    values.push(perfil);
  }

  if (payload.status !== undefined) {
    const status = normalizeStatus(payload.status);
    if (!status) {
      throw createHttpError(400, 'INVALID_STATUS', 'Status de usuário inválido.');
    }
    if (isSelfUpdate && status !== 'ativo') {
      throw createHttpError(400, 'CANNOT_DISABLE_SELF', 'Administrador não pode inativar a própria conta.');
    }
    updates.push('status = ?');
    values.push(status);
  }

  if (payload.password !== undefined) {
    const password = String(payload.password || '');
    if (password.length < 6) {
      throw createHttpError(400, 'INVALID_PASSWORD', 'A senha deve ter pelo menos 6 caracteres.');
    }
    updates.push('senha_hash = ?');
    values.push(hashPassword(password));
  }

  if (updates.length === 0) {
    return sanitizeUser(user);
  }

  values.push(Number(id));
  await pool.execute(
    `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return sanitizeUser(await findUserById(id));
}

async function deleteUser(id, actorId) {
  if (Number(id) === Number(actorId)) {
    throw createHttpError(400, 'CANNOT_DELETE_SELF', 'Administrador não pode excluir a própria conta.');
  }

  const user = await findUserById(id);
  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
  }

  await pool.execute('DELETE FROM usuarios WHERE id = ?', [Number(id)]);
  return sanitizeUser(user);
}

async function validateCredentials(email, password) {
  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.senha_hash)) {
    throw createHttpError(401, 'INVALID_CREDENTIALS', 'Email ou senha incorretos.');
  }

  assertUserCanAuthenticate(sanitizeUser(user));
  return user;
}

async function getUser(id) {
  const user = await findUserById(id);
  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
  }
  return sanitizeUser(user);
}

async function getActiveUserForRequest(id) {
  const user = await findUserById(id);
  assertUserCanAuthenticate(user ? sanitizeUser(user) : null);
  return sanitizeUser(user);
}

module.exports = {
  VALID_PERFIS,
  VALID_STATUSES,
  createPendingUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  getActiveUserForRequest,
  getUser,
  listUsers,
  sanitizeUser,
  updateUser,
  validateCredentials,
};
