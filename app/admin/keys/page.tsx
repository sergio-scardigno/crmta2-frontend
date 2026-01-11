"use client";

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/contexts/TenantContext';
import { Button } from '@/app/components/ui/Button';
import { Alert } from '@/app/components/ui/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/Table';
import type { Tenant } from '@/app/lib/types/resources';

export default function KeysPage() {
  const { tenants, loading, error, regenerateKey, loadTenants, clearError } = useTenant();
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<number | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState<number | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  useEffect(() => {
    loadTenants();
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar el componente

  const handleRegenerateKey = async (tenantId: number) => {
    setRegeneratingId(tenantId);
    try {
      await regenerateKey(tenantId);
      setShowConfirmDialog(null);
    } catch (err) {
      // Error ya manejado en el contexto
    } finally {
      setRegeneratingId(null);
    }
  };

  const confirmRegenerate = (tenantId: number) => {
    setShowConfirmDialog(tenantId);
  };

  const cancelRegenerate = () => {
    setShowConfirmDialog(null);
  };

  const handleShowKey = (tenantId: number) => {
    setShowKeyDialog(tenantId);
  };

  const handleCopyKey = async (tenant: Tenant) => {
    try {
      await navigator.clipboard.writeText(tenant.access_key);
      setCopiedKeyId(tenant.id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (err) {
      console.error('Error copiando clave:', err);
    }
  };

  const closeKeyDialog = () => {
    setShowKeyDialog(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando empresas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Claves de Acceso</h1>
            <p className="text-neutral-400 mt-1">
              Administra las claves de acceso de todas las empresas
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            <p>{error}</p>
          </Alert>
        )}

        <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white mb-2">Empresas Registradas</h2>
            <p className="text-sm text-neutral-400">
              Aquí puedes ver, copiar y regenerar las claves de acceso de las empresas. Ten en cuenta que regenerar una clave invalidará la anterior.
            </p>
          </div>

          {tenants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-400">No hay empresas registradas</p>
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Base de Datos</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead>Clave Actual</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map(tenant => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {tenant.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.database_exists 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {tenant.database_exists ? 'Creada' : 'Pendiente'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-400">
                        {new Date(tenant.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm text-neutral-300">
                          {tenant.access_key ? `${tenant.access_key.substring(0, 4)}****` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowKey(tenant.id)}
                          >
                            Ver Clave
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => confirmRegenerate(tenant.id)}
                            disabled={regeneratingId === tenant.id}
                            loading={regeneratingId === tenant.id}
                          >
                            Regenerar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Diálogo para mostrar clave completa */}
        {showKeyDialog && (() => {
          const tenant = tenants.find(t => t.id === showKeyDialog);
          if (!tenant) return null;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeKeyDialog}>
              <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Clave de Acceso - {tenant.name}
                </h3>
                <div className="mb-6">
                  <p className="text-sm text-neutral-400 mb-2">Clave completa:</p>
                  <div className="bg-neutral-900 rounded-md p-4 border border-neutral-700">
                    <code className="text-lg font-mono text-emerald-400 select-all">
                      {tenant.access_key}
                    </code>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleCopyKey(tenant)}
                    className="flex-1"
                  >
                    {copiedKeyId === tenant.id ? '✓ Copiada' : '📋 Copiar Clave'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={closeKeyDialog}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Diálogo de confirmación para regenerar */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Confirmar Regeneración de Clave
              </h3>
              <p className="text-neutral-300 mb-6">
                ¿Estás seguro de que quieres regenerar la clave de acceso para{' '}
                <strong>{tenants.find(t => t.id === showConfirmDialog)?.name}</strong>?
                <br /><br />
                <span className="text-yellow-400">
                  ⚠️ Esto invalidará la clave anterior y la empresa necesitará usar la nueva clave para acceder.
                </span>
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="danger"
                  onClick={() => handleRegenerateKey(showConfirmDialog)}
                  disabled={regeneratingId === showConfirmDialog}
                  loading={regeneratingId === showConfirmDialog}
                >
                  Sí, Regenerar
                </Button>
                <Button
                  variant="ghost"
                  onClick={cancelRegenerate}
                  disabled={regeneratingId === showConfirmDialog}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-300 font-semibold mb-2">ℹ️ Información Importante</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Las claves de acceso tienen 8 caracteres y son únicas para cada empresa</li>
            <li>• Al regenerar una clave, la anterior se invalida inmediatamente</li>
            <li>• Las empresas necesitarán usar la nueva clave para acceder al sistema</li>
            <li>• Puedes ver y copiar la clave completa haciendo clic en "Ver Clave"</li>
          </ul>
        </div>
    </div>
  );
}

