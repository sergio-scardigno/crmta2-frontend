"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSetting } from "@/app/lib/resources";
import type { CreateSettingData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

const COMMON_SETTINGS = [
  { key: "margen_de_beneficio", description: "Margen de beneficio para cálculos de precios (0.25 = 25%)" },
  { key: "valor_dolar_default", description: "Valor por defecto del dólar si no se obtiene de la API" },
  { key: "tiempo_impresion_default", description: "Tiempo de impresión por defecto en horas" },
  { key: "desperdicio_default", description: "Porcentaje de desperdicio por defecto (0.05 = 5%)" },
];

export default function NewSettingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<CreateSettingData>({
    key: "",
    value: 0,
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key.trim()) {
      handleError(new Error("La clave es requerida"));
      return;
    }

    if (formData.value === null || formData.value === undefined) {
      handleError(new Error("El valor es requerido"));
      return;
    }

    try {
      setLoading(true);
      clearError();
      await createSetting(formData);
      router.push("/admin/settings");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateSettingData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePresetSelect = (preset: typeof COMMON_SETTINGS[0]) => {
    setFormData(prev => ({
      ...prev,
      key: preset.key,
      description: preset.description,
    }));
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva Configuración</h1>
        <p className="text-neutral-400">Agrega una nueva configuración al sistema</p>
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
          <h2 className="mb-4 text-lg font-semibold">Información de la Configuración</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-200 mb-2 block">
                Configuraciones Comunes
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {COMMON_SETTINGS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="text-left rounded border border-neutral-600 p-3 text-sm transition hover:bg-neutral-800"
                  >
                    <div className="font-mono text-xs text-emerald-400">{preset.key}</div>
                    <div className="text-neutral-400 text-xs mt-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Clave de configuración"
              placeholder="Ej: margen_de_beneficio"
              value={formData.key}
              onChange={(e) => handleInputChange("key", e.target.value)}
              required
              helperText="Identificador único para la configuración"
            />

            <Input
              label="Valor"
              type="number"
              step="0.0001"
              placeholder="0.25"
              value={formData.value || ""}
              onChange={(e) => handleInputChange("value", parseFloat(e.target.value) || 0)}
              required
              helperText="Valor numérico de la configuración"
            />

            <Input
              label="Descripción (opcional)"
              placeholder="Descripción de qué hace esta configuración"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              helperText="Descripción opcional para documentar el propósito de esta configuración"
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
            Crear Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
