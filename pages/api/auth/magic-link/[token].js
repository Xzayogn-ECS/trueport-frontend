import { setCookie } from 'nookies';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

// Use the global fetch available in Next.js/Node 18+ runtime instead of node-fetch
export default async function handler(req, res) {
  const { token } = req.query;
  const { redirect } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing token' });
  }

  // Call backend validation endpoint (do not consume the token)
  let backendResp = null;
  let lastErr = null;

  const validationEndpoints = [
    `${API_BASE}/auth/magic-link/${token}`,
    `${API_BASE}/auth/magic/${token}`,
    `${API_BASE}/auth/magic-link/preview?token=${token}`,
    `${API_BASE}/auth/magic/preview?token=${token}`
  ];

  for (const url of validationEndpoints) {
    try {
      backendResp = await fetch(url, { method: 'GET' });
      if (backendResp && backendResp.ok) {
        const data = await backendResp.json();
        return res.json({ success: true, ...data, redirect: redirect || data.redirect || '/' });
      }
    } catch (err) {
      lastErr = err;
    }
  }

  console.error('Magic link validation failed:', lastErr);
  return res.status(502).json({ success: false, message: 'Failed to validate magic link', error: lastErr?.message });
}
