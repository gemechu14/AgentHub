import {
  TeamMember,
  TeamMemberResponse,
  InviteMemberRequest,
  UpdateMemberPermissionsRequest,
  DeleteUserRequest,
  SuccessResponse,
} from "@/types/team";
import { tokenStore } from "@/lib/tokenStore";
import { authService } from "./authService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class TeamService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = tokenStore.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle 401 errors by attempting token refresh and redirecting to login on failure
   */
  private async handle401Error(response: Response): Promise<void> {
    if (response.status === 401) {
      try {
        // Try to refresh the token
        await authService.refreshAccessToken();
        // If refresh succeeds, the caller should retry the request
      } catch (refreshError) {
        // Refresh failed - tokens are invalid/expired
        // authService.refreshAccessToken() already redirects, but ensure it here
        authService.clearTokens();
        if (typeof window !== "undefined") {
          window.location.replace("/login?session_expired=true");
        }
        throw new Error("Session expired. Please login again.");
      }
    }
  }

  /**
   * List team members for an account
   * GET /accounts/{account_id}/team_members
   */
  async listTeamMembers(accountId: string): Promise<TeamMember[]> {
    let response = await fetch(`${API_BASE_URL}/accounts/${accountId}/team_members`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    // Handle 401 - try to refresh token
    if (response.status === 401) {
      await this.handle401Error(response);
      // Retry with new token
      response = await fetch(`${API_BASE_URL}/accounts/${accountId}/team_members`, {
        method: "GET",
        headers: this.getHeaders(),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // If still 401 after refresh, redirect already happened
      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(error.detail || error.message || "Failed to fetch team members");
    }

    const data: TeamMemberResponse[] = await response.json();
    
    // Map API response to local format
    return data.map((member) => ({
      id: member.user_id || undefined,
      email: member.email,
      role: member.role,
      status: member.status,
      user_id: member.user_id || undefined,
    }));
  }

  /**
   * Send invitation to a team member
   * POST /accounts/{account_id}/invite
   */
  async inviteMember(accountId: string, payload: InviteMemberRequest): Promise<SuccessResponse> {
    let response = await fetch(`${API_BASE_URL}/accounts/${accountId}/invite`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    // Handle 401 - try to refresh token
    if (response.status === 401) {
      await this.handle401Error(response);
      // Retry with new token
      response = await fetch(`${API_BASE_URL}/accounts/${accountId}/invite`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // If still 401 after refresh, redirect already happened
      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(error.detail || error.message || "Failed to send invitation");
    }

    return response.json();
  }

  /**
   * Update member permissions
   * PUT /accounts/{account_id}/members/permissions
   */
  async updateMemberPermissions(
    accountId: string,
    payload: UpdateMemberPermissionsRequest
  ): Promise<SuccessResponse> {
    let response = await fetch(`${API_BASE_URL}/accounts/${accountId}/members/permissions`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    // Handle 401 - try to refresh token
    if (response.status === 401) {
      await this.handle401Error(response);
      // Retry with new token
      response = await fetch(`${API_BASE_URL}/accounts/${accountId}/members/permissions`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // If still 401 after refresh, redirect already happened
      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(error.detail || error.message || "Failed to update member permissions");
    }

    return response.json();
  }

  /**
   * Delete a user from the account
   * DELETE /accounts/{account_id}/users
   */
  async deleteUser(accountId: string, payload: DeleteUserRequest): Promise<SuccessResponse> {
    let response = await fetch(`${API_BASE_URL}/accounts/${accountId}/users`, {
      method: "DELETE",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    // Handle 401 - try to refresh token
    if (response.status === 401) {
      await this.handle401Error(response);
      // Retry with new token
      response = await fetch(`${API_BASE_URL}/accounts/${accountId}/users`, {
        method: "DELETE",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // If still 401 after refresh, redirect already happened
      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(error.detail || error.message || "Failed to delete user");
    }

    return response.json();
  }
}

export const teamService = new TeamService();

