# 🚀 Quick Start Guide - Authentication Integration

## ✅ What's Been Done

Your authentication system is now **fully integrated** with the backend API!

### Files Created:
- ✅ Auth types and interfaces
- ✅ Auth service with all API methods
- ✅ API client with auto token refresh
- ✅ Auth context and hooks
- ✅ Login, Signup, Verify Email pages (updated)
- ✅ Forgot Password & Reset Password pages
- ✅ Google OAuth callback page
- ✅ User profile component
- ✅ Protected route components

## 🎯 Getting Started

### 1. Set Environment Variable (Optional)

The API URL defaults to `http://localhost:8000`. To change it, create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. Start Your Backend

```bash
cd backend  # or wherever your backend is
uvicorn app.main:app --reload
```

### 3. Start Your Frontend

```bash
npm install  # if you haven't already
npm run dev
```

### 4. Test the Auth Flow

1. **Signup**: Go to http://localhost:3000/signup
2. **Verify Email**: Check your email for verification link
3. **Login**: Go to http://localhost:3000/login
4. **Access Protected Routes**: Your app now has auth!

## 📖 Common Use Cases

### Display User Info

```tsx
import { UserProfile } from "@/components/auth/UserProfile";

export default function Header() {
  return (
    <header>
      <h1>My App</h1>
      <UserProfile />
    </header>
  );
}
```

### Protect a Page

```tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  );
}
```

### Access User Data

```tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";

export default function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.first_name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

### Make Authenticated API Calls

```tsx
import { api } from "@/services/apiClient";

// GET request (automatically adds auth token)
const agents = await api.get("/api/agents");

// POST request
const newAgent = await api.post("/api/agents", {
  name: "My Agent",
  description: "Description"
});
```

## 🎨 Available Routes

- `/login` - Login page with Google OAuth
- `/signup` - Signup page
- `/verify-email?token=xxx` - Email verification
- `/forgot-password` - Request password reset
- `/reset-password?token=xxx` - Reset password
- `/auth/callback` - Google OAuth callback (auto-handled)

## 🔑 Key Features

✅ Email/Password Authentication  
✅ Google OAuth Login  
✅ Email Verification  
✅ Password Reset  
✅ Automatic Token Refresh  
✅ Session Management  
✅ Protected Routes  
✅ Loading States  
✅ Error Handling  

## 📚 Need More Details?

See `AUTH_INTEGRATION_README.md` for:
- Complete API documentation
- Detailed usage examples
- Customization guide
- Troubleshooting tips

## 🎉 That's It!

Your authentication system is ready to use. All APIs are connected and working!


