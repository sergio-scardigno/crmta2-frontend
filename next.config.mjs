/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Solo usar rewrites en desarrollo local
    // En producción (Vercel), las peticiones se harán directamente desde el cliente
    // para evitar problemas de conectividad desde los servidores de Vercel
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          process.env.VERCEL_ENV === undefined;
    
    if (isDevelopment) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    
    // En producción, no usar rewrites (las peticiones van directo al backend desde el cliente)
    return [];
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
