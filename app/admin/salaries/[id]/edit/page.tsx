"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSalary, updateSalary } from "@/app/lib/resources";
import type { Salary, UpdateSalaryData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

interface EditSalaryPageProps {
  params: {
    id: string;
  };
}

export default function EditSalaryPage({ params }: EditSalaryPageProps) {
  const router = useRouter();
  const [salary, setSalary] = useState<Salary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<UpdateSalaryData>({
    tipo_trabajador: "",
    salario_mensual: 0,
  });

  useEffect(() => {
    loadSalary();
  }, [params.id]);

  const loadSalary = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchSalary(parseInt(params.id));
      setSalary(data);
      setFormData({
        tipo_trabajador: data.tipo_trabajador,
        salario_mensual: data.salario_mensual,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo_trabajador?.trim()) {
      handleError(new Error("El tipo de trabajador es requerido"));
      return;
    }

    if (formData.salario_mensual && formData.salario_mensual <= 0) {
      handleError(new Error("El salario mensual debe ser mayor a 0"));
      return;
    }

    try {
      setSaving(true);
      clearError();
      await updateSalary(parseInt(params.id), formData);
      router.push("/admin/salaries");
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateSalaryData, value: string | number) => {
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
            <p className="text-neutral-400">Cargando salario...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="error">
          <p>No se pudo cargar el salario solicitado.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Editar Salario</h1>
          <p className="text-neutral-400">Modifica la información del salario</p>
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
            <h2 className="mb-4 text-lg font-semibold">Información del Salario</h2>
            
            <div className="space-y-4">
              <Input
                label="Tipo de Trabajador"
                placeholder="Ej: Diseñador, Operador, etc."
                value={formData.tipo_trabajador || ""}
                onChange={(e) => handleInputChange("tipo_trabajador", e.target.value)}
                required
              />

              <Input
                label="Salario Mensual"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000.00"
                value={formData.salario_mensual || ""}
                onChange={(e) => handleInputChange("salario_mensual", parseFloat(e.target.value) || 0)}
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
