# CRMTA2 Backend

Backend FastAPI que replica y amplía la lógica de costos del proyecto CRMTA original. Expone endpoints REST completos para gestionar recursos base (máquinas, trabajadores, materiales, configuraciones) y calcular costos de impresiones 3D reutilizando datos persistidos.

## 🏢 Arquitectura Multi-Tenant

Este backend implementa una arquitectura multi-tenant donde cada usuario/cliente tiene su propia base de datos aislada. Esto permite:

- **Aislamiento completo** de datos entre diferentes clientes
- **Escalabilidad** independiente por tenant
- **Seguridad** mejorada con separación de datos
- **Personalización** específica por cliente

## Requisitos

- Python 3.10+
- pip
- (Opcional) `uv`/`pipx` para aislar herramientas CLI

## Instalación rápida

```bash
cd crmta2/backend
python -m venv .venv
source .venv/Scripts/activate  # PowerShell: .\.venv\Scripts\Activate.ps1
pip install -e .[dev]
```

## Migraciones y seed

```bash
alembic upgrade head
python scripts/seed.py
```

El `seed.py` crea datos de ejemplo (máquinas, trabajadores, materiales, margen) e intenta obtener la cotización del dólar a través de `https://dolarapi.com/v1/dolares/blue`. Si la API externa no responde, el proceso continúa sin interrumpir el resto del seed.

## Ejecución del servidor

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La documentación interactiva queda disponible en:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

## 🏢 Gestión de Tenants

### Crear un nuevo tenant
```bash
curl -X POST "http://localhost:8000/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{"name": "empresa_abc", "is_active": true}'
```

### Listar todos los tenants
```bash
curl -X GET "http://localhost:8000/api/tenants"
```

### Usar un tenant específico
Para todas las operaciones de recursos, incluir el header `X-Tenant`:

```bash
curl -X GET "http://localhost:8000/api/machines" \
  -H "X-Tenant: empresa_abc"
```

O usar el parámetro de query:
```bash
curl -X GET "http://localhost:8000/api/machines?tenant=empresa_abc"
```

## API Endpoints

### 🏢 Tenants (`/api/tenants`)
- `GET /tenants` - Listar todos los tenants
- `GET /tenants/{id}` - Obtener tenant específico
- `POST /tenants` - Crear nuevo tenant (y su base de datos) - Devuelve clave de acceso
- `POST /tenants/login` - Login con nombre y clave de acceso
- `PUT /tenants/{id}` - Actualizar tenant
- `DELETE /tenants/{id}` - Eliminar tenant (y su base de datos)
- `POST /tenants/{id}/regenerate-key` - Regenerar clave de acceso
- `POST /tenants/{id}/database/create` - Crear base de datos para tenant existente
- `DELETE /tenants/{id}/database` - Eliminar base de datos del tenant

### 🔧 Máquinas (`/api/machines`)
- `GET /machines` - Listar todas las máquinas
- `GET /machines/{id}` - Obtener máquina específica
- `POST /machines` - Crear nueva máquina
- `PUT /machines/{id}` - Actualizar máquina
- `DELETE /machines/{id}` - Eliminar máquina

### 👥 Trabajadores (`/api/workers`)
- `GET /workers` - Listar todos los trabajadores
- `GET /workers/{id}` - Obtener trabajador específico
- `POST /workers` - Crear nuevo trabajador
- `PUT /workers/{id}` - Actualizar trabajador
- `DELETE /workers/{id}` - Eliminar trabajador

### ⚙️ Configuraciones (`/api/settings`)
- `GET /settings` - Listar todas las configuraciones
- `GET /settings/{id}` - Obtener configuración por ID
- `GET /settings/key/{key}` - Obtener configuración por clave
- `POST /settings` - Crear nueva configuración
- `PUT /settings/{id}` - Actualizar configuración por ID
- `PUT /settings/key/{key}` - Actualizar configuración por clave
- `DELETE /settings/{id}` - Eliminar configuración

### 📦 Materiales (`/api/materials`)
- `GET /materials` - Listar todos los materiales
- `GET /materials/{id}` - Obtener material específico
- `POST /materials` - Crear nuevo material
- `PUT /materials/{id}` - Actualizar material
- `DELETE /materials/{id}` - Eliminar material

### 💰 Cálculo de Costos (`/api/costs`)
- `POST /costs/calculate` - Calcula costos y precios sugeridos

### 🌍 Moneda (`/api/currency`)
- `GET /currency/latest?refresh=false` - Última cotización del dólar

### 🔧 Endpoints Legacy
- `GET /settings/benefit` - Margen de beneficio configurado

## Esquemas de Datos

### Máquina
```json
{
  "id": 1,
  "nombre": "Impresora 3D Modelo A",
  "costo": 50000.0,
  "vida_util_anios": 5.0,
  "costo_mantenimiento": 5000.0
}
```

