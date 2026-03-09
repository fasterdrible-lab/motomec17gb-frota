import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'motomec_token';
const USER_KEY = 'motomec_user';

/**
 * Store the JWT token in localStorage.
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Retrieve the JWT token from localStorage.
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove the JWT token and user data from localStorage.
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Return true if a token is currently stored.
 */
export function isAuthenticated() {
  return Boolean(getToken());
}

/**
 * Authenticate with username + password (OAuth2 password flow).
 * Stores the returned token and returns the full response data.
 */
export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const { data } = await axios.post(`${BASE_URL}/auth/token`, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (data.access_token) {
    setToken(data.access_token);
  }
  return data;
}

/**
 * Register a new user account.
 */
export async function register(userData) {
  const { data } = await axios.post(`${BASE_URL}/auth/register`, userData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

/**
 * Fetch the current authenticated user's profile.
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const { data } = await axios.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  return data;
}

/**
 * Return the locally cached user object (no network call).
 */
export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
