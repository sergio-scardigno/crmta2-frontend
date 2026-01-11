"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMachine, updateMachine } from "@/app/lib/resources";
import type { Machine, UpdateMachineData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

interface EditMachinePageProps {
  params: {
    id: string;
  };
}

export default function EditMachinePage({ params }: EditMachinePageProps) {
  const router = useRouter();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<UpdateMachineData>({
    nombre: "",
    costo: 0,
    vida_util_anios: 5,
    costo_mantenimiento: 0,
  });

  useEffect(() => {
    loadMachine();
  }, [params.id]);

  const loadMachine = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchMachine(parseInt(params.id));
      setMachine(data);
      setFormData({
        nombre: data.nombre,
        costo: data.costo,
        vida_util_anios: data.vida_util_anios,
        costo_mantenimiento: data.costo_mantenimiento,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre?.trim()) {
      handleError(new Error("El nombre es requerido"));
      return;
    }

    if (formData.costo && formData.costo <= 0) {
      handleError(new Error("El costo debe ser mayor a 0"));
      return;
    }

    if (formData.vida_util_anios && formData.vida_util_anios <= 0) {
      handleError(new Error("La vida útil debe ser mayor a 0"));
      return;
    }

    if (formData.costo_mantenimiento && formData.costo_mantenimiento < 0) {
      handleError(new Error("El costo de mantenimiento no puede ser negativo"));
      return;
    }

    try {
      setSaving(true);
      clearError();
      await updateMachine(parseInt(params.id), formData);
      router.push("/admin/machines");
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateMachineData, value: string | number) => {
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
            <p className="text-neutral-400">Cargando máquina...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="error">
          <p>No se pudo cargar la máquina solicitada.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Máquina</h1>
        <p className="text-neutral-400">Modifica la información de la máquina</p>
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
              value={formData.nombre || ""}
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
            loading={saving}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
