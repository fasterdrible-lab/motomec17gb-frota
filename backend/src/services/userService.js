const crypto = require('crypto');

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

/**
 * Mock de usuarios para desenvolvimento.
 * Em producao, esta responsabilidade deve ir para uma camada de persistencia.
 */
const users = [
  {
    id: 1,
    nome: 'Admin Teste',
    email: 'admin@cbmesp.sp.gov.br',
    passwordHash: hashPassword('admin123'),
    cargo: 'Comandante',
    unidade: '17GB',
    perfil: 'admin',
    status: 'ativo',
    createdAt: '2026-05-19T12:00:00.000Z',
  },
  {
    id: 2,
    nome: 'Operador Teste',
    email: 'operador@cbmesp.sp.gov.br',
    passwordHash: hashPassword('operador123'),
    cargo: 'Sd BM',
    unidade: '17GB',
    perfil: 'operador',
    status: 'ativo',
    createdAt: '2026-05-19T12:05:00.000Z',
  },
];

let nextId = 3;

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

function createHttpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    cargo: user.cargo,
    unidade: user.unidade,
    perfil: user.perfil,
    status: user.status,
    createdAt: user.createdAt,
  };
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return users.find(user => user.email === normalizedEmail) || null;
}

function findUserById(id) {
  const numericId = Number(id);
  return users.find(user => user.id === numericId) || null;
}

function validateRequiredUserFields({ nome, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(nome || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    throw createHttpError(400, 'MISSING_FIELDS', 'Nome, email e senha sao obrigatorios.');
  }

  if (normalizedName.length < 3) {
    throw createHttpError(400, 'INVALID_NAME', 'Informe o nome completo do usuario.');
  }

  if (!isValidEmail(normalizedEmail)) {
    throw createHttpError(400, 'INVALID_EMAIL', 'Informe um email valido.');
  }

  if (normalizedPassword.length < 6) {
    throw createHttpError(400, 'INVALID_PASSWORD', 'A senha deve ter pelo menos 6 caracteres.');
  }

  if (findUserByEmail(normalizedEmail)) {
    throw createHttpError(409, 'EMAIL_ALREADY_EXISTS', 'Ja existe um usuario cadastrado com este email.');
  }

  return {
    nome: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
  };
}

function createPendingUser(payload) {
  const baseUser = validateRequiredUserFields(payload);

  const user = {
    id: nextId,
    nome: baseUser.nome,
    email: baseUser.email,
    passwordHash: hashPassword(baseUser.password),
    cargo: normalizeText(payload.cargo),
    unidade: normalizeText(payload.unidade),
    perfil: 'operador',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  };

  nextId += 1;
  users.push(user);
  return sanitizeUser(user);
}

function listUsers(filters = {}) {
  const status = filters.status ? normalizeStatus(filters.status) : null;

  if (filters.status && !status) {
    throw createHttpError(400, 'INVALID_STATUS', 'Status de filtro invalido.');
  }

  return users
    .filter(user => !status || user.status === status)
    .map(sanitizeUser);
}

function updateUser(id, payload, actorId) {
  const user = findUserById(id);

  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado.');
  }

  const isSelfUpdate = Number(id) === Number(actorId);

  if (payload.nome !== undefined) {
    const nome = String(payload.nome || '').trim();
    if (nome.length < 3) {
      throw createHttpError(400, 'INVALID_NAME', 'Informe o nome completo do usuario.');
    }
    user.nome = nome;
  }

  if (payload.cargo !== undefined) {
    user.cargo = normalizeText(payload.cargo);
  }

  if (payload.unidade !== undefined) {
    user.unidade = normalizeText(payload.unidade);
  }

  if (payload.perfil !== undefined || payload.role !== undefined) {
    const perfil = normalizePerfil(payload.perfil ?? payload.role);
    if (!perfil) {
      throw createHttpError(400, 'INVALID_PROFILE', 'Perfil de usuario invalido.');
    }
    if (isSelfUpdate && perfil !== 'admin') {
      throw createHttpError(400, 'CANNOT_DEMOTE_SELF', 'Administrador nao pode remover o proprio perfil admin.');
    }
    user.perfil = perfil;
  }

  if (payload.status !== undefined) {
    const status = normalizeStatus(payload.status);
    if (!status) {
      throw createHttpError(400, 'INVALID_STATUS', 'Status de usuario invalido.');
    }
    if (isSelfUpdate && status !== 'ativo') {
      throw createHttpError(400, 'CANNOT_DISABLE_SELF', 'Administrador nao pode inativar a propria conta.');
    }
    user.status = status;
  }

  return sanitizeUser(user);
}

function deleteUser(id, actorId) {
  const numericId = Number(id);

  if (numericId === Number(actorId)) {
    throw createHttpError(400, 'CANNOT_DELETE_SELF', 'Administrador nao pode excluir a propria conta.');
  }

  const index = users.findIndex(user => user.id === numericId);
  if (index === -1) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado.');
  }

  const [removed] = users.splice(index, 1);
  return sanitizeUser(removed);
}

function assertUserCanAuthenticate(user) {
  if (!user) {
    throw createHttpError(401, 'INVALID_CREDENTIALS', 'Email ou senha incorretos.');
  }

  if (user.status === 'pendente') {
    throw createHttpError(403, 'USER_PENDING', 'Cadastro aguardando liberacao do administrador.');
  }

  if (user.status === 'inativo') {
    throw createHttpError(403, 'USER_INACTIVE', 'Usuario inativo. Solicite suporte ao administrador.');
  }
}

function validateCredentials(email, password) {
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createHttpError(401, 'INVALID_CREDENTIALS', 'Email ou senha incorretos.');
  }

  assertUserCanAuthenticate(user);
  return user;
}

function getUser(id) {
  const user = findUserById(id);

  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado.');
  }

  return sanitizeUser(user);
}

function getActiveUserForRequest(id) {
  const user = findUserById(id);
  assertUserCanAuthenticate(user);
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
