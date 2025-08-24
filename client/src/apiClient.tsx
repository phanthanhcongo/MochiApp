// src/apiClient.ts
// Nếu Electron có inject __API_BASE__ thì dùng nó.
// Nếu không (đang dev web), để rỗng "" để proxy Vite xử lý.
const API_BASE: string =
  (window as any).__API_BASE__ ?? ''  // '' + '/api/...' => Vite proxy

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
