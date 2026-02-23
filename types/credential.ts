import type { EmbedTheme } from "./theme";

export interface Credential {
  id: string;
  agent_id: string;
  client_id: string;
  client_secret?: string; // Only present on creation
  account_id: string;
  is_active: boolean;
  created_at: string;
  name?: string;
  embed_url?: string; // Current embed URL if available
  embed_token?: string; // Current embed token if available
  theme?: EmbedTheme;
}

export interface CreateCredentialRequest {
  agent_id: string;
  name?: string;
}

export interface CreateCredentialResponse extends Credential {
  client_secret: string; // Always present in creation response
}





