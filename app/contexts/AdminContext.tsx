"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { adminLogin, adminLogout, getCurrentAdmin, getStoredAdminUser, getStoredAdminToken } from '@/app/lib/admin';
import type { AdminUser, AdminLoginRequest } from '@/app/lib/types/admin';

interface AdminContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => void;
  loadAdmin: () => Promise<void>;
  clearError: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar admin del localStorage al inicializar
  useEffect(() => {
    const storedAdmin = getStoredAdminUser();
    const storedToken = getStoredAdminToken();
    
    if (storedAdmin && storedToken) {
      setAdmin(storedAdmin);
      // Verificar que el token sigue siendo válido
      loadAdmin();
    } else {
      setLoading(false);
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentAdmin = await getCurrentAdmin();
      if (currentAdmin) {
        setAdmin(currentAdmin);
      } else {
        setAdmin(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
    } catch (err) {
      console.error('Error loading admin:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar información del administrador');
      setAdmin(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: AdminLoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminLogin(credentials);
      setAdmin(response.admin);
    } catch (err) {
      console.error('Error logging in:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    adminLogout();
    setAdmin(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AdminContextType = {
    admin,
    isAuthenticated: !!admin,
    loading,
    error,
    login,
    logout,
    loadAdmin,
    clearError,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
