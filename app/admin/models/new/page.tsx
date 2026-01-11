"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createModel3D } from "@/app/lib/resources";
import type { CreateModel3DData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function NewModelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<CreateModel3DData>({
    nombre: "",
    dimension_x: 0,
    dimension_y: 0,
    dimension_z: 0,
    horas_estimadas: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      handleError(new Error("El nombre es requerido"));
      return;
    }

    if (formData.dimension_x <= 0 || formData.dimension_y <= 0 || formData.dimension_z <= 0) {
      handleError(new Error("Todas las dimensiones deben ser mayores a 0"));
      return;
    }

    if (formData.horas_estimadas <= 0) {
      handleError(new Error("Las horas estimadas deben ser mayores a 0"));
      return;
    }

    try {
      setLoading(true);
      clearError();
      await createModel3D(formData);
      router.push("/admin/models");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateModel3DData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Nuevo Modelo 3D</h1>
          <p className="text-neutral-400">Agrega un nuevo modelo 3D al sistema</p>
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
            <h2 className="mb-4 text-lg font-semibold">Información del Modelo</h2>
            
            <div className="space-y-4">
              <Input
                label="Nombre del Modelo"
                placeholder="Ej: Carcasa de teléfono"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                required
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Dimensión X (mm)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={formData.dimension_x || ""}
                  onChange={(e) => handleInputChange("dimension_x", parseFloat(e.target.value) || 0)}
                  required
                />

                <Input
                  label="Dimensión Y (mm)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={formData.dimension_y || ""}
                  onChange={(e) => handleInputChange("dimension_y", parseFloat(e.target.value) || 0)}
                  required
                />

                <Input
                  label="Dimensión Z (mm)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={formData.dimension_z || ""}
                  onChange={(e) => handleInputChange("dimension_z", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <Input
                label="Horas Estimadas"
                type="number"
                step="1"
                min="1"
                placeholder="5"
                value={formData.horas_estimadas || ""}
                onChange={(e) => handleInputChange("horas_estimadas", parseInt(e.target.value) || 0)}
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
              Crear Modelo
            </Button>
        </div>
      </form>
    </div>
  );
}
