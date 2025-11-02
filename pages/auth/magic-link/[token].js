import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function MagicLinkPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/dashboard');

  useEffect(() => {
    if (!token) return;

    const validate = async () => {
      setStatus('loading');
      try {
        const resp = await fetch(`/api/auth/magic-link/${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await resp.json();
        if (!resp.ok) {
          setError(data?.message || 'Invalid or expired magic link');
          setStatus('error');
          return;
        }

        // Expecting data to include email and user (preview mode)
        setEmail(data.email || data.user?.email || '');
        setUser(data.user || data.userData || null);
        setRedirectTo(data.redirect || '/dashboard');
        setStatus('ready');
      } catch (err) {
        console.error('Magic link validation failed:', err);
        setError(err.message || 'Failed to validate magic link');
        setStatus('error');
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setProcessing(true);
    try {
      const resp = await fetch('/api/auth/magic-link/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.message || 'Failed to set password');
        setProcessing(false);
        return;
      }

      // Persist user and redirect
      const receivedUser = data.user || data.userData || user || null;
      try { if (receivedUser) localStorage.setItem('user', JSON.stringify(receivedUser)); } catch (e) {}

      // Navigate to redirect
      router.replace(data.redirect || redirectTo || '/dashboard');
    } catch (err) {
      console.error('Set password error:', err);
      setError(err.message || 'Failed to set password');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <div className="text-gray-700">Validating magic link…</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded shadow">
          <h3 className="text-lg font-medium text-red-600">Magic link invalid or expired</h3>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <div className="mt-4">
            <a href="/auth/login" className="text-primary-600 hover:underline">Sign in manually</a>
          </div>
        </div>
      </div>
    );
  }

  // Ready: show password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Set your password</h2>
        <p className="text-sm text-gray-600 mb-4">Continue as <strong>{email}</strong></p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input w-full" placeholder="Create a strong password" required />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="form-input w-full" placeholder="Confirm password" required />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={processing} className="bg-primary-600 text-white px-4 py-2 rounded">{processing ? 'Saving…' : 'Set password and continue'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
