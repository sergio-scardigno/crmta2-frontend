"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSetting, updateSetting } from "@/app/lib/resources";
import type { Setting, UpdateSettingData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

interface EditSettingPageProps {
  params: {
    id: string;
  };
}

export default function EditSettingPage({ params }: EditSettingPageProps) {
  const router = useRouter();
  const [setting, setSetting] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<UpdateSettingData>({
    key: "",
    value: 0,
    description: "",
  });

  useEffect(() => {
    loadSetting();
  }, [params.id]);

  const loadSetting = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchSetting(parseInt(params.id));
      setSetting(data);
      setFormData({
        key: data.key,
        value: data.value,
        description: data.description || "",
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key?.trim()) {
      handleError(new Error("La clave es requerida"));
      return;
    }

    if (formData.value === null || formData.value === undefined) {
      handleError(new Error("El valor es requerido"));
      return;
    }

    try {
      setSaving(true);
      clearError();
      await updateSetting(parseInt(params.id), formData);
      router.push("/admin/settings");
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateSettingData, value: string | number) => {
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
            <p className="text-neutral-400">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!setting) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="error">
          <p>No se pudo cargar la configuración solicitada.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Configuración</h1>
        <p className="text-neutral-400">Modifica la información de la configuración</p>
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
            <Input
              label="Clave de configuración"
              placeholder="Ej: margen_de_beneficio"
              value={formData.key || ""}
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
            loading={saving}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
