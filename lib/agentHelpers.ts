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
  // Models are already in API format, just validate and return
  const validModels = ["gpt-4", "gpt-4o", "gpt-4o-mini"];
  if (validModels.includes(uiModel)) {
    return uiModel;
  }
  // Legacy mapping for backwards compatibility
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
  if (!apiModel) return "gpt-4";
  
  // Models are already in API format, return as-is
  const validModels = ["gpt-4", "gpt-4o", "gpt-4o-mini"];
  if (validModels.includes(apiModel)) {
    return apiModel;
  }
  
  // Legacy mapping for backwards compatibility
  const modelMap: Record<string, string> = {
    "gpt-4": "gpt-4",
    "gpt-3.5-turbo": "gpt-4", // Map old models to gpt-4
    "claude-3-opus": "gpt-4",
    "claude-3-sonnet": "gpt-4",
    "gemini-pro": "gpt-4",
  };
  return modelMap[apiModel] || "gpt-4";
}

/**
 * Convert UI database type to API DatabaseType
 */
export function mapDatabaseTypeToAPI(uiType: string): DatabaseType {
  const typeMap: Record<string, DatabaseType> = {
    "PostgreSQL": "postgresql",
    "MySQL": "mysql",
    "MariaDB": "mariadb",
    "SQLite": "sqlite",
    "SQL Server": "mssql",
    "Oracle": "oracle",
  };
  return typeMap[uiType] || "postgresql";
}

/**
 * Convert API DatabaseType to UI string
 */
export function mapDatabaseTypeFromAPI(apiType: DatabaseType): string {
  const typeMap: Record<string, string> = {
    postgresql: "PostgreSQL",
    postgres: "PostgreSQL",
    mysql: "MySQL",
    mariadb: "MariaDB",
    sqlite: "SQLite",
    mssql: "SQL Server",
    sqlserver: "SQL Server", // Legacy support
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
 * Build DB connection config from individual form fields
 */
export function buildDBConfig(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string,
  databaseType: string
): DBConnectionConfig | null {
  if (!host || !database || !username || !password || !databaseType) {
    return null;
  }

  return {
    host: host.trim(),
    port: port || 5432,
    database: database.trim(),
    username: username.trim(),
    password: password.trim(),
    database_type: mapDatabaseTypeToAPI(databaseType),
  };
}


