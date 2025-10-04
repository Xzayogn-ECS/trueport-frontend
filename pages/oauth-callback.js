import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { setAuthToken } from '../utils/auth';
import { adminAuth } from '../utils/adminAPI';
import api from '../utils/api';

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing authentication...');

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

  useEffect(() => {
    const parseHashAuth = () => {
      try {
        if (typeof window === 'undefined' || !window.location.hash) return null;
        const hash = window.location.hash.replace(/^#/, '');
        // expect format auth=%7B...%7D or auth=encodedJSON
        const params = new URLSearchParams(hash);
        const authPayload = params.get('auth');
        if (!authPayload) return null;
        const parsed = JSON.parse(decodeURIComponent(authPayload));
        return parsed; // { token, user }
      } catch (err) {
        console.warn('Failed to parse auth hash', err);
        return null;
      }
    };

    const handleRedirectToLogin = (delay = 800) => {
      setStatus('error');
      setMessage('Authentication failed — redirecting to login...');
      setTimeout(() => {
        // clear any messy query/hash
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
        router.replace('/auth/login');
      }, delay);
    };

    const handleCallback = async () => {
      try {
        // 1) Check URL fragment first (server may redirect with #auth={...})
        const fragmentAuth = parseHashAuth();
        if (fragmentAuth && (fragmentAuth.token || fragmentAuth.user)) {
          setStatus('success');
          setMessage('Authentication successful — redirecting...');
          // persist token if present
          if (fragmentAuth.token) {
            try { setAuthToken(fragmentAuth.token); } catch (e) { console.warn(e); }
          }
          if (fragmentAuth.user) localStorage.setItem('user', JSON.stringify(fragmentAuth.user));

          // if opened in popup, notify opener then close
          if (window.opener) {
            const parentOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: fragmentAuth.token, user: fragmentAuth.user }, parentOrigin);
            window.close();
            return;
          }

          // choose redirect path and hard navigate so cookies/token are read
          const user = fragmentAuth.user;
          const redirectPath = user
            ? adminAuth.isSuperAdmin(user)
              ? '/admin/super-admin/dashboard'
              : adminAuth.isInstituteAdmin(user)
                ? '/admin/institute-admin/dashboard'
                : user.role === 'VERIFIER'
                  ? '/verifier/dashboard'
                  : user.role === 'STUDENT'
                    ? '/dashboard'
                    : '/profile?setup=true'
            : '/dashboard';

          // clean URL and redirect
          try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
          window.location.replace(redirectPath);
          return;
        }

        const { code, state, error, success } = router.query;

        // 2) Handle explicit error/success query params
        if (error) {
          handleRedirectToLogin(1200);
          return;
        }

        if (success === 'true') {
          // backend redirected with success (cookie set) -> validate session
          setMessage('Verifying session (cookie flow)...');
          const validateResp = await fetch(`${API_BASE}/auth/validate`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          }).catch(() => null);

          const validateData = validateResp ? await validateResp.json() : null;
          if (validateResp && validateResp.ok && validateData?.valid) {
            const user = validateData.user;
            localStorage.setItem('user', JSON.stringify(user));
            setStatus('success');
            setMessage('Verified — redirecting...');
            if (window.opener) {
              const parentOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user, cookieAuth: true }, parentOrigin);
              window.close();
              return;
            }
            const redirectPath = adminAuth.isSuperAdmin(user)
              ? '/admin/super-admin/dashboard'
              : adminAuth.isInstituteAdmin(user)
                ? '/admin/institute-admin/dashboard'
                : user.role === 'VERIFIER'
                  ? '/verifier/dashboard'
                  : user.role === 'STUDENT'
                    ? '/dashboard'
                    : '/profile?setup=true';
            window.location.replace(redirectPath);
            return;
          } else {
            handleRedirectToLogin(800);
            return;
          }
        }

        // 3) If "code" exists, try exchanging it via API (POST) — some backends support this
        if (code) {
          setMessage('Exchanging authorization code...');
          try {
            const exchangeResp = await fetch(`${API_BASE}/api/auth/google/callback`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: String(code), state: state || '' })
            }).catch(() => null);

            const exchangeData = exchangeResp ? await exchangeResp.json() : null;

            if (exchangeResp && exchangeResp.ok && (exchangeData?.token || exchangeData?.user)) {
              // token-in-body flow
              if (exchangeData.token) {
                try { setAuthToken(exchangeData.token); } catch (e) { console.warn(e); }
              }
              if (exchangeData.user) localStorage.setItem('user', JSON.stringify(exchangeData.user));

              if (window.opener) {
                const parentOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: exchangeData.token, user: exchangeData.user }, parentOrigin);
                window.close();
                return;
              }

              const user = exchangeData.user;
              const redirectPath = user
                ? adminAuth.isSuperAdmin(user)
                  ? '/admin/super-admin/dashboard'
                  : adminAuth.isInstituteAdmin(user)
                    ? '/admin/institute-admin/dashboard'
                    : user.role === 'VERIFIER'
                      ? '/verifier/dashboard'
                      : user.role === 'STUDENT'
                        ? '/dashboard'
                        : '/profile?setup=true'
                : '/dashboard';

              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.replace(redirectPath);
              return;
            } else {
              // exchange didn't produce usable data -> fallback to validate cookie
              console.warn('Exchange returned no token/user, falling back to validate.');
            }
          } catch (err) {
            console.warn('Exchange failed, will fallback to validate:', err);
          }
        }

        // 4) Final fallback: attempt cookie validation (covers plain redirect that set cookie)
        setMessage('Verifying session (final fallback)...');
        const fallbackResp = await fetch(`${API_BASE}/auth/validate`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(() => null);

        const fallbackData = fallbackResp ? await fallbackResp.json() : null;

        if (fallbackResp && fallbackResp.ok && fallbackData?.valid) {
          const user = fallbackData.user;
          localStorage.setItem('user', JSON.stringify(user));
          setStatus('success'); setMessage('Verified — redirecting...');
          if (window.opener) {
            const parentOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user, cookieAuth: true }, parentOrigin);
            window.close();
            return;
          }
          const redirectPath = adminAuth.isSuperAdmin(user)
            ? '/admin/super-admin/dashboard'
            : adminAuth.isInstituteAdmin(user)
              ? '/admin/institute-admin/dashboard'
              : user.role === 'VERIFIER'
                ? '/verifier/dashboard'
                : user.role === 'STUDENT'
                  ? '/dashboard'
                  : '/profile?setup=true';
          window.location.replace(redirectPath);
          return;
        }

        // nothing worked — redirect to login
        handleRedirectToLogin(600);
      } catch (error) {
        console.error('OAuth callback error:', error);
        handleRedirectToLogin(600);
      }
    };

    if (router.isReady) handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full">
            {status === 'processing' && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>}
            {status === 'success' && (
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {status === 'processing' ? 'Authenticating...' : status === 'success' ? 'Success!' : 'Authentication Failed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  );
}
