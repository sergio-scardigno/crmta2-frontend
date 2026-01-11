"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchModels3D, deleteModel3D } from "@/app/lib/resources";
import type { Model3D } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Alert } from "@/app/components/ui/Alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/Table";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import { useTenant } from "@/app/contexts/TenantContext";

export default function ModelsPage() {
  const { currentTenant } = useTenant();
  const [models, setModels] = useState<Model3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchModels3D();
      setModels(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el modelo "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      clearError();
      await deleteModel3D(id);
      setModels(models.filter(m => m.id !== id));
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
            <p className="text-neutral-400">Cargando modelos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modelos 3D</h1>
          <p className="text-neutral-400">Gestiona los modelos 3D y sus dimensiones</p>
          {currentTenant && (
            <p className="text-sm text-emerald-400">
              Empresa: <span className="font-medium">{currentTenant}</span>
            </p>
          )}
        </div>
        <Link href="/admin/models/new">
          <Button>Agregar Modelo</Button>
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

      {models.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay modelos 3D</h3>
          <p className="text-neutral-500 mb-4">Comienza agregando tu primer modelo 3D.</p>
          <Link href="/admin/models/new">
            <Button>Agregar Primer Modelo</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dimensiones (X × Y × Z)</TableHead>
                <TableHead>Horas Estimadas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.nombre}</TableCell>
                  <TableCell>{model.dimension_x} × {model.dimension_y} × {model.dimension_z}</TableCell>
                  <TableCell>{model.horas_estimadas} h</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/models/${model.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === model.id}
                        onClick={() => handleDelete(model.id, model.nombre)}
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
