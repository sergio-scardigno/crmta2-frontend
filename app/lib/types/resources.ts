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
  costo_total_usd: number;
  costo_unitario_usd: number;
  costo_sugerido_total_usd: number;
  costo_sugerido_unitario_usd: number;
  costo_sugerido_total_local: number;
  costo_sugerido_unitario_local: number;
  costo_labor_usd?: number;
  precio_calculado_ars?: number;
  precio_final_ars?: number;
  adicionales_total_ars?: number;
  adicionales_total_usd?: number;
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
  valor_dolar: number;
  created_at: string;
  updated_at: string;
  // Relaciones
  machine?: Machine;
  worker?: Worker;
  material?: Material;
  extras?: PrintExtra[];
}

// Tipos para formularios de creación/edición
export type CreateTenantData = Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'database_exists'>;
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

export type CreatePrintData = Omit<Print, 'id' | 'created_at' | 'updated_at' | 'costo_maquinas_usd' | 'costo_trabajadores_usd' | 'costo_materiales_usd' | 'costo_desperdicio_usd' | 'costo_total_usd' | 'costo_unitario_usd' | 'costo_sugerido_total_usd' | 'costo_sugerido_unitario_usd' | 'costo_sugerido_total_local' | 'costo_sugerido_unitario_local' | 'tarifa_mano_obra_usd_h' | 'costo_labor_usd' | 'minimo_trabajo_ars' | 'precio_calculado_ars' | 'precio_final_ars' | 'machine' | 'worker' | 'material'> & {
  worker_id?: number | null; // Opcional: puede ser null para "Sin empleado"
};
export type UpdatePrintData = Partial<CreatePrintData>;

// Tipos para respuestas de error de la API
export interface ApiError {
  detail: string | Array<{
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

export type CreateFixedExpenseData = Omit<FixedExpense, 'id' | 'created_at' | 'updated_at'> & {
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

export type CreateSalaryData = Omit<Salary, 'id' | 'created_at' | 'updated_at'> & {
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
