"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPrints, deletePrint } from '@/app/lib/resources';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import { formatCurrency } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/Table';
import { Alert } from '@/app/components/ui/Alert';
import type { Print } from '@/app/lib/types/resources';

export default function PrintsPage() {
  const [prints, setPrints] = useState<Print[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    loadPrints();
  }, []);

  const loadPrints = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchPrints();
      setPrints(data);
    } catch (err) {
      handleError(err, 'Error cargando impresiones');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la impresión "${nombre}"?`)) {
      try {
        await deletePrint(id);
        setPrints(prints.filter(p => p.id !== id));
      } catch (err) {
        handleError(err, 'Error eliminando impresión');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-neutral-400">Cargando impresiones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Impresiones</h1>
          <p className="text-neutral-400 mt-1">
            Gestiona el historial de impresiones calculadas
          </p>
        </div>
        <Link href="/prints/new">
          <Button>
            Nueva Impresión
          </Button>
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

      {prints.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <svg className="mx-auto h-12 w-12 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No hay impresiones</h3>
          <p className="text-neutral-400 mb-4">
            Comienza creando tu primera impresión calculada
          </p>
          <Link href="/prints/new">
            <Button>
              Crear Primera Impresión
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Nombre",
                  "Máquina",
                  "Trabajador",
                  "Material",
                  "Horas",
                  "Unidades",
                  "Costo Total USD",
                  "Costo Unitario USD",
                  "Precio Sugerido USD",
                  "Precio venta ARS",
                  "Ganancia ARS",
                  "Fecha",
                  "Acciones",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {prints.map((print) => (
                <TableRow key={print.id}>
                  <TableCell className="font-medium text-white">{print.nombre}</TableCell>
                  <TableCell className="text-sm text-neutral-300">
                    {print.machine?.nombre || `ID: ${print.machine_id}`}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-300">
                    {print.worker?.nombre || (print.worker_id ? `ID: ${print.worker_id}` : "—")}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-300">
                    {print.material?.nombre || `ID: ${print.material_id}`}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-300">{print.horas_impresion}h</TableCell>
                  <TableCell className="text-sm text-neutral-300">{print.cantidad_unidades}</TableCell>
                  <TableCell className="text-sm text-emerald-400 font-medium">
                    ${print.costo_total_usd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-emerald-400 font-medium">
                    ${print.costo_unitario_usd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-blue-400 font-medium">
                    ${print.costo_sugerido_unitario_usd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-300">
                    {print.precio_venta_ars != null && print.precio_venta_ars > 0
                      ? `$${Number(print.precio_venta_ars).toFixed(0)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {print.ganancia_ars != null
                      ? (
                          <span className={Number(print.ganancia_ars) >= 0 ? "text-emerald-400" : "text-red-400"}>
                            ${Number(print.ganancia_ars).toFixed(0)}
                          </span>
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {new Date(print.created_at).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Link href={`/prints/${print.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/prints/${print.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(print.id, print.nombre)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Estadísticas rápidas */}
      {prints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-4">
            <div className="text-sm text-neutral-400">Total Impresiones</div>
            <div className="text-2xl font-bold text-white">{prints.length}</div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-4">
            <div className="text-sm text-neutral-400">Costo Total Promedio</div>
            <div className="text-2xl font-bold text-emerald-400">
              ${(prints.reduce((sum, p) => sum + p.costo_total_usd, 0) / prints.length).toFixed(2)}
            </div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-4">
            <div className="text-sm text-neutral-400">Horas Totales</div>
            <div className="text-2xl font-bold text-blue-400">
              {prints.reduce((sum, p) => sum + p.horas_impresion, 0).toFixed(1)}h
            </div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-4">
            <div className="text-sm text-neutral-400">Unidades Totales</div>
            <div className="text-2xl font-bold text-purple-400">
              {prints.reduce((sum, p) => sum + p.cantidad_unidades, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
