export interface PowerBITestRequest {
  tenant_id: string;
  client_id: string;
  workspace_id: string;
  dataset_id: string;
  client_secret: string;
}

export interface ConnectionCheckResponse {
  connected: boolean;
  message: string;
  workspace_id?: string;
  dataset_id?: string;
  table_count?: number;
  error?: string;
}

export interface SchemaResponse {
  success: boolean;
  message: string;
  data?: {
    tables?: any[];
    columns?: any[];
    relationships?: any[];
    measures?: any[];
  };
  error?: string;
}

// Chat types
export interface PowerBIChatRequest {
  question: string;
}

export interface PowerBIChatResponse {
  answer: string;
  resolution_note: string;
  action: "DESCRIBE" | "QUERY" | "ERROR";
  dax_attempts: string[];
  final_dax: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  question: string;
  response: PowerBIChatResponse;
  timestamp: Date;
}

