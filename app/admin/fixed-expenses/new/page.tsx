"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFixedExpense } from "@/app/lib/resources";
import type { CreateFixedExpenseData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function NewFixedExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<CreateFixedExpenseData>({
    tipo_gasto: "",
    monto_usd: undefined,
    monto_ars: undefined,
    categoria: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo_gasto.trim()) {
      handleError(new Error("El tipo de gasto es requerido"));
      return;
    }

    if ((!formData.monto_usd || formData.monto_usd <= 0) && (!formData.monto_ars || formData.monto_ars <= 0)) {
      handleError(new Error("Debe proporcionarse un monto en ARS o USD mayor a 0"));
      return;
    }

    try {
      setLoading(true);
      clearError();
      await createFixedExpense(formData);
      router.push("/admin/fixed-expenses");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateFixedExpenseData,
    value: string | number | null | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Gasto Fijo</h1>
        <p className="text-neutral-400">Agrega un nuevo gasto fijo al sistema</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold">Información del Gasto Fijo</h2>
            
            <div className="space-y-4">
              <Input
                label="Tipo de Gasto"
                placeholder="Ej: Servicio de luz"
                value={formData.tipo_gasto}
                onChange={(e) => handleInputChange("tipo_gasto", e.target.value)}
                required
              />

              <Input
                label="Monto (ARS)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 50000"
                value={formData.monto_ars || ""}
                onChange={(e) => handleInputChange("monto_ars", parseFloat(e.target.value) || undefined)}
                required
              />
              <p className="text-sm text-neutral-400">
                El monto se convertirá automáticamente a USD usando el tipo de cambio actual.
              </p>

              <Input
                label="Categoría (opcional)"
                placeholder="Ej: luz, agua, gas"
                value={formData.categoria || ""}
                onChange={(e) => handleInputChange("categoria", e.target.value || null)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              Crear Gasto Fijo
            </Button>
          </div>
        </form>
    </div>
  );
}
