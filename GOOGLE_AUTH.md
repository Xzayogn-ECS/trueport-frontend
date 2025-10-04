# Google Authentication Implementation

This document explains how Google OAuth is implemented in your TruePort application.

## How it Works

### Frontend (Next.js)
1. **Google Auth Button**: Added to the `AuthForm` component
2. **Popup Flow**: Opens Google OAuth in a popup window
3. **Message Handling**: Listens for authentication results via postMessage API
4. **Token Management**: Stores JWT token in cookies upon successful authentication

### Backend Integration
Your backend handles Google OAuth with these endpoints:
- `GET /auth/google` - Initiates Google OAuth flow
- `GET /auth/google/callback` - Handles Google OAuth callback
- Returns JWT token and user data to frontend via postMessage

### Security Features
- CSP-compliant implementation with nonces
- Origin validation for postMessage
- JWT token validation
- Secure cookie handling

## Frontend Changes Made

### 1. AuthForm Component Updates
- Added Google OAuth button with Google branding
- Implemented popup window handling
- Added postMessage listener for auth results
- Added proper loading states and error handling

### 2. Environment Configuration
- Updated `NEXT_PUBLIC_API_URL` to match backend routes
- Maintained existing Cloudinary and frontend URL configs

## Testing the Implementation

### Prerequisites
1. Ensure your backend server is running on `http://localhost:3000`
2. Ensure Google OAuth is configured in your backend with:
   - Client ID and Client Secret
   - Authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Authorized origins: `http://localhost:3000` and `http://localhost:3001`

### Test Steps
1. Start your backend server: `npm start` (in backend directory)
2. Start your frontend server: `npm run dev` (in frontend directory)
3. Navigate to `http://localhost:3001/auth/login`
4. Click "Continue with Google" button
5. Complete Google OAuth in popup window
6. Should redirect to dashboard upon success

## Troubleshooting

### Common Issues
1. **Popup blocked**: Ensure popups are allowed for localhost:3001
2. **CORS errors**: Verify backend CORS settings include frontend origin
3. **Token issues**: Check JWT token generation in backend
4. **Redirect errors**: Verify Google OAuth redirect URIs are correctly configured

### Debug Tips
- Check browser console for JavaScript errors
- Monitor Network tab for API calls
- Verify backend logs for OAuth flow
- Test popup communication with browser dev tools

## Security Considerations

### Production Setup
1. Update environment variables for production domains
2. Configure Google OAuth for production URLs
3. Enable HTTPS for both frontend and backend
4. Update CORS settings for production origins
5. Set secure cookie flags in production

### Best Practices
- Always validate tokens on backend
- Use HTTPS in production
- Set appropriate cookie expiration
- Implement proper error handling
- Monitor authentication events