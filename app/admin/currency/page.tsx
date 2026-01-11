"use client";

import { useEffect, useState } from "react";
import { fetchCurrencyRate } from "@/app/lib/resources";
import type { CurrencyRate } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import { formatCurrency } from "@/app/lib/utils";

export default function CurrencyPage() {
  const [currencyRate, setCurrencyRate] = useState<CurrencyRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    loadCurrencyRate();
  }, []);

  const loadCurrencyRate = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      clearError();
      const data = await fetchCurrencyRate(refresh);
      setCurrencyRate(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCurrencyRate(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando tasa de cambio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasas de Cambio</h1>
          <p className="text-neutral-400">Consulta las tasas de cambio actuales del dólar</p>
        </div>
        <Button
          onClick={handleRefresh}
          loading={refreshing}
          variant="secondary"
        >
          Actualizar Tasa
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

      {!currencyRate ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay datos de moneda</h3>
          <p className="text-neutral-500 mb-4">No se pudo obtener la tasa de cambio actual.</p>
          <Button onClick={handleRefresh}>
            Intentar de nuevo
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold">Tasa de Cambio Actual</h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-neutral-600 p-4">
                <div className="text-sm text-neutral-400">Moneda</div>
                <div className="text-lg font-semibold">{currencyRate.currency}</div>
              </div>
              
              <div className="rounded border border-neutral-600 p-4">
                <div className="text-sm text-neutral-400">Valor en ARS</div>
                <div className="text-lg font-semibold">{formatCurrency(currencyRate.value, "ARS")}</div>
              </div>
              
              <div className="rounded border border-neutral-600 p-4">
                <div className="text-sm text-neutral-400">Fuente</div>
                <div className="text-lg font-semibold capitalize">{currencyRate.source}</div>
              </div>
              
              <div className="rounded border border-neutral-600 p-4">
                <div className="text-sm text-neutral-400">Última actualización</div>
                <div className="text-sm font-medium">{formatDate(currencyRate.created_at)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-700 bg-blue-950/40 p-4">
            <h3 className="font-semibold text-blue-100 mb-2">ℹ️ Información</h3>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• La tasa de cambio se obtiene automáticamente desde <code className="bg-blue-900/50 px-1 rounded">dolarapi.com</code></li>
              <li>• Si la API externa no responde, se usa el último valor almacenado en la base de datos</li>
              <li>• El botón "Actualizar Tasa" fuerza una nueva consulta a la API externa</li>
              <li>• Esta tasa se usa automáticamente en los cálculos de costos si no se especifica un valor manual</li>
            </ul>
          </div>

          <div className="rounded-lg border border-yellow-700 bg-yellow-950/40 p-4">
            <h3 className="font-semibold text-yellow-100 mb-2">⚠️ Nota Importante</h3>
            <p className="text-sm text-yellow-200">
              Las tasas de cambio pueden variar constantemente. Para cálculos precisos, 
              considera actualizar la tasa antes de realizar cotizaciones importantes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
