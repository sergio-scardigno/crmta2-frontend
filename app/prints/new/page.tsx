"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/app/contexts/TenantContext";
import {
  calculateCost,
  fetchBenefit,
  fetchMachines,
  fetchMaterials,
  fetchWorkers,
  fetchCurrencyRate,
  createPrintFromCalculation,
} from "@/app/lib/resources";
import { generateQuotePdf } from "@/app/lib/pdf/quote";
import { Select } from "@/app/components/ui/Select";
import type {
  CostBreakdown,
  Machine,
  Material,
  Worker,
  CurrencyRate,
} from "@/app/lib/types/resources";

interface MaterialSelection {
  id_material: number;
  cantidad_usada: number;
  desperdicio: number;
}

interface AdicionalRow {
  concepto: string;
  moneda: "ARS" | "USD";
  monto: number | null;
  por_unidad: boolean;
}

const defaultMaterial: MaterialSelection = {
  id_material: 0,
  cantidad_usada: 0,
  desperdicio: 0,
};

const defaultAdicional: AdicionalRow = {
  concepto: "",
  moneda: "ARS",
  monto: null,
  por_unidad: false,
};

export default function NewPrintPage() {
  const router = useRouter();
  const { currentTenant, currentTenantKey } = useTenant();
  
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currencyRate, setCurrencyRate] = useState<CurrencyRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMachineIds, setSelectedMachineIds] = useState<number[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<number[]>([]);
  const [materialRows, setMaterialRows] = useState<MaterialSelection[]>([
    defaultMaterial,
  ]);
  const [hours, setHours] = useState(1);
  const [units, setUnits] = useState(1);
  const [dollarValue, setDollarValue] = useState(900);
  const [referenciaTipo, setReferenciaTipo] = useState<string>("");
  const [comisionPlataformaPct, setComisionPlataformaPct] = useState<number>(18);
  const [benefit, setBenefit] = useState<number | null>(null);
  
  // Nuevos campos para tiempos y mano de obra
  const [tiempoPreparacionMin, setTiempoPreparacionMin] = useState<number | null>(null);
  const [tiempoPostMin, setTiempoPostMin] = useState<number | null>(null);
  const [tiempoDisenioH, setTiempoDisenioH] = useState<number | null>(null);
  const [minimoTrabajoArs, setMinimoTrabajoArs] = useState<number | null>(null);
  const [tarifaManoObraUsdH, setTarifaManoObraUsdH] = useState<number | null>(null);
  const [adicionales, setAdicionales] = useState<AdicionalRow[]>([defaultAdicional]);

  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [printName, setPrintName] = useState("");
  const [printDescription, setPrintDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Redirigir a login si no hay tenant autenticado
  useEffect(() => {
    if (currentTenant === null || currentTenantKey === null) {
      router.push("/login");
    }
  }, [currentTenant, currentTenantKey, router]);

  useEffect(() => {
    // No cargar datos si no hay tenant autenticado
    if (currentTenant === null || currentTenantKey === null) {
      return;
    }
    
    async function loadData() {
      try {
        setIsLoading(true);
        const [machinesList, workersList, materialsList, benefitSetting, currencyData] =
          await Promise.all([
            fetchMachines(),
            fetchWorkers(),
            fetchMaterials(),
            fetchBenefit().catch(() => null),
            fetchCurrencyRate().catch(() => null),
          ]);

        setMachines(machinesList);
        setWorkers(workersList);
        setMaterials(materialsList);
        setBenefit(benefitSetting?.value ?? null);
        setCurrencyRate(currencyData);

        if (machinesList.length) {
          setSelectedMachineIds([machinesList[0].id]);
        }
        // No seleccionar trabajadores por defecto - son opcionales
        if (materialsList.length) {
          setMaterialRows([
            {
              id_material: materialsList[0].id,
              cantidad_usada: 0,
              desperdicio: 0,
            },
          ]);
        } else {
          // Si no hay materiales, inicializar con un material vacío
          setMaterialRows([defaultMaterial]);
        }
        
        // Si tenemos tasa de cambio, actualizar el valor del dólar
        if (currencyData) {
          setDollarValue(currencyData.value);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [currentTenant, currentTenantKey]);

  const benefitPercent = useMemo(() => {
    if (benefit === null) return "";
    return `${(benefit * 100).toFixed(0)}%`;
  }, [benefit]);

  const referenciaOptions = [
    { value: "", label: "Sin referencia" },
    { value: "minorista", label: "Precio Minorista (x4)" },
    { value: "mayorista", label: "Precio Mayorista (x3)" },
    { value: "llaveros", label: "Precio Llaveros (x5)" },
  ];

  const plaTotal = useMemo(() => {
    return materialRows.reduce((sum, row) => sum + row.cantidad_usada, 0);
  }, [materialRows]);

  // Mostrar loading mientras se verifica la autenticación (después de todos los hooks)
  if (currentTenant === null || currentTenantKey === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Handler para actualizar PLA usado en el material principal
  const handlePlaUsadoChange = (value: number) => {
    if (materialRows.length > 0 && materials.length > 0) {
      // Asegurar que el primer material tenga un material seleccionado
      const firstRow = materialRows[0];
      if (firstRow.id_material === 0 && materials[0]) {
        setMaterialRows([
          {
            id_material: materials[0].id,
            cantidad_usada: value,
            desperdicio: firstRow.desperdicio,
          },
          ...materialRows.slice(1),
        ]);
      } else {
        handleMaterialChange(0, "cantidad_usada", value);
      }
    }
  };

  async function handleCalculate() {
    if (!selectedMachineIds.length) {
      setError("Selecciona al menos una máquina");
      return;
    }

    const preparedMaterials = materialRows.filter(
      (row) => row.id_material && row.cantidad_usada > 0,
    );

    if (!preparedMaterials.length) {
      setError("Añade al menos un material con cantidad usada > 0");
      return;
    }

    setError(null);
    setIsCalculating(true);
    try {
      const adicionalesPreparados = adicionales
        .map((a) => ({
          concepto: a.concepto.trim(),
          moneda: a.moneda,
          monto: a.monto ?? 0,
          por_unidad: a.por_unidad,
        }))
        .filter((a) => a.concepto.length > 0 && a.monto > 0);

      const payload = {
        horas_impresion: hours,
        maquinas_ids: selectedMachineIds,
        trabajadores_ids: selectedWorkerIds,
        materiales: preparedMaterials,
        valor_dolar: dollarValue,
        cantidad_unidades: units,
        beneficio: benefit ?? undefined,
        tiempo_preparacion_minutos: tiempoPreparacionMin ?? undefined,
        tiempo_post_proceso_minutos: tiempoPostMin ?? undefined,
        tiempo_disenio_horas: tiempoDisenioH ?? undefined,
        minimo_trabajo_ars: minimoTrabajoArs ?? undefined,
        tarifa_mano_obra_usd_h: tarifaManoObraUsdH ?? undefined,
        comision_plataforma_pct: comisionPlataformaPct > 0 ? comisionPlataformaPct / 100 : 0,
        referencia_tipo: referenciaTipo || undefined,
        adicionales: adicionalesPreparados,
      };

      const response = await calculateCost(payload);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error calculando costos");
    } finally {
      setIsCalculating(false);
    }
  }

  const handleSavePrint = async () => {
    if (!result) {
      setError("No hay resultados para guardar");
      return;
    }

    if (!printName.trim()) {
      setError("Debes ingresar un nombre para la impresión");
      return;
    }

    if (selectedMachineIds.length === 0) {
      setError("Debes seleccionar al menos una máquina");
      return;
    }

    const preparedMaterials = materialRows.filter(
      (row) => row.id_material && row.cantidad_usada > 0,
    );

    if (!preparedMaterials.length) {
      setError("Debes seleccionar al menos un material");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const printData = {
        nombre: printName,
        descripcion: printDescription || undefined,
        horas_impresion: hours,
        cantidad_unidades: units,
        porcentaje_desperdicio: preparedMaterials.reduce((sum, row) => sum + row.desperdicio, 0) / preparedMaterials.length,
        margen_beneficio: benefit || 0,
        machine_id: selectedMachineIds[0], // Usar la primera máquina seleccionada
        worker_id: selectedWorkerIds.length > 0 ? selectedWorkerIds[0] : null, // Opcional: puede ser null
        material_id: preparedMaterials[0].id_material, // Usar el primer material seleccionado
        cantidad_material_gramos: preparedMaterials.reduce((sum, row) => sum + row.cantidad_usada, 0),
        extras: adicionales
          .map((a) => ({
            concepto: a.concepto.trim(),
            moneda: a.moneda,
            monto: a.monto ?? 0,
            por_unidad: a.por_unidad,
          }))
          .filter((a) => a.concepto.length > 0 && a.monto > 0),
      };

      // Incluir los nuevos campos en el resultado para guardarlos
      const enhancedResult = {
        ...result,
        tarifa_mano_obra_usd_h: tarifaManoObraUsdH ?? 0,
        minimo_trabajo_ars: minimoTrabajoArs ?? 0,
      } as CostBreakdown & { tarifa_mano_obra_usd_h: number; minimo_trabajo_ars: number };

      const savedPrint = await createPrintFromCalculation(printData, enhancedResult, dollarValue);
      
      // Redirigir a la página de detalle de la impresión guardada
      window.location.href = `/prints/${savedPrint.id}`;
    } catch (err) {
      setError("Error guardando impresión");
      console.error("Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  function handleMaterialChange(index: number, field: keyof MaterialSelection, value: number) {
    setMaterialRows((rows) =>
      rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
  }

  function addMaterialRow() {
    setMaterialRows((rows) => [
      ...rows,
      {
        id_material: materials[0]?.id ?? 0,
        cantidad_usada: 0,
        desperdicio: 0,
      },
    ]);
  }

  function handleAdicionalChange(index: number, field: keyof AdicionalRow, value: any) {
    setAdicionales((rows) =>
      rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
  }

  function addAdicionalRow() {
    setAdicionales((rows) => [...rows, { ...defaultAdicional }]);
  }

  function removeAdicionalRow(index: number) {
    setAdicionales((rows) => rows.filter((_, idx) => idx !== index));
  }

  function removeMaterialRow(index: number) {
    setMaterialRows((rows) => rows.filter((_, idx) => idx !== index));
  }

  async function refreshCurrencyRate() {
    try {
      const newRate = await fetchCurrencyRate(true);
      setCurrencyRate(newRate);
      setDollarValue(newRate.value);
    } catch (err) {
      setError("Error actualizando tasa de cambio");
    }
  }

  if (isLoading) {
    return <p className="p-6">Cargando datos...</p>;
  }

  if (error && !isCalculating && !result) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Nueva impresión</h1>
        <p className="text-sm text-neutral-500">
          Calcula costos usando los datos cargados desde el backend FastAPI.
        </p>
        {benefitPercent && (
          <p className="text-xs text-neutral-500">
            Margen configurado: <span className="font-medium">{benefitPercent}</span>
          </p>
        )}
        {currencyRate && (
          <p className="text-xs text-neutral-500">
            Tasa de cambio USD/ARS: <span className="font-medium">${currencyRate.value}</span>
            <button
              onClick={refreshCurrencyRate}
              className="ml-2 text-blue-500 hover:text-blue-400"
            >
              (Actualizar)
            </button>
          </p>
        )}
      </header>

      {error && <p className="rounded-md bg-red-100 p-3 text-red-700">{error}</p>}

      {/* Sección Esencial - Siempre visible */}
      <section className="grid gap-6 rounded-lg border-2 border-emerald-600 bg-emerald-950/20 p-6">
        <div>
          <h2 className="text-xl font-semibold text-emerald-200 mb-2">Información Esencial</h2>
          <p className="text-sm text-neutral-400">Completa estos campos para calcular el costo básico</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-base font-medium text-neutral-200">Horas de impresión *</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              className="text-lg rounded-lg border-2 border-emerald-600 bg-neutral-900 p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              placeholder="Ej: 2.5"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-base font-medium text-neutral-200">PLA usado (gr) *</span>
            <input
              type="number"
              min={0}
              step={0.1}
              className="text-lg rounded-lg border-2 border-emerald-600 bg-neutral-900 p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              value={materialRows[0]?.cantidad_usada || 0}
              onChange={(event) => handlePlaUsadoChange(Number(event.target.value))}
              placeholder="Ej: 150"
            />
            {plaTotal > (materialRows[0]?.cantidad_usada || 0) && (
              <p className="text-xs text-emerald-300 mt-1">
                PLA total (gr): <span className="font-semibold">{plaTotal.toFixed(1)}</span>
                <span className="text-neutral-400 ml-2">(incluye materiales adicionales)</span>
              </p>
            )}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Referencia de precio"
            options={referenciaOptions}
            value={referenciaTipo}
            onChange={(event) => setReferenciaTipo(event.target.value)}
            helperText="Aplica multiplicador al total final (minorista, mayorista o llaveros)."
          />

          <label className="grid gap-2">
            <span className="text-base font-medium text-neutral-200">Comisión MercadoLibre (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className="text-lg rounded-lg border-2 border-emerald-600 bg-neutral-900 p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              value={comisionPlataformaPct}
              onChange={(event) => setComisionPlataformaPct(Number(event.target.value))}
              placeholder="Ej: 18"
            />
          </label>
        </div>
      </section>

      {/* Panel Avanzado - Colapsable */}
      <details className="group rounded-lg border border-neutral-700 bg-neutral-900/50 overflow-hidden">
        <summary className="cursor-pointer list-none p-4 bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-200">Opciones Avanzadas</h2>
            <span className="text-sm text-neutral-400 group-open:hidden">▼ Expandir</span>
            <span className="text-sm text-neutral-400 hidden group-open:inline">▲ Colapsar</span>
          </div>
        </summary>
        
        <div className="p-4 space-y-6 border-t border-neutral-700">
          {/* Campos de nombre y descripción */}
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Nombre de la Impresión *
              </label>
              <input
                type="text"
                value={printName}
                onChange={(e) => setPrintName(e.target.value)}
                placeholder="Ej: Prototipo de carcasa"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={printDescription}
                onChange={(e) => setPrintDescription(e.target.value)}
                placeholder="Descripción detallada de la impresión..."
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={2}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Máquinas</span>
              <select
                multiple
                value={selectedMachineIds.map(String)}
                onChange={(event) =>
                  setSelectedMachineIds(
                    Array.from(event.target.selectedOptions, (option) => Number(option.value)),
                  )
                }
                className="h-32 rounded border border-neutral-700 bg-neutral-900 p-2 text-sm"
              >
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.nombre} (${machine.costo}/h)
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Trabajadores (opcional)</span>
              <select
                multiple
                value={selectedWorkerIds.map(String)}
                onChange={(event) =>
                  setSelectedWorkerIds(
                    Array.from(event.target.selectedOptions, (option) => Number(option.value)),
                  )
                }
                className="h-32 rounded border border-neutral-700 bg-neutral-900 p-2 text-sm"
              >
                <option value="" disabled>Selecciona trabajadores (opcional)</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.nombre} (${worker.costo_por_hora}/h)
                  </option>
                ))}
              </select>
              {selectedWorkerIds.length === 0 && (
                <p className="text-xs text-neutral-400">Si no seleccionas trabajadores, el costo de sueldos será $0</p>
              )}
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Cantidad de unidades</span>
              <input
                type="number"
                min={1}
                className="rounded border border-neutral-700 bg-neutral-900 p-2"
                value={units}
                onChange={(event) => setUnits(Number(event.target.value))}
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Valor dólar (ARS)</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  className="flex-1 rounded border border-neutral-700 bg-neutral-900 p-2"
                  value={dollarValue}
                  onChange={(event) => setDollarValue(Number(event.target.value))}
                />
                {currencyRate && (
                  <button
                    onClick={refreshCurrencyRate}
                    className="px-3 py-2 text-xs rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                  >
                    Actualizar
                  </button>
                )}
              </div>
            </label>
          </div>

          {/* Tiempos de mano de obra */}
          <div className="grid gap-4 rounded-lg border border-neutral-700 p-4 bg-neutral-900/50">
            <h3 className="text-sm font-semibold text-neutral-300">Tiempos de mano de obra</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Tiempo preparación (min)</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="rounded border border-neutral-700 bg-neutral-900 p-2"
                  value={tiempoPreparacionMin ?? ""}
                  onChange={(event) => setTiempoPreparacionMin(event.target.value ? Number(event.target.value) : null)}
                  placeholder="0 (default: 15)"
                />
                <p className="text-xs text-neutral-400">Si es 0, se usa 15 min por defecto</p>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Tiempo post-proceso (min)</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="rounded border border-neutral-700 bg-neutral-900 p-2"
                  value={tiempoPostMin ?? ""}
                  onChange={(event) => setTiempoPostMin(event.target.value ? Number(event.target.value) : null)}
                  placeholder="0 (default: 15)"
                />
                <p className="text-xs text-neutral-400">Si es 0, se usa 15 min por defecto</p>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Tiempo diseño (horas)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className="rounded border border-neutral-700 bg-neutral-900 p-2"
                  value={tiempoDisenioH ?? ""}
                  onChange={(event) => setTiempoDisenioH(event.target.value ? Number(event.target.value) : null)}
                  placeholder="0"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Tarifa mano de obra (USD/h)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                className="rounded border border-neutral-700 bg-neutral-900 p-2"
                value={tarifaManoObraUsdH ?? ""}
                onChange={(event) => setTarifaManoObraUsdH(event.target.value ? Number(event.target.value) : null)}
                placeholder="Opcional (usa setting)"
              />
              <p className="text-xs text-neutral-400">Opcional: usa valor de settings si está vacío</p>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Cargo fijo por trabajo (ARS)</span>
              <input
                type="number"
                min={0}
                step={100}
                className="rounded border border-neutral-700 bg-neutral-900 p-2"
                value={minimoTrabajoArs ?? ""}
                onChange={(event) => setMinimoTrabajoArs(event.target.value ? Number(event.target.value) : null)}
                placeholder="Opcional (usa setting)"
              />
              <p className="text-xs text-neutral-400">
                Se <span className="font-medium">suma siempre</span> al total final (se convierte con USD/ARS).
              </p>
            </label>
          </div>

          {/* Materiales detallado */}
          <div className="grid gap-4 rounded-lg border border-neutral-700 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-300">Materiales detallado</h3>
              <button
                type="button"
                onClick={addMaterialRow}
                className="rounded-md border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800"
              >
                Añadir material
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Puedes agregar múltiples materiales y especificar desperdicio por cada uno
            </p>
            <div className="grid gap-3">
              {materialRows.map((row, index) => (
                <div
                  key={`${row.id_material}-${index}`}
                  className="grid gap-2 rounded-md border border-neutral-700 p-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
                >
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Material</span>
                    <select
                      value={row.id_material || ""}
                      onChange={(event) =>
                        handleMaterialChange(index, "id_material", Number(event.target.value))
                      }
                      className="rounded border border-neutral-700 bg-neutral-900 p-2"
                    >
                      <option value="" disabled>
                        Selecciona material
                      </option>
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.nombre} (${material.costo_por_gramo}/gr)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Cantidad usada (gr)</span>
                    <input
                      type="number"
                      min={0}
                      className="rounded border border-neutral-700 bg-neutral-900 p-2"
                      value={row.cantidad_usada}
                      onChange={(event) =>
                        handleMaterialChange(index, "cantidad_usada", Number(event.target.value))
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Desperdicio (gr)</span>
                    <input
                      type="number"
                      min={0}
                      className="rounded border border-neutral-700 bg-neutral-900 p-2"
                      value={row.desperdicio}
                      onChange={(event) =>
                        handleMaterialChange(index, "desperdicio", Number(event.target.value))
                      }
                    />
                  </label>

                  {materialRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMaterialRow(index)}
                      className="self-start rounded border border-red-700 px-2 py-1 text-sm text-red-500 hover:bg-red-900/30"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Adicionales */}
          <div className="grid gap-4 rounded-lg border border-neutral-700 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-300">Adicionales (producto / servicio)</h3>
              <button
                type="button"
                onClick={addAdicionalRow}
                className="rounded-md border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800"
              >
                Añadir adicional
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Cada adicional puede ser en ARS o USD y puede ser por unidad o por trabajo. Se suma al total final.
            </p>
            <div className="grid gap-3">
              {adicionales.map((row, index) => (
                <div
                  key={`adicional-${index}`}
                  className="grid gap-2 rounded-md border border-neutral-700 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end"
                >
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Concepto</span>
                    <input
                      type="text"
                      className="rounded border border-neutral-700 bg-neutral-900 p-2"
                      value={row.concepto}
                      onChange={(e) => handleAdicionalChange(index, "concepto", e.target.value)}
                      placeholder="Ej: Vaso de acero inoxidable"
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Moneda</span>
                    <select
                      className="rounded border border-neutral-700 bg-neutral-900 p-2"
                      value={row.moneda}
                      onChange={(e) => handleAdicionalChange(index, "moneda", e.target.value as "ARS" | "USD")}
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Monto</span>
                    <input
                      type="number"
                      min={0}
                      step={row.moneda === "ARS" ? 100 : 0.1}
                      className="rounded border border-neutral-700 bg-neutral-900 p-2"
                      value={row.monto ?? ""}
                      onChange={(e) =>
                        handleAdicionalChange(index, "monto", e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Alcance</span>
                    <select
                      className="rounded border border-neutral-700 bg-neutral-900 p-2"
                      value={row.por_unidad ? "por_unidad" : "por_trabajo"}
                      onChange={(e) => handleAdicionalChange(index, "por_unidad", e.target.value === "por_unidad")}
                    >
                      <option value="por_trabajo">Por trabajo</option>
                      <option value="por_unidad">Por unidad</option>
                    </select>
                  </label>

                  {adicionales.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAdicionalRow(index)}
                      className="self-start rounded border border-red-700 px-2 py-1 text-sm text-red-500 hover:bg-red-900/30"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Botón Calcular - Siempre accesible */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full rounded-lg bg-emerald-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/50"
        >
          {isCalculating ? "Calculando..." : "Calcular costos"}
        </button>
        <p className="text-xs text-neutral-500 text-center">
          Los cálculos se realizan en tu backend FastAPI (/api/costs/calculate).
        </p>
      </div>

      {result && (
        <section className="grid gap-4 rounded-lg border border-emerald-700 bg-emerald-950/40 p-6 text-sm">
          <h2 className="text-xl font-semibold text-emerald-100">Resumen de Costos</h2>
          
          {(() => {
            const valorDolar = dollarValue > 0 ? dollarValue : 1;
            // Costos en ARS (como en la referencia)
            const materialArs = (result.costo_materiales_usd + result.costo_desperdicio_usd) * valorDolar;
            const electricidadArs = result.costo_electricidad_usd * valorDolar;
            const desgasteArs = result.costo_maquinas_usd * valorDolar;
            const margenErrorArs = result.costo_seguro_fallos_usd * valorDolar;
            const insumosArs = 0; // fijo por ahora
            const otrosArs = (result.costo_gastos_fijos_usd + result.costo_labor_usd + result.costo_trabajadores_usd) * valorDolar;
            const costoProduccionArs = materialArs + electricidadArs + desgasteArs + margenErrorArs;
            const totalCostosArs = result.total_costos_ars ?? result.costo_base_usd * valorDolar;
            const totalACobrarArs = result.total_a_cobrar_ars ?? totalCostosArs * (result.referencia_multiplicador ?? 1);
            const precioConComisionArs = result.precio_con_comision_ars ?? totalACobrarArs * (1 + comisionPlataformaPct / 100);
            // Distribución de costos (sobre total a cobrar)
            const pctMaterial = totalACobrarArs > 0 ? (materialArs / totalACobrarArs) * 100 : 0;
            const pctMargenError = totalACobrarArs > 0 ? (margenErrorArs / totalACobrarArs) * 100 : 0;
            const pctGanancia = totalACobrarArs > 0 ? ((totalACobrarArs - totalCostosArs) / totalACobrarArs) * 100 : 0;
            const precioFinalArs = result.precio_final_ars ?? totalACobrarArs;
            const unitarioFinalArs = units > 0 ? precioFinalArs / units : null;
            const unitarioFinalUsd = dollarValue > 0 && unitarioFinalArs !== null ? unitarioFinalArs / dollarValue : null;
            const adicionalesTotalArs = result.adicionales_total_ars ?? 0;

            return (
              <>
                {/* Costos Base (como en la referencia) */}
                <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
                  <h3 className="text-base font-semibold text-emerald-200 mb-3 pb-2 border-b border-emerald-700/40">
                    Costos Base
                  </h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-300">Material</span>
                      <span className="font-medium text-emerald-300">ARS $ {materialArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-300">Electricidad</span>
                      <span className="font-medium text-emerald-300">ARS $ {electricidadArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-300">Desgaste</span>
                      <span className="font-medium text-emerald-300">ARS $ {desgasteArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Costos Adicionales */}
                <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
                  <h3 className="text-base font-semibold text-emerald-200 mb-3 pb-2 border-b border-emerald-700/40">
                    Costos Adicionales
                  </h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-300">Margen Error</span>
                      <span className="font-medium text-emerald-300">ARS $ {margenErrorArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-300">Costo Producción</span>
                      <span className="font-medium text-emerald-300">ARS $ {costoProduccionArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-300">Insumos (fijo)</span>
                      <span className="font-medium text-emerald-300">ARS $ {insumosArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {otrosArs > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-neutral-300">Otros (gastos fijos, mano de obra)</span>
                        <span className="font-medium text-emerald-300">ARS $ {otrosArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-emerald-700/40 flex justify-between items-center">
                      <span className="font-semibold text-emerald-100">Total Costos</span>
                      <span className="font-bold text-lg text-emerald-200">ARS $ {totalCostosArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Precio Final: TOTAL A COBRAR */}
                <div className="rounded-lg border-2 border-emerald-500 bg-emerald-900/30 p-4">
                  <h3 className="text-base font-semibold text-emerald-200 mb-3 pb-2 border-b border-emerald-700/40">
                    Precio Final
                  </h3>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-bold text-emerald-100">TOTAL A COBRAR</span>
                    <span className="font-bold text-xl text-emerald-200">ARS $ {totalACobrarArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* MercadoLibre: Precio con comisión */}
                <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
                  <h3 className="text-base font-semibold text-emerald-200 mb-3 pb-2 border-b border-emerald-700/40">
                    MercadoLibre
                  </h3>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-300">Precio con comisión (+{comisionPlataformaPct}%)</span>
                    <span className="font-bold text-emerald-200">ARS $ {precioConComisionArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Distribución de Costos */}
                <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
                  <h3 className="text-base font-semibold text-emerald-200 mb-3 pb-2 border-b border-emerald-700/40">
                    Distribución de Costos
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-neutral-300">Material: {pctMaterial.toFixed(1)}%</span>
                    <span className="text-neutral-300">Margen Error: {pctMargenError.toFixed(1)}%</span>
                    <span className="text-emerald-300 font-medium">Ganancia: {pctGanancia.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Precio Unitario (compacto) */}
                <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
                  <h3 className="text-base font-semibold text-emerald-200 mb-3 pb-2 border-b border-emerald-700/40">
                    Precio Unitario
                  </h3>
                  <div className="grid gap-2">
                    {unitarioFinalArs !== null && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-neutral-300">Unitario ARS (final)</span>
                        <span className="font-semibold text-emerald-300">ARS $ {unitarioFinalArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {unitarioFinalUsd !== null && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-neutral-300">Unitario USD (final)</span>
                        <span className="font-semibold text-emerald-300">$ {unitarioFinalUsd.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección: Adicionales (si existen) */}
                {adicionalesTotalArs > 0 && adicionales.filter(a => a.concepto.trim() && (a.monto ?? 0) > 0).length > 0 && (
                  <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
                    <h3 className="text-base font-semibold text-emerald-200 mb-3 pb-2 border-b border-emerald-700/40">
                      Adicionales Aplicados
                    </h3>
                    <div className="space-y-2">
                      {adicionales
                        .filter(a => a.concepto.trim() && (a.monto ?? 0) > 0)
                        .map((adicional, idx) => {
                          const factor = adicional.por_unidad ? units : 1;
                          const montoTotal = (adicional.monto ?? 0) * factor;
                          const montoTotalArs = adicional.moneda === "USD" 
                            ? montoTotal * dollarValue 
                            : montoTotal;
                          const montoTotalUsd = adicional.moneda === "USD"
                            ? montoTotal
                            : montoTotal / dollarValue;
                          return (
                            <div key={idx} className="flex justify-between items-center py-1 text-xs">
                              <span className="text-neutral-300">
                                {adicional.concepto} ({adicional.por_unidad ? "por unidad" : "por trabajo"})
                              </span>
                              <span className="font-medium text-purple-300">
                                ${montoTotalArs.toFixed(2)} ARS (${montoTotalUsd.toFixed(2)} USD)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Campo de Notas/Condiciones */}
                <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
                  <h3 className="text-base font-semibold text-emerald-200 mb-2">
                    Notas / Condiciones
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ingrese notas o condiciones adicionales para el presupuesto..."
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    rows={3}
                  />
                </div>
              </>
            );
          })()}
          
          {/* Botones de acción */}
          <div className="mt-4 pt-4 border-t border-emerald-700/60 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSavePrint}
              disabled={isSaving || !printName.trim()}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando..." : "Guardar Impresión"}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!result) return;
                
                const precioCalculadoArs = result.precio_calculado_ars ?? result.costo_sugerido_total_local;
                const precioFinalArs = result.precio_final_ars ?? precioCalculadoArs;
                const precioFinalUsd = dollarValue > 0 ? precioFinalArs / dollarValue : null;
                const unitarioFinalArs = units > 0 ? precioFinalArs / units : null;
                const unitarioFinalUsd = precioFinalUsd !== null && units > 0 ? precioFinalUsd / units : null;
                const adicionalesTotalArs = result.adicionales_total_ars ?? 0;
                const adicionalesTotalUsd = result.adicionales_total_usd ?? (dollarValue > 0 ? adicionalesTotalArs / dollarValue : 0);
                
                try {
                  await generateQuotePdf({
                    formData: {
                      nombre: printName || "Impresión sin nombre",
                      descripcion: printDescription,
                      horas: hours,
                      unidades: units,
                      valorDolar: dollarValue,
                    },
                    result,
                    computedTotals: {
                      precioFinalArs,
                      precioFinalUsd,
                      unitarioFinalArs,
                      unitarioFinalUsd,
                      adicionalesTotalArs,
                      adicionalesTotalUsd,
                    },
                    adicionales: adicionales.filter(a => a.concepto.trim() && (a.monto ?? 0) > 0),
                    notes,
                  });
                } catch (error) {
                  console.error('Error generando PDF:', error);
                  setError('Error al generar el PDF. Por favor, intente nuevamente.');
                }
              }}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Descargar PDF (Presupuesto)
            </button>
          </div>
          <p className="text-xs text-neutral-400 text-center">
            La impresión se guardará en el historial para futuras consultas
          </p>
        </section>
      )}
    </div>
  );
}