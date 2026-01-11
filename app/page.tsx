"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/app/contexts/TenantContext";

export default function Home() {
  const { currentTenant, currentTenantKey } = useTenant();
  const router = useRouter();

  // Redirigir a login si no hay tenant o clave
  useEffect(() => {
    if (currentTenant === null || currentTenantKey === null) {
      router.push("/login");
    }
  }, [currentTenant, currentTenantKey, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (currentTenant === null || currentTenantKey === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold">CRMTA2 Multi-Tenant</h1>
          <p className="text-lg text-neutral-500">
            Sistema completo de gestión de costos de impresiones 3D con arquitectura multi-tenant.
          </p>
          <p className="text-sm text-emerald-400">
            Empresa actual: <span className="font-medium">{currentTenant}</span>
          </p>
        </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Cálculo de Costos */}
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">💰 Cálculo de Costos</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Calcula costos de impresiones 3D usando máquinas, trabajadores y materiales.
          </p>
          <div className="space-y-2">
            <Link
              href="/prints"
              className="block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Ver Impresiones
            </Link>
            <Link
              href="/prints/new"
              className="block rounded-md border border-neutral-600 px-4 py-2 text-sm transition hover:bg-neutral-800"
            >
              Nueva Impresión
            </Link>
          </div>
        </section>

        {/* Administración de Máquinas */}
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">🔧 Máquinas</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Gestiona las impresoras 3D, sus costos y configuraciones.
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/machines"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Ver todas las máquinas
            </Link>
            <Link
              href="/admin/machines/new"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Agregar máquina
            </Link>
          </div>
        </section>

        {/* Administración de Trabajadores */}
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">👥 Trabajadores</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Administra el personal, sus costos por hora y roles.
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/workers"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Ver todos los trabajadores
            </Link>
            <Link
              href="/admin/workers/new"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Agregar trabajador
            </Link>
          </div>
        </section>

        {/* Administración de Materiales */}
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">📦 Materiales</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Consulta el inventario de materiales disponibles.
          </p>
          <Link
            href="/admin/materials"
            className="inline-block rounded-md border border-neutral-600 px-4 py-2 text-sm transition hover:bg-neutral-800"
          >
            Ver materiales
          </Link>
        </section>

        {/* Configuraciones */}
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">⚙️ Configuraciones</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Gestiona configuraciones del sistema como márgenes de beneficio.
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/settings"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Ver configuraciones
            </Link>
            <Link
              href="/admin/settings/new"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Nueva configuración
            </Link>
          </div>
        </section>

        {/* Moneda */}
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">🌍 Moneda</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Consulta las tasas de cambio actuales del dólar.
          </p>
          <Link
            href="/admin/currency"
            className="inline-block rounded-md border border-neutral-600 px-4 py-2 text-sm transition hover:bg-neutral-800"
          >
            Ver tasas de cambio
          </Link>
        </section>

        {/* Gestión de Empresas */}
        <section className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">🏢 Gestión de Empresas</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Administra las empresas y sus bases de datos en el sistema multi-tenant.
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/tenants"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Gestionar Empresas
            </Link>
            <Link
              href="/admin/keys"
              className="block rounded-md border border-neutral-600 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Gestión de Claves
            </Link>
          </div>
        </section>
      </div>

        <footer className="mt-8 border-t border-neutral-700 pt-6">
          <p className="text-sm text-neutral-500">
            Backend FastAPI Multi-Tenant ejecutándose en{" "}
            <code className="rounded bg-neutral-800 px-2 py-1 text-xs">
              http://localhost:8000
            </code>
          </p>
        </footer>
      </main>
  );
}
