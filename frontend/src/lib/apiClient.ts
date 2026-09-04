export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result: ApiResponse<T> = await response.json();
    if (!response.ok && result.success === undefined) {
      return {
        success: false,
        data: null as unknown as T,
        message: result.message || `Request failed with status ${response.status}`,
      };
    }
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null as unknown as T,
      message: error.message || 'Network error or backend server unreachable',
    };
  }
}
