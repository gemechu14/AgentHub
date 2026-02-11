import type { ConnectionType, DatabaseType, ConnectionConfig, PowerBIConnectionConfig, DBConnectionConfig } from "@/types/agent";

/**
 * Convert UI connection type string to API ConnectionType
 */
export function mapConnectionTypeToAPI(uiType: string): ConnectionType {
  switch (uiType) {
    case "Power BI Semantic Model":
      return "POWERBI";
    case "SQL Database":
      return "DB";
    case "None":
    default:
      return "NONE";
  }
}

/**
 * Convert API ConnectionType to UI string
 */
export function mapConnectionTypeFromAPI(apiType: ConnectionType): string {
  switch (apiType) {
    case "POWERBI":
      return "Power BI Semantic Model";
    case "DB":
      return "SQL Database";
    case "NONE":
    default:
      return "None";
  }
}

/**
 * Convert UI model name to API model_type
 */
export function mapModelTypeToAPI(uiModel: string): string {
  const modelMap: Record<string, string> = {
    "OpenAI GPT-4": "gpt-4",
    "OpenAI GPT-3.5": "gpt-3.5-turbo",
    "Claude 3 Opus": "claude-3-opus",
    "Claude 3 Sonnet": "claude-3-sonnet",
    "Google Gemini Pro": "gemini-pro",
  };
  return modelMap[uiModel] || "gpt-4";
}

/**
 * Convert API model_type to UI model name
 */
export function mapModelTypeFromAPI(apiModel: string | undefined): string {
  if (!apiModel) return "OpenAI GPT-4";
  
  const modelMap: Record<string, string> = {
    "gpt-4": "OpenAI GPT-4",
    "gpt-3.5-turbo": "OpenAI GPT-3.5",
    "claude-3-opus": "Claude 3 Opus",
    "claude-3-sonnet": "Claude 3 Sonnet",
    "gemini-pro": "Google Gemini Pro",
  };
  return modelMap[apiModel] || "OpenAI GPT-4";
}

/**
 * Convert UI database type to API DatabaseType
 */
export function mapDatabaseTypeToAPI(uiType: string): DatabaseType {
  const typeMap: Record<string, DatabaseType> = {
    "PostgreSQL": "postgresql",
    "MySQL": "mysql",
    "SQL Server": "sqlserver",
    "Oracle": "oracle",
  };
  return typeMap[uiType] || "postgresql";
}

/**
 * Convert API DatabaseType to UI string
 */
export function mapDatabaseTypeFromAPI(apiType: DatabaseType): string {
  const typeMap: Record<DatabaseType, string> = {
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    sqlserver: "SQL Server",
    oracle: "Oracle",
  };
  return typeMap[apiType] || "PostgreSQL";
}

/**
 * Parse connection string for DB connection
 * Format: postgresql://user:password@host:port/database
 */
export function parseConnectionString(connectionString: string): {
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
} | null {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
      port: parseInt(url.port) || 5432,
    };
  } catch {
    return null;
  }
}

/**
 * Build PowerBI connection config from form data
 */
export function buildPowerBIConfig(
  workspaceId: string,
  datasetId: string,
  tenantId?: string,
  clientId?: string,
  clientSecret?: string
): PowerBIConnectionConfig | null {
  if (!workspaceId || !datasetId) {
    return null;
  }
  
  // For now, we'll require these fields. In a real app, you might want to
  // make tenant_id, client_id, and client_secret optional or have separate fields
  return {
    tenant_id: tenantId || "",
    client_id: clientId || "",
    workspace_id: workspaceId,
    dataset_id: datasetId,
    client_secret: clientSecret || "",
  };
}

/**
 * Build DB connection config from form data
 */
export function buildDBConfig(
  connectionString: string,
  databaseType: string
): DBConnectionConfig | null {
  const parsed = parseConnectionString(connectionString);
  if (!parsed) {
    return null;
  }

  return {
    host: parsed.host,
    username: parsed.username,
    password: parsed.password,
    database: parsed.database,
    port: parsed.port,
    database_type: mapDatabaseTypeToAPI(databaseType),
  };
}


