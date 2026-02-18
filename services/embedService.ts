import { api } from "./apiClient";

export interface LaunchEmbedRequest {
  client_id: string;
  client_secret: string;
  agent_id: string;
}

export interface LaunchEmbedResponse {
  frontend_url: string;
}

/**
 * Launch embed chatbot
 * POST /embed/launch
 */
export async function launchEmbed(data: LaunchEmbedRequest): Promise<LaunchEmbedResponse> {
  return api.post<LaunchEmbedResponse>("/embed/launch", data, { skipAuth: true });
}

export interface ValidateTokenResponse {
  agent_id: string;
  agent_name: string;
  account_id: string;
  credential_id: string;
}

/**
 * Validate embed token
 * GET /embed/validate-token?token={token}
 */
export async function validateEmbedToken(token: string): Promise<ValidateTokenResponse> {
  return api.get<ValidateTokenResponse>(`/embed/validate-token?token=${token}`, { skipAuth: true });
}

