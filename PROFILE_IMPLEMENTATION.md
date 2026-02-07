# User Profile Implementation

This document describes the industry-standard user profile fetching and state management implementation.

## Overview

The application now uses a robust profile management system that:
- Automatically fetches user profile from `/auth/me` endpoint
- Handles token refresh on 401 errors
- Stores profile in React context for easy access
- Updates UI components with real user data

## Architecture

### 1. API Layer (`services/authService.ts`)

#### `getProfile()` Function
```typescript
async getProfile(): Promise<User | null>
```

**Features:**
- Calls `GET /auth/me` with access token in `Authorization: Bearer {token}` header
- Automatically handles 401 errors by refreshing access token
- Returns `null` on error (never throws)
- Clears tokens if refresh fails

**Flow:**
```
1. Call /auth/me with access token
2. If 401 → Try refreshAccessToken()
3. If refresh succeeds → Retry /auth/me with new token
4. If refresh fails → Clear tokens → Return null
5. Return profile or null
```

### 2. State Management (`contexts/AuthContext.tsx`)

#### `refreshProfile()` Function
```typescript
const refreshProfile = useCallback(async () => {
  // Updates tokens from storage
  // Calls authService.getProfile()
  // Updates state with profile or null
}, []);
```

**Features:**
- Automatically called on app initialization (if tokens exist)
- Automatically called after login
- Can be manually called via `useAuth()` hook
- Handles all error cases gracefully

**State Updates:**
- On success: `setUser(profile)`
- On failure: `setUser(null)`, clears tokens

### 3. Component Usage

#### Accessing Profile
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, refreshProfile, isLoading } = useAuth();
  
  // Access user data
  const userName = user?.first_name + " " + user?.last_name;
  const userEmail = user?.email;
  
  // Manually refresh profile
  const handleRefresh = async () => {
    await refreshProfile();
  };
}
```

#### Profile Data Structure
```typescript
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_subscribed: boolean;
  memberships: UserMembership[];
}
```

## Implementation Details

### Automatic Token Refresh

When `getProfile()` receives a 401 response:
1. Attempts to refresh access token using refresh token
2. If refresh succeeds, retries the original request
3. If refresh fails, clears all tokens and returns `null`

This ensures seamless user experience without manual token management.

### Error Handling

All errors are handled gracefully:
- Network errors → Returns `null`
- 401 errors → Attempts token refresh
- Token refresh fails → Clears tokens, returns `null`
- Invalid response → Returns `null`

No errors are thrown to components - they receive `null` and can handle accordingly.

### Profile Refresh Triggers

Profile is automatically refreshed:
1. **On app initialization** - If tokens exist in storage
2. **After login** - After successful email/password login
3. **After Google OAuth** - After successful Google sign-in
4. **Manually** - Via `refreshProfile()` function

## UI Integration

### AppShell Component

The `AppShell` component now displays real user data:
- **User Initials**: Generated from `first_name` and `last_name`
- **User Full Name**: `first_name + " " + last_name`
- **User Email**: From `user.email`
- **Loading States**: Shows "Loading..." while fetching

**Before:**
```typescript
// Hardcoded values
<span>Gemechu Bulti</span>
<p>gemechubulti11@gmail.com</p>
```

**After:**
```typescript
// Real user data
const { user, isLoading } = useAuth();
<span>{getUserFullName(user)}</span>
<p>{user?.email}</p>
```

## Usage Examples

### Example 1: Display User Name
```typescript
function UserProfile() {
  const { user } = useAuth();
  
  if (!user) return <div>Not logged in</div>;
  
  return (
    <div>
      <h1>Welcome, {user.first_name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### Example 2: Manual Profile Refresh
```typescript
function ProfileSettings() {
  const { user, refreshProfile, isLoading } = useAuth();
  
  const handleSave = async () => {
    // Save profile changes...
    await saveProfile();
    
    // Refresh profile to get updated data
    await refreshProfile();
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

### Example 3: Check Subscription Status
```typescript
function PremiumFeature() {
  const { user } = useAuth();
  
  if (!user?.is_subscribed) {
    return <div>Please subscribe to access this feature</div>;
  }
  
  return <div>Premium content here</div>;
}
```

## Key Benefits

1. **Automatic Token Management**: No manual token refresh needed
2. **Error Resilient**: Handles all error cases gracefully
3. **Type Safe**: Full TypeScript support with proper types
4. **Easy Access**: Simple hook-based API for components
5. **Real-time Updates**: Profile updates automatically on login/refresh
6. **Industry Standard**: Follows best practices for auth state management

## Migration Notes

### Legacy Methods
- `getCurrentUser()` - Still available but deprecated, use `getProfile()` instead
- `refreshUser()` - Still available but deprecated, use `refreshProfile()` instead

Both legacy methods delegate to the new implementations for backward compatibility.

## Testing

To test the profile implementation:

1. **Login** - Profile should load automatically
2. **Token Expiry** - Wait for access token to expire, profile should refresh automatically
3. **Manual Refresh** - Call `refreshProfile()` to manually refresh
4. **Logout** - Profile should be cleared

## Summary

The profile implementation provides:
- ✅ Automatic profile fetching from `/auth/me`
- ✅ Automatic token refresh on 401 errors
- ✅ Graceful error handling (returns null, never throws)
- ✅ React context integration for easy access
- ✅ Real user data in UI components
- ✅ Industry-standard code structure


