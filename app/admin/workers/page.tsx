"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWorkers, deleteWorker } from "@/app/lib/resources";
import type { Worker } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Alert } from "@/app/components/ui/Alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/Table";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import { formatCurrency } from "@/app/lib/utils";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchWorkers();
      setWorkers(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al trabajador "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      clearError();
      await deleteWorker(id);
      setWorkers(workers.filter(w => w.id !== id));
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
            <p className="text-neutral-400">Cargando trabajadores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trabajadores</h1>
          <p className="text-neutral-400">Gestiona el personal y sus configuraciones de costos</p>
        </div>
        <Link href="/admin/workers/new">
          <Button>Agregar Trabajador</Button>
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

      {workers.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay trabajadores</h3>
          <p className="text-neutral-500 mb-4">Comienza agregando el primer trabajador al sistema.</p>
          <Link href="/admin/workers/new">
            <Button>Agregar Primer Trabajador</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Costo por Hora (USD)</TableHead>
                <TableHead>Factor de Trabajo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.nombre}</TableCell>
                  <TableCell>{formatCurrency(worker.costo_por_hora)}</TableCell>
                  <TableCell>{(worker.factor_trabajo * 100).toFixed(0)}%</TableCell>
                  <TableCell>{worker.rol || "Sin rol"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/workers/${worker.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === worker.id}
                        onClick={() => handleDelete(worker.id, worker.nombre)}
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
