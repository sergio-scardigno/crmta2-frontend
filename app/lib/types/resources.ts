export interface Tenant {
    id: number;
    name: string;
    database_name: string;
    access_key: string;
    is_active: boolean;
    marked_for_deletion: boolean;
    marked_for_deletion_at: string | null;
    created_at: string;
    updated_at: string;
    database_exists: boolean;
}

export interface TenantLogin {
    name: string;
    access_key: string;
}

export interface TenantLoginResponse {
    id: number;
    name: string;
    database_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    database_exists: boolean;
}

export interface Machine {
    id: number;
    nombre: string;
    costo: number;
    vida_util_anios: number;
    costo_mantenimiento: number;
}

export interface Worker {
    id: number;
    nombre: string;
    costo_por_hora: number;
    factor_trabajo: number;
    rol: string | null;
}

export interface Material {
    id: number;
    nombre: string;
    unidad_de_medida: string;
    cantidad_de_material: number;
    costo_por_unidad: number;
    costo_por_gramo: number;
}

// Para crear/actualizar materiales, el backend calcula y persiste los costos en USD
// (`costo_por_unidad`, `costo_por_gramo`) a partir de los campos *_local.
export type CreateMaterialData = Omit<
    Material,
    'id' | 'costo_por_unidad' | 'costo_por_gramo'
> & {
    costo_por_unidad_local?: number;
    costo_por_gramo_local?: number;
};
export type UpdateMaterialData = Partial<CreateMaterialData>;

export interface Setting {
    id: number;
    key: string;
    value: number;
    description?: string;
}

export interface CurrencyRate {
    id: number;
    currency: string;
    value: number;
    source: string;
    created_at: string;
}

export interface CostBreakdown {
    costo_maquinas_usd: number;
    costo_trabajadores_usd: number;
    costo_materiales_usd: number;
    costo_desperdicio_usd: number;
    costo_gastos_fijos_usd: number;
    costo_electricidad_usd?: number;
    costo_seguro_fallos_usd?: number;
    costo_base_usd?: number;
    costo_total_usd: number;
    costo_unitario_usd: number;
    costo_sugerido_total_usd: number;
    costo_sugerido_unitario_usd: number;
    costo_sugerido_total_local: number;
    costo_sugerido_unitario_local: number;
    comision_plataforma_usd?: number | null;
    costo_labor_usd?: number;
    precio_calculado_ars?: number;
    precio_final_ars?: number;
    adicionales_total_ars?: number;
    adicionales_total_usd?: number;
    referencia_tipo?: string | null;
    referencia_multiplicador?: number;
    precio_final_referencia_ars?: number;
    precio_final_referencia_usd?: number;
    total_costos_ars?: number;
    total_a_cobrar_ars?: number;
    precio_con_comision_ars?: number;
    margen_real_pct?: number;
    minimo_aplicado?: boolean;
}

export interface PrintExtra {
    id: number;
    concepto: string;
    moneda: string; // "ARS" | "USD"
    monto: number;
    por_unidad: boolean;
    monto_total_ars: number;
    monto_total_usd: number;
    created_at: string;
    updated_at: string;
}

// Payload de creación de extras (el backend calcula montos totales y timestamps)
export type CreatePrintExtraData = Omit<
    PrintExtra,
    'id' | 'monto_total_ars' | 'monto_total_usd' | 'created_at' | 'updated_at'
>;

export interface Print {
    id: number;
    nombre: string;
    descripcion?: string;
    horas_impresion: number;
    cantidad_unidades: number;
    porcentaje_desperdicio: number;
    margen_beneficio: number;
    machine_id: number;
    worker_id: number | null;
    material_id: number;
    cantidad_material_gramos: number;
    costo_maquinas_usd: number;
    costo_trabajadores_usd: number;
    costo_materiales_usd: number;
    costo_desperdicio_usd: number;
    costo_total_usd: number;
    costo_unitario_usd: number;
    costo_sugerido_total_usd: number;
    costo_sugerido_unitario_usd: number;
    costo_sugerido_total_local: number;
    costo_sugerido_unitario_local: number;
    tarifa_mano_obra_usd_h: number;
    costo_labor_usd: number;
    minimo_trabajo_ars: number;
    precio_calculado_ars: number;
    precio_final_ars: number;
    referencia_tipo: string | null;
    referencia_multiplicador: number;
    precio_final_referencia_ars: number;
    precio_final_referencia_usd: number;
    valor_dolar: number;
    precio_venta_ars?: number | null;
    ganancia_ars?: number | null;
    ganancia_usd?: number | null;
    margen_ganancia_pct?: number | null;
    created_at: string;
    updated_at: string;
    // Relaciones
    machine?: Machine;
    worker?: Worker;
    material?: Material;
    extras?: PrintExtra[];
}

