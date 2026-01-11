"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/app/contexts/TenantContext";
import TenantLogin from "@/app/components/TenantLogin";

export default function LoginPage() {
  const { currentTenant } = useTenant();
  const router = useRouter();

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (currentTenant) {
      router.push("/");
    }
  }, [currentTenant, router]);

  // Mostrar loading mientras se verifica el estado de autenticación
  if (currentTenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return <TenantLogin onLogin={() => router.push("/")} />;
}

