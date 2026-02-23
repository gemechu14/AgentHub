import { api } from "./apiClient";
import type { PowerBITestRequest, ConnectionCheckResponse, SchemaResponse, DBTestConnectionRequest } from "@/types/powerbi";

/**
 * Test Power BI connection
 * POST /agents/test-connection
 */
export async function testPowerBIConnection(
  credentials: PowerBITestRequest
): Promise<ConnectionCheckResponse> {
  // This endpoint is public (no auth required) for testing
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  
  const response = await fetch(`${API_BASE_URL}/agents/test-connection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || "Connection test failed");
  }

  return response.json();
}

/**
 * Get Power BI schema
 * POST /agents/get-schema
 */
export async function getPowerBISchema(
  credentials: PowerBITestRequest
): Promise<SchemaResponse> {
  // This endpoint is public (no auth required) for testing
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  
  const response = await fetch(`${API_BASE_URL}/agents/get-schema`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || "Schema retrieval failed");
  }

  return response.json();
}

/**
 * Test database connection
 * POST /agents/test-db-connection
 */
export async function testDbConnection(
  credentials: DBTestConnectionRequest
): Promise<ConnectionCheckResponse> {
  // This endpoint is public (no auth required) for testing
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  
  const response = await fetch(`${API_BASE_URL}/agents/test-db-connection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || "Database connection test failed");
  }

  return response.json();
}

