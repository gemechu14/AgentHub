"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, AuthState } from "@/types/auth";
import { authService } from "@/services/authService";
import { tokenStore } from "@/lib/tokenStore";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>; // Legacy - use refreshProfile
  loginWithGoogle: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simple authentication check: have tokens AND user data
  const isAuthenticated = !!user && !!accessToken && !!refreshToken;

  /**
   * Refresh user profile from /auth/me endpoint
   * Automatically handles token refresh on 401 errors
   * Updates state with profile data or null on failure
   */
  const refreshProfile = useCallback(async () => {
    try {
      // Update tokens from tokenStore first (in case they were just stored)
      const storedAccessToken = tokenStore.getAccessToken();
      const storedRefreshToken = tokenStore.getRefreshToken();
      
      if (!storedAccessToken || !storedRefreshToken) {
        // No tokens - set profile to null
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        return;
      }

      // Update state with tokens
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);

      // Fetch profile (getProfile handles token refresh automatically)
      const profile = await authService.getProfile();
      
      if (profile) {
        // Profile fetched successfully
        setUser(profile);
      } else {
        // Profile fetch failed (token refresh also failed)
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        tokenStore.clearTokens();
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      // On error, clear auth state
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      tokenStore.clearTokens();
    }
  }, []);

  /**
   * Legacy refreshUser method - delegates to refreshProfile
   * @deprecated Use refreshProfile instead
   */
  const refreshUser = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      // Check if tokens exist
      if (!tokenStore.hasTokens()) {
        setIsLoading(false);
        return;
      }

      // Restore tokens from storage
      const storedAccessToken = tokenStore.getAccessToken();
      const storedRefreshToken = tokenStore.getRefreshToken();

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);

        // Fetch profile (getProfile handles token refresh automatically)
        await refreshProfile();
      }

      setIsLoading(false);
    };

    initAuth();
  }, [refreshProfile]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const tokens = await authService.login({ email, password });
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);

      // Fetch profile after login
      await refreshProfile();
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [refreshProfile]);

  // Signup
  const signup = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      await authService.signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  }, []);

  /**
   * Logout - Clean, synchronous logout with proper state management
   */
  const logout = useCallback(() => {
    // 1. Clear all local state immediately (synchronous)
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    
    // 2. Clear tokens from storage
    tokenStore.clearTokens();
    
    // 3. Notify server (fire and forget - don't wait)
    authService.logout().catch(() => {
      // Ignore errors - tokens already cleared locally
    });
    
    // 4. Redirect to login page (use replace to prevent back button issues)
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }, []);

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    try {
      const { auth_url } = await authService.getGoogleAuthUrl();
      // Redirect to Google OAuth page
      window.location.href = auth_url;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshProfile,
    refreshUser, // Legacy support
    loginWithGoogle,
    setAccessToken,
    setRefreshToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

