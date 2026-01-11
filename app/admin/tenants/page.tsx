"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/app/contexts/AdminContext";
import { adminListTenants, adminDeleteTenant, adminMarkTenantForDeletion, adminUnmarkTenantForDeletion, createTenantDatabase, deleteTenantDatabase, createTenant } from "@/app/lib/resources";
import type { Tenant } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Alert } from "@/app/components/ui/Alert";
import { Input } from "@/app/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/Table";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function TenantsPage() {
  const { isAuthenticated, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creatingDbId, setCreatingDbId] = useState<number | null>(null);
  const [deletingDbId, setDeletingDbId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState<number | null>(null);
  const [newTenantName, setNewTenantName] = useState("");
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  // Proteger ruta: redirigir si no es admin
  useEffect(() => {
    if (!adminLoading && !isAuthenticated) {
      router.push("/admin-login");
    }
  }, [isAuthenticated, adminLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTenants();
    }
  }, [isAuthenticated]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await adminListTenants();
      setTenants(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la empresa "${name}"? Esta acción NO eliminará la base de datos (solo el registro de la empresa).`)) {
      return;
    }

    try {
      setDeletingId(id);
      clearError();
      await adminDeleteTenant(id);
      setTenants(tenants.filter(t => t.id !== id));
    } catch (err) {
      handleError(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkForDeletion = async (id: number) => {
    try {
      setMarkingId(id);
      clearError();
      const updated = await adminMarkTenantForDeletion(id);
      setTenants(tenants.map(t => t.id === id ? updated : t));
    } catch (err) {
      handleError(err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleUnmarkForDeletion = async (id: number) => {
    try {
      setMarkingId(id);
      clearError();
      const updated = await adminUnmarkTenantForDeletion(id);
      setTenants(tenants.map(t => t.id === id ? updated : t));
    } catch (err) {
      handleError(err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleCreateDatabase = async (id: number) => {
    try {
      setCreatingDbId(id);
      clearError();
      await createTenantDatabase(id);
      // Recargar la lista para actualizar el estado de la base de datos
      await loadTenants();
    } catch (err) {
      handleError(err);
    } finally {
      setCreatingDbId(null);
    }
  };

  const handleDeleteDatabase = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la base de datos de "${name}"? Esta acción eliminará todos los datos de la empresa.`)) {
      return;
    }

    try {
      setDeletingDbId(id);
      clearError();
      await deleteTenantDatabase(id);
      // Recargar la lista para actualizar el estado de la base de datos
      await loadTenants();
    } catch (err) {
      handleError(err);
    } finally {
      setDeletingDbId(null);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) {
      handleError(new Error("El nombre de la empresa es requerido"));
      return;
    }

    try {
      setCreatingTenant(true);
      clearError();
      const newTenant = await createTenant({ name: newTenantName.trim(), is_active: true });
      setTenants([...tenants, newTenant]);
      setNewTenantName("");
      setShowCreateModal(false);
    } catch (err) {
      handleError(err);
    } finally {
      setCreatingTenant(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (adminLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Será redirigido por useEffect
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Empresas</h1>
          <p className="text-neutral-400">Administra las empresas y sus bases de datos en el sistema multi-tenant</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Crear Empresa
        </Button>
      </div>

      {error.message && (
        <Alert variant="error" className="mb-6">
          <div>
            <p className="font-medium">{error.message}</p>
            {error.details && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {error.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </Alert>
      )}

      {tenants.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay empresas</h3>
          <p className="text-neutral-500 mb-4">No se encontraron empresas en el sistema.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Base de Datos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Marcado para Eliminación</TableHead>
                <TableHead>Clave de Acceso</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow 
                  key={tenant.id}
                  className={tenant.marked_for_deletion ? "bg-red-950/20 border-red-800" : ""}
                >
                  <TableCell className="font-medium">
                    {tenant.marked_for_deletion && (
                      <span className="inline-block mr-2 text-red-400" title="Marcado para eliminación">⚠️</span>
                    )}
                    {tenant.name}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-neutral-800 px-2 py-1 rounded">
                      {tenant.database_name}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          tenant.database_exists ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-sm">
                        {tenant.database_exists ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.marked_for_deletion ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-red-400 font-semibold">Marcado</span>
                        {tenant.marked_for_deletion_at && (
                          <span className="text-xs text-neutral-500">
                            {formatDate(tenant.marked_for_deletion_at)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500">No marcado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-neutral-300">
                        {tenant.access_key ? `${tenant.access_key.substring(0, 4)}****` : 'N/A'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeyModal(tenant.id)}
                        className="text-xs px-2 py-1"
                      >
                        Ver
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {formatDate(tenant.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {formatDate(tenant.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {tenant.marked_for_deletion ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={markingId === tenant.id}
                          onClick={() => handleUnmarkForDeletion(tenant.id)}
                        >
                          Desmarcar
                        </Button>
                      ) : (
                        <Button
                          variant="warning"
                          size="sm"
                          loading={markingId === tenant.id}
                          onClick={() => handleMarkForDeletion(tenant.id)}
                        >
                          Marcar para Eliminación
                        </Button>
                      )}
                      {tenant.database_exists ? (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingDbId === tenant.id}
                          onClick={() => handleDeleteDatabase(tenant.id, tenant.name)}
                        >
                          Eliminar BD
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={creatingDbId === tenant.id}
                          onClick={() => handleCreateDatabase(tenant.id)}
                        >
                          Crear BD
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === tenant.id}
                        onClick={() => handleDelete(tenant.id, tenant.name)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-yellow-700 bg-yellow-950/40 p-4">
            <h3 className="font-semibold text-yellow-100 mb-2">⚠️ Advertencia</h3>
            <p className="text-sm text-yellow-200">
              Como administrador, al eliminar una empresa solo se eliminará el registro (NO la base de datos). 
              Las bases de datos marcadas para eliminación pueden ser limpiadas usando el script de limpieza.
            </p>
          </div>
          {tenants.some(t => t.marked_for_deletion) && (
            <div className="rounded-lg border border-red-700 bg-red-950/40 p-4">
              <h3 className="font-semibold text-red-100 mb-2">🗑️ Bases de Datos Marcadas</h3>
              <p className="text-sm text-red-200">
                Hay {tenants.filter(t => t.marked_for_deletion).length} empresa(s) marcada(s) para eliminación. 
                Ejecuta el script <code className="bg-red-900 px-1 rounded">cleanup_marked_databases.py</code> para eliminarlas.
              </p>
            </div>
          )}
      </div>

      {/* Modal para crear empresa */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">Crear Nueva Empresa</h3>
              <div className="space-y-4">
                <Input
                  label="Nombre de la Empresa"
                  placeholder="Ej: Mi Empresa 3D"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTenant();
                    }
                  }}
                  autoFocus
                />
                {error.message && (
                  <Alert variant="error">
                    <p>{error.message}</p>
                  </Alert>
                )}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleCreateTenant}
                    loading={creatingTenant}
                    className="flex-1"
                  >
                    Crear Empresa
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewTenantName("");
                      clearError();
                    }}
                    disabled={creatingTenant}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para ver clave */}
        {showKeyModal && (() => {
          const tenant = tenants.find(t => t.id === showKeyModal);
          if (!tenant) return null;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowKeyModal(null)}>
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
                    onClick={() => setShowKeyModal(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
