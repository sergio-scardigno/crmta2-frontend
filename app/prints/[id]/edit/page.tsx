"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPrint, updatePrint, fetchMachines, fetchWorkers, fetchMaterials } from '@/app/lib/resources';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Alert } from '@/app/components/ui/Alert';
import type { Print, Machine, Worker, Material, UpdatePrintData } from '@/app/lib/types/resources';

export default function EditPrintPage() {
  const params = useParams();
  const router = useRouter();
  const printId = parseInt(params.id as string);
  
  const [print, setPrint] = useState<Print | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  const [formData, setFormData] = useState<UpdatePrintData>({
    nombre: '',
    descripcion: '',
    horas_impresion: 0,
    cantidad_unidades: 1,
    porcentaje_desperdicio: 0,
    margen_beneficio: 0,
    machine_id: 0,
    worker_id: 0,
    material_id: 0,
    cantidad_material_gramos: 0,
  });

  useEffect(() => {
    if (printId) {
      loadData();
    }
  }, [printId]);

  const loadData = async () => {
    try {
      setLoading(true);
      clearError();
      
      const [printData, machinesData, workersData, materialsData] = await Promise.all([
        fetchPrint(printId),
        fetchMachines(),
        fetchWorkers(),
        fetchMaterials()
      ]);
      
      setPrint(printData);
      setMachines(machinesData);
      setWorkers(workersData);
      setMaterials(materialsData);
      
      // Llenar formulario con datos existentes
      setFormData({
        nombre: printData.nombre,
        descripcion: printData.descripcion || '',
        horas_impresion: printData.horas_impresion,
        cantidad_unidades: printData.cantidad_unidades,
        porcentaje_desperdicio: printData.porcentaje_desperdicio,
        margen_beneficio: printData.margen_beneficio,
        machine_id: printData.machine_id,
        worker_id: printData.worker_id ?? 0,
        material_id: printData.material_id,
        cantidad_material_gramos: printData.cantidad_material_gramos,
        precio_venta_ars: printData.precio_venta_ars ?? undefined,
      });
    } catch (err) {
      handleError(err, 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!print) return;
    
    try {
      setSaving(true);
      clearError();
      const payload = {
        ...formData,
        worker_id: formData.worker_id === 0 ? null : formData.worker_id,
      };
      await updatePrint(print.id, payload);
      router.push(`/prints/${print.id}`);
    } catch (err) {
      handleError(err, 'Error actualizando impresión');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdatePrintData, value: string | number | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-neutral-400">Cargando datos...</div>
      </div>
    );
  }

  if (!print) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-4">Impresión no encontrada</h2>
        <Link href="/prints">
          <Button>Volver a Impresiones</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Impresión</h1>
          <p className="text-neutral-400 mt-1">
            Modifica los datos de la impresión "{print.nombre}"
          </p>
        </div>
        <Link href={`/prints/${print.id}`}>
          <Button variant="ghost">
            Cancelar
          </Button>
        </Link>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información básica */}
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Información General</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Nombre *
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre de la impresión"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Descripción opcional"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Horas de Impresión *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.horas_impresion}
                    onChange={(e) => handleInputChange('horas_impresion', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Cantidad de Unidades *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.cantidad_unidades}
                    onChange={(e) => handleInputChange('cantidad_unidades', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    % Desperdicio
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.porcentaje_desperdicio ?? 0}
                    onChange={(e) => handleInputChange('porcentaje_desperdicio', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Margen de Beneficio (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={(formData.margen_beneficio ?? 0) * 100}
                    onChange={(e) => handleInputChange('margen_beneficio', (parseFloat(e.target.value) || 0) / 100)}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recursos */}
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recursos</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Máquina *
                </label>
                <Select
                  value={formData.machine_id ?? 0}
                  onChange={(e) => handleInputChange('machine_id', parseInt(e.target.value))}
                  required
                  options={[
                    { value: 0, label: "Seleccionar máquina" },
                    ...machines.map((machine) => ({ value: machine.id, label: machine.nombre })),
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Trabajador *
                </label>
                <Select
                  value={formData.worker_id ?? 0}
                  onChange={(e) => handleInputChange('worker_id', parseInt(e.target.value))}
                  required
                  options={[
                    { value: 0, label: "Seleccionar trabajador" },
                    ...workers.map((worker) => ({ value: worker.id, label: worker.nombre })),
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Material *
                </label>
                <Select
                  value={formData.material_id ?? 0}
                  onChange={(e) => handleInputChange('material_id', parseInt(e.target.value))}
                  required
                  options={[
                    { value: 0, label: "Seleccionar material" },
                    ...materials.map((material) => ({ value: material.id, label: material.nombre })),
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Cantidad de Material (gramos) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.cantidad_material_gramos}
                  onChange={(e) => handleInputChange('cantidad_material_gramos', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Precio de venta (ARS) – opcional
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.precio_venta_ars ?? ''}
                  onChange={(e) => handleInputChange('precio_venta_ars', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  placeholder="Ej: 15000 – para calcular ganancia/pérdida"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Si lo completas, se recalculará ganancia o pérdida respecto al costo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between">
          <Link href={`/prints/${print.id}`}>
            <Button variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
