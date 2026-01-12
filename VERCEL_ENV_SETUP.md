# Configuración de Variables de Entorno en Vercel

Este documento explica cómo configurar las variables de entorno necesarias para desplegar el frontend en Vercel.

## 📋 Variables Requeridas

### `NEXT_PUBLIC_API_BASE_URL`

**Descripción:** URL base del backend API

**Valor para Producción:**
```
http://srv970964.hstgr.cloud:8000/api
```

**Valor para Desarrollo Local:**
```
http://localhost:8000/api
```

## 🔧 Configuración en Vercel

### Paso 1: Acceder a la Configuración

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** > **Environment Variables**

### Paso 2: Agregar la Variable

1. Haz clic en **Add New**
2. Completa el formulario:
   - **Key:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `http://srv970964.hstgr.cloud:8000/api`
   - **Environment:** Selecciona según necesites:
     - ✅ **Production** (para producción)
     - ✅ **Preview** (para PRs y branches)
     - ✅ **Development** (opcional, para desarrollo local)

3. Haz clic en **Save**

### Paso 3: Hacer Deploy

Después de agregar las variables, necesitas hacer un nuevo deploy:

1. Ve a **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz push a tu branch principal

## 📝 Configuración Recomendada por Entorno

### Production
```
NEXT_PUBLIC_API_BASE_URL=http://srv970964.hstgr.cloud:8000/api
```

### Preview (para PRs y branches)
```
NEXT_PUBLIC_API_BASE_URL=http://srv970964.hstgr.cloud:8000/api
```
*(O puedes usar un backend de staging si tienes uno)*

### Development (opcional)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```
*(Solo si necesitas desarrollo local)*

## ⚠️ Notas Importantes

1. **Variables NEXT_PUBLIC_**: Las variables que empiezan con `NEXT_PUBLIC_` son expuestas al cliente y están disponibles en el navegador. **No incluyas información sensible** como tokens o secretos.

2. **Estrategia de Conexión**: 
   - **En desarrollo**: Usa rewrites de Next.js (`/api` → `localhost:8000/api`)
   - **En producción (Vercel)**: Hace peticiones directas desde el navegador al backend
   - ⚠️ **IMPORTANTE**: En producción, el backend DEBE permitir CORS desde tu dominio de Vercel
   - ⚠️ **IMPORTANTE**: Si el backend usa HTTP y Vercel HTTPS, puede haber problemas de mixed content. Considera usar HTTPS en el backend o un proxy.

3. **CORS en Backend (Opcional)**: Si quieres permitir peticiones directas desde el navegador (no recomendado en producción), el backend debe incluir en `CORS_ORIGINS`:
   - `https://tu-app.vercel.app`
   - `https://tu-dominio-custom.com` (si usas dominio personalizado)

4. **Re-deploy necesario**: Después de agregar o modificar variables de entorno, necesitas hacer un nuevo deploy para que los cambios surtan efecto.

5. **Verificación**: Puedes verificar que la variable está configurada correctamente en:
   - Vercel Dashboard > Settings > Environment Variables
   - O en el código usando `process.env.NEXT_PUBLIC_API_BASE_URL`

## 🔍 Verificación Post-Deploy

Después del deploy, verifica que todo funciona:

1. Abre tu aplicación en Vercel
2. Abre las DevTools del navegador (F12)
3. Ve a la pestaña **Network**
4. Intenta hacer login o cualquier acción que llame al backend
5. Verifica que las peticiones se están haciendo a: `http://srv970964.hstgr.cloud:8000/api/...`

## 🐛 Troubleshooting

### Error: "Failed to fetch"

**Problema:** No se pueden hacer peticiones al backend.

**Soluciones:**

1. **Verificar que NEXT_PUBLIC_API_BASE_URL está configurada:**
   - Ve a Vercel Dashboard > Settings > Environment Variables
   - Verifica que `NEXT_PUBLIC_API_BASE_URL` está configurada con: `http://srv970964.hstgr.cloud:8000/api`
   - Haz un nuevo deploy después de agregar/modificar la variable

2. **Verificar que el backend está accesible:**
   - Abre en el navegador: `http://srv970964.hstgr.cloud:8000/api`
   - Deberías ver un JSON con información de la API
   - Si no responde, el backend puede estar caído o el firewall bloqueando

3. **Verificar CORS en el backend:**
   - El backend DEBE tener configurado CORS para permitir tu dominio de Vercel
   - En el backend, configura la variable `CORS_ORIGINS` con tu dominio de Vercel:
     ```env
     CORS_ORIGINS=https://tu-app.vercel.app,https://tu-app-git-main-tu-usuario.vercel.app
     ```
   - Reinicia el backend después de cambiar CORS_ORIGINS

4. **Revisar logs de Vercel:**
   - Ve a Vercel Dashboard > Deployments > [tu deployment] > Functions
   - Revisa los logs para ver errores específicos

### Error: 502 "ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR"

**Problema:** Vercel no puede conectarse al backend (esto ocurre con rewrites).

**Solución:**
- Este error indica que el backend no es accesible desde los servidores de Vercel
- La configuración actual hace peticiones directas desde el navegador, no desde el servidor
- Si ves este error, verifica:
  1. Que el backend esté corriendo y accesible públicamente
  2. Que el firewall permita conexiones al puerto 8000
  3. Que CORS esté configurado correctamente en el backend
  4. Haz un nuevo deploy después de los cambios

### Error: "CORS policy" (si usas peticiones directas)

**Problema:** El backend no está aceptando peticiones desde Vercel.

**Solución:** 
1. Verifica que el backend tiene configurado CORS con tu dominio de Vercel
2. Revisa la variable `CORS_ORIGINS` en el backend
3. **Nota:** Con rewrites de Next.js, normalmente no necesitas CORS porque las peticiones vienen del servidor

### Error: "API_BASE_URL is not defined"

**Problema:** La variable de entorno no está configurada o no se hizo re-deploy.

**Solución:**
1. Verifica que la variable está en Vercel Dashboard
2. Haz un nuevo deploy después de agregar la variable
3. Verifica que el nombre de la variable es exactamente `NEXT_PUBLIC_API_BASE_URL`

### Las peticiones van a localhost en producción

**Problema:** El código está usando el valor por defecto en lugar de la variable de entorno.

**Solución:**
1. Verifica que la variable está configurada en Vercel
2. Verifica que el nombre es correcto: `NEXT_PUBLIC_API_BASE_URL`
3. Haz un nuevo deploy

## 📚 Referencias

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