// Tipos para formularios de creación/edición
export type CreateTenantData = Omit<
    Tenant,
    'id' | 'created_at' | 'updated_at' | 'database_exists'
>;
export type UpdateTenantData = Partial<CreateTenantData>;

export type CreateMachineData = Omit<Machine, 'id'>;
export type UpdateMachineData = Partial<Machine>;

export type CreateWorkerData = Omit<Worker, 'id'> & {
    costo_por_hora_local?: number; // Opcional: si se proporciona, se convierte a USD
};
export type UpdateWorkerData = Partial<Worker> & {
    costo_por_hora_local?: number; // Opcional: si se proporciona, se convierte a USD
};

export type CreateSettingData = Omit<Setting, 'id'>;
export type UpdateSettingData = Partial<Setting>;

export type CreatePrintData = Omit<
    Print,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'machine'
    | 'worker'
    | 'material'
    | 'extras'
> & {
    worker_id?: number | null; // Opcional: puede ser null para "Sin empleado"
    extras?: CreatePrintExtraData[];
};
export type UpdatePrintData = Partial<CreatePrintData>;

// Tipos para respuestas de error de la API
export interface ApiError {
    detail:
        | string
        | Array<{
              type: string;
              loc: string[];
              msg: string;
          }>;
}

// Gastos Fijos
export interface FixedExpense {
    id: number;
    tipo_gasto: string;
    monto_usd: number;
    categoria: string | null;
    created_at: string;
    updated_at: string;
}

// Para crear un gasto fijo aceptamos monto en USD o en ARS.
// El backend convierte ARS->USD cuando se envía `monto_ars`.
export type CreateFixedExpenseData = Omit<
    FixedExpense,
    'id' | 'created_at' | 'updated_at' | 'monto_usd'
> & {
    monto_usd?: number;
    monto_ars?: number; // Opcional: si se proporciona, se convierte a USD
};
export type UpdateFixedExpenseData = Partial<CreateFixedExpenseData> & {
    monto_ars?: number; // Opcional: si se proporciona, se convierte a USD
};

// Salarios
export interface Salary {
    id: number;
    tipo_trabajador: string;
    salario_mensual: number;
    created_at: string;
    updated_at: string;
}

// Para crear un salario aceptamos monto en USD o en ARS.
// El backend convierte ARS->USD cuando se envía `salario_mensual_ars`.
export type CreateSalaryData = Omit<
    Salary,
    'id' | 'created_at' | 'updated_at' | 'salario_mensual'
> & {
    salario_mensual?: number;
    salario_mensual_ars?: number; // Opcional: si se proporciona, se convierte a USD
};
export type UpdateSalaryData = Partial<CreateSalaryData> & {
    salario_mensual_ars?: number; // Opcional: si se proporciona, se convierte a USD
};

// Modelos 3D
export interface Model3D {
    id: number;
    nombre: string;
    dimension_x: number;
    dimension_y: number;
    dimension_z: number;
    horas_estimadas: number;
}

export type CreateModel3DData = Omit<Model3D, 'id'>;
export type UpdateModel3DData = Partial<Model3D>;

// Resumen de totales de impresiones
export interface PrintSummary {
    prints_count: number;
    units_total: number;
    hours_total: number;
    ventas_ars_total: number;
    ventas_usd_total: number;
    costos_usd_total: number;
    costos_ars_total: number;
    empleados_usd_total: number;
    empleados_ars_total: number;
    gastos_usd_total: number;
    gastos_ars_total: number;
    ganancia_usd_total: number;
    ganancia_ars_total: number;
    adicionales_ars_total: number;
    adicionales_usd_total: number;
    cargo_fijo_ars_total: number;
}