### Trabajador
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "costo_por_hora": 25.0,
  "factor_trabajo": 0.3,
  "rol": "Operador"
}
```

### Configuración
```json
{
  "id": 1,
  "key": "margen_de_beneficio",
  "value": 0.15
}
```

### Material
```json
{
  "id": 1,
  "nombre": "PLA Blanco",
  "unidad_de_medida": "gramos",
  "cantidad_de_material": 1000.0,
  "costo_por_unidad": 25.50,
  "costo_por_gramo": 0.0255
}
```

## 🚀 Desarrollo Frontend

### Configuración CORS
El backend está configurado para aceptar peticiones desde los siguientes orígenes:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:3003`
- `http://localhost:3004`
- `http://localhost:3005`

### 🏢 Configuración Multi-Tenant para Frontend

#### 1. Gestión de Tenants con Claves de Acceso
El frontend debe implementar un sistema de selección de tenant con autenticación por clave:

```javascript
// Servicio de gestión de tenants con claves
class TenantService {
  constructor() {
    this.currentTenant = localStorage.getItem('currentTenant');
    this.currentTenantKey = localStorage.getItem('currentTenantKey');
  }

  // Crear nuevo tenant (devuelve clave de acceso)
  async createTenant(tenantName) {
    const response = await fetch('http://localhost:8000/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tenantName, is_active: true })
    });
    const tenant = await response.json();
    
    // Guardar automáticamente la clave
    if (tenant.access_key) {
      this.setCurrentTenant(tenant.name, tenant.access_key);
    }
    
    return tenant;
  }

  // Login con nombre y clave
  async loginTenant(tenantName, accessKey) {
    const response = await fetch('http://localhost:8000/api/tenants/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tenantName, access_key: accessKey })
    });
    
    if (response.ok) {
      const tenant = await response.json();
      this.setCurrentTenant(tenant.name, accessKey);
      return tenant;
    }
    
    throw new Error('Credenciales incorrectas');
  }

  // Listar tenants disponibles (solo nombres, sin claves)
  async getTenants() {
    const response = await fetch('http://localhost:8000/api/tenants');
    return response.json();
  }

  // Seleccionar tenant actual con clave
  setCurrentTenant(tenantName, tenantKey) {
    this.currentTenant = tenantName;
    this.currentTenantKey = tenantKey;
    localStorage.setItem('currentTenant', tenantName);
    localStorage.setItem('currentTenantKey', tenantKey);
  }

  // Obtener tenant actual
  getCurrentTenant() {
    return this.currentTenant;
  }

  // Obtener clave actual
  getCurrentTenantKey() {
    return this.currentTenantKey;
  }

  // Cerrar sesión
  logout() {
    this.currentTenant = null;
    this.currentTenantKey = null;
    localStorage.removeItem('currentTenant');
    localStorage.removeItem('currentTenantKey');
  }
}
```

#### 2. Configuración de API con Tenant y Clave
```javascript
// Configuración global para axios
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Interceptor para agregar tenant y clave automáticamente
api.interceptors.request.use((config) => {
  const currentTenant = localStorage.getItem('currentTenant');
  const currentTenantKey = localStorage.getItem('currentTenantKey');
  
  if (currentTenant && currentTenantKey) {
    config.headers['X-Tenant'] = currentTenant;
    config.headers['X-Tenant-Key'] = currentTenantKey;
  }
  
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Credenciales incorrectas o expiradas
      localStorage.removeItem('currentTenant');
      localStorage.removeItem('currentTenantKey');
      window.location.href = '/login';
    } else if (error.response?.status === 404 && error.response?.data?.detail?.includes('Tenant')) {
      // Tenant no encontrado
      window.location.href = '/select-tenant';
    }
    return Promise.reject(error);
  }
);
```

#### 3. Componente de Login/Selección de Tenant
```jsx
// React - Componente de login y selección de tenant
import React, { useState, useEffect } from 'react';

const TenantLogin = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' o 'create'
  const [tenants, setTenants] = useState([]);
  const [loginData, setLoginData] = useState({ name: '', accessKey: '' });
  const [newTenantName, setNewTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tenants');
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error('Error cargando tenants:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.name.trim() || !loginData.accessKey.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/tenants/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: loginData.name,
          access_key: loginData.accessKey
        })
      });
      
      if (response.ok) {
        const tenant = await response.json();
        onLogin(tenant.name, loginData.accessKey);
      } else {
        setError('Nombre de empresa o clave incorrectos');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async (e) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTenantName, is_active: true })
      });
      
      if (response.ok) {
        const newTenant = await response.json();
        setTenants([...tenants, newTenant]);
        setNewTenantName('');
        onLogin(newTenant.name, newTenant.access_key);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error creando empresa');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-login">
      <h2>Acceso al Sistema</h2>
      
      <div className="mode-selector">
        <button 
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Iniciar Sesión
        </button>
        <button 
          className={mode === 'create' ? 'active' : ''}
          onClick={() => setMode('create')}
        >
          Crear Empresa
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="login-form">
          <h3>Iniciar Sesión</h3>
          
          <div className="form-group">
            <label>Empresa:</label>
            <select
              value={loginData.name}
              onChange={(e) => setLoginData({...loginData, name: e.target.value})}
              required
            >
              <option value="">Seleccionar empresa</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.name}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Clave de Acceso:</label>
            <input
              type="password"
              value={loginData.accessKey}
              onChange={(e) => setLoginData({...loginData, accessKey: e.target.value})}
              placeholder="Ingresa tu clave de acceso"
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      ) : (
        <form onSubmit={createTenant} className="create-form">
          <h3>Crear Nueva Empresa</h3>
          
          <div className="form-group">
            <label>Nombre de la Empresa:</label>
            <input
              type="text"
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              placeholder="Nombre de la empresa"
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Empresa'}
          </button>
          
          <p className="info">
            Se generará automáticamente una clave de acceso única para tu empresa.
          </p>
        </form>
      )}
    </div>
  );
};

export default TenantLogin;
```

