import { authService } from "./authService";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiErrorShape {
  message: string;
  detail?: string;
  status?: number;
}

export class ApiError extends Error {
  status?: number;
  detail?: string;

  constructor({ message, status, detail }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface ApiClientOptions extends RequestInit {
  method?: HttpMethod;
  skipAuth?: boolean;
  isRetry?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Enhanced API client with automatic token refresh on 401 errors
 */
export async function apiClient<TResponse>(
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const { skipAuth = false, isRetry = false, ...fetchOptions } = options;
  
  // Build full URL
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  // Prepare headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers ?? {}),
  };

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = authService.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const isJson =
    response.headers.get("content-type")?.includes("application/json") ?? false;

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && !skipAuth && !isRetry) {
    try {
      // Try to refresh the token
      await authService.refreshAccessToken();
      
      // Retry the original request with the new token
      return apiClient<TResponse>(path, {
        ...options,
        isRetry: true, // Prevent infinite loop
      });
    } catch (refreshError) {
      // Refresh failed, clear tokens and throw error
      authService.clearTokens();
      
      // Redirect to login if we're in the browser
      if (typeof window !== "undefined") {
        window.location.href = "/login?session_expired=true";
      }
      
      throw new ApiError({
        message: "Session expired. Please login again.",
        status: 401,
      });
    }
  }

  // Handle other errors
  if (!response.ok) {
    const errorBody = isJson ? await response.json() : null;
    const message =
      errorBody?.detail ||
      errorBody?.message ||
      `Request to ${url} failed with status ${response.status}`;

    throw new ApiError({ 
      message, 
      status: response.status,
      detail: errorBody?.detail,
    });
  }

  // Return response
  if (!isJson) {
    // @ts-expect-error - caller is responsible for correct typing when response is not JSON
    return response.text();
  }

  return (await response.json()) as TResponse;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(path: string, options?: Omit<ApiClientOptions, "method">) =>
    apiClient<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, data?: unknown, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(path: string, data?: unknown, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: unknown, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string, options?: Omit<ApiClientOptions, "method">) =>
    apiClient<T>(path, { ...options, method: "DELETE" }),
};


