import { api } from "./apiClient";
import type { Credential, CreateCredentialRequest, CreateCredentialResponse } from "@/types/credential";

/**
 * Create or update client credentials for an agent (upserts - if exists, updates; if not, creates)
 * Ensures only one credential per agent
 * POST /agents/{account_id}/{agent_id}/credentials
 */
export async function createCredential(
  accountId: string,
  agentId: string,
  data: CreateCredentialRequest
): Promise<CreateCredentialResponse> {
  return api.post<CreateCredentialResponse>(`/agents/${accountId}/${agentId}/credentials`, data);
}

/**
 * List all credentials for an agent
 * GET /agents/{account_id}/{agent_id}/credentials
 */
export async function listCredentials(
  accountId: string,
  agentId: string
): Promise<Credential[]> {
  return api.get<Credential[]>(`/agents/${accountId}/${agentId}/credentials`);
}

/**
 * Delete a credential
 * DELETE /agents/{account_id}/{agent_id}/credentials/{credential_id}
 */
export async function deleteCredential(
  accountId: string,
  agentId: string,
  credentialId: string
): Promise<{ ok: boolean; message: string }> {
  return api.delete<{ ok: boolean; message: string }>(
    `/agents/${accountId}/${agentId}/credentials/${credentialId}`
  );
}

/**
 * Regenerate client secret for a credential
 * PATCH /agents/{account_id}/{agent_id}/credentials/{credential_id}/regenerate-secret
 */
export async function regenerateCredentialSecret(
  accountId: string,
  agentId: string,
  credentialId: string
): Promise<CreateCredentialResponse> {
  return api.patch<CreateCredentialResponse>(
    `/agents/${accountId}/${agentId}/credentials/${credentialId}/regenerate-secret`
  );
}

/**
 * Toggle embed status for a credential
 * PATCH /agents/{account_id}/{agent_id}/credentials/{credential_id}/toggle
 */
export async function toggleEmbedStatus(
  accountId: string,
  agentId: string,
  credentialId: string,
  isActive: boolean
): Promise<Credential> {
  return api.patch<Credential>(
    `/agents/${accountId}/${agentId}/credentials/${credentialId}/toggle`,
    { is_active: isActive }
  );
}

