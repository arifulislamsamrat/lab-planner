import axios from 'axios';

// In dev, Vite proxies /api → localhost:5000.
// In production, set VITE_API_BASE to your server URL (e.g. https://lab-planner-api.onrender.com/api).
const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const TOKEN_KEY = 'lab-planner-token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the latest token on every request (no closure capture issues).
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the token so the next request is unauthenticated.
apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const path = window.location.pathname;
      // Don't bounce a visitor on a public share page back to /login
      // if the server returns 401 (e.g. link is revoked).
      const isPublicPage = path.startsWith('/share/');
      if (!isPublicPage) setToken(null);
      // Avoid a hard redirect loop if we're already on /login.
      if (!path.startsWith('/login') && !isPublicPage) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  },
);

export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default apiClient;
