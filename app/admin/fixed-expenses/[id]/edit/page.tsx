"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchFixedExpense, updateFixedExpense } from "@/app/lib/resources";
import type { FixedExpense, UpdateFixedExpenseData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

interface EditFixedExpensePageProps {
  params: {
    id: string;
  };
}

export default function EditFixedExpensePage({ params }: EditFixedExpensePageProps) {
  const router = useRouter();
  const [expense, setExpense] = useState<FixedExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<UpdateFixedExpenseData>({
    tipo_gasto: "",
    monto_usd: 0,
    categoria: null,
  });

  useEffect(() => {
    loadExpense();
  }, [params.id]);

  const loadExpense = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchFixedExpense(parseInt(params.id));
      setExpense(data);
      setFormData({
        tipo_gasto: data.tipo_gasto,
        monto_usd: data.monto_usd,
        categoria: data.categoria,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo_gasto?.trim()) {
      handleError(new Error("El tipo de gasto es requerido"));
      return;
    }

    if (formData.monto_usd && formData.monto_usd <= 0) {
      handleError(new Error("El monto debe ser mayor a 0"));
      return;
    }

    try {
      setSaving(true);
      clearError();
      await updateFixedExpense(parseInt(params.id), formData);
      router.push("/admin/fixed-expenses");
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateFixedExpenseData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando gasto fijo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="error">
          <p>No se pudo cargar el gasto fijo solicitado.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Gasto Fijo</h1>
        <p className="text-neutral-400">Modifica la información del gasto fijo</p>
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
              value={formData.tipo_gasto || ""}
              onChange={(e) => handleInputChange("tipo_gasto", e.target.value)}
              required
            />

            <Input
              label="Monto (USD)"
              type="number"
              step="0.01"
              min="0"
              placeholder="100.00"
              value={formData.monto_usd || ""}
              onChange={(e) => handleInputChange("monto_usd", parseFloat(e.target.value) || 0)}
              required
            />

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
            loading={saving}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
