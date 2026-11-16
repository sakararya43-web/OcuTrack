export class ApiClientError extends Error {
  public status: number;
  public isUnavailable: boolean;
  public details?: unknown;

  constructor(message: string, status: number = 0, isUnavailable: boolean = false, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.isUnavailable = isUnavailable;
    this.details = details;
  }
}

const DEFAULT_BASE_URL = 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 10000;

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }
  return DEFAULT_BASE_URL;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail: unknown = null;
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;

      try {
        const json = await response.json();
        errorDetail = json;
        if (json.detail) {
          if (typeof json.detail === 'string') {
            errorMessage = json.detail;
          } else if (Array.isArray(json.detail)) {
            errorMessage = json.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ');
          }
        } else if (json.message) {
          errorMessage = json.message;
        }
      } catch {
        // Non-JSON response
      }

      const isUnavailable = response.status === 502 || response.status === 503 || response.status === 504;
      throw new ApiClientError(
        isUnavailable
          ? 'The OcuTrack backend service is temporarily unavailable. Please verify the backend is running.'
          : errorMessage,
        response.status,
        isUnavailable,
        errorDetail
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError(
        `Request timed out after ${timeoutMs / 1000}s. Backend server may be offline or unreachable.`,
        0,
        true
      );
    }

    // Network error (e.g. Failed to fetch, Connection refused)
    const errorMsg = error instanceof Error ? error.message : 'Unknown network error';
    throw new ApiClientError(
      `Cannot connect to backend at ${baseUrl}. Ensure the FastAPI server is running. (${errorMsg})`,
      0,
      true,
      error
    );
  }
}
