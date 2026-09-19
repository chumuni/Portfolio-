// Single source of truth for the backend location.
// The API lives in backend/linker-adventure-api (see its README for setup)
// and listens on http://localhost:3000/api/v1 by default.
// Change this if you run the API on a different host/port (e.g. after deploying it).
const API_BASE = 'http://localhost:3000/api/v1';

/**
 * Fetch an authenticated API route, retrying once with a refreshed access
 * token if the first attempt comes back 401 (access tokens expire in 15m).
 * Returns null and redirects to signin.html if the session cannot be
 * recovered at all.
 */
async function authFetch(path, options = {}) {
  const call = (token) => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });

  let accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    window.location.href = 'signin.html';
    return null;
  }

  let response = await call(accessToken);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshed = refreshToken && await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    if (refreshed?.data?.tokens) {
      localStorage.setItem('accessToken', refreshed.data.tokens.accessToken);
      localStorage.setItem('refreshToken', refreshed.data.tokens.refreshToken);
      response = await call(refreshed.data.tokens.accessToken);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      window.location.href = 'signin.html';
      return null;
    }
  }

  return response;
}

/** Swaps nav auth links for a Dashboard/Sign Out pair when a session exists. */
function reflectAuthState({ signInSelector = 'a[href="signin.html"]', getStartedSelector = 'a[href="register-tour-agent.html"]' } = {}) {
  if (!localStorage.getItem('accessToken')) return;

  document.querySelectorAll(signInSelector).forEach((link) => {
    link.textContent = 'Dashboard';
    link.href = 'dashboard.html';
  });
  document.querySelectorAll(getStartedSelector).forEach((link) => {
    link.textContent = 'Sign Out';
    link.href = '#';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      window.location.href = 'index.html';
    });
  });
}
