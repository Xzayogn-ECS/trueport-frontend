import { setCookie } from 'nookies';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect('/auth/login?error=missing_code');
    }

    // Exchange code for token with backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback?code=${code}&state=${state}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error('Backend auth error:', data);
      return res.redirect('/auth/login?error=backend_error');
    }

    if (data.success && data.token) {
      // Set the auth token in cookies
      setCookie({ res }, 'auth_token', data.token, {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Redirect based on user role or setup status
      if (data.user?.role) {
        if (data.user.role === 'VERIFIER') {
          return res.redirect('/verifier/dashboard');
        } else {
          return res.redirect('/dashboard');
        }
      } else {
        // User needs to complete profile setup
        return res.redirect('/profile?setup=true');
      }
    } else {
      console.error('Authentication failed:', data);
      return res.redirect('/auth/login?error=auth_failed');
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect('/auth/login?error=server_error');
  }
}