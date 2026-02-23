import { api } from "./apiClient";

export interface LaunchEmbedRequest {
  agent_id: string;
}

export interface LaunchEmbedResponse {
  frontend_url: string;
}

/**
 * Launch embed chatbot
 * POST /embed/launch
 * Returns 403 if credential not found or is_active=false
 */
export async function launchEmbed(data: LaunchEmbedRequest): Promise<LaunchEmbedResponse> {
  return api.post<LaunchEmbedResponse>("/embed/launch", data, { skipAuth: true });
}

export interface ValidateTokenResponse {
  agent_id: string;
  agent_name: string;
  account_id: string;
  credential_id: string;
  recommended_questions?: string[];
}

/**
 * Validate embed token
 * GET /embed/validate-token?token={token}
 * Returns 403 if credential not found or is_active=false
 */
export async function validateEmbedToken(token: string): Promise<ValidateTokenResponse> {
  return api.get<ValidateTokenResponse>(`/embed/validate-token?token=${token}`, { skipAuth: true });
}

/**
 * Get current embed URL for an agent (returns existing token if available)
 * GET /agents/{account_id}/{agent_id}/embed-url
 * Returns the current embed URL without generating a new token
 */
export async function getEmbedUrl(
  accountId: string,
  agentId: string
): Promise<LaunchEmbedResponse | null> {
  try {
    return await api.get<LaunchEmbedResponse>(`/agents/${accountId}/${agentId}/embed-url`);
  } catch (err: any) {
    // If 404, no embed URL exists yet
    if (err?.response?.status === 404 || err?.status === 404) {
      return null;
    }
    throw err;
  }
}

