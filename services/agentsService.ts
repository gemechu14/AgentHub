import { api } from "./apiClient";
import type { Agent, CreateAgentRequest, UpdateAgentRequest, ListAgentsResponse } from "@/types/agent";

/**
 * Get account_id from user memberships
 * Priority: account_id > account.id > workspace_id
 */
export function getAccountId(user: { memberships?: Array<{ account_id?: string; account?: { id?: string }; workspace_id?: string }> } | null): string | null {
  if (!user || !user.memberships || user.memberships.length === 0) {
    return null;
  }

  const membership = user.memberships[0];
  if (membership.account_id) {
    return membership.account_id;
  }
  if (membership.account?.id) {
    return membership.account.id;
  }
  if (membership.workspace_id) {
    return membership.workspace_id;
  }
  return null;
}

/**
 * List all agents for an account
 * GET /agents/{account_id}
 */
export async function listAgents(accountId: string): Promise<ListAgentsResponse> {
  return api.get<ListAgentsResponse>(`/agents/${accountId}`);
}

/**
 * Get a single agent by ID
 * GET /agents/{account_id}/{agent_id}
 */
export async function getAgent(accountId: string, agentId: string): Promise<Agent> {
  return api.get<Agent>(`/agents/${accountId}/${agentId}`);
}

/**
 * Create a new agent
 * POST /agents/{account_id}
 */
export async function createAgent(accountId: string, data: CreateAgentRequest): Promise<Agent> {
  return api.post<Agent>(`/agents/${accountId}`, data);
}

/**
 * Update an existing agent
 * PATCH /agents/{account_id}/{agent_id}
 */
export async function updateAgent(
  accountId: string,
  agentId: string,
  data: UpdateAgentRequest
): Promise<Agent> {
  return api.patch<Agent>(`/agents/${accountId}/${agentId}`, data);
}

/**
 * Delete an agent
 * DELETE /agents/{account_id}/{agent_id}
 */
export async function deleteAgent(accountId: string, agentId: string): Promise<void> {
  return api.delete<void>(`/agents/${accountId}/${agentId}`);
}

// Legacy function for backward compatibility
// @deprecated Use listAgents(accountId) instead
export async function getAgents(accountId?: string): Promise<Agent[]> {
  if (!accountId) {
    throw new Error("accountId is required. Use listAgents(accountId) instead.");
  }
  const response = await listAgents(accountId);
  return response.agents;
}


