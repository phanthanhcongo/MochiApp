// src/apiClient.ts
// Fix cứng API URL để đảm bảo luôn dùng IP Tailscale
function computeApiUrl(): string {
  // IP Tailscale mặc định
  const TAILSCALE_IP = '100.87.242.47:8000';
  const DEFAULT_API_URL = `http://${TAILSCALE_IP}/api`;
  
  // Nếu có env variable, kiểm tra xem có phải localhost không
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL;
    // Nếu env URL chứa localhost hoặc 127.0.0.1, thay thế bằng IP Tailscale
    if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      console.warn('[API Client] Phát hiện localhost trong VITE_API_URL, thay thế bằng IP Tailscale');
      return DEFAULT_API_URL;
    }
    return envUrl;
  }
  
  // Fix cứng IP Tailscale
  return DEFAULT_API_URL;
}

// Tính toán API_URL mỗi lần gọi để đảm bảo không bị cache localhost
function getApiUrlRuntime(): string {
  const url = computeApiUrl();
  
  // Runtime check: nếu URL chứa localhost/127.0.0.1, force dùng IP Tailscale
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn('[API Client] Runtime check: Phát hiện localhost, force dùng IP Tailscale');
    return 'http://100.87.242.47:8000/api';
  }
  
  return url;
}

// Export constant cho backward compatibility - tính toán ngay để đảm bảo không có localhost
const computedApiUrl = getApiUrlRuntime();
export const API_URL = computedApiUrl;

// Export function để lấy URL mới mỗi lần gọi (recommended - dùng cho API calls)
export function getApiBaseUrl(): string {
  return getApiUrlRuntime();
}

// Helper để các file khác có thể dùng thay vì API_URL constant
// Đảm bảo luôn trả về URL đúng, không bao giờ localhost
export function getApiUrl(): string {
  return getApiUrlRuntime();
}

// Log API URL để debug (luôn log, không chỉ DEV)
if (typeof window !== 'undefined') {
  const runtimeUrl = getApiBaseUrl();
  console.log('[API Client] API_URL (constant):', API_URL);
  console.log('[API Client] API_URL (runtime):', runtimeUrl);
  console.log('[API Client] Current location:', window.location.href);
  console.log('[API Client] Hostname:', window.location.hostname);
  console.log('[API Client] Port:', window.location.port);
  console.log('[API Client] User Agent:', navigator.userAgent);
  
  // Warning nếu phát hiện localhost
  if (runtimeUrl.includes('localhost') || runtimeUrl.includes('127.0.0.1')) {
    console.error('[API Client] ⚠️ CẢNH BÁO: API URL vẫn chứa localhost! Điều này sẽ không hoạt động trên iPhone.');
  }
}

// Custom error class với thông tin chi tiết
export class ApiError extends Error {
  status: number;
  statusText: string; 
  url: string;
  responseBody?: any;

  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
    responseBody?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.responseBody = responseBody;
  }

  getDetails(): string {
    const parts: string[] = [];
    
    parts.push(`Status: ${this.status} ${this.statusText}`);
    parts.push(`URL: ${this.url}`);
    
    if (this.responseBody) {
      if (typeof this.responseBody === 'string') {
        parts.push(`Response: ${this.responseBody}`);
      } else if (this.responseBody.message) {
        parts.push(`Message: ${this.responseBody.message}`);
      } else if (this.responseBody.error) {
        parts.push(`Error: ${this.responseBody.error}`);
      } else if (this.responseBody.errors) {
        const errors = this.responseBody.errors;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          parts.push(`Validation Errors: ${errorMessages}`);
        }
      }
    }
    
    return parts.join('\n');
  }
}

// Main API function với error handling chi tiết
export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  
  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...init
    });

    // Parse response body (cả success và error)
    let responseBody: any = null;
    try {
      const text = await res.text();
      if (text) {
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text;
        }
      }
    } catch (e) {
      // Ignore parse errors, sẽ dùng status code
    }

    if (!res.ok) {
      // Tạo error message chi tiết
      let errorMessage = `HTTP ${res.status} ${res.statusText}`;
      
      if (responseBody) {
        if (typeof responseBody === 'string') {
          errorMessage = responseBody;
        } else if (responseBody.message) {
          errorMessage = responseBody.message;
        } else if (responseBody.error) {
          errorMessage = responseBody.error;
        } else if (responseBody.errors) {
          // Laravel validation errors
          const errors = responseBody.errors;
          if (typeof errors === 'object') {
            const errorMessages = Object.entries(errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            errorMessage = errorMessages || errorMessage;
          }
        }
      }

      // Thêm thông tin về loại lỗi
      if (res.status === 0) {
        errorMessage = `Không thể kết nối đến server. Kiểm tra kết nối mạng hoặc CORS.`;
      } else if (res.status === 401) {
        errorMessage = `Xác thực thất bại: ${errorMessage}`;
      } else if (res.status === 403) {
        errorMessage = `Không có quyền truy cập: ${errorMessage}`;
      } else if (res.status === 404) {
        errorMessage = `Không tìm thấy: ${errorMessage}`;
      } else if (res.status === 422) {
        errorMessage = `Dữ liệu không hợp lệ: ${errorMessage}`;
      } else if (res.status === 500) {
        errorMessage = `Lỗi server: ${errorMessage}`;
      }

      throw new ApiError(
        errorMessage,
        res.status,
        res.statusText,
        url,
        responseBody
      );
    }

    // Success - parse JSON
    if (responseBody !== null) {
      return responseBody as T;
    }
    
    // Nếu không có body, thử parse lại
    try {
      return await res.json() as T;
    } catch {
      return {} as T;
    }
  } catch (error: any) {
    // Network errors, CORS errors, etc.
    if (error instanceof ApiError) {
      throw error;
    }

    // Fetch failed (network error, CORS, timeout)
    if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('Load failed')) {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
      throw new ApiError(
        `Không thể kết nối đến server123.\n\nĐang truy cập từ: ${currentOrigin}\nAPI URL: ${url}\n\nKiểm tra:\n- Server có đang chạy không?\n- Firewall đã mở port 8000 chưa?\n- Địa chỉ API đúng không?\n- CORS đã được cấu hình chưa?\n- iPhone đã kết nối Tailscale VPN chưa?\n\nChi tiết: ${error.message}`,
        0,
        'Network Error',
        url
      );
    }

    // Re-throw với thông tin chi tiết
    throw new ApiError(
      error.message || 'Lỗi không xác định',
      0,
      'Unknown Error',
      url,
      { originalError: error.toString() }
    );
  }
}

// Helper function cho POST, PUT, DELETE
export async function apiPost<T>(path: string, data?: any, init?: RequestInit): Promise<T> {
  return apiGet<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...init,
  });
}

export async function apiPut<T>(path: string, data?: any, init?: RequestInit): Promise<T> {
  return apiGet<T>(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...init,
  });
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return apiGet<T>(path, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    ...init,
  });
}

// Helper để lấy error message từ bất kỳ error nào
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Đã xảy ra lỗi không xác định';
}

// Helper để log error chi tiết (dùng trong development)
export function logError(error: unknown, context?: string): void {
  if (error instanceof ApiError) {
    console.error(`[API Error${context ? ` - ${context}` : ''}]`, {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      responseBody: error.responseBody,
      details: error.getDetails(),
    });
  } else if (error instanceof Error) {
    console.error(`[Error${context ? ` - ${context}` : ''}]`, error);
  } else {
    console.error(`[Unknown Error${context ? ` - ${context}` : ''}]`, error);
  }
}
