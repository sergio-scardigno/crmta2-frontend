"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPrint, deletePrint } from '@/app/lib/resources';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import { formatCurrency } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/Button';
import { Alert } from '@/app/components/ui/Alert';
import type { Print } from '@/app/lib/types/resources';

export default function PrintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const printId = parseInt(params.id as string);
  
  const [print, setPrint] = useState<Print | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    if (printId) {
      loadPrint();
    }
  }, [printId]);

  const loadPrint = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchPrint(printId);
      setPrint(data);
    } catch (err) {
      handleError(err, 'Error cargando impresión');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!print) return;
    
    try {
      await deletePrint(print.id);
      router.push('/prints');
    } catch (err) {
      handleError(err, 'Error eliminando impresión');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-neutral-400">Cargando impresión...</div>
      </div>
    );
  }

  if (!print) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-4">Impresión no encontrada</h2>
        <Link href="/prints">
          <Button>Volver a Impresiones</Button>
        </Link>
      </div>
    );
  }

  const referenciaLabel =
    print.referencia_tipo === "minorista"
      ? "Precio Minorista (x4)"
      : print.referencia_tipo === "mayorista"
        ? "Precio Mayorista (x3)"
        : print.referencia_tipo === "llaveros"
          ? "Precio Llaveros (x5)"
          : null;
  const referenciaUsd = print.valor_dolar
    ? (print.precio_final_referencia_ars / print.valor_dolar)
    : print.precio_final_referencia_usd;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{print.nombre}</h1>
          <p className="text-neutral-400 mt-1">
            Creada el {new Date(print.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href={`/prints/${print.id}/edit`}>
            <Button variant="ghost">
              Editar
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-400 hover:text-red-300"
          >
            Eliminar
          </Button>
        </div>
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

      {/* Información básica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Información General</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-neutral-400">Nombre</label>
              <p className="text-white">{print.nombre}</p>
            </div>
            {print.descripcion && (
              <div>
                <label className="text-sm text-neutral-400">Descripción</label>
                <p className="text-white">{print.descripcion}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-neutral-400">Horas de Impresión</label>
              <p className="text-white">{print.horas_impresion} horas</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Cantidad de Unidades</label>
              <p className="text-white">{print.cantidad_unidades}</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Porcentaje de Desperdicio</label>
              <p className="text-white">{print.porcentaje_desperdicio}%</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Margen de Beneficio</label>
              <p className="text-white">{(print.margen_beneficio * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recursos Utilizados</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-neutral-400">Máquina</label>
              <p className="text-white">{print.machine?.nombre || `ID: ${print.machine_id}`}</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Trabajador</label>
              <p className="text-white">{print.worker?.nombre || `ID: ${print.worker_id}`}</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Material</label>
              <p className="text-white">{print.material?.nombre || `ID: ${print.material_id}`}</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Cantidad de Material</label>
              <p className="text-white">{print.cantidad_material_gramos} gramos</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Valor del Dólar</label>
              <p className="text-white">${print.valor_dolar.toFixed(2)} ARS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de costos */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Desglose de Costos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="text-sm text-neutral-400">Costo de Máquinas</div>
            <div className="text-xl font-bold text-emerald-400">
              ${print.costo_maquinas_usd.toFixed(2)} USD
            </div>
            <div className="text-sm text-neutral-500">
              ${(print.costo_maquinas_usd * print.valor_dolar).toFixed(2)} ARS
            </div>
          </div>
          
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="text-sm text-neutral-400">Costo de Trabajadores</div>
            <div className="text-xl font-bold text-blue-400">
              ${print.costo_trabajadores_usd.toFixed(2)} USD
            </div>
            <div className="text-sm text-neutral-500">
              ${(print.costo_trabajadores_usd * print.valor_dolar).toFixed(2)} ARS
            </div>
          </div>
          
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="text-sm text-neutral-400">Costo de Materiales</div>
            <div className="text-xl font-bold text-purple-400">
              ${print.costo_materiales_usd.toFixed(2)} USD
            </div>
            <div className="text-sm text-neutral-500">
              ${(print.costo_materiales_usd * print.valor_dolar).toFixed(2)} ARS
            </div>
          </div>
          
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="text-sm text-neutral-400">Costo de Desperdicio</div>
            <div className="text-xl font-bold text-orange-400">
              ${print.costo_desperdicio_usd.toFixed(2)} USD
            </div>
            <div className="text-sm text-neutral-500">
              ${(print.costo_desperdicio_usd * print.valor_dolar).toFixed(2)} ARS
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Costos Totales</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Costo Total USD:</span>
                  <span className="text-emerald-400 font-semibold">
                    ${print.costo_total_usd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Costo Unitario USD:</span>
                  <span className="text-emerald-400 font-semibold">
                    ${print.costo_unitario_usd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Costo Total ARS:</span>
                  <span className="text-emerald-400 font-semibold">
                    ${(print.costo_total_usd * print.valor_dolar).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Precios Sugeridos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Precio Sugerido USD:</span>
                  <span className="text-blue-400 font-semibold">
                    ${print.costo_sugerido_total_usd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Precio Unitario USD:</span>
                  <span className="text-blue-400 font-semibold">
                    ${print.costo_sugerido_unitario_usd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Precio Total ARS:</span>
                  <span className="text-blue-400 font-semibold">
                    ${print.costo_sugerido_total_local.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Precio Calculado ARS:</span>
                  <span className="text-blue-300 font-semibold">
                    ${print.precio_calculado_ars.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Precio Final ARS:</span>
                  <span className="text-emerald-300 font-semibold">
                    ${print.precio_final_ars.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Precio Final USD:</span>
                  <span className="text-emerald-300 font-semibold">
                    ${(print.valor_dolar ? (print.precio_final_ars / print.valor_dolar) : 0).toFixed(2)}
                  </span>
                </div>
                {referenciaLabel && (
                  <>
                    <div className="mt-3 pt-3 border-t border-neutral-700 flex justify-between">
                      <span className="text-neutral-400">{referenciaLabel}:</span>
                      <span className="text-emerald-300 font-semibold">
                        ${print.precio_final_referencia_ars.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Precio Referencia USD:</span>
                      <span className="text-emerald-300 font-semibold">
                        ${(referenciaUsd ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adicionales */}
      {print.extras && print.extras.length > 0 && (
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Adicionales</h3>
          <div className="space-y-3">
            {print.extras.map((extra) => (
              <div
                key={extra.id}
                className="flex flex-col gap-1 rounded-md border border-neutral-700 bg-neutral-800/30 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white font-medium">{extra.concepto}</div>
                  <div className="text-neutral-300 text-sm">
                    {extra.por_unidad ? "Por unidad" : "Por trabajo"}
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  Ingresado: {extra.moneda} {extra.monto.toFixed(2)} · Total: ARS{" "}
                  {extra.monto_total_ars.toFixed(2)} (USD {extra.monto_total_usd.toFixed(2)})
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <div className="flex justify-between">
              <span className="text-neutral-400">Total adicionales ARS:</span>
              <span className="text-white font-semibold">
                ${print.extras.reduce((sum, e) => sum + (e.monto_total_ars || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Total adicionales USD:</span>
              <span className="text-white font-semibold">
                ${print.extras.reduce((sum, e) => sum + (e.monto_total_usd || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-neutral-300 mb-6">
              ¿Estás seguro de que quieres eliminar la impresión <strong>"{print.nombre}"</strong>?
              <br /><br />
              <span className="text-red-400">
                ⚠️ Esta acción no se puede deshacer.
              </span>
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Sí, Eliminar
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-neutral-600 hover:bg-neutral-700"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Link href="/prints">
          <Button variant="ghost">
            ← Volver a Impresiones
          </Button>
        </Link>
        <Link href={`/prints/${print.id}/edit`}>
          <Button>
            Editar Impresión
          </Button>
        </Link>
      </div>
    </div>
  );
}
