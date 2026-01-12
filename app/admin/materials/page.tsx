"use client";

import { useEffect, useState } from "react";
import { fetchMaterials, deleteMaterial } from "@/app/lib/resources";
import type { Material } from "@/app/lib/types/resources";
import { Alert } from "@/app/components/ui/Alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/Table";
import { Button } from "@/app/components/ui/Button";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import { formatCurrency, formatNumber } from "@/app/lib/utils";
import { useRouter } from "next/navigation";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { error, handleError, clearError } = useErrorHandler();
  const router = useRouter();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchMaterials();
      setMaterials(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este material?')) {
      return;
    }

    try {
      setDeletingId(id);
      clearError();
      await deleteMaterial(id);
      setMaterials(materials.filter(m => m.id !== id));
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
            <p className="text-neutral-400">Cargando materiales...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiales</h1>
          <p className="text-neutral-400">Gestiona el inventario de materiales para impresión 3D</p>
        </div>
        <Button onClick={() => router.push('/admin/materials/new')}>
          Nuevo Material
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

      {materials.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay materiales</h3>
          <p className="text-neutral-500">No se encontraron materiales en el sistema.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Unidad de Medida</TableHead>
                <TableHead>Cantidad Disponible</TableHead>
                <TableHead>Costo por Unidad (USD)</TableHead>
                <TableHead>Costo por Gramo (USD)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.id}</TableCell>
                  <TableCell className="font-medium">{material.nombre}</TableCell>
                  <TableCell>{material.unidad_de_medida}</TableCell>
                  <TableCell>{formatNumber(material.cantidad_de_material)} {material.unidad_de_medida}</TableCell>
                  <TableCell>{formatCurrency(material.costo_por_unidad)}</TableCell>
                  <TableCell>{formatCurrency(material.costo_por_gramo)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/materials/${material.id}/edit`)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
                        disabled={deletingId === material.id}
                      >
                        {deletingId === material.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-emerald-700 bg-emerald-950/40 p-4">
        <h3 className="font-semibold text-emerald-100 mb-2">✅ Materiales Disponibles</h3>
        <p className="text-sm text-emerald-200">
          Total de materiales: <span className="font-medium">{materials.length}</span>
        </p>
      </div>
    </div>
  );
}
