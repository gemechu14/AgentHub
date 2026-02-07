/**
 * Example: Complete Auth Integration Usage
 * 
 * This file demonstrates all the ways to use the authentication system
 * in your AgentHub application.
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useProtectedRoute, useGuestRoute } from "@/hooks/useProtectedRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserProfile } from "@/components/auth/UserProfile";
import { api } from "@/services/apiClient";
import { authService } from "@/services/authService";

// ============================================================================
// Example 1: Using useAuth hook to access user data
// ============================================================================

function UserDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login to continue</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.first_name}!</h1>
      <p>Email: {user?.email}</p>
      <p>Subscribed: {user?.is_subscribed ? "Yes" : "No"}</p>
      
      {/* Display user memberships */}
      <div>
        <h2>Your Workspaces</h2>
        {user?.memberships.map((membership) => (
          <div key={membership.workspace_id}>
            <p>{membership.workspace_name} - {membership.role}</p>
          </div>
        ))}
      </div>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

// ============================================================================
// Example 2: Protected Page with useProtectedRoute hook
// ============================================================================

function ProtectedPage() {
  // Automatically redirects to login if not authenticated
  const { isLoading } = useProtectedRoute();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <UserProfile />
    </div>
  );
}

// ============================================================================
// Example 3: Guest-only Page (redirect if already logged in)
// ============================================================================

function LoginPage() {
  // Redirects to "/" if already authenticated
  const { isLoading } = useGuestRoute();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Login Page</h1>
      {/* Login form here */}
    </div>
  );
}

// ============================================================================
// Example 4: Using ProtectedRoute component wrapper
// ============================================================================

function AdminDashboard() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Admin Dashboard</h1>
        <p>This content is only visible to authenticated users</p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// Example 5: Making authenticated API calls
// ============================================================================

async function fetchUserAgents() {
  try {
    // GET request - automatically includes auth token
    const agents = await api.get<{ data: any[] }>("/api/agents");
    return agents.data;
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    throw error;
  }
}

async function createAgent(name: string, description: string) {
  try {
    // POST request - automatically includes auth token
    const newAgent = await api.post("/api/agents", {
      name,
      description,
    });
    return newAgent;
  } catch (error) {
    console.error("Failed to create agent:", error);
    throw error;
  }
}

async function updateAgent(id: string, data: any) {
  try {
    // PUT request - automatically includes auth token
    const updated = await api.put(`/api/agents/${id}`, data);
    return updated;
  } catch (error) {
    console.error("Failed to update agent:", error);
    throw error;
  }
}

async function deleteAgent(id: string) {
  try {
    // DELETE request - automatically includes auth token
    await api.delete(`/api/agents/${id}`);
  } catch (error) {
    console.error("Failed to delete agent:", error);
    throw error;
  }
}

// ============================================================================
// Example 6: Using authService directly for auth operations
// ============================================================================

async function handleManualLogin(email: string, password: string) {
  try {
    // Login and get tokens
    const tokens = await authService.login({ email, password });
    console.log("Logged in successfully", tokens);
    
    // Tokens are automatically stored in localStorage
    // You can now fetch user data
    const user = await authService.getCurrentUser();
    console.log("User data:", user);
  } catch (error) {
    console.error("Login failed:", error);
  }
}

async function handleManualSignup(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  try {
    await authService.signup({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    console.log("Signup successful - check email for verification");
  } catch (error) {
    console.error("Signup failed:", error);
  }
}

async function handlePasswordReset(email: string) {
  try {
    await authService.forgotPassword({ email });
    console.log("Password reset email sent");
  } catch (error) {
    console.error("Password reset failed:", error);
  }
}

async function handleGoogleLogin() {
  try {
    // Get Google OAuth URL
    const { auth_url } = await authService.getGoogleAuthUrl();
    
    // Redirect to Google
    window.location.href = auth_url;
    
    // After Google auth, user will be redirected to /auth/callback
    // which automatically handles the token exchange
  } catch (error) {
    console.error("Google login failed:", error);
  }
}

// ============================================================================
// Example 7: Complete component with all features
// ============================================================================

function CompleteAuthExample() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  const handleRefreshUserData = async () => {
    try {
      await refreshUser();
      console.log("User data refreshed");
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Please Login</h1>
        <a href="/login">Go to Login</a>
      </div>
    );
  }

  return (
    <div>
      {/* User Profile Component */}
      <UserProfile />

      {/* User Information */}
      <div>
        <h2>User Details</h2>
        <p>Name: {user?.first_name} {user?.last_name}</p>
        <p>Email: {user?.email}</p>
        <p>Active: {user?.is_active ? "Yes" : "No"}</p>
        <p>Subscribed: {user?.is_subscribed ? "Yes" : "No"}</p>
      </div>

      {/* Actions */}
      <div>
        <button onClick={handleRefreshUserData}>Refresh User Data</button>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* Workspaces */}
      <div>
        <h2>Workspaces</h2>
        {user?.memberships.length === 0 ? (
          <p>No workspaces yet</p>
        ) : (
          user?.memberships.map((m) => (
            <div key={m.workspace_id}>
              <h3>{m.workspace_name}</h3>
              <p>Role: {m.role}</p>
              <p>Joined: {new Date(m.joined_at).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Checking token status
// ============================================================================

function TokenStatus() {
  const isAuthenticated = authService.isAuthenticated();
  const accessToken = authService.getAccessToken();
  const refreshToken = authService.getRefreshToken();

  return (
    <div>
      <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
      <p>Access Token: {accessToken ? "Present" : "None"}</p>
      <p>Refresh Token: {refreshToken ? "Present" : "None"}</p>
    </div>
  );
}

// ============================================================================
// Export examples
// ============================================================================

export {
  UserDashboard,
  ProtectedPage,
  LoginPage,
  AdminDashboard,
  CompleteAuthExample,
  TokenStatus,
  fetchUserAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  handleManualLogin,
  handleManualSignup,
  handlePasswordReset,
  handleGoogleLogin,
};


