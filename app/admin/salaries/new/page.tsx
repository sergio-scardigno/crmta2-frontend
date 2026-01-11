"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSalary } from "@/app/lib/resources";
import type { CreateSalaryData } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function NewSalaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<CreateSalaryData>({
    tipo_trabajador: "",
    salario_mensual: undefined,
    salario_mensual_ars: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo_trabajador.trim()) {
      handleError(new Error("El tipo de trabajador es requerido"));
      return;
    }

    if ((!formData.salario_mensual || formData.salario_mensual <= 0) && (!formData.salario_mensual_ars || formData.salario_mensual_ars <= 0)) {
      handleError(new Error("Debe proporcionarse un salario mensual en ARS o USD mayor a 0"));
      return;
    }

    try {
      setLoading(true);
      clearError();
      await createSalary(formData);
      router.push("/admin/salaries");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateSalaryData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Nuevo Salario</h1>
          <p className="text-neutral-400">Agrega un nuevo salario al sistema</p>
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
                value={formData.tipo_trabajador}
                onChange={(e) => handleInputChange("tipo_trabajador", e.target.value)}
                required
              />

              <Input
                label="Salario Mensual (ARS)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 500000"
                value={formData.salario_mensual_ars || ""}
                onChange={(e) => handleInputChange("salario_mensual_ars", parseFloat(e.target.value) || undefined)}
                required
              />
              <p className="text-sm text-neutral-400">
                El salario se convertirá automáticamente a USD usando el tipo de cambio actual.
              </p>
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
              Crear Salario
            </Button>
        </div>
      </form>
    </div>
  );
}
