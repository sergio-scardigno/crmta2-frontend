"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorker } from "@/app/lib/resources";
import type { CreateWorkerData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

const ROLES = [
  { value: "operario", label: "Operario" },
  { value: "disenador", label: "Diseñador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "tecnico", label: "Técnico" },
  { value: "otro", label: "Otro" },
];

export default function NewWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<CreateWorkerData & {
    costo_por_hora_local: number;
    moneda_local: string;
    useLocalCurrency: boolean;
  }>({
    nombre: "",
    costo_por_hora: 0,
    factor_trabajo: 0.3,
    rol: null,
    // Campos para conversión de moneda
    costo_por_hora_local: 0,
    moneda_local: "ARS",
    useLocalCurrency: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      handleError(new Error("El nombre es requerido"));
      return;
    }

    if (formData.useLocalCurrency) {
      if (formData.costo_por_hora_local <= 0) {
        handleError(new Error("El costo por hora en pesos debe ser mayor a 0"));
        return;
      }
    } else {
      if (formData.costo_por_hora <= 0) {
        handleError(new Error("El costo por hora debe ser mayor a 0"));
        return;
      }
    }

    if (formData.factor_trabajo <= 0 || formData.factor_trabajo > 1) {
      handleError(new Error("El factor de trabajo debe estar entre 0 y 1"));
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      const workerData = {
        nombre: formData.nombre,
        costo_por_hora: formData.useLocalCurrency ? 0 : formData.costo_por_hora,
        factor_trabajo: formData.factor_trabajo,
        rol: formData.rol,
        // Campos de conversión de moneda
        costo_por_hora_local: formData.useLocalCurrency ? formData.costo_por_hora_local : undefined,
        moneda_local: formData.useLocalCurrency ? formData.moneda_local : undefined,
      };
      
      await createWorker(workerData);
      router.push("/admin/workers");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Trabajador</h1>
        <p className="text-neutral-400">Agrega un nuevo trabajador al sistema</p>
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
          <h2 className="mb-4 text-lg font-semibold">Información del Trabajador</h2>
          
          <div className="space-y-4">
            <Input
              label="Nombre del trabajador"
              placeholder="Ej: Juan Pérez"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              required
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useLocalCurrency"
                  checked={formData.useLocalCurrency}
                  onChange={(e) => handleInputChange("useLocalCurrency", e.target.checked)}
                  className="rounded border-neutral-600 bg-neutral-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="useLocalCurrency" className="text-sm font-medium text-neutral-300">
                  Ingresar salario en pesos argentinos (se convertirá automáticamente a USD)
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {formData.useLocalCurrency ? (
                  <Input
                    label="Costo por hora (ARS)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15000"
                    value={formData.costo_por_hora_local || ""}
                    onChange={(e) => handleInputChange("costo_por_hora_local", parseFloat(e.target.value) || 0)}
                    required
                  />
                ) : (
                  <Input
                    label="Costo por hora (USD)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15.00"
                    value={formData.costo_por_hora || ""}
                    onChange={(e) => handleInputChange("costo_por_hora", parseFloat(e.target.value) || 0)}
                    required
                  />
                )}

                <Input
                  label="Factor de trabajo (0.1 - 1.0)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  placeholder="0.30"
                  value={formData.factor_trabajo || ""}
                  onChange={(e) => handleInputChange("factor_trabajo", parseFloat(e.target.value) || 0)}
                  helperText="Porcentaje de tiempo efectivo trabajando"
                  required
                />
              </div>

              {formData.useLocalCurrency && (
                <div className="bg-neutral-800/50 p-4 rounded-md">
                  <p className="text-sm text-blue-400">
                    El salario se convertirá automáticamente a USD usando la tasa de cambio actual
                  </p>
                </div>
              )}
            </div>

            <Select
              label="Rol"
              placeholder="Selecciona un rol"
              options={ROLES}
              value={formData.rol || ""}
              onChange={(e) => handleInputChange("rol", e.target.value || null)}
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
            Crear Trabajador
          </Button>
        </div>
      </form>
    </div>
  );
}
