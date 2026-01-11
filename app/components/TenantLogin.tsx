"use client";

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/contexts/TenantContext';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Alert } from '@/app/components/ui/Alert';

interface TenantLoginProps {
  onLogin: () => void;
}

export default function TenantLogin({ onLogin }: TenantLoginProps) {
  const { tenants, loading, error, createNewTenant, loginTenant, setCurrentTenant, loadTenants, clearError, copyKeyToClipboard } = useTenant();
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [loginData, setLoginData] = useState({ name: '', accessKey: '' });
  const [newTenantName, setNewTenantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newTenantKey, setNewTenantKey] = useState<string | null>(null);
  const [newTenantNameForModal, setNewTenantNameForModal] = useState<string>('');
  const [keyCopied, setKeyCopied] = useState(false);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    clearError();
  }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.name.trim() || !loginData.accessKey.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await loginTenant({
        name: loginData.name,
        access_key: loginData.accessKey
      });
      
      // Establecer tenant y clave en el contexto
      setCurrentTenant(response.name, loginData.accessKey);
      onLogin();
    } catch (err) {
      // Error ya manejado en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const newTenant = await createNewTenant(newTenantName);
      // Mostrar modal con la clave antes de hacer login
      setNewTenantKey(newTenant.access_key);
      setNewTenantNameForModal(newTenant.name);
      setShowKeyModal(true);
      setNewTenantName('');
    } catch (err) {
      // Error ya manejado en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAfterKey = () => {
    if (newTenantKey && newTenantNameForModal) {
      setCurrentTenant(newTenantNameForModal, newTenantKey);
      setShowKeyModal(false);
      setNewTenantKey(null);
      setNewTenantNameForModal('');
      onLogin();
    }
  };

  const handleCopyKey = async () => {
    if (newTenantKey) {
      const success = await copyKeyToClipboard(newTenantKey);
      if (success) {
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Acceso al Sistema
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-400">
            Sistema de gestión de costos de impresiones 3D
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Selector de modo */}
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-600 hover:bg-neutral-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-t border-r border-b ${
                mode === 'create'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-600 hover:bg-neutral-700'
              }`}
            >
              Crear Empresa
            </button>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <Alert variant="error">
              <p>{error}</p>
            </Alert>
          )}
          
          {/* Mostrar estado de carga */}
          {loading && (
            <div className="text-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm text-neutral-400">Cargando empresas...</p>
            </div>
          )}

          {/* Formulario de login */}
          {mode === 'login' ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="tenant-name" className="block text-sm font-medium text-neutral-300">
                  Empresa
                </label>
                <select
                  id="tenant-name"
                  value={loginData.name}
                  onChange={(e) => setLoginData({...loginData, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-neutral-600 rounded-md shadow-sm bg-neutral-800 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={loading}
                >
                  <option value="">{loading ? 'Cargando empresas...' : 'Seleccionar empresa'}</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.name}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                {!loading && tenants.length === 0 && (
                  <p className="mt-1 text-xs text-neutral-500">
                    No hay empresas registradas. Crea una nueva empresa usando la pestaña "Crear Empresa".
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="access-key" className="block text-sm font-medium text-neutral-300">
                  Clave de Acceso
                </label>
                <Input
                  id="access-key"
                  type="password"
                  value={loginData.accessKey}
                  onChange={(e) => setLoginData({...loginData, accessKey: e.target.value})}
                  placeholder="Ingresa tu clave de acceso"
                  required
                />
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !loginData.name || !loginData.accessKey}
                  className="w-full"
                >
                  {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleCreateTenant}>
              <div>
                <label htmlFor="new-tenant-name" className="block text-sm font-medium text-neutral-300">
                  Nombre de la Empresa
                </label>
                <Input
                  id="new-tenant-name"
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>

              <div className="bg-neutral-800 p-4 rounded-md">
                <p className="text-sm text-neutral-300">
                  <strong>Nota:</strong> Se generará automáticamente una clave de acceso única de 8 caracteres para tu empresa. 
                  Guarda esta clave en un lugar seguro, ya que la necesitarás para acceder al sistema.
                </p>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !newTenantName.trim()}
                  className="w-full"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Empresa'}
                </Button>
              </div>
            </form>
          )}

          {/* Información adicional */}
          <div className="text-center">
            <p className="text-xs text-neutral-500">
              ¿Necesitas ayuda? Contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para mostrar clave después de crear empresa */}
      {showKeyModal && newTenantKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              ✅ Empresa Creada Exitosamente
            </h3>
            <div className="mb-6">
              <p className="text-sm text-neutral-300 mb-4">
                Tu empresa <strong>{newTenantNameForModal}</strong> ha sido creada. 
                <br /><br />
                <span className="text-yellow-400 font-semibold">
                  ⚠️ IMPORTANTE: Guarda esta clave de acceso en un lugar seguro. 
                  La necesitarás para iniciar sesión.
                </span>
              </p>
              <div className="bg-neutral-900 rounded-md p-4 border-2 border-emerald-500">
                <p className="text-xs text-neutral-400 mb-2">Clave de Acceso:</p>
                <code className="text-xl font-mono text-emerald-400 select-all block text-center">
                  {newTenantKey}
                </code>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleCopyKey}
                variant="secondary"
                className="flex-1"
              >
                {keyCopied ? '✓ Copiada' : '📋 Copiar Clave'}
              </Button>
              <Button
                onClick={handleContinueAfterKey}
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

