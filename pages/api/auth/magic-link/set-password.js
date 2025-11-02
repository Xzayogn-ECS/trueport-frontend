import { setCookie } from 'nookies';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  try {
    const backendResp = await fetch(`${API_BASE}/auth/magic-link/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });

    const data = await backendResp.json();
    if (!backendResp.ok) {
      return res.status(backendResp.status || 500).json({ message: data?.message || 'Failed to set password', error: data });
    }

    // Normalize token key
    const jwt = data.token || data.authToken || data.jwt || data.auth_token;

    if (jwt) {
      // set cookie for frontend auth usage (non-httpOnly so utils can read)
      setCookie({ res }, 'auth-token', jwt, {
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    return res.json({ success: true, token: jwt, user: data.user || data.userData || null, redirect: data.redirect || '/' });
  } catch (err) {
    console.error('Set password proxy error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
