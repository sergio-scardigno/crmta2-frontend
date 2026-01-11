"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchTenants, createTenant, loginTenant, regenerateTenantKey } from '@/app/lib/resources';
import type { Tenant, TenantLogin, TenantLoginResponse } from '@/app/lib/types/resources';

interface TenantContextType {
  currentTenant: string | null;
  currentTenantKey: string | null;
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  setCurrentTenant: (tenantName: string | null, tenantKey?: string | null) => void;
  loadTenants: () => Promise<void>;
  createNewTenant: (name: string) => Promise<Tenant>;
  loginTenant: (loginData: TenantLogin) => Promise<TenantLoginResponse>;
  regenerateKey: (tenantId: number) => Promise<Tenant>;
  copyKeyToClipboard: (accessKey: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [currentTenant, setCurrentTenantState] = useState<string | null>(null);
  const [currentTenantKey, setCurrentTenantKeyState] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar tenant y clave del localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTenant = localStorage.getItem('currentTenant');
      const savedKey = localStorage.getItem('currentTenantKey');
      if (savedTenant && savedKey) {
        setCurrentTenantState(savedTenant);
        setCurrentTenantKeyState(savedKey);
      }
    }
  }, []);

  // Cargar lista de tenants
  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading tenants...');
      const data = await fetchTenants();
      console.log('Tenants loaded:', data);
      setTenants(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando empresas';
      setError(errorMessage);
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nuevo tenant
  const createNewTenant = async (name: string): Promise<Tenant> => {
    try {
      setError(null);
      const newTenant = await createTenant({ name, is_active: true });
      setTenants(prev => [...prev, newTenant]);
      return newTenant;
    } catch (err) {
      const errorMessage = 'Error creando empresa';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Login con tenant
  const loginTenantUser = async (loginData: TenantLogin): Promise<TenantLoginResponse> => {
    try {
      setError(null);
      const response = await loginTenant(loginData);
      return response;
    } catch (err) {
      const errorMessage = 'Credenciales incorrectas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Regenerar clave de acceso
  const regenerateKey = async (tenantId: number): Promise<Tenant> => {
    try {
      setError(null);
      const updatedTenant = await regenerateTenantKey(tenantId);
      setTenants(prev => prev.map(t => t.id === tenantId ? updatedTenant : t));
      return updatedTenant;
    } catch (err) {
      const errorMessage = 'Error regenerando clave';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Copiar clave al portapapeles
  const copyKeyToClipboard = async (accessKey: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(accessKey);
      return true;
    } catch (err) {
      console.error('Error copiando clave:', err);
      setError('Error al copiar la clave al portapapeles');
      return false;
    }
  };

  // Establecer tenant actual con clave
  const setCurrentTenant = (tenantName: string | null, tenantKey?: string | null) => {
    setCurrentTenantState(tenantName);
    setCurrentTenantKeyState(tenantKey || null);
    if (typeof window !== 'undefined') {
      if (tenantName && tenantKey) {
        localStorage.setItem('currentTenant', tenantName);
        localStorage.setItem('currentTenantKey', tenantKey);
      } else {
        localStorage.removeItem('currentTenant');
        localStorage.removeItem('currentTenantKey');
      }
    }
  };

  // Cerrar sesión
  const logout = () => {
    setCurrentTenant(null, null);
  };

  // Limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: TenantContextType = {
    currentTenant,
    currentTenantKey,
    tenants,
    loading,
    error,
    setCurrentTenant,
    loadTenants,
    createNewTenant,
    loginTenant: loginTenantUser,
    regenerateKey,
    copyKeyToClipboard,
    logout,
    clearError,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
