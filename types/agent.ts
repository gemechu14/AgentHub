export type AgentStatus = "active" | "draft" | "inactive";

export type ConnectionType = "POWERBI" | "DB" | "NONE";

export type DatabaseType = "postgresql" | "postgres" | "mysql" | "mariadb" | "sqlite" | "mssql" | "oracle";

export interface PowerBIConnectionConfig {
  tenant_id: string;
  client_id: string;
  workspace_id: string;
  dataset_id: string;
  client_secret: string;
}

export interface DBConnectionConfig {
  host: string;
  username: string;
  database: string;
  password: string;
  port: number;
  database_type: DatabaseType;
}

export type ConnectionConfig = PowerBIConnectionConfig | DBConnectionConfig;

export interface Agent {
  id: string;
  name: string;
  description?: string;
  status: AgentStatus;
  model_type?: string; // e.g., "gpt-4", "gpt-3.5-turbo"
  api_key?: string;
  system_instructions?: string;
  connection_type: ConnectionType;
  connection_config?: ConnectionConfig;
  account_id: string;
  created_at: string;
  updated_at?: string;
  // Custom tone fields
  custom_tone_schema_enabled?: boolean;
  custom_tone_rows_enabled?: boolean;
  custom_tone_schema?: string;
  custom_tone_rows?: string;
}

// Request types for API
export interface CreateAgentRequest {
  name: string;
  description?: string;
  status?: AgentStatus;
  model_type?: string;
  api_key?: string;
  system_instructions?: string;
  connection_type: ConnectionType;
  connection_config?: ConnectionConfig;
  // Custom tone fields
  custom_tone_schema_enabled?: boolean;
  custom_tone_rows_enabled?: boolean;
  custom_tone_schema?: string;
  custom_tone_rows?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  status?: AgentStatus;
  model_type?: string;
  api_key?: string;
  system_instructions?: string;
  connection_type?: ConnectionType;
  connection_config?: ConnectionConfig;
  // Custom tone fields
  custom_tone_schema_enabled?: boolean;
  custom_tone_rows_enabled?: boolean;
  custom_tone_schema?: string;
  custom_tone_rows?: string;
}

// Response types
export interface ListAgentsResponse {
  agents: Agent[];
  total: number;
}


