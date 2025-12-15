// src/apiClient.ts
// Gọi API trực tiếp đến cổng 8000
export const API_BASE_URL = 'http://localhost:8000';

const API_BASE: string = (window as any).__API_BASE__ ?? API_BASE_URL;

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// ví dụ dùng:
// const users = await apiGet('/api/users')