### 📋 Ejemplos de Uso para Frontend

#### Obtener máquinas (con tenant y clave automáticos)
```javascript
// Con axios configurado con interceptor
const machines = await api.get('/machines');

// Con fetch manual
const response = await fetch('http://localhost:8000/api/machines', {
  headers: { 
    'X-Tenant': 'mi_empresa',
    'X-Tenant-Key': 'MI_CLAVE_ACCESO'
  }
});
const machines = await response.json();
```

#### Crear nueva empresa
```javascript
const newCompany = await fetch('http://localhost:8000/api/tenants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Mi Empresa', is_active: true })
});
const company = await newCompany.json();
console.log('Clave de acceso:', company.access_key);
```

#### Login con empresa existente
```javascript
const login = await fetch('http://localhost:8000/api/tenants/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    name: 'Mi Empresa', 
    access_key: 'MI_CLAVE_ACCESO' 
  })
});
const tenant = await login.json();
```

#### Crear nueva máquina
```javascript
const newMachine = {
  nombre: "Impresora 3D Industrial",
  costo: 100000.0,
  vida_util_anios: 10.0,
  costo_mantenimiento: 10000.0
};

const response = await fetch('http://localhost:8000/api/machines', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newMachine)
});
const createdMachine = await response.json();
```

#### Actualizar trabajador
```javascript
const updateData = {
  costo_por_hora: 30.0,
  rol: "Supervisor"
};

const response = await fetch('http://localhost:8000/api/workers/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});
const updatedWorker = await response.json();
```

#### Eliminar configuración
```javascript
const response = await fetch('http://localhost:8000/api/settings/1', {
  method: 'DELETE'
});
```

### Manejo de Errores
Todos los endpoints devuelven códigos de estado HTTP estándar:
- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `204 No Content` - Recurso eliminado exitosamente
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: clave duplicada)
- `422 Unprocessable Entity` - Error de validación
- `500 Internal Server Error` - Error interno

Los mensajes de error están en español y siguen el formato:
```json
{
  "detail": "Mensaje de error descriptivo"
}
```

### Cálculo de Costos
Para calcular costos de impresión, usar el endpoint `/api/costs/calculate`:

```javascript
const costData = {
  machine_id: 1,
  worker_id: 1,
  material_id: 1,
  material_quantity: 100.0, // gramos
  print_time_hours: 2.5,
  valor_dolar: 1000.0 // opcional, si no se envía usa la cotización almacenada
};

const response = await fetch('http://localhost:8000/api/costs/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant': 'mi_empresa'
  },
  body: JSON.stringify(costData)
});
const costResult = await response.json();
```

## 📚 Documentación Adicional

### Ejemplos Completos de Frontend
Para ejemplos detallados de implementación con diferentes frameworks, consulta:
- **[FRONTEND_EXAMPLES.md](./FRONTEND_EXAMPLES.md)** - Ejemplos completos para React, Vue, Angular y Vanilla JS

### Guía de Implementación Rápida

1. **Elegir Framework** - React, Vue, Angular o Vanilla JS
2. **Configurar API** - Usar los servicios proporcionados en los ejemplos
3. **Implementar Tenant Selector** - Componente para selección de empresa
4. **Crear CRUD Components** - Para máquinas, trabajadores y configuraciones
5. **Agregar Estilos** - CSS proporcionado en los ejemplos
6. **Probar Integración** - Usar el script de pruebas del backend

## Estructura del Proyecto

```
app/
  api/             # Routers FastAPI
  core/            # Configuración general
  db/              # Declarative Base + sesión SQLAlchemy
  domain/          # Reglas de negocio (cálculo de costos)
  models/          # Modelos ORM
  schemas/         # Modelos Pydantic
  services/        # Integraciones externas (cotización)
```

## Próximos pasos sugeridos

1. Persistir impresiones calculadas (nuevo modelo + endpoints `POST /api/prints`).
2. Añadir autenticación para administración de recursos.
3. Programar un job recurrente (cron/APScheduler) que llame a `ensure_recent_rate` y registre la cotización sin depender de llamadas del cliente.
4. Implementar paginación en los endpoints de listado.
5. Añadir filtros y búsqueda en los endpoints de listado.