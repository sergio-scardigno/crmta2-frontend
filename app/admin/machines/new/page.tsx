"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMachine } from "@/app/lib/resources";
import type { CreateMachineData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function NewMachinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<CreateMachineData>({
    nombre: "",
    costo: 0,
    vida_util_anios: 5,
    costo_mantenimiento: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      handleError(new Error("El nombre es requerido"));
      return;
    }

    if (formData.costo <= 0) {
      handleError(new Error("El costo debe ser mayor a 0"));
      return;
    }

    if (formData.vida_util_anios <= 0) {
      handleError(new Error("La vida útil debe ser mayor a 0"));
      return;
    }

    if (formData.costo_mantenimiento < 0) {
      handleError(new Error("El costo de mantenimiento no puede ser negativo"));
      return;
    }

    try {
      setLoading(true);
      clearError();
      await createMachine(formData);
      router.push("/admin/machines");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateMachineData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva Máquina</h1>
        <p className="text-neutral-400">Agrega una nueva impresora 3D al sistema</p>
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
          <h2 className="mb-4 text-lg font-semibold">Información de la Máquina</h2>
          
          <div className="space-y-4">
            <Input
              label="Nombre de la máquina"
              placeholder="Ej: Prusa MK3S"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Costo de la máquina (USD)"
                type="number"
                step="0.01"
                min="0"
                placeholder="1200.00"
                value={formData.costo || ""}
                onChange={(e) => handleInputChange("costo", parseFloat(e.target.value) || 0)}
                required
              />

              <Input
                label="Vida útil (años)"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="5.0"
                value={formData.vida_util_anios || ""}
                onChange={(e) => handleInputChange("vida_util_anios", parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <Input
              label="Costo de mantenimiento anual (USD)"
              type="number"
              step="0.01"
              min="0"
              placeholder="150.00"
              value={formData.costo_mantenimiento || ""}
              onChange={(e) => handleInputChange("costo_mantenimiento", parseFloat(e.target.value) || 0)}
              required
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
            Crear Máquina
          </Button>
        </div>
      </form>
    </div>
  );
}
