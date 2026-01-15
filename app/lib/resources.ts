import { api } from './api';
import type {
    CostBreakdown,
    CurrencyRate,
    FixedExpense,
    Machine,
    Material,
    Model3D,
    Print,
    PrintSummary,
    Salary,
    Setting,
    Tenant,
    TenantLogin,
    TenantLoginResponse,
    Worker,
    CreateFixedExpenseData,
    CreateMaterialData,
    CreateModel3DData,
    CreatePrintData,
    CreateSalaryData,
    UpdateFixedExpenseData,
    UpdateMaterialData,
    UpdateModel3DData,
    UpdatePrintData,
    UpdateSalaryData,
} from './types/resources';

type CalculatePayload = {
    horas_impresion: number;
    maquinas_ids: number[];
    trabajadores_ids: number[];
    materiales: Array<{
        id_material: number;
        cantidad_usada: number;
        desperdicio?: number;
    }>;
    valor_dolar?: number;
    cantidad_unidades: number;
    beneficio?: number;
    tiempo_preparacion_minutos?: number;
    tiempo_post_proceso_minutos?: number;
    tiempo_disenio_horas?: number;
    minimo_trabajo_ars?: number;
    tarifa_mano_obra_usd_h?: number;
    adicionales?: Array<{
        concepto: string;
        moneda?: string; // "ARS" | "USD"
        monto: number;
        por_unidad?: boolean;
    }>;
};

// Tenants - CRUD completo con autenticación por claves
export async function fetchTenants() {
    return api.get<Tenant[]>('/tenants');
}

export async function fetchTenant(id: number) {
    return api.get<Tenant>(`/tenants/${id}`);
}

export async function createTenant(data: { name: string; is_active: boolean }) {
    return api.post<Tenant>('/tenants', data);
}

export async function loginTenant(data: TenantLogin) {
    return api.post<TenantLoginResponse>('/tenants/login', data);
}

export async function updateTenant(
    id: number,
    data: Partial<{ name: string; is_active: boolean }>
) {
    return api.put<Tenant>(`/tenants/${id}`, data);
}

export async function deleteTenant(id: number) {
    return api.delete<void>(`/tenants/${id}`);
}

export async function regenerateTenantKey(id: number) {
    return api.post<Tenant>(`/tenants/${id}/regenerate-key`, {});
}

export async function createTenantDatabase(id: number) {
    return api.post<void>(`/tenants/${id}/database/create`, {});
}

export async function deleteTenantDatabase(id: number) {
    return api.delete<void>(`/tenants/${id}/database`);
}

export async function markTenantForDeletion(id: number) {
    return api.put<Tenant>(`/tenants/${id}/mark-for-deletion`, {});
}

export async function unmarkTenantForDeletion(id: number) {
    return api.put<Tenant>(`/tenants/${id}/unmark-for-deletion`, {});
}

export async function fetchTenantsMarkedForDeletion() {
    return api.get<Tenant[]>('/tenants/marked-for-deletion');
}

// Funciones de admin (requieren autenticación admin)
export async function adminDeleteTenant(id: number) {
    return api.delete<{ message: string }>(`/admin/tenants/${id}`);
}

export async function adminListTenants() {
    return api.get<Tenant[]>('/admin/tenants');
}

export async function adminMarkTenantForDeletion(id: number) {
    return api.put<Tenant>(`/admin/tenants/${id}/mark-for-deletion`, {});
}

export async function adminUnmarkTenantForDeletion(id: number) {
    return api.put<Tenant>(`/admin/tenants/${id}/unmark-for-deletion`, {});
}

// Máquinas - CRUD completo
export async function fetchMachines() {
    return api.get<Machine[]>('/machines');
}

export async function fetchMachine(id: number) {
    return api.get<Machine>(`/machines/${id}`);
}

export async function createMachine(data: Omit<Machine, 'id'>) {
    return api.post<Machine>('/machines', data);
}

export async function updateMachine(id: number, data: Partial<Machine>) {
    return api.put<Machine>(`/machines/${id}`, data);
}

export async function deleteMachine(id: number) {
    return api.delete<void>(`/machines/${id}`);
}

