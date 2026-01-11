"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchModel3D, updateModel3D } from "@/app/lib/resources";
import type { Model3D, UpdateModel3DData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

interface EditModelPageProps {
  params: {
    id: string;
  };
}

export default function EditModelPage({ params }: EditModelPageProps) {
  const router = useRouter();
  const [model, setModel] = useState<Model3D | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<UpdateModel3DData>({
    nombre: "",
    dimension_x: 0,
    dimension_y: 0,
    dimension_z: 0,
    horas_estimadas: 0,
  });

  useEffect(() => {
    loadModel();
  }, [params.id]);

  const loadModel = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchModel3D(parseInt(params.id));
      setModel(data);
      setFormData({
        nombre: data.nombre,
        dimension_x: data.dimension_x,
        dimension_y: data.dimension_y,
        dimension_z: data.dimension_z,
        horas_estimadas: data.horas_estimadas,
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

    if (formData.dimension_x && (formData.dimension_x <= 0 || formData.dimension_y! <= 0 || formData.dimension_z! <= 0)) {
      handleError(new Error("Todas las dimensiones deben ser mayores a 0"));
      return;
    }

    if (formData.horas_estimadas && formData.horas_estimadas <= 0) {
      handleError(new Error("Las horas estimadas deben ser mayores a 0"));
      return;
    }

    try {
      setSaving(true);
      clearError();
      await updateModel3D(parseInt(params.id), formData);
      router.push("/admin/models");
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateModel3DData, value: string | number) => {
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
            <p className="text-neutral-400">Cargando modelo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="error">
          <p>No se pudo cargar el modelo solicitado.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Editar Modelo 3D</h1>
          <p className="text-neutral-400">Modifica la información del modelo</p>
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
                value={formData.nombre || ""}
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
              loading={saving}
            >
              Guardar Cambios
            </Button>
        </div>
      </form>
    </div>
  );
}
