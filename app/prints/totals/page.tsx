'use client';

import React, { useState, useEffect } from 'react';
import { fetchPrintsSummary } from '@/app/lib/resources';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import { formatCurrency } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/Button';
import { Alert } from '@/app/components/ui/Alert';
import { Input } from '@/app/components/ui/Input';
import type { PrintSummary } from '@/app/lib/types/resources';

export default function PrintsTotalsPage() {
    const [summary, setSummary] = useState<PrintSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [includeLabor, setIncludeLabor] = useState<boolean>(true);
    const { error, handleError, clearError } = useErrorHandler();

    useEffect(() => {
        loadSummary();
    }, [includeLabor]);

    const loadSummary = async () => {
        try {
            setLoading(true);
            clearError();

            const params: {
                start_date?: string;
                end_date?: string;
                include_labor?: boolean;
            } = {
                include_labor: includeLabor,
            };

            if (startDate) {
                params.start_date = startDate;
            }
            if (endDate) {
                params.end_date = endDate;
            }

            const data = await fetchPrintsSummary(params);
            setSummary(data);
        } catch (err) {
            handleError(err, 'Error cargando totales');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        loadSummary();
    };

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setIncludeLabor(true);
        // Cargar sin filtros
        setTimeout(() => {
            loadSummary();
        }, 100);
    };

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-neutral-400">Cargando totales...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        📊 Totales de Impresiones
                    </h1>
                    <p className="text-neutral-400 mt-1">
                        Resumen completo de ventas, costos, ganancias y gastos
                    </p>
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

            {/* Filtros */}
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Filtros
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Fecha desde
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Fecha hasta
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeLabor}
                                onChange={(e) =>
                                    setIncludeLabor(e.target.checked)
                                }
                                className="rounded border-neutral-600 bg-neutral-800 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-neutral-300">
                                Incluir mano de obra en empleados
                            </span>
                        </label>
                    </div>
                    <div className="flex items-end space-x-2">
                        <Button onClick={handleApplyFilters} size="sm">
                            Aplicar
                        </Button>
                        <Button
                            onClick={handleResetFilters}
                            variant="ghost"
                            size="sm"
                        >
                            Limpiar
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-neutral-400 mt-3">
                    💡 Los totales se calculan a partir de las impresiones
                    guardadas. Si no seleccionas fechas, se incluyen todas las
                    impresiones.
                </p>
            </div>

            {summary && (
                <>
                    {/* KPIs principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Ventas */}
                        <div className="bg-emerald-950/30 rounded-lg border border-emerald-700/50 p-6">
                            <div className="text-sm text-emerald-300 mb-1">
                                Ventas Totales
                            </div>
                            <div className="text-2xl font-bold text-emerald-400 mb-1">
                                $
                                {summary.ventas_ars_total.toLocaleString(
                                    'es-AR',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{' '}
                                ARS
                            </div>
                            <div className="text-sm text-emerald-300/70">
                                $
                                {summary.ventas_usd_total.toLocaleString(
                                    'en-US',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{' '}
                                USD
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">
                                Suma de precio de venta (o precio final) de
                                todas las impresiones
                            </p>
                        </div>

                        {/* Costos */}
                        <div className="bg-red-950/30 rounded-lg border border-red-700/50 p-6">
                            <div className="text-sm text-red-300 mb-1">
                                Costos Totales
                            </div>
                            <div className="text-2xl font-bold text-red-400 mb-1">
                                $
                                {summary.costos_ars_total.toLocaleString(
                                    'es-AR',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{' '}
                                ARS
                            </div>
                            <div className="text-sm text-red-300/70">
                                $
                                {summary.costos_usd_total.toLocaleString(
                                    'en-US',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{' '}
                                USD
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">
                                Suma de costo_total_usd convertido a ARS
                            </p>
                        </div>

                        {/* Ganancia */}
                        <div
                            className={`rounded-lg border p-6 ${
                                summary.ganancia_ars_total >= 0
                                    ? 'bg-blue-950/30 border-blue-700/50'
                                    : 'bg-orange-950/30 border-orange-700/50'
                            }`}
                        >
                            <div
                                className={`text-sm mb-1 ${
                                    summary.ganancia_ars_total >= 0
                                        ? 'text-blue-300'
                                        : 'text-orange-300'
                                }`}
                            >
                                Ganancia Total
                            </div>
                            <div
                                className={`text-2xl font-bold mb-1 ${
                                    summary.ganancia_ars_total >= 0
                                        ? 'text-blue-400'
                                        : 'text-orange-400'
                                }`}
                            >
                                $
                                {summary.ganancia_ars_total.toLocaleString(
                                    'es-AR',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{' '}
                                ARS
                            </div>
                            <div
                                className={`text-sm ${
                                    summary.ganancia_ars_total >= 0
                                        ? 'text-blue-300/70'
                                        : 'text-orange-300/70'
                                }`}
                            >
                                $
                                {summary.ganancia_usd_total.toLocaleString(
                                    'en-US',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{' '}
                                USD
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">
                                Ventas - Costos
                            </p>
                        </div>

                        {/* Impresiones */}
                        <div className="bg-purple-950/30 rounded-lg border border-purple-700/50 p-6">
                            <div className="text-sm text-purple-300 mb-1">
                                Total Impresiones
                            </div>
                            <div className="text-2xl font-bold text-purple-400 mb-1">
                                {summary.prints_count}
                            </div>
                            <div className="text-sm text-purple-300/70">
                                {summary.units_total} unidades ·{' '}
                                {summary.hours_total.toFixed(1)} horas
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">
                                Cantidad de impresiones guardadas
                            </p>
                        </div>
                    </div>

                    {/* Desglose detallado */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Empleados */}
                        <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                👥 Empleados
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-300">
                                        Total USD:
                                    </span>
                                    <span className="text-blue-400 font-semibold">
                                        $
                                        {summary.empleados_usd_total.toLocaleString(
                                            'en-US',
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-300">
                                        Total ARS:
                                    </span>
                                    <span className="text-blue-400 font-semibold">
                                        $
                                        {summary.empleados_ars_total.toLocaleString(
                                            'es-AR',
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-2 pt-2 border-t border-neutral-700">
                                    {includeLabor
                                        ? 'Incluye: costo_trabajadores_usd + costo_labor_usd'
                                        : 'Incluye: costo_trabajadores_usd (sin mano de obra)'}
                                </p>
                            </div>
                        </div>

                        {/* Gastos */}
                        <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                💸 Gastos
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-300">
                                        Total USD:
                                    </span>
                                    <span className="text-orange-400 font-semibold">
                                        $
                                        {summary.gastos_usd_total.toLocaleString(
                                            'en-US',
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-300">
                                        Total ARS:
                                    </span>
                                    <span className="text-orange-400 font-semibold">
                                        $
                                        {summary.gastos_ars_total.toLocaleString(
                                            'es-AR',
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-2 pt-2 border-t border-neutral-700">
                                    Incluye: costo_maquinas_usd +
                                    costo_materiales_usd + costo_desperdicio_usd
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Adicionales y cargos */}
                    <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            ➕ Adicionales y Cargos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-neutral-400 mb-2">
                                    Adicionales (extras)
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-300">
                                            ARS:
                                        </span>
                                        <span className="text-purple-400 font-semibold">
                                            $
                                            {summary.adicionales_ars_total.toLocaleString(
                                                'es-AR',
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-300">
                                            USD:
                                        </span>
                                        <span className="text-purple-400 font-semibold">
                                            $
                                            {summary.adicionales_usd_total.toLocaleString(
                                                'en-US',
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-400 mt-2">
                                    Suma de todos los extras (PrintExtra) de las
                                    impresiones
                                </p>
                            </div>
                            <div>
                                <div className="text-sm text-neutral-400 mb-2">
                                    Cargo Fijo
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-300">
                                            Total ARS:
                                        </span>
                                        <span className="text-yellow-400 font-semibold">
                                            $
                                            {summary.cargo_fijo_ars_total.toLocaleString(
                                                'es-AR',
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-400 mt-2">
                                    Suma de minimo_trabajo_ars de todas las
                                    impresiones
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Resumen final */}
                    <div className="bg-gradient-to-r from-emerald-950/50 to-blue-950/50 rounded-lg border border-emerald-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            📈 Resumen Ejecutivo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm text-neutral-400">
                                    Margen de Ganancia
                                </div>
                                <div className="text-xl font-bold text-emerald-400">
                                    {summary.ventas_ars_total > 0
                                        ? (
                                              (summary.ganancia_ars_total /
                                                  summary.ventas_ars_total) *
                                              100
                                          ).toFixed(1)
                                        : '0.0'}
                                    %
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-neutral-400">
                                    Ganancia por Impresión
                                </div>
                                <div className="text-xl font-bold text-blue-400">
                                    $
                                    {summary.prints_count > 0
                                        ? (
                                              summary.ganancia_ars_total /
                                              summary.prints_count
                                          ).toLocaleString('es-AR', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                          })
                                        : '0.00'}{' '}
                                    ARS
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-neutral-400">
                                    Venta Promedio
                                </div>
                                <div className="text-xl font-bold text-purple-400">
                                    $
                                    {summary.prints_count > 0
                                        ? (
                                              summary.ventas_ars_total /
                                              summary.prints_count
                                          ).toLocaleString('es-AR', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                          })
                                        : '0.00'}{' '}
                                    ARS
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!summary && !loading && (
                <div className="text-center py-12">
                    <div className="text-neutral-400 mb-4">
                        <svg
                            className="mx-auto h-12 w-12 text-neutral-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                        No hay datos
                    </h3>
                    <p className="text-neutral-400">
                        No se encontraron impresiones para el rango seleccionado
                    </p>
                </div>
            )}
        </div>
    );
}
