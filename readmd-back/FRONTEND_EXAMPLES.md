# 🚀 Ejemplos de Frontend para CRMTA2 Multi-Tenant

Este archivo contiene ejemplos completos para integrar el backend CRMTA2 multi-tenant con diferentes frameworks de frontend.

## 📋 Tabla de Contenidos

- [React + TypeScript](#react--typescript)
- [Vue.js + TypeScript](#vuejs--typescript)
- [Angular + TypeScript](#angular--typescript)
- [Vanilla JavaScript](#vanilla-javascript)
- [Configuración Multi-Tenant](#configuración-multi-tenant)
- [Componentes Reutilizables](#componentes-reutilizables)

## React + TypeScript

### Instalación y Configuración

```bash
# Crear proyecto React con TypeScript
npx create-react-app crmta2-frontend --template typescript
cd crmta2-frontend

# Instalar dependencias adicionales
npm install axios
npm install @types/axios
```

### Configuración de API y Tenant

```typescript
// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Tipos TypeScript
export interface Tenant {
  id: number;
  name: string;
  database_name: string;
  access_key: string;
  is_active: boolean;
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
  rol?: string;
}

export interface Setting {
  id: number;
  key: string;
  value: number;
}

export interface Material {
  id: number;
  nombre: string;
  unidad_de_medida: string;
  cantidad_de_material: number;
  costo_por_unidad: number;
  costo_por_gramo: number;
}

// Servicio de gestión de tenants
class TenantService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8000/api',
    });
  }

  async getTenants(): Promise<Tenant[]> {
    const response = await this.api.get<Tenant[]>('/tenants');
    return response.data;
  }

  async createTenant(name: string): Promise<Tenant> {
    const response = await this.api.post<Tenant>('/tenants', {
      name,
      is_active: true
    });
    return response.data;
  }

  async loginTenant(name: string, accessKey: string): Promise<TenantLoginResponse> {
    const response = await this.api.post<TenantLoginResponse>('/tenants/login', {
      name,
      access_key: accessKey
    });
    return response.data;
  }

  async updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
    const response = await this.api.put<Tenant>(`/tenants/${id}`, data);
    return response.data;
  }

  async deleteTenant(id: number): Promise<void> {
    await this.api.delete(`/tenants/${id}`);
  }

  async regenerateTenantKey(id: number): Promise<Tenant> {
    const response = await this.api.post<Tenant>(`/tenants/${id}/regenerate-key`);
    return response.data;
  }
}

// Servicio principal de API con tenant
class ApiService {
  private api: AxiosInstance;
  private tenantService: TenantService;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8000/api',
    });
    
    this.tenantService = new TenantService();
    
    // Interceptor para agregar tenant y clave automáticamente
    this.api.interceptors.request.use((config) => {
      const currentTenant = localStorage.getItem('currentTenant');
      const currentTenantKey = localStorage.getItem('currentTenantKey');
      
      if (currentTenant && currentTenantKey) {
        config.headers['X-Tenant'] = currentTenant;
        config.headers['X-Tenant-Key'] = currentTenantKey;
      }
      
      return config;
    });

    // Interceptor para manejar errores de autenticación
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Credenciales incorrectas o expiradas
          localStorage.removeItem('currentTenant');
          localStorage.removeItem('currentTenantKey');
          window.location.href = '/login';
        } else if (error.response?.status === 404 && 
            error.response?.data?.detail?.includes('Tenant')) {
          // Redirigir a selección de tenant
          window.location.href = '/select-tenant';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos para tenants
  get tenant() {
    return this.tenantService;
  }

  // Login con tenant
  async loginTenant(tenantName: string, accessKey: string): Promise<TenantLoginResponse> {
    const response = await this.api.post<TenantLoginResponse>('/tenants/login', {
      name: tenantName,
      access_key: accessKey
    });
    return response.data;
  }

  // Métodos para máquinas
  async getMachines(): Promise<Machine[]> {
    const response = await this.api.get<Machine[]>('/machines');
    return response.data;
  }

  async getMachine(id: number): Promise<Machine> {
    const response = await this.api.get<Machine>(`/machines/${id}`);
    return response.data;
  }

  async createMachine(machine: Omit<Machine, 'id'>): Promise<Machine> {
    const response = await this.api.post<Machine>('/machines', machine);
    return response.data;
  }

  async updateMachine(id: number, machine: Partial<Machine>): Promise<Machine> {
    const response = await this.api.put<Machine>(`/machines/${id}`, machine);
    return response.data;
  }

  async deleteMachine(id: number): Promise<void> {
    await this.api.delete(`/machines/${id}`);
  }

  // Métodos para trabajadores
  async getWorkers(): Promise<Worker[]> {
    const response = await this.api.get<Worker[]>('/workers');
    return response.data;
  }

  async createWorker(worker: Omit<Worker, 'id'>): Promise<Worker> {
    const response = await this.api.post<Worker>('/workers', worker);
    return response.data;
  }

  async updateWorker(id: number, worker: Partial<Worker>): Promise<Worker> {
    const response = await this.api.put<Worker>(`/workers/${id}`, worker);
    return response.data;
  }

  async deleteWorker(id: number): Promise<void> {
    await this.api.delete(`/workers/${id}`);
  }

  // Métodos para materiales
  async getMaterials(): Promise<Material[]> {
    const response = await this.api.get<Material[]>('/materials');
    return response.data;
  }

  async getMaterial(id: number): Promise<Material> {
    const response = await this.api.get<Material>(`/materials/${id}`);
    return response.data;
  }

  async createMaterial(material: Omit<Material, 'id'>): Promise<Material> {
    const response = await this.api.post<Material>('/materials', material);
    return response.data;
  }

  async updateMaterial(id: number, material: Partial<Material>): Promise<Material> {
    const response = await this.api.put<Material>(`/materials/${id}`, material);
    return response.data;
  }

  async deleteMaterial(id: number): Promise<void> {
    await this.api.delete(`/materials/${id}`);
  }

  // Métodos para configuraciones
  async getSettings(): Promise<Setting[]> {
    const response = await this.api.get<Setting[]>('/settings');
    return response.data;
  }

  async createSetting(setting: Omit<Setting, 'id'>): Promise<Setting> {
    const response = await this.api.post<Setting>('/settings', setting);
    return response.data;
  }

  async updateSetting(id: number, setting: Partial<Setting>): Promise<Setting> {
    const response = await this.api.put<Setting>(`/settings/${id}`, setting);
    return response.data;
  }

  async deleteSetting(id: number): Promise<void> {
    await this.api.delete(`/settings/${id}`);
  }
}

// Instancia global del servicio
export const apiService = new ApiService();
```

### Componente de Selección de Tenant

```tsx
// src/components/TenantSelector.tsx
import React, { useState, useEffect } from 'react';
import { apiService, Tenant } from '../services/api';

interface TenantSelectorProps {
  onTenantSelect: (tenantName: string) => void;
}

const TenantSelector: React.FC<TenantSelectorProps> = ({ onTenantSelect }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenantName, setNewTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setError(null);
      const data = await apiService.tenant.getTenants();
      setTenants(data);
    } catch (err) {
      setError('Error cargando empresas');
      console.error('Error cargando tenants:', err);
    }
  };

  const createTenant = async () => {
    if (!newTenantName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newTenant = await apiService.tenant.createTenant(newTenantName);
      setTenants([...tenants, newTenant]);
      setNewTenantName('');
      onTenantSelect(newTenant.name);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error creando empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-selector">
      <h2>Seleccionar Empresa</h2>
      
      {error && <div className="error">{error}</div>}
      
      <div className="existing-tenants">
        <h3>Empresas Existentes</h3>
        {tenants.length === 0 ? (
          <p>No hay empresas registradas</p>
        ) : (
          <div className="tenant-list">
            {tenants.map(tenant => (
              <button 
                key={tenant.id}
                onClick={() => onTenantSelect(tenant.name)}
                className="tenant-button"
                disabled={!tenant.database_exists}
              >
                {tenant.name}
                {!tenant.database_exists && ' (Sin base de datos)'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="create-tenant">
        <h3>Crear Nueva Empresa</h3>
        <div className="input-group">
          <input
            type="text"
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            placeholder="Nombre de la empresa"
            onKeyPress={(e) => e.key === 'Enter' && createTenant()}
          />
          <button 
            onClick={createTenant} 
            disabled={loading || !newTenantName.trim()}
          >
            {loading ? 'Creando...' : 'Crear Empresa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantSelector;
```

### Componente de Gestión de Máquinas

```tsx
// src/components/MachineList.tsx
import React, { useState, useEffect } from 'react';
import { apiService, Machine } from '../services/api';

const MachineList: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMachines();
      setMachines(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error cargando máquinas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (machineData: Omit<Machine, 'id'>) => {
    try {
      const newMachine = await apiService.createMachine(machineData);
      setMachines([...machines, newMachine]);
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error creando máquina');
    }
  };

  const handleUpdate = async (id: number, machineData: Partial<Machine>) => {
    try {
      const updatedMachine = await apiService.updateMachine(id, machineData);
      setMachines(machines.map(m => m.id === id ? updatedMachine : m));
      setEditingMachine(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error actualizando máquina');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta máquina?')) {
      try {
        await apiService.deleteMachine(id);
        setMachines(machines.filter(m => m.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error eliminando máquina');
      }
    }
  };

  if (loading) return <div>Cargando máquinas...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="machine-list">
      <div className="header">
        <h2>Máquinas</h2>
        <button onClick={() => setShowForm(true)}>
          Agregar Máquina
        </button>
      </div>

      {showForm && (
        <MachineForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingMachine && (
        <MachineForm
          machine={editingMachine}
          onSubmit={(data) => handleUpdate(editingMachine.id, data)}
          onCancel={() => setEditingMachine(null)}
        />
      )}

      <table className="machines-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Costo</th>
            <th>Vida Útil (años)</th>
            <th>Costo Mantenimiento</th>
            <th>Costo por Hora</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {machines.map(machine => (
            <tr key={machine.id}>
              <td>{machine.nombre}</td>
              <td>${machine.costo.toLocaleString()}</td>
              <td>{machine.vida_util_anios}</td>
              <td>${machine.costo_mantenimiento.toLocaleString()}</td>
              <td>${((machine.costo + machine.costo_mantenimiento) / (machine.vida_util_anios * 365 * 24)).toFixed(2)}</td>
              <td>
                <button onClick={() => setEditingMachine(machine)}>
                  Editar
                </button>
                <button onClick={() => handleDelete(machine.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente de formulario para máquinas
interface MachineFormProps {
  machine?: Machine;
  onSubmit: (data: Omit<Machine, 'id'>) => void;
  onCancel: () => void;
}

const MachineForm: React.FC<MachineFormProps> = ({ machine, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: machine?.nombre || '',
    costo: machine?.costo || 0,
    vida_util_anios: machine?.vida_util_anios || 0,
    costo_mantenimiento: machine?.costo_mantenimiento || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="machine-form">
      <h3>{machine ? 'Editar Máquina' : 'Nueva Máquina'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre:</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Costo:</label>
          <input
            type="number"
            value={formData.costo}
            onChange={(e) => setFormData({...formData, costo: Number(e.target.value)})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Vida Útil (años):</label>
          <input
            type="number"
            step="0.1"
            value={formData.vida_util_anios}
            onChange={(e) => setFormData({...formData, vida_util_anios: Number(e.target.value)})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Costo Mantenimiento:</label>
          <input
            type="number"
            value={formData.costo_mantenimiento}
            onChange={(e) => setFormData({...formData, costo_mantenimiento: Number(e.target.value)})}
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="submit">
            {machine ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default MachineList;
```

### Componente de Gestión de Materiales

```tsx
// src/components/MaterialList.tsx
import React, { useState, useEffect } from 'react';
import { apiService, Material } from '../services/api';

const MaterialList: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMaterials();
      setMaterials(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error cargando materiales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (materialData: Omit<Material, 'id'>) => {
    try {
      const newMaterial = await apiService.createMaterial(materialData);
      setMaterials([...materials, newMaterial]);
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error creando material');
    }
  };

  const handleUpdate = async (id: number, materialData: Partial<Material>) => {
    try {
      const updatedMaterial = await apiService.updateMaterial(id, materialData);
      setMaterials(materials.map(m => m.id === id ? updatedMaterial : m));
      setEditingMaterial(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error actualizando material');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este material?')) {
      return;
    }

    try {
      await apiService.deleteMaterial(id);
      setMaterials(materials.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error eliminando material');
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMaterial(null);
  };

  if (loading) return <div>Cargando materiales...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="material-list">
      <div className="header">
        <h2>Gestión de Materiales</h2>
        <button onClick={() => setShowForm(true)}>
          Agregar Material
        </button>
      </div>

      {showForm && (
        <MaterialForm
          material={editingMaterial}
          onSubmit={editingMaterial ? 
            (data) => handleUpdate(editingMaterial.id, data) : 
            handleCreate
          }
          onCancel={handleCancel}
        />
      )}

      <div className="materials-grid">
        {materials.map(material => (
          <div key={material.id} className="material-card">
            <h3>{material.nombre}</h3>
            <div className="material-details">
              <p><strong>Unidad:</strong> {material.unidad_de_medida}</p>
              <p><strong>Cantidad:</strong> {material.cantidad_de_material}</p>
              <p><strong>Costo por unidad:</strong> ${material.costo_por_unidad}</p>
              <p><strong>Costo por gramo:</strong> ${material.costo_por_gramo}</p>
            </div>
            <div className="actions">
              <button onClick={() => handleEdit(material)}>
                Editar
              </button>
              <button 
                onClick={() => handleDelete(material.id)}
                className="delete"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Formulario de Material
interface MaterialFormProps {
  material?: Material | null;
  onSubmit: (data: Omit<Material, 'id'>) => void;
  onCancel: () => void;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ material, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: material?.nombre || '',
    unidad_de_medida: material?.unidad_de_medida || '',
    cantidad_de_material: material?.cantidad_de_material || 0,
    costo_por_unidad: material?.costo_por_unidad || 0,
    costo_por_gramo: material?.costo_por_gramo || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('costo') || name.includes('cantidad') ? 
        parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="form-overlay">
      <form onSubmit={handleSubmit} className="material-form">
        <h3>{material ? 'Editar Material' : 'Nuevo Material'}</h3>
        
        <div className="form-group">
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Unidad de Medida:</label>
          <input
            type="text"
            name="unidad_de_medida"
            value={formData.unidad_de_medida}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Cantidad de Material:</label>
          <input
            type="number"
            step="0.01"
            name="cantidad_de_material"
            value={formData.cantidad_de_material}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Costo por Unidad:</label>
          <input
            type="number"
            step="0.01"
            name="costo_por_unidad"
            value={formData.costo_por_unidad}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Costo por Gramo:</label>
          <input
            type="number"
            step="0.0001"
            name="costo_por_gramo"
            value={formData.costo_por_gramo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit">
            {material ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialList;
```

### App Principal

```tsx
// src/App.tsx
import React, { useState, useEffect } from 'react';
import TenantSelector from './components/TenantSelector';
import MachineList from './components/MachineList';
import WorkerList from './components/WorkerList';
import SettingList from './components/SettingList';
import './App.css';

const App: React.FC = () => {
  const [currentTenant, setCurrentTenant] = useState<string | null>(
    localStorage.getItem('currentTenant')
  );
  const [activeTab, setActiveTab] = useState('machines');

  useEffect(() => {
    if (currentTenant) {
      localStorage.setItem('currentTenant', currentTenant);
    } else {
      localStorage.removeItem('currentTenant');
    }
  }, [currentTenant]);

  const handleTenantSelect = (tenantName: string) => {
    setCurrentTenant(tenantName);
  };

  const handleLogout = () => {
    setCurrentTenant(null);
  };

  if (!currentTenant) {
    return <TenantSelector onTenantSelect={handleTenantSelect} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>CRMTA2 - {currentTenant}</h1>
        <button onClick={handleLogout} className="logout-btn">
          Cambiar Empresa
        </button>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'machines' ? 'active' : ''}
          onClick={() => setActiveTab('machines')}
        >
          Máquinas
        </button>
        <button 
          className={activeTab === 'workers' ? 'active' : ''}
          onClick={() => setActiveTab('workers')}
        >
          Trabajadores
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Configuraciones
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'machines' && <MachineList />}
        {activeTab === 'workers' && <WorkerList />}
        {activeTab === 'settings' && <SettingList />}
      </main>
    </div>
  );
};

export default App;
```

### Estilos CSS

```css
/* src/App.css */
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.app-nav {
  background: white;
  padding: 0 2rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 1rem;
}

.app-nav button {
  background: none;
  border: none;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.app-nav button.active {
  border-bottom-color: #3498db;
  color: #3498db;
}

.app-main {
  padding: 2rem;
}

.tenant-selector {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tenant-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.tenant-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.tenant-button:hover {
  background: #2980b9;
}

.tenant-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.input-group input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-group button {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.machine-list {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.machines-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.machines-table th,
.machines-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.machines-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.machine-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.form-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="submit"] {
  background: #3498db;
  color: white;
}

.form-actions button[type="button"] {
  background: #95a5a6;
  color: white;
}

.error {
  background: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}
```

## Vue.js + TypeScript

### Instalación

```bash
npm create vue@latest crmta2-frontend
cd crmta2-frontend
npm install axios
```

### Servicio de API

```typescript
// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

export interface Tenant {
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

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8000/api',
    });

    // Interceptor para agregar tenant
    this.api.interceptors.request.use((config) => {
      const currentTenant = localStorage.getItem('currentTenant');
      if (currentTenant) {
        config.headers['X-Tenant'] = currentTenant;
      }
      return config;
    });
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    const response = await this.api.get<Tenant[]>('/tenants');
    return response.data;
  }

  async createTenant(name: string): Promise<Tenant> {
    const response = await this.api.post<Tenant>('/tenants', {
      name,
      is_active: true
    });
    return response.data;
  }

  // Máquinas
  async getMachines(): Promise<Machine[]> {
    const response = await this.api.get<Machine[]>('/machines');
    return response.data;
  }

  async createMachine(machine: Omit<Machine, 'id'>): Promise<Machine> {
    const response = await this.api.post<Machine>('/machines', machine);
    return response.data;
  }

  async updateMachine(id: number, machine: Partial<Machine>): Promise<Machine> {
    const response = await this.api.put<Machine>(`/machines/${id}`, machine);
    return response.data;
  }

  async deleteMachine(id: number): Promise<void> {
    await this.api.delete(`/machines/${id}`);
  }
}

export const apiService = new ApiService();
```

### Composable para Tenants

```typescript
// src/composables/useTenants.ts
import { ref, computed } from 'vue';
import { apiService, type Tenant } from '@/services/api';

export function useTenants() {
  const tenants = ref<Tenant[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadTenants = async () => {
    try {
      loading.value = true;
      error.value = null;
      tenants.value = await apiService.getTenants();
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error cargando empresas';
    } finally {
      loading.value = false;
    }
  };

  const createTenant = async (name: string) => {
    try {
      loading.value = true;
      error.value = null;
      const newTenant = await apiService.createTenant(name);
      tenants.value.push(newTenant);
      return newTenant;
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error creando empresa';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setCurrentTenant = (tenantName: string) => {
    localStorage.setItem('currentTenant', tenantName);
  };

  const getCurrentTenant = () => {
    return localStorage.getItem('currentTenant');
  };

  return {
    tenants: computed(() => tenants.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadTenants,
    createTenant,
    setCurrentTenant,
    getCurrentTenant
  };
}
```

### Componente de Selección de Tenant

```vue
<!-- src/components/TenantSelector.vue -->
<template>
  <div class="tenant-selector">
    <h2>Seleccionar Empresa</h2>
    
    <div v-if="error" class="error">{{ error }}</div>
    
    <div class="existing-tenants">
      <h3>Empresas Existentes</h3>
      <div v-if="loading">Cargando...</div>
      <div v-else-if="tenants.length === 0" class="no-tenants">
        No hay empresas registradas
      </div>
      <div v-else class="tenant-list">
        <button 
          v-for="tenant in tenants"
          :key="tenant.id"
          @click="selectTenant(tenant.name)"
          :disabled="!tenant.database_exists"
          class="tenant-button"
        >
          {{ tenant.name }}
          <span v-if="!tenant.database_exists">(Sin base de datos)</span>
        </button>
      </div>
    </div>

    <div class="create-tenant">
      <h3>Crear Nueva Empresa</h3>
      <div class="input-group">
        <input
          v-model="newTenantName"
          type="text"
          placeholder="Nombre de la empresa"
          @keyup.enter="createTenant"
        />
        <button 
          @click="createTenant"
          :disabled="loading || !newTenantName.trim()"
        >
          {{ loading ? 'Creando...' : 'Crear Empresa' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTenants } from '@/composables/useTenants';

const emit = defineEmits<{
  tenantSelected: [tenantName: string]
}>();

const { tenants, loading, error, loadTenants, createTenant: createTenantApi, setCurrentTenant } = useTenants();

const newTenantName = ref('');

const selectTenant = (tenantName: string) => {
  setCurrentTenant(tenantName);
  emit('tenantSelected', tenantName);
};

const createTenant = async () => {
  if (!newTenantName.value.trim()) return;
  
  try {
    const newTenant = await createTenantApi(newTenantName.value);
    newTenantName.value = '';
    selectTenant(newTenant.name);
  } catch (err) {
    // Error ya manejado en el composable
  }
};

// Cargar tenants al montar el componente
loadTenants();
</script>

<style scoped>
.tenant-selector {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tenant-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.tenant-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.tenant-button:hover:not(:disabled) {
  background: #2980b9;
}

.tenant-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.input-group input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-group button {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  background: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}
</style>
```

## Angular + TypeScript

### Instalación

```bash
ng new crmta2-frontend
cd crmta2-frontend
npm install
```

### Servicio Angular

```typescript
// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Tenant {
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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';
  private currentTenantSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('currentTenant')
  );
  public currentTenant$ = this.currentTenantSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const currentTenant = this.currentTenantSubject.value;
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    if (currentTenant) {
      headers = headers.set('X-Tenant', currentTenant);
    }
    
    return headers;
  }

  setCurrentTenant(tenantName: string): void {
    this.currentTenantSubject.next(tenantName);
    localStorage.setItem('currentTenant', tenantName);
  }

  getCurrentTenant(): string | null {
    return this.currentTenantSubject.value;
  }

  // Tenants
  getTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.baseUrl}/tenants`);
  }

  createTenant(name: string): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.baseUrl}/tenants`, {
      name,
      is_active: true
    });
  }

  // Máquinas
  getMachines(): Observable<Machine[]> {
    return this.http.get<Machine[]>(`${this.baseUrl}/machines`, {
      headers: this.getHeaders()
    });
  }

  createMachine(machine: Omit<Machine, 'id'>): Observable<Machine> {
    return this.http.post<Machine>(`${this.baseUrl}/machines`, machine, {
      headers: this.getHeaders()
    });
  }

  updateMachine(id: number, machine: Partial<Machine>): Observable<Machine> {
    return this.http.put<Machine>(`${this.baseUrl}/machines/${id}`, machine, {
      headers: this.getHeaders()
    });
  }

  deleteMachine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/machines/${id}`, {
      headers: this.getHeaders()
    });
  }
}
```

### Componente de Selección de Tenant

```typescript
// src/app/components/tenant-selector/tenant-selector.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiService, Tenant } from '../../services/api.service';

