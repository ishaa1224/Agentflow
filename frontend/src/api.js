// Single source of truth for the backend API base URL.
// In production, reads VITE_API_BASE_URL from Vercel env vars.
// Falls back to the Render service URL, then localhost for dev.
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://agentflow-4.onrender.com'
    : 'http://127.0.0.1:8000')
).replace(/\/+$/, ''); // strip trailing slashes

export default API_BASE;
