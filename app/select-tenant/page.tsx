"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTenant } from '@/app/contexts/TenantContext';

export default function SelectTenantPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();

  // Si ya hay un tenant seleccionado, redirigir al dashboard
  useEffect(() => {
    if (currentTenant) {
      router.push('/');
    } else {
      // Si no hay tenant, redirigir al login
      router.push('/login');
    }
  }, [currentTenant, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-neutral-400">Redirigiendo...</p>
      </div>
    </div>
  );
}
