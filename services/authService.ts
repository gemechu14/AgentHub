import {
  SignupRequest,
  LoginRequest,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthTokenResponse,
  SuccessResponse,
  VerifyEmailResponse,
  GoogleAuthStartResponse,
  User,
} from "@/types/auth";
import { tokenStore } from "@/lib/tokenStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class AuthService {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = tokenStore.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Token Management - Delegate to tokenStore
  getAccessToken(): string | null {
    return tokenStore.getAccessToken();
  }

  getRefreshToken(): string | null {
    return tokenStore.getRefreshToken();
  }

  setTokens(accessToken: string, refreshToken: string): void {
    tokenStore.setTokens(accessToken, refreshToken);
  }

  clearTokens(): void {
    tokenStore.clearTokens();
  }

  // Signup
  async signup(data: SignupRequest): Promise<SuccessResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Signup failed");
    }

    return response.json();
  }

  // Login
  async login(data: LoginRequest): Promise<AuthTokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Login failed");
    }

    const tokens: AuthTokenResponse = await response.json();
    this.setTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  }

  // Verify Email
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify?token=${token}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Email verification failed");
    }

    return response.json();
  }

  /**
   * Get user profile from /auth/me endpoint
   * Automatically handles token refresh on 401 errors
   * Returns null on error instead of throwing
   */
  async getProfile(): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: this.getHeaders(true),
      });

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        try {
          // Attempt to refresh access token
          await this.refreshAccessToken();
          
          // Retry the request with new token
          const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: this.getHeaders(true),
          });

          if (!retryResponse.ok) {
            // Refresh failed or retry failed - clear tokens
            this.clearTokens();
            return null;
          }

          return retryResponse.json();
        } catch (refreshError) {
          // Token refresh failed - clear tokens and return null
          console.error("Token refresh failed:", refreshError);
          this.clearTokens();
          return null;
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("Failed to fetch profile:", error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }

  /**
   * Get Current User (legacy method - use getProfile instead)
   * @deprecated Use getProfile() instead for automatic token refresh
   */
  async getCurrentUser(): Promise<User> {
    const profile = await this.getProfile();
    if (!profile) {
      throw new Error("Failed to fetch user");
    }
    return profile;
  }

  // Refresh Token
  async refreshAccessToken(): Promise<AuthTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const formData = new FormData();
    formData.append("refresh_token", refreshToken);

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error("Token refresh failed");
    }

    const tokens: AuthTokenResponse = await response.json();
    this.setTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  }

  /**
   * Logout user - Notify server and clear local tokens
   * Always clears tokens even if server call fails
   */
  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefreshToken();
    
    // Notify server to revoke refresh token (if we have one)
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout?refresh_token=${encodeURIComponent(refreshToken)}`, {
          method: "POST",
        });
      } catch (err) {
        // Ignore server errors - always clear local tokens
      }
    }
    
    // Always clear tokens locally
    tokenStore.clearTokens();
  }

  // Resend Verification Email
  async resendVerification(data: ResendVerificationRequest): Promise<SuccessResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify/resend`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Failed to resend verification email");
    }

    return response.json();
  }

  // Forgot Password
  async forgotPassword(data: ForgotPasswordRequest): Promise<SuccessResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Failed to send password reset email");
    }

    return response.json();
  }

  // Reset Password
  async resetPassword(data: ResetPasswordRequest): Promise<SuccessResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Failed to reset password");
    }

    return response.json();
  }

  // Google OAuth - Start
  async getGoogleAuthUrl(): Promise<GoogleAuthStartResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google/start`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Failed to get Google auth URL");
    }

    return response.json();
  }

  // Google OAuth - Callback
  async handleGoogleCallback(code: string): Promise<AuthTokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google/callback?code=${encodeURIComponent(code)}`, {
      method: "POST",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "Google authentication failed");
    }

    const tokens: AuthTokenResponse = await response.json();
    this.setTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();

