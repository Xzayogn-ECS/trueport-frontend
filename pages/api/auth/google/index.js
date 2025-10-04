export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the Google OAuth URL from backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
      method: 'GET',
    });

    const data = await backendResponse.json();

    if (data.success && data.authUrl) {
      return res.redirect(data.authUrl);
    } else {
      return res.status(400).json({ message: 'Failed to get Google auth URL' });
    }

  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}