// Trabajadores - CRUD completo
export async function fetchWorkers() {
    return api.get<Worker[]>('/workers');
}

export async function fetchWorker(id: number) {
    return api.get<Worker>(`/workers/${id}`);
}

export async function createWorker(data: Omit<Worker, 'id'>) {
    return api.post<Worker>('/workers', data);
}

export async function updateWorker(id: number, data: Partial<Worker>) {
    return api.put<Worker>(`/workers/${id}`, data);
}

export async function deleteWorker(id: number) {
    return api.delete<void>(`/workers/${id}`);
}

// Materiales - CRUD completo
export async function fetchMaterials() {
    return api.get<Material[]>('/materials');
}

export async function fetchMaterial(id: number) {
    return api.get<Material>(`/materials/${id}`);
}

export async function createMaterial(data: CreateMaterialData) {
    return api.post<Material>('/materials', data);
}

export async function updateMaterial(id: number, data: UpdateMaterialData) {
    return api.put<Material>(`/materials/${id}`, data);
}

export async function deleteMaterial(id: number) {
    return api.delete<void>(`/materials/${id}`);
}

// Configuraciones - CRUD completo
export async function fetchSettings() {
    return api.get<Setting[]>('/settings');
}

export async function fetchSetting(id: number) {
    return api.get<Setting>(`/settings/${id}`);
}

export async function fetchSettingByKey(key: string) {
    return api.get<Setting>(`/settings/key/${key}`);
}

export async function createSetting(data: Omit<Setting, 'id'>) {
    return api.post<Setting>('/settings', data);
}

export async function updateSetting(id: number, data: Partial<Setting>) {
    return api.put<Setting>(`/settings/${id}`, data);
}

export async function updateSettingByKey(key: string, data: Partial<Setting>) {
    return api.put<Setting>(`/settings/key/${key}`, data);
}

export async function deleteSetting(id: number) {
    return api.delete<void>(`/settings/${id}`);
}

// Funciones legacy para compatibilidad
export async function fetchBenefit() {
    return api.get<Setting>('/settings/benefit');
}

// Moneda
export async function fetchCurrencyRate(refresh = false) {
    const suffix = refresh ? '?refresh=true' : '';
    return api.get<CurrencyRate>(`/currency/latest${suffix}`);
}

// Cálculo de costos
export async function calculateCost(payload: CalculatePayload) {
    return api.post<CostBreakdown>('/costs/calculate', payload);
}

// Impresiones - CRUD completo
export async function fetchPrints() {
    return api.get<Print[]>('/prints');
}

export async function fetchPrint(id: number) {
    return api.get<Print>(`/prints/${id}`);
}

export async function createPrint(data: CreatePrintData) {
    return api.post<Print>('/prints', data);
}

export async function updatePrint(id: number, data: UpdatePrintData) {
    return api.put<Print>(`/prints/${id}`, data);
}

export async function deletePrint(id: number) {
    return api.delete<void>(`/prints/${id}`);
}