@Component({
  selector: 'app-tenant-selector',
  templateUrl: './tenant-selector.component.html',
  styleUrls: ['./tenant-selector.component.css']
})
export class TenantSelectorComponent implements OnInit {
  @Output() tenantSelected = new EventEmitter<string>();

  tenants: Tenant[] = [];
  newTenantName = '';
  loading = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.apiService.getTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.error = null;
      },
      error: (err) => {
        this.error = 'Error cargando empresas';
        console.error('Error cargando tenants:', err);
      }
    });
  }

  selectTenant(tenantName: string): void {
    this.apiService.setCurrentTenant(tenantName);
    this.tenantSelected.emit(tenantName);
  }

  createTenant(): void {
    if (!this.newTenantName.trim()) return;

    this.loading = true;
    this.error = null;

    this.apiService.createTenant(this.newTenantName).subscribe({
      next: (newTenant) => {
        this.tenants.push(newTenant);
        this.newTenantName = '';
        this.selectTenant(newTenant.name);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error creando empresa';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
```

```html
<!-- src/app/components/tenant-selector/tenant-selector.component.html -->
<div class="tenant-selector">
  <h2>Seleccionar Empresa</h2>
  
  <div *ngIf="error" class="error">{{ error }}</div>
  
  <div class="existing-tenants">
    <h3>Empresas Existentes</h3>
    <div *ngIf="loading">Cargando...</div>
    <div *ngIf="!loading && tenants.length === 0" class="no-tenants">
      No hay empresas registradas
    </div>
    <div *ngIf="!loading && tenants.length > 0" class="tenant-list">
      <button 
        *ngFor="let tenant of tenants"
        (click)="selectTenant(tenant.name)"
        [disabled]="!tenant.database_exists"
        class="tenant-button"
      >
        {{ tenant.name }}
        <span *ngIf="!tenant.database_exists">(Sin base de datos)</span>
      </button>
    </div>
  </div>

  <div class="create-tenant">
    <h3>Crear Nueva Empresa</h3>
    <div class="input-group">
      <input
        [(ngModel)]="newTenantName"
        type="text"
        placeholder="Nombre de la empresa"
        (keyup.enter)="createTenant()"
      />
      <button 
        (click)="createTenant()"
        [disabled]="loading || !newTenantName.trim()"
      >
        {{ loading ? 'Creando...' : 'Crear Empresa' }}
      </button>
    </div>
  </div>
</div>
```

## Vanilla JavaScript

### Estructura de Archivos

```
crmta2-frontend/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── tenant-manager.js
│   ├── machine-manager.js
│   └── app.js
└── components/
    ├── tenant-selector.html
    └── machine-list.html
```

### Servicio de API

```javascript
// js/api.js
class ApiService {
  constructor() {
    this.baseUrl = 'http://localhost:8000/api';
    this.currentTenant = localStorage.getItem('currentTenant');
  }

  setCurrentTenant(tenantName) {
    this.currentTenant = tenantName;
    localStorage.setItem('currentTenant', tenantName);
  }

  getCurrentTenant() {
    return this.currentTenant;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    // Agregar tenant si existe
    if (this.currentTenant) {
      config.headers['X-Tenant'] = this.currentTenant;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en la petición');
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Tenants
  async getTenants() {
    return this.request('/tenants');
  }

  async createTenant(name) {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify({ name, is_active: true }),
    });
  }

  // Máquinas
  async getMachines() {
    return this.request('/machines');
  }

  async getMachine(id) {
    return this.request(`/machines/${id}`);
  }

  async createMachine(machine) {
    return this.request('/machines', {
      method: 'POST',
      body: JSON.stringify(machine),
    });
  }

  async updateMachine(id, machine) {
    return this.request(`/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(machine),
    });
  }

  async deleteMachine(id) {
    return this.request(`/machines/${id}`, {
      method: 'DELETE',
    });
  }

  // Trabajadores
  async getWorkers() {
    return this.request('/workers');
  }

  async createWorker(worker) {
    return this.request('/workers', {
      method: 'POST',
      body: JSON.stringify(worker),
    });
  }

  async updateWorker(id, worker) {
    return this.request(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(worker),
    });
  }

  async deleteWorker(id) {
    return this.request(`/workers/${id}`, {
      method: 'DELETE',
    });
  }

  // Configuraciones
  async getSettings() {
    return this.request('/settings');
  }

  async createSetting(setting) {
    return this.request('/settings', {
      method: 'POST',
      body: JSON.stringify(setting),
    });
  }

  async updateSetting(id, setting) {
    return this.request(`/settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(setting),
    });
  }

  async deleteSetting(id) {
    return this.request(`/settings/${id}`, {
      method: 'DELETE',
    });
  }
}

// Instancia global
const apiService = new ApiService();
```

### Gestor de Tenants

```javascript
// js/tenant-manager.js
class TenantManager {
  constructor() {
    this.api = apiService;
  }

  async loadTenants() {
    try {
      return await this.api.getTenants();
    } catch (error) {
      console.error('Error cargando tenants:', error);
      throw error;
    }
  }

  async createTenant(name) {
    try {
      const tenant = await this.api.createTenant(name);
      return tenant;
    } catch (error) {
      console.error('Error creando tenant:', error);
      throw error;
    }
  }

  selectTenant(tenantName) {
    this.api.setCurrentTenant(tenantName);
    this.onTenantSelected(tenantName);
  }

  onTenantSelected(tenantName) {
    // Evento personalizado
    const event = new CustomEvent('tenantSelected', {
      detail: { tenantName }
    });
    document.dispatchEvent(event);
  }

  getCurrentTenant() {
    return this.api.getCurrentTenant();
  }
}

const tenantManager = new TenantManager();
```

### Gestor de Máquinas

```javascript
// js/machine-manager.js
class MachineManager {
  constructor() {
    this.api = apiService;
    this.machines = [];
  }

  async loadMachines() {
    try {
      this.machines = await this.api.getMachines();
      this.renderMachines();
    } catch (error) {
      console.error('Error cargando máquinas:', error);
      this.showError('Error cargando máquinas');
    }
  }

  async createMachine(machineData) {
    try {
      const newMachine = await this.api.createMachine(machineData);
      this.machines.push(newMachine);
      this.renderMachines();
      this.hideForm();
    } catch (error) {
      console.error('Error creando máquina:', error);
      this.showError('Error creando máquina');
    }
  }

  async updateMachine(id, machineData) {
    try {
      const updatedMachine = await this.api.updateMachine(id, machineData);
      const index = this.machines.findIndex(m => m.id === id);
      if (index !== -1) {
        this.machines[index] = updatedMachine;
        this.renderMachines();
      }
      this.hideForm();
    } catch (error) {
      console.error('Error actualizando máquina:', error);
      this.showError('Error actualizando máquina');
    }
  }

  async deleteMachine(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta máquina?')) {
      try {
        await this.api.deleteMachine(id);
        this.machines = this.machines.filter(m => m.id !== id);
        this.renderMachines();
      } catch (error) {
        console.error('Error eliminando máquina:', error);
        this.showError('Error eliminando máquina');
      }
    }
  }

  renderMachines() {
    const container = document.getElementById('machines-container');
    if (!container) return;

    container.innerHTML = `
      <div class="machine-list">
        <div class="header">
          <h2>Máquinas</h2>
          <button onclick="machineManager.showForm()">Agregar Máquina</button>
        </div>
        
        <div id="error-message" class="error" style="display: none;"></div>
        
        <table class="machines-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Costo</th>
              <th>Vida Útil (años)</th>
              <th>Costo Mantenimiento</th>
              <th>Costo por Hora</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${this.machines.map(machine => `
              <tr>
                <td>${machine.nombre}</td>
                <td>$${machine.costo.toLocaleString()}</td>
                <td>${machine.vida_util_anios}</td>
                <td>$${machine.costo_mantenimiento.toLocaleString()}</td>
                <td>$${((machine.costo + machine.costo_mantenimiento) / (machine.vida_util_anios * 365 * 24)).toFixed(2)}</td>
                <td>
                  <button onclick="machineManager.showForm(${machine.id})">Editar</button>
                  <button onclick="machineManager.deleteMachine(${machine.id})">Eliminar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  showForm(machineId = null) {
    const machine = machineId ? this.machines.find(m => m.id === machineId) : null;
    
    const formHtml = `
      <div class="machine-form">
        <h3>${machine ? 'Editar Máquina' : 'Nueva Máquina'}</h3>
        <form onsubmit="machineManager.handleSubmit(event, ${machineId})">
          <div class="form-group">
            <label>Nombre:</label>
            <input type="text" name="nombre" value="${machine?.nombre || ''}" required>
          </div>
          
          <div class="form-group">
            <label>Costo:</label>
            <input type="number" name="costo" value="${machine?.costo || 0}" required>
          </div>
          
          <div class="form-group">
            <label>Vida Útil (años):</label>
            <input type="number" step="0.1" name="vida_util_anios" value="${machine?.vida_util_anios || 0}" required>
          </div>
          
          <div class="form-group">
            <label>Costo Mantenimiento:</label>
            <input type="number" name="costo_mantenimiento" value="${machine?.costo_mantenimiento || 0}" required>
          </div>
          
          <div class="form-actions">
            <button type="submit">${machine ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onclick="machineManager.hideForm()">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    const container = document.getElementById('machines-container');
    if (container) {
      container.innerHTML = formHtml + container.innerHTML;
    }
  }

  handleSubmit(event, machineId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const machineData = {
      nombre: formData.get('nombre'),
      costo: Number(formData.get('costo')),
      vida_util_anios: Number(formData.get('vida_util_anios')),
      costo_mantenimiento: Number(formData.get('costo_mantenimiento'))
    };

    if (machineId) {
      this.updateMachine(machineId, machineData);
    } else {
      this.createMachine(machineData);
    }
  }

  hideForm() {
    const form = document.querySelector('.machine-form');
    if (form) {
      form.remove();
    }
  }

  showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  }
}

const machineManager = new MachineManager();
```

### Aplicación Principal

```javascript
// js/app.js
class App {
  constructor() {
    this.api = apiService;
    this.tenantManager = tenantManager;
    this.machineManager = machineManager;
    this.currentTenant = null;
  }

  init() {
    this.checkCurrentTenant();
    this.setupEventListeners();
  }

  checkCurrentTenant() {
    const currentTenant = this.api.getCurrentTenant();
    if (currentTenant) {
      this.showMainApp(currentTenant);
    } else {
      this.showTenantSelector();
    }
  }

  setupEventListeners() {
    // Escuchar selección de tenant
    document.addEventListener('tenantSelected', (event) => {
      this.currentTenant = event.detail.tenantName;
      this.showMainApp(this.currentTenant);
    });

    // Escuchar cambio de tenant
    document.getElementById('change-tenant')?.addEventListener('click', () => {
      this.showTenantSelector();
    });
  }

  showTenantSelector() {
    document.body.innerHTML = `
      <div id="tenant-selector">
        <h1>CRMTA2 - Seleccionar Empresa</h1>
        <div id="tenant-content"></div>
      </div>
    `;
    this.renderTenantSelector();
  }

  async renderTenantSelector() {
    const container = document.getElementById('tenant-content');
    if (!container) return;

    try {
      const tenants = await this.tenantManager.loadTenants();
      
      container.innerHTML = `
        <div class="existing-tenants">
          <h2>Empresas Existentes</h2>
          <div class="tenant-list">
            ${tenants.map(tenant => `
              <button 
                onclick="app.selectTenant('${tenant.name}')"
                ${!tenant.database_exists ? 'disabled' : ''}
                class="tenant-button"
              >
                ${tenant.name}
                ${!tenant.database_exists ? ' (Sin base de datos)' : ''}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="create-tenant">
          <h2>Crear Nueva Empresa</h2>
          <div class="input-group">
            <input 
              type="text" 
              id="new-tenant-name" 
              placeholder="Nombre de la empresa"
            />
            <button onclick="app.createTenant()">Crear Empresa</button>
          </div>
        </div>
      `;
    } catch (error) {
      container.innerHTML = '<div class="error">Error cargando empresas</div>';
    }
  }

  selectTenant(tenantName) {
    this.tenantManager.selectTenant(tenantName);
  }

  async createTenant() {
    const input = document.getElementById('new-tenant-name');
    const name = input?.value.trim();
    
    if (!name) return;

    try {
      await this.tenantManager.createTenant(name);
      input.value = '';
      this.renderTenantSelector();
    } catch (error) {
      alert('Error creando empresa: ' + error.message);
    }
  }

  showMainApp(tenantName) {
    document.body.innerHTML = `
      <div id="main-app">
        <header class="app-header">
          <h1>CRMTA2 - ${tenantName}</h1>
          <button id="change-tenant">Cambiar Empresa</button>
        </header>
        
        <nav class="app-nav">
          <button onclick="app.showTab('machines')" class="tab-button active">Máquinas</button>
          <button onclick="app.showTab('workers')" class="tab-button">Trabajadores</button>
          <button onclick="app.showTab('settings')" class="tab-button">Configuraciones</button>
        </nav>
        
        <main class="app-main">
          <div id="content"></div>
        </main>
      </div>
    `;

    this.setupEventListeners();
    this.showTab('machines');
  }

  showTab(tabName) {
    // Actualizar botones de navegación
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[onclick="app.showTab('${tabName}')"]`).classList.add('active');

    // Mostrar contenido
    const content = document.getElementById('content');
    if (!content) return;

    switch (tabName) {
      case 'machines':
        this.machineManager.loadMachines();
        break;
      case 'workers':
        content.innerHTML = '<h2>Trabajadores - Próximamente</h2>';
        break;
      case 'settings':
        content.innerHTML = '<h2>Configuraciones - Próximamente</h2>';
        break;
    }
  }
}

// Inicializar aplicación
const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
```

### HTML Principal

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRMTA2 - Sistema de Costos 3D</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="app">
        <!-- El contenido se carga dinámicamente -->
    </div>

    <script src="js/api.js"></script>
    <script src="js/tenant-manager.js"></script>
    <script src="js/machine-manager.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

### Estilos CSS

```css
/* css/styles.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.app-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-nav {
  background: white;
  padding: 0 2rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 1rem;
}

.tab-button {
  background: none;
  border: none;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  border-bottom-color: #3498db;
  color: #3498db;
}

.app-main {
  padding: 2rem;
}

.tenant-selector {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tenant-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.tenant-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.tenant-button:hover:not(:disabled) {
  background: #2980b9;
}

.tenant-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.input-group input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-group button {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.machine-list {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.machines-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.machines-table th,
.machines-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.machines-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.machine-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.form-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="submit"] {
  background: #3498db;
  color: white;
}

.form-actions button[type="button"] {
  background: #95a5a6;
  color: white;
}

.error {
  background: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

button {
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

## 🎯 Configuración Multi-Tenant

### Variables de Entorno

```javascript
// config.js
const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  DEFAULT_TENANT_HEADER: 'X-Tenant',
  STORAGE_KEY: 'currentTenant',
  SUPPORTED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005'
  ]
};

export default CONFIG;
```

### Manejo de Errores

```javascript
// error-handler.js
class ErrorHandler {
  static handleApiError(error) {
    if (error.response?.status === 404 && 
        error.response?.data?.detail?.includes('Tenant')) {
      // Redirigir a selección de tenant
      window.location.href = '/select-tenant';
      return;
    }

    if (error.response?.status === 400) {
      return error.response.data.detail || 'Error de validación';
    }

    if (error.response?.status === 500) {
      return 'Error interno del servidor';
    }

    return 'Error desconocido';
  }

  static showError(message) {
    // Implementar según el framework
    console.error('Error:', message);
    alert(message);
  }
}
```

## 🚀 Próximos Pasos

1. **Implementar autenticación** - JWT tokens para seguridad
2. **Agregar validación** - Validación de formularios en frontend
3. **Implementar tests** - Tests unitarios y de integración
4. **Optimizar rendimiento** - Lazy loading y caching
5. **Agregar notificaciones** - Sistema de notificaciones en tiempo real
6. **Implementar PWA** - Funcionalidad offline
7. **Agregar internacionalización** - Soporte multi-idioma

¡Con estos ejemplos tienes todo lo necesario para construir un frontend completo que se integre perfectamente con el sistema multi-tenant de CRMTA2!