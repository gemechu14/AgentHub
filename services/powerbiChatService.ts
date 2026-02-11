import { api } from "./apiClient";
import type { PowerBIChatRequest, PowerBIChatResponse } from "@/types/powerbi";

/**
 * Chat with Power BI agent
 * POST /agents/{account_id}/{agent_id}/chat
 */
export async function chatWithPowerBI(
  accountId: string,
  agentId: string,
  question: string
): Promise<PowerBIChatResponse> {
  const payload: PowerBIChatRequest = { question };
  
  return api.post<PowerBIChatResponse>(
    `/agents/${accountId}/${agentId}/chat`,
    payload
  );
}