// Función para crear impresión desde cálculo de costos
export async function createPrintFromCalculation(
    printData: Omit<
        CreatePrintData,
        | 'costo_maquinas_usd'
        | 'costo_trabajadores_usd'
        | 'costo_materiales_usd'
        | 'costo_desperdicio_usd'
        | 'costo_total_usd'
        | 'costo_unitario_usd'
        | 'costo_sugerido_total_usd'
        | 'costo_sugerido_unitario_usd'
        | 'costo_sugerido_total_local'
        | 'costo_sugerido_unitario_local'
        | 'valor_dolar'
        | 'tarifa_mano_obra_usd_h'
        | 'costo_labor_usd'
        | 'minimo_trabajo_ars'
        | 'precio_calculado_ars'
        | 'precio_final_ars'
    >,
    costBreakdown: CostBreakdown & {
        tarifa_mano_obra_usd_h?: number;
        minimo_trabajo_ars?: number;
    },
    valorDolar: number
) {
    const fullPrintData: CreatePrintData = {
        ...printData,
        costo_maquinas_usd: costBreakdown.costo_maquinas_usd,
        costo_trabajadores_usd: costBreakdown.costo_trabajadores_usd,
        costo_materiales_usd: costBreakdown.costo_materiales_usd,
        costo_desperdicio_usd: costBreakdown.costo_desperdicio_usd,
        costo_total_usd: costBreakdown.costo_total_usd,
        costo_unitario_usd: costBreakdown.costo_unitario_usd,
        costo_sugerido_total_usd: costBreakdown.costo_sugerido_total_usd,
        costo_sugerido_unitario_usd: costBreakdown.costo_sugerido_unitario_usd,
        costo_sugerido_total_local: costBreakdown.costo_sugerido_total_local,
        costo_sugerido_unitario_local:
            costBreakdown.costo_sugerido_unitario_local,
        tarifa_mano_obra_usd_h: costBreakdown.tarifa_mano_obra_usd_h ?? 0,
        costo_labor_usd: (costBreakdown as any).costo_labor_usd ?? 0,
        minimo_trabajo_ars: costBreakdown.minimo_trabajo_ars ?? 0,
        precio_calculado_ars:
            (costBreakdown as any).precio_calculado_ars ??
            costBreakdown.costo_sugerido_total_local,
        precio_final_ars:
            (costBreakdown as any).precio_final_ars ??
            costBreakdown.costo_sugerido_total_local,
        valor_dolar: valorDolar,
    };

    return createPrint(fullPrintData);
}

// Gastos Fijos - CRUD completo
export async function fetchFixedExpenses() {
    return api.get<FixedExpense[]>('/fixed-expenses');
}

export async function fetchFixedExpense(id: number) {
    return api.get<FixedExpense>(`/fixed-expenses/${id}`);
}

export async function createFixedExpense(data: CreateFixedExpenseData) {
    return api.post<FixedExpense>('/fixed-expenses', data);
}

export async function updateFixedExpense(
    id: number,
    data: UpdateFixedExpenseData
) {
    return api.put<FixedExpense>(`/fixed-expenses/${id}`, data);
}

export async function deleteFixedExpense(id: number) {
    return api.delete<void>(`/fixed-expenses/${id}`);
}

export async function fetchFixedExpensesMonth(
    categories: string[] = ['luz', 'agua']
) {
    const params = new URLSearchParams();
    categories.forEach((cat) => params.append('categories', cat));
    return api.get<FixedExpense[]>(
        `/fixed-expenses/month?${params.toString()}`
    );
}

// Salarios - CRUD completo
export async function fetchSalaries() {
    return api.get<Salary[]>('/salaries');
}

export async function fetchSalary(id: number) {
    return api.get<Salary>(`/salaries/${id}`);
}

export async function createSalary(data: CreateSalaryData) {
    return api.post<Salary>('/salaries', data);
}

export async function updateSalary(id: number, data: UpdateSalaryData) {
    return api.put<Salary>(`/salaries/${id}`, data);
}

export async function deleteSalary(id: number) {
    return api.delete<void>(`/salaries/${id}`);
}

export async function fetchDesignerSalary() {
    return api.get<Salary>('/salaries/designer');
}

// Modelos 3D - CRUD completo
export async function fetchModels3D() {
    return api.get<Model3D[]>('/models3d');
}

export async function fetchModel3D(id: number) {
    return api.get<Model3D>(`/models3d/${id}`);
}

export async function createModel3D(data: CreateModel3DData) {
    return api.post<Model3D>('/models3d', data);
}

export async function updateModel3D(id: number, data: UpdateModel3DData) {
    return api.put<Model3D>(`/models3d/${id}`, data);
}

export async function deleteModel3D(id: number) {
    return api.delete<void>(`/models3d/${id}`);
}

// Resumen de totales de impresiones
export async function fetchPrintsSummary(params?: {
    start_date?: string;
    end_date?: string;
    include_labor?: boolean;
}) {
    const queryParams = new URLSearchParams();
    if (params?.start_date) {
        queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
        queryParams.append('end_date', params.end_date);
    }
    if (params?.include_labor !== undefined) {
        queryParams.append('include_labor', params.include_labor.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
        ? `/prints/summary?${queryString}`
        : '/prints/summary';

    return api.get<PrintSummary>(url);
}
