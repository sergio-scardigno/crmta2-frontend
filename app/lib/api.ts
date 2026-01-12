// Determinar la URL base de la API
// Siempre usar rewrites de Next.js (/api) para evitar problemas de mixed content (HTTPS -> HTTP)
// Los rewrites funcionan tanto en desarrollo como en producción
const getApiBaseUrl = () => {
  // Si estamos en el servidor (SSR), usar la URL completa del backend
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
  }
  
  // En el cliente (navegador), siempre usar rewrites para evitar mixed content
  // Los rewrites de Next.js permiten hacer peticiones HTTP desde el servidor
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Función para obtener el tenant actual del localStorage
function getCurrentTenant(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('currentTenant');
  } catch (e) {
    console.error('Error reading currentTenant from localStorage:', e);
    return null;
  }
}

// Función para obtener la clave de acceso actual del localStorage
function getCurrentTenantKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('currentTenantKey');
  } catch (e) {
    console.error('Error reading currentTenantKey from localStorage:', e);
    return null;
  }
}

// Función para obtener el token JWT del admin del localStorage
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

// Función para manejar errores específicos de tenant y autenticación
function handleTenantError(response: Response, errorBody: string) {
  if (typeof window === 'undefined') return;
  
  if (response.status === 401) {
    // Credenciales incorrectas o expiradas - limpiar localStorage y redirigir
    localStorage.removeItem('currentTenant');
    localStorage.removeItem('currentTenantKey');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
      return;
    }
  } else if (response.status === 400 && errorBody.includes('X-Tenant')) {
    // Falta header de tenant - redirigir a login
    console.warn('Falta header X-Tenant, redirigiendo a login');
    localStorage.removeItem('currentTenant');
    localStorage.removeItem('currentTenantKey');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/select-tenant')) {
      window.location.href = '/login';
      return;
    }
  } else if (response.status === 404 && errorBody.includes('Tenant')) {
    // Tenant no encontrado - redirigir a selección de tenant
    if (!window.location.pathname.includes('/select-tenant')) {
      window.location.href = '/select-tenant';
      return;
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  console.log(`Making request to: ${url}`);
  
  // Obtener tenant actual y clave de acceso
  const currentTenant = getCurrentTenant();
  const currentTenantKey = getCurrentTenantKey();
  const adminToken = getAdminToken();
  
  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('Request headers:', {
      hasTenant: !!currentTenant,
      hasTenantKey: !!currentTenantKey,
      hasAdminToken: !!adminToken,
      path,
    });
  }
  
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Agregar headers de autenticación de tenant si existen
  if (currentTenant && currentTenantKey) {
    headers.set("X-Tenant", currentTenant);
    headers.set("X-Tenant-Key", currentTenantKey);
  }

  // Agregar token JWT de admin si existe (tiene prioridad sobre tenant)
  if (adminToken) {
    headers.set("Authorization", `Bearer ${adminToken}`);
  }
  
  const response = await fetch(url, {
    ...init,
    headers,
  });

  console.log(`Response status: ${response.status}`);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error: ${response.status} - ${errorBody}`);
    
    // Manejar errores específicos de tenant
    handleTenantError(response, errorBody);
    
    throw new Error(`Error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: init?.method ?? "GET" }),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "DELETE",
    }),
};
