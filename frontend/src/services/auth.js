const TOKEN_KEY = 'frota17gb_token';

/** Store JWT in localStorage */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Retrieve JWT from localStorage */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove JWT from localStorage */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Returns true if a token is present and not expired */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = decodePayload(token);
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Decode JWT payload without verifying signature */
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return decodePayload(token);
  } catch {
    return null;
  }
}

function decodePayload(token) {
  const base64 = token.split('.')[1];
  const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}
