/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Obtener la URL del backend desde variables de entorno
    // En producción, usar la URL del servidor real
    // En desarrollo, usar localhost
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    
    // Si NEXT_PUBLIC_API_BASE_URL está configurado y no es localhost,
    // extraer la URL base sin el /api
    let destination;
    if (backendUrl.includes('localhost')) {
      destination = 'http://localhost:8000/api/:path*';
    } else {
      // Extraer la URL base (sin /api al final si existe)
      const baseUrl = backendUrl.replace(/\/api\/?$/, '');
      destination = `${baseUrl}/api/:path*`;
    }
    
    return [
      {
        source: '/api/:path*',
        destination: destination,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
