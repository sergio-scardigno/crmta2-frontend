import { api } from "./api";
import type { AdminLoginRequest, AdminLoginResponse, AdminUser } from "./types/admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export async function adminLogin(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await api.post<AdminLoginResponse>(
    "/auth/admin/login",
    credentials
  );
  
  // Guardar token en localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminToken', response.access_token);
    localStorage.setItem('adminUser', JSON.stringify(response.admin));
  }
  
  return response;
}

export async function adminLogout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const response = await api.get<AdminUser>("/auth/admin/me");
    return response;
  } catch (error) {
    // Si falla, limpiar localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    return null;
  }
}

export function getStoredAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('adminUser');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AdminUser;
  } catch {
    return null;
  }
}
