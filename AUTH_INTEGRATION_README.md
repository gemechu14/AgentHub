# Authentication Integration Guide

## 🎉 Setup Complete!

Your authentication system has been successfully integrated with the AgentHub backend API. All authentication endpoints are now connected and working.

## 📁 Files Created/Modified

### Core Services
- **`types/auth.ts`** - TypeScript interfaces for all auth requests/responses
- **`services/authService.ts`** - Authentication service with all API methods
- **`services/apiClient.ts`** - Enhanced API client with automatic token refresh
- **`contexts/AuthContext.tsx`** - React context for auth state management
- **`hooks/useProtectedRoute.ts`** - Hooks for protecting routes

### Pages Updated
- **`app/login/page.tsx`** - Login with email/password and Google OAuth
- **`app/signup/page.tsx`** - User registration with first name, last name, email, password
- **`app/verify-email/page.tsx`** - Email verification with token support
- **`app/forgot-password/page.tsx`** - Password reset request
- **`app/reset-password/page.tsx`** - Password reset with token
- **`app/auth/callback/page.tsx`** - Google OAuth callback handler
- **`app/layout.tsx`** - Updated to include AuthProvider

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in your project root with the following:

```env
# Backend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If this variable is not set, it will default to `http://localhost:8000`.

## 🚀 Features Implemented

### ✅ Authentication Flow
- User signup with email verification
- Email/password login
- Google OAuth login
- Email verification via link
- Password reset flow
- Automatic token refresh
- Session management

### ✅ Security Features
- JWT access tokens (15 min expiry)
- Refresh tokens (30 day expiry)
- Automatic token refresh on 401 errors
- Secure token storage in localStorage
- Error handling for all edge cases

### ✅ User Experience
- Loading states
- Error messages
- Success confirmations
- Automatic redirects
- Session expired warnings

## 📚 Usage Examples

### Using Authentication in Components

```tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function MyComponent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.first_name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```tsx
"use client";

import { useProtectedRoute } from "@/hooks/useProtectedRoute";

export default function ProtectedPage() {
  const { isLoading } = useProtectedRoute();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Protected content</div>;
}
```

### Redirecting Authenticated Users

```tsx
"use client";

import { useGuestRoute } from "@/hooks/useProtectedRoute";

export default function LoginPage() {
  const { isLoading } = useGuestRoute(); // Redirects to "/" if already logged in

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Login form</div>;
}
```

### Making Authenticated API Calls

```tsx
import { api } from "@/services/apiClient";

// GET request
const data = await api.get<ResponseType>("/api/endpoint");

// POST request
const result = await api.post<ResponseType>("/api/endpoint", {
  key: "value"
});

// The apiClient automatically:
// - Adds Authorization header
// - Refreshes token if expired (401)
// - Redirects to login if refresh fails
```

### Using Auth Service Directly

```tsx
import { authService } from "@/services/authService";

// Login
await authService.login({ email, password });

// Signup
await authService.signup({
  email,
  password,
  first_name: "John",
  last_name: "Doe"
});

// Get current user
const user = await authService.getCurrentUser();

// Logout
await authService.logout();

// Forgot password
await authService.forgotPassword({ email });

// Reset password
await authService.resetPassword({ token, new_password });

// Google OAuth
const { auth_url } = await authService.getGoogleAuthUrl();
window.location.href = auth_url;
```

## 🔐 Authentication Endpoints

All endpoints are connected to `http://localhost:8000`:

1. **POST `/auth/signup`** - User registration
2. **POST `/auth/login`** - Email/password login
3. **GET `/auth/verify?token={token}`** - Email verification
4. **GET `/auth/me`** - Get current user
5. **POST `/auth/refresh`** - Refresh access token
6. **POST `/auth/logout`** - Logout
7. **POST `/auth/verify/resend`** - Resend verification email
8. **POST `/auth/password/forgot`** - Request password reset
9. **POST `/auth/password/reset`** - Reset password
10. **GET `/auth/google/start`** - Get Google OAuth URL
11. **POST `/auth/google/callback?code={code}`** - Handle Google callback

## 🧪 Testing

### Manual Testing Steps

1. **Start the backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Test signup flow:**
   - Go to http://localhost:3000/signup
   - Enter first name, last name, email, and password
   - Submit form
   - Check email for verification link
   - Click link to verify email

4. **Test login flow:**
   - Go to http://localhost:3000/login
   - Enter email and password
   - Should redirect to dashboard

5. **Test Google OAuth:**
   - Click "Continue with Google" button
   - Complete Google sign-in
   - Should redirect to dashboard

6. **Test password reset:**
   - Go to http://localhost:3000/forgot-password
   - Enter email
   - Check email for reset link
   - Click link and set new password

## 🛠️ Customization

### Changing Token Storage

Currently, tokens are stored in localStorage. To switch to httpOnly cookies:

1. Update `authService.ts` to handle cookie-based tokens
2. Update API client to not send Authorization header (cookies sent automatically)
3. Update backend to set httpOnly cookies

### Adding Additional User Fields

1. Update `User` interface in `types/auth.ts`
2. Update signup form in `app/signup/page.tsx`
3. Update `SignupRequest` interface in `types/auth.ts`

### Customizing Redirects

Edit the redirect paths in:
- `services/apiClient.ts` - Token refresh redirect
- `app/login/page.tsx` - Post-login redirect
- `app/verify-email/page.tsx` - Post-verification redirect
- `hooks/useProtectedRoute.ts` - Protected route redirect

## 📖 API Client Features

The `apiClient` provides:

- **Automatic token injection** - Adds Bearer token to all requests
- **Auto token refresh** - Refreshes expired tokens automatically
- **Error handling** - Provides user-friendly error messages
- **TypeScript support** - Fully typed requests and responses
- **Convenience methods** - `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()`

## 🎨 UI Components

All authentication pages feature:

- Modern, clean design with Tailwind CSS
- Responsive layouts for mobile and desktop
- Loading states and disabled buttons
- Error and success messages
- Password visibility toggles
- Consistent styling across all pages

## ⚠️ Important Notes

1. **Token Expiry:**
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 30 days
   - Auto-refresh handles expired access tokens
   - Users must re-login after refresh token expires

2. **Email Verification:**
   - Users must verify email before logging in
   - Verification link sent to email
   - Can resend verification email if needed

3. **Google OAuth:**
   - Requires Google OAuth credentials in backend
   - Callback URL must be configured: `http://localhost:3000/auth/callback`
   - Users are automatically logged in after Google auth

4. **Security:**
   - Always use HTTPS in production
   - Consider switching to httpOnly cookies for production
   - Implement rate limiting on backend
   - Add CSRF protection for forms

## 🚨 Troubleshooting

### "Session expired" error
- Refresh token has expired
- User needs to login again
- Check backend token expiry settings

### Google OAuth not working
- Check Google OAuth credentials
- Verify callback URL in Google Console
- Check browser console for errors

### Email verification link not working
- Token might be expired
- Use resend button to get new link
- Check backend email service configuration

### API calls failing
- Check backend is running on port 8000
- Verify NEXT_PUBLIC_API_BASE_URL is set correctly
- Check browser network tab for actual errors

## 🎯 Next Steps

1. ✅ Authentication system is complete
2. Consider adding:
   - Two-factor authentication (2FA)
   - Social login (Facebook, Twitter, etc.)
   - Account deletion
   - Profile editing
   - Change password feature
   - Remember me functionality
   - Login activity tracking

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend logs
3. Verify environment variables are set
4. Test backend endpoints directly with curl/Postman

---

**Your authentication system is ready to use! 🎉**


