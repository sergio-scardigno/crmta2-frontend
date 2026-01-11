# Prompt para Backend FastAPI - CRM de Impresiones 3D

## Contexto del Proyecto
Necesito crear un backend FastAPI para un sistema de cálculo de costos de impresiones 3D. El frontend Next.js ya está funcionando y espera estos endpoints específicos.

## Estructura de Base de Datos Requerida

### 1. Tabla `machines` (Máquinas de impresión)
```sql
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    costo DECIMAL(10,2) NOT NULL,  -- Costo por hora en USD
    vida_util_anios DECIMAL(3,1) NOT NULL,
    costo_mantenimiento DECIMAL(10,2) NOT NULL  -- Costo anual de mantenimiento
);
```

### 2. Tabla `workers` (Trabajadores)
```sql
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    costo_por_hora DECIMAL(10,2) NOT NULL,  -- En USD
    factor_trabajo DECIMAL(3,2) NOT NULL,   -- Factor de eficiencia (0.1-1.0)
    rol VARCHAR(50)  -- 'operario', 'disenador', etc.
);
```

### 3. Tabla `materials` (Materiales)
```sql
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad_de_medida VARCHAR(10) NOT NULL,  -- 'GR', 'KG', etc.
    cantidad_de_material DECIMAL(10,2) NOT NULL,  -- Stock disponible
    costo_por_unidad DECIMAL(10,2) NOT NULL,  -- Costo por unidad de medida
    costo_por_gramo DECIMAL(10,4) NOT NULL   -- Costo por gramo calculado
);
```

### 4. Tabla `settings` (Configuraciones)
```sql
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    description TEXT
);
```

### 5. Tabla `currency_rates` (Tasas de cambio)
```sql
CREATE TABLE currency_rates (
    id SERIAL PRIMARY KEY,
    currency VARCHAR(10) NOT NULL,  -- 'USD', 'ARS', etc.
    value DECIMAL(10,4) NOT NULL,   -- Tasa de cambio
    source VARCHAR(50) NOT NULL,    -- 'api', 'manual', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Endpoints Requeridos

### 1. GET /api/machines
```json
[
  {
    "id": 1,
    "nombre": "Prusa MK3S",
    "costo": 1200.0,
    "vida_util_anios": 5.0,
    "costo_mantenimiento": 150.0
  }
]
```

### 2. GET /api/workers
```json
[
  {
    "id": 1,
    "nombre": "Operario 3D",
    "costo_por_hora": 12.0,
    "factor_trabajo": 0.3,
    "rol": "operario"
  }
]
```

### 3. GET /api/materials
```json
[
  {
    "id": 1,
    "nombre": "PLA Premium",
    "unidad_de_medida": "GR",
    "cantidad_de_material": 1000.0,
    "costo_por_unidad": 30.0,
    "costo_por_gramo": 0.03
  }
]
```

### 4. GET /api/settings/benefit
```json
{
  "id": 1,
  "key": "benefit",
  "value": 0.25
}
```

### 5. GET /api/currency/latest
```json
{
  "id": 1,
  "currency": "USD",
  "value": 900.0,
  "source": "api",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 6. POST /api/costs/calculate
**Request:**
```json
{
  "horas_impresion": 2.5,
  "maquinas_ids": [1, 2],
  "trabajadores_ids": [1],
  "materiales": [
    {
      "id_material": 1,
      "cantidad_usada": 50.0,
      "desperdicio": 5.0
    }
  ],
  "valor_dolar": 900.0,
  "cantidad_unidades": 1,
  "beneficio": 0.25
}
```

**Response:**
```json
{
  "costo_maquinas_usd": 12.0,
  "costo_trabajadores_usd": 9.0,
  "costo_materiales_usd": 1.65,
  "costo_desperdicio_usd": 0.15,
  "costo_total_usd": 22.8,
  "costo_unitario_usd": 22.8,
  "costo_sugerido_total_usd": 28.5,
  "costo_sugerido_unitario_usd": 28.5,
  "costo_sugerido_total_local": 25650.0,
  "costo_sugerido_unitario_local": 25650.0
}
```

## Lógica de Cálculo de Costos

### Fórmulas:
1. **Costo de máquinas por hora:** `costo / (vida_util_anios * 365 * 24) + (costo_mantenimiento / (365 * 24))`
2. **Costo de trabajadores:** `costo_por_hora * factor_trabajo`
3. **Costo de materiales:** `cantidad_usada * costo_por_gramo`
4. **Costo de desperdicio:** `desperdicio * costo_por_gramo`
5. **Costo total:** Suma de todos los costos
6. **Precio sugerido:** `costo_total * (1 + beneficio)`
7. **Precio en moneda local:** `precio_usd * valor_dolar`

## Configuración CORS Requerida
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Datos de Prueba Iniciales

### Máquinas:
- Prusa MK3S: $1200, 5 años, $150 mantenimiento
- Creality Ender 3: $300, 4 años, $80 mantenimiento

### Trabajadores:
- Operario 3D: $12/h, factor 0.3
- Diseñador CAD: $20/h, factor 0.35

### Materiales:
- PLA Premium: 1000gr, $30, $0.03/gr
- PETG: 1000gr, $30, $0.03/gr

### Configuraciones:
- benefit: 0.25 (25% de margen)

### Tasa de cambio:
- USD/ARS: 900

## Estructura de Archivos Sugerida
```
backend/
├── main.py
├── models/
│   ├── __init__.py
│   ├── machine.py
│   ├── worker.py
│   ├── material.py
│   ├── setting.py
│   └── currency.py
├── schemas/
│   ├── __init__.py
│   ├── machine.py
│   ├── worker.py
│   ├── material.py
│   ├── setting.py
│   └── currency.py
├── routers/
│   ├── __init__.py
│   ├── machines.py
│   ├── workers.py
│   ├── materials.py
│   ├── settings.py
│   ├── currency.py
│   └── costs.py
├── database.py
├── requirements.txt
└── alembic/ (para migraciones)
```

## Características Adicionales Deseadas
1. **Validación de datos** con Pydantic
2. **Manejo de errores** robusto
3. **Logging** de operaciones
4. **Documentación automática** con Swagger
5. **Tests unitarios** básicos
6. **Migraciones de base de datos** con Alembic
7. **Variables de entorno** para configuración
8. **Rate limiting** opcional
9. **Autenticación** básica (opcional)

## Instrucciones de Implementación
1. Crear estructura de proyecto FastAPI
2. Configurar base de datos (SQLAlchemy + PostgreSQL/SQLite)
3. Implementar modelos de datos
4. Crear esquemas Pydantic
5. Implementar routers para cada endpoint
6. Agregar lógica de cálculo de costos
7. Configurar CORS
8. Agregar datos de prueba
9. Crear documentación API
10. Probar integración con frontend

## Notas Importantes
- El frontend ya está configurado para estos endpoints exactos
- Los nombres de campos deben coincidir exactamente
- Los tipos de datos deben ser compatibles
- El servidor debe ejecutarse en puerto 8000
- La base de datos debe estar en `localhost:5432` (PostgreSQL) o usar SQLite para desarrollo
