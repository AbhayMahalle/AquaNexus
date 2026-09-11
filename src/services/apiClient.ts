import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        data: null as unknown as T,
        message: errorData.message || `HTTP Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      message: error instanceof Error ? error.message : 'Network request failed',
    };
  }
}
