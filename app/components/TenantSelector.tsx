"use client";

import { useState, useEffect } from 'react';
import { useTenant } from '@/app/contexts/TenantContext';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Alert } from '@/app/components/ui/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/Table';

interface TenantSelectorProps {
  onTenantSelect: (tenantName: string) => void;
}

export default function TenantSelector({ onTenantSelect }: TenantSelectorProps) {
  const { tenants, loading, error, loadTenants, createNewTenant, clearError } = useTenant();
  const [newTenantName, setNewTenantName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) return;

    try {
      setCreating(true);
      clearError();
      const newTenant = await createNewTenant(newTenantName.trim());
      setNewTenantName('');
      onTenantSelect(newTenant.name);
    } catch (err) {
      // Error ya manejado en el contexto
    } finally {
      setCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTenant();
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">🏢 CRMTA2 Multi-Tenant</h1>
        <p className="text-lg text-neutral-400">
          Selecciona una empresa o crea una nueva para comenzar
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <p className="font-medium">{error}</p>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Lista de empresas existentes */}
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4">Empresas Existentes</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
              <span className="ml-3 text-neutral-400">Cargando empresas...</span>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-400 mb-4">No hay empresas registradas</p>
              <p className="text-sm text-neutral-500">
                Crea la primera empresa usando el formulario de la derecha
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    tenant.database_exists
                      ? 'border-neutral-600 hover:border-emerald-500 cursor-pointer'
                      : 'border-red-600 bg-red-950/20 cursor-not-allowed'
                  }`}
                  onClick={() => tenant.database_exists && onTenantSelect(tenant.name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{tenant.name}</h3>
                      <p className="text-sm text-neutral-400">
                        Base de datos: {tenant.database_exists ? 'Disponible' : 'No disponible'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Creado: {new Date(tenant.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="text-right">
                      {tenant.database_exists ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTenantSelect(tenant.name);
                          }}
                        >
                          Seleccionar
                        </Button>
                      ) : (
                        <span className="text-red-400 text-sm">Sin base de datos</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario para crear nueva empresa */}
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4">Crear Nueva Empresa</h2>
          <p className="text-sm text-neutral-400 mb-6">
            Crea una nueva empresa con su propia base de datos aislada
          </p>

          <div className="space-y-4">
            <Input
              label="Nombre de la empresa"
              placeholder="Ej: Mi Empresa S.A."
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              onKeyPress={handleKeyPress}
              helperText="Este nombre identificará tu empresa en el sistema"
            />

            <div className="rounded-lg border border-blue-700 bg-blue-950/40 p-4">
              <h3 className="font-semibold text-blue-100 mb-2">ℹ️ Información</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Se creará una base de datos independiente</li>
                <li>• Tus datos estarán completamente aislados</li>
                <li>• Podrás gestionar máquinas, trabajadores y configuraciones</li>
                <li>• El nombre debe ser único en el sistema</li>
              </ul>
            </div>

            <Button
              onClick={handleCreateTenant}
              loading={creating}
              disabled={!newTenantName.trim()}
              className="w-full"
            >
              {creating ? 'Creando Empresa...' : 'Crear Empresa'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">
          Sistema multi-tenant para gestión de costos de impresiones 3D
        </p>
      </div>
    </div>
  );
}
