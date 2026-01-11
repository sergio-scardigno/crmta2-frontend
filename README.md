# CRMTA2 Frontend

Frontend Next.js 14 para el sistema de cálculo de costos de impresiones 3D con arquitectura multi-tenant.

## 📋 Tabla de Contenidos

- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [Ejecución](#-ejecución)
- [Despliegue en Vercel](#-despliegue-en-vercel)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Integración con Backend](#-integración-con-backend)

## 📦 Requisitos

- Node.js 18+
- npm o yarn
- Backend FastAPI ejecutándose (ver [backend/README.md](../backend/README.md))

## 🚀 Instalación

```bash
cd frontend
npm install
```

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env.local` en `frontend/`:

```env
# URL base del backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**En producción**, configurar la URL del backend desplegado:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.tu-dominio.com/api
```

### Configuración de CORS en Backend

El backend debe estar configurado para aceptar peticiones desde el dominio del frontend. Ver [backend/README.md](../backend/README.md#-seguridad) para más detalles.

## ▶️ Ejecución

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Producción

```bash
npm run build
npm run start
```

## 🌐 Despliegue en Vercel

### 1. Preparar el Proyecto

Asegurarse de que el proyecto esté listo para producción:

```bash
npm run build
```

### 2. Conectar con Vercel

#### Opción A: Desde la CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar deploy
vercel
```

#### Opción B: Desde el Dashboard

1. Ir a [vercel.com](https://vercel.com)
2. Importar el repositorio de GitHub
3. Configurar el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Configurar Variables de Entorno

En el dashboard de Vercel, ir a **Settings → Environment Variables** y agregar:

```
NEXT_PUBLIC_API_BASE_URL=https://api.tu-dominio.com/api
```

**Importante**: Reemplazar `https://api.tu-dominio.com/api` con la URL real de tu backend en producción.

### 4. Configurar CORS en el Backend

El backend debe permitir el origen de Vercel. En el archivo `.env` del backend:

```env
CORS_ORIGINS=https://tu-app.vercel.app,https://www.tu-dominio.com
```

### 5. Deploy

- **Automatic Deploy**: Cada push a la rama `main` desplegará automáticamente
- **Manual Deploy**: Usar `vercel --prod` desde la CLI

### 6. Dominio Personalizado (Opcional)

1. En Vercel Dashboard → **Settings → Domains**
2. Agregar tu dominio personalizado
3. Configurar los registros DNS según las instrucciones de Vercel

## 📁 Estructura del Proyecto

```
frontend/
├── app/
│   ├── admin/              # Páginas de administración
│   │   ├── tenants/        # Gestión de empresas
│   │   ├── machines/       # CRUD de máquinas
│   │   ├── workers/        # CRUD de trabajadores
│   │   ├── materials/      # CRUD de materiales
│   │   ├── settings/       # Configuraciones
│   │   ├── currency/       # Tasas de cambio
│   │   ├── fixed-expenses/ # Gastos fijos
│   │   ├── salaries/       # Salarios
│   │   ├── models/         # Modelos 3D
│   │   └── keys/           # Gestión de claves
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes UI reutilizables
│   │   ├── Navigation.tsx
│   │   ├── TenantSelector.tsx
│   │   └── TenantLogin.tsx
│   ├── contexts/           # Contextos de React
│   │   ├── TenantContext.tsx
│   │   └── AdminContext.tsx
│   ├── hooks/              # Hooks personalizados
│   │   └── useErrorHandler.ts
│   ├── lib/                # Utilidades y servicios
│   │   ├── api.ts         # Cliente HTTP
│   │   ├── resources.ts   # Servicios de API
│   │   ├── admin.ts       # Servicios de admin
│   │   ├── pdf/           # Generación de PDFs
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils.ts       # Utilidades helper
│   ├── prints/             # Páginas de impresiones
│   │   ├── new/           # Cálculo de costos
│   │   ├── [id]/          # Detalle de impresión
│   │   └── history/       # Historial
│   ├── login/             # Login de tenant
│   ├── admin-login/       # Login de administrador
│   ├── select-tenant/     # Selección de tenant
│   └── page.tsx          # Página principal
├── public/                # Archivos estáticos
├── next.config.mjs        # Configuración Next.js
├── tailwind.config.js    # Configuración Tailwind
├── tsconfig.json         # Configuración TypeScript
└── package.json         # Dependencias
```

## 🔌 Integración con Backend

### Autenticación Multi-Tenant

El frontend utiliza un sistema de autenticación basado en claves de acceso:

1. **Login**: El usuario ingresa nombre de empresa y clave de acceso
2. **Headers**: Todas las peticiones incluyen automáticamente:
   - `X-Tenant: {nombre_empresa}`
   - `X-Tenant-Key: {clave_acceso}`
3. **Persistencia**: Las credenciales se guardan en `localStorage`
4. **Contexto**: El estado del tenant se maneja con React Context

### Cliente API

El cliente API (`app/lib/api.ts`) está configurado para:

- Agregar automáticamente los headers de tenant
- Manejar errores de autenticación (401, 403)
- Redirigir a login cuando es necesario
- Interceptar respuestas y manejar errores

### Endpoints Utilizados

- **Tenants**: `GET/POST/PUT/DELETE /api/tenants`
- **Auth**: `POST /api/auth/admin/login`
- **Admin**: `GET /api/admin/tenants`
- **Resources**: `GET/POST/PUT/DELETE /api/machines`, `/api/workers`, `/api/materials`, etc.
- **Costs**: `POST /api/costs/calculate`
- **Currency**: `GET /api/currency/latest`
- **Prints**: `GET/POST/PUT/DELETE /api/prints`

Ver [backend/README.md](../backend/README.md#-api-endpoints) para documentación completa de endpoints.

## 🎨 Tecnologías

- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios
- **Axios**: Cliente HTTP
- **jsPDF**: Generación de PDFs
- **React Query**: Gestión de estado del servidor (opcional)

## 🛠️ Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construcción para producción
npm run start    # Servidor de producción
npm run lint     # Linting de código
```

## 🔧 Configuración Avanzada

### Rewrites (Desarrollo)

El archivo `next.config.mjs` incluye rewrites para desarrollo local:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ];
}
```

**Nota**: En producción, usar `NEXT_PUBLIC_API_BASE_URL` en lugar de rewrites.

### Webpack Configuration

La configuración de Webpack incluye fallbacks para librerías que requieren Node.js:

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };
  }
  return config;
}
```

## 🐛 Troubleshooting

### Error: "CORS policy"

- Verificar que el backend tiene configurado `CORS_ORIGINS` con el dominio del frontend
- Verificar que `NEXT_PUBLIC_API_BASE_URL` apunta al backend correcto

### Error: "Tenant no encontrado"

- Verificar que el tenant existe en el backend
- Verificar que los headers `X-Tenant` y `X-Tenant-Key` son correctos
- Revisar el `localStorage` del navegador

### Error: "Cannot find module"

- Ejecutar `npm install` para reinstalar dependencias
- Limpiar `.next` y `node_modules`: `rm -rf .next node_modules && npm install`

### Build falla en Vercel

- Verificar que `NEXT_PUBLIC_API_BASE_URL` está configurado en Vercel
- Verificar que el build funciona localmente: `npm run build`
- Revisar los logs de build en Vercel Dashboard

## 📚 Recursos Adicionales

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación del Backend](../backend/README.md)

---

**Versión**: 0.1.0  
**Última actualización**: 2024
