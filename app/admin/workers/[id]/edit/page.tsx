"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWorker, updateWorker } from "@/app/lib/resources";
import type { Worker, UpdateWorkerData } from "@/app/lib/types/resources";
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

interface EditWorkerPageProps {
  params: {
    id: string;
  };
}

export default function EditWorkerPage({ params }: EditWorkerPageProps) {
  const router = useRouter();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<UpdateWorkerData>({
    nombre: "",
    costo_por_hora: 0,
    factor_trabajo: 0.3,
    rol: null,
  });

  useEffect(() => {
    loadWorker();
  }, [params.id]);

  const loadWorker = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchWorker(parseInt(params.id));
      setWorker(data);
      setFormData({
        nombre: data.nombre,
        costo_por_hora: data.costo_por_hora,
        factor_trabajo: data.factor_trabajo,
        rol: data.rol,
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

    if (formData.costo_por_hora && formData.costo_por_hora <= 0) {
      handleError(new Error("El costo por hora debe ser mayor a 0"));
      return;
    }

    if (formData.factor_trabajo && (formData.factor_trabajo <= 0 || formData.factor_trabajo > 1)) {
      handleError(new Error("El factor de trabajo debe estar entre 0 y 1"));
      return;
    }

    try {
      setSaving(true);
      clearError();
      await updateWorker(parseInt(params.id), formData);
      router.push("/admin/workers");
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateWorkerData, value: string | number) => {
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
            <p className="text-neutral-400">Cargando trabajador...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="error">
          <p>No se pudo cargar el trabajador solicitado.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Trabajador</h1>
        <p className="text-neutral-400">Modifica la información del trabajador</p>
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
              value={formData.nombre || ""}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
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
            loading={saving}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
