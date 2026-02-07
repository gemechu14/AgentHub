// Auth Request Types
export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  invite?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// Auth Response Types
export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface SuccessResponse {
  ok: boolean;
  message?: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
  message: string;
}

export interface GoogleAuthStartResponse {
  auth_url: string;
}

// User Types
export interface UserMembership {
  workspace_id: string;
  workspace_name: string;
  role: string;
  joined_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_subscribed: boolean;
  memberships: UserMembership[];
}

// Auth State
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Token Storage
export interface TokenStorage {
  access_token: string;
  refresh_token: string;
  token_type: string;
}


