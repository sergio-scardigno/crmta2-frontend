"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMachines, deleteMachine } from "@/app/lib/resources";
import type { Machine } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Alert } from "@/app/components/ui/Alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/Table";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import { formatCurrency } from "@/app/lib/utils";
import { useTenant } from "@/app/contexts/TenantContext";

export default function MachinesPage() {
  const { currentTenant } = useTenant();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchMachines();
      setMachines(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la máquina "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      clearError();
      await deleteMachine(id);
      setMachines(machines.filter(m => m.id !== id));
    } catch (err) {
      handleError(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando máquinas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Máquinas</h1>
          <p className="text-neutral-400">Gestiona las impresoras 3D y sus configuraciones</p>
          {currentTenant && (
            <p className="text-sm text-emerald-400">
              Empresa: <span className="font-medium">{currentTenant}</span>
            </p>
          )}
        </div>
        <Link href="/admin/machines/new">
          <Button>Agregar Máquina</Button>
        </Link>
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

      {machines.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay máquinas</h3>
          <p className="text-neutral-500 mb-4">Comienza agregando tu primera máquina de impresión 3D.</p>
          <Link href="/admin/machines/new">
            <Button>Agregar Primera Máquina</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Costo (USD)</TableHead>
                <TableHead>Vida Útil (años)</TableHead>
                <TableHead>Mantenimiento (USD/año)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">{machine.nombre}</TableCell>
                  <TableCell>{formatCurrency(machine.costo)}</TableCell>
                  <TableCell>{machine.vida_util_anios}</TableCell>
                  <TableCell>{formatCurrency(machine.costo_mantenimiento)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/machines/${machine.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === machine.id}
                        onClick={() => handleDelete(machine.id, machine.nombre)}
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
    </div>
  );
}
