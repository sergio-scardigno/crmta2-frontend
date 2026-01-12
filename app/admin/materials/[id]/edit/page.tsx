"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMaterial, updateMaterial } from "@/app/lib/resources";
import { Material } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

interface EditMaterialPageProps {
  params: {
    id: string;
  };
}

export default function EditMaterialPage({ params }: EditMaterialPageProps) {
  const [material, setMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    unidad_de_medida: "gramos",
    cantidad_de_material: 0,
    costo_por_unidad_local: undefined as number | undefined,
    costo_por_gramo_local: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  const router = useRouter();

  const materialId = parseInt(params.id);

  useEffect(() => {
    loadMaterial();
  }, [materialId]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchMaterial(materialId);
      setMaterial(data);
      // Nota: Los valores vienen en USD desde el backend, pero en el frontend
      // mostramos campos para ARS. Para edición, el usuario ingresará nuevos valores en ARS.
      setFormData({
        nombre: data.nombre,
        unidad_de_medida: data.unidad_de_medida,
        cantidad_de_material: data.cantidad_de_material,
        costo_por_unidad_local: undefined, // El usuario ingresará nuevo valor en ARS
        costo_por_gramo_local: 0,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      handleError(new Error("El nombre del material es requerido"));
      return;
    }

    if (formData.cantidad_de_material <= 0) {
      handleError(new Error("La cantidad debe ser mayor a 0"));
      return;
    }

    if (!formData.costo_por_unidad_local || formData.costo_por_unidad_local <= 0) {
      handleError(new Error("El costo por unidad en pesos (ARS) debe ser mayor a 0"));
      return;
    }

    try {
      setSaving(true);
      clearError();
      
      // Convertir cantidad a gramos si la unidad es kilogramos
      const cantidadEnGramos = formData.unidad_de_medida === "kilogramos" 
        ? formData.cantidad_de_material * 1000 
        : formData.cantidad_de_material;
      
      // Calcular costo por gramo automáticamente usando la cantidad en gramos
      const costoPorGramo = formData.costo_por_unidad_local! / cantidadEnGramos;
      
      // Siempre guardar en gramos, normalizando la unidad
      const materialData = {
        nombre: formData.nombre,
        unidad_de_medida: "gramos", // Siempre guardar en gramos
        cantidad_de_material: cantidadEnGramos, // Cantidad ya convertida a gramos
        costo_por_unidad_local: formData.costo_por_unidad_local,
        costo_por_gramo_local: costoPorGramo,
      };

      await updateMaterial(materialId, materialData);
      router.push("/admin/materials");
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Recalcular costo por gramo cuando cambian cantidad, unidad o costo por unidad
    if (field === "cantidad_de_material" || field === "costo_por_unidad_local" || field === "unidad_de_medida") {
      const cantidad =
        field === "cantidad_de_material" ? Number(value ?? 0) : formData.cantidad_de_material;
      const unidad = field === "unidad_de_medida" ? String(value) : formData.unidad_de_medida;
      const costoLocal =
        field === "costo_por_unidad_local"
          ? Number(value ?? 0)
          : Number(formData.costo_por_unidad_local ?? 0);
      
      if (cantidad > 0 && costoLocal > 0) {
        // Convertir cantidad a gramos si la unidad es kilogramos
        const cantidadEnGramos = unidad === "kilogramos" ? cantidad * 1000 : cantidad;
        const costoPorGramo = costoLocal / cantidadEnGramos;
        
        setFormData(prev => ({
          ...prev,
          [field]: value,
          costo_por_gramo_local: costoPorGramo
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando material...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="error">
          <div>
            <p className="font-medium">Material no encontrado</p>
            <p className="text-sm mt-1">El material con ID {materialId} no existe.</p>
          </div>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/admin/materials")}>
            Volver a Materiales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Material</h1>
        <p className="text-neutral-400">Modifica la información del material</p>
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
          <h2 className="text-lg font-semibold mb-4">Información del Material</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-neutral-300 mb-2">
                Nombre del Material *
              </label>
              <Input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ej: PLA Blanco, ABS Negro, PETG Transparente"
                required
              />
            </div>

            <div>
              <label htmlFor="unidad_de_medida" className="block text-sm font-medium text-neutral-300 mb-2">
                Unidad de Medida
              </label>
              <select
                id="unidad_de_medida"
                value={formData.unidad_de_medida}
                onChange={(e) => handleInputChange("unidad_de_medida", e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="gramos">Gramos</option>
                <option value="kilogramos">Kilogramos</option>
              </select>
              <p className="text-xs text-neutral-400 mt-1">
                Si eliges kilogramos, se convertirá automáticamente a gramos al guardar
              </p>
            </div>

            <div>
              <label htmlFor="cantidad_de_material" className="block text-sm font-medium text-neutral-300 mb-2">
                Cantidad Disponible *
              </label>
              <Input
                id="cantidad_de_material"
                type="number"
                value={formData.cantidad_de_material}
                onChange={(e) => handleInputChange("cantidad_de_material", Number(e.target.value))}
                min="0"
                step="0.1"
                placeholder="1000"
                required
              />
            </div>

            <div>
              <label htmlFor="costo_por_unidad_local" className="block text-sm font-medium text-neutral-300 mb-2">
                Costo por Unidad (ARS) *
              </label>
              <Input
                id="costo_por_unidad_local"
                type="number"
                value={formData.costo_por_unidad_local || ""}
                onChange={(e) => handleInputChange("costo_por_unidad_local", parseFloat(e.target.value) || undefined)}
                min="0"
                step="0.01"
                placeholder="Ej: 25000"
                required
              />
              <p className="text-xs text-neutral-400 mt-1">
                El costo se convertirá automáticamente a USD usando el tipo de cambio actual
              </p>
            </div>

            <div className="bg-neutral-800/50 p-4 rounded-md">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Costo por Gramo (ARS) - Calculado automáticamente
              </label>
              <div className="text-lg font-mono text-emerald-400">
                ${formData.costo_por_gramo_local > 0 ? formData.costo_por_gramo_local.toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Se calcula automáticamente: Costo por Unidad ÷ Cantidad
              </p>
              <p className="text-xs text-blue-400 mt-1">
                Se convertirá automáticamente a USD usando la tasa de cambio actual
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/materials")}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}

