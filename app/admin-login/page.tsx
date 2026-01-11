"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/app/contexts/AdminContext";
import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Alert } from "@/app/components/ui/Alert";

export default function AdminLoginPage() {
  const { admin, isAuthenticated, loading, error, login, clearError } = useAdmin();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && admin) {
      router.push("/admin/tenants");
    }
  }, [isAuthenticated, admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsSubmitting(true);
    clearError();
    try {
      await login({ username: username.trim(), password });
      router.push("/admin/tenants");
    } catch (err) {
      // Error ya manejado en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-8">
          <h1 className="text-3xl font-bold mb-2">Acceso de Administrador</h1>
          <p className="text-neutral-400 mb-6">Inicia sesión como administrador para gestionar empresas</p>

          {error && (
            <Alert variant="error" className="mb-6">
              <p>{error}</p>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting}
              disabled={!username.trim() || !password.trim()}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-emerald-400 hover:text-emerald-300 underline"
            >
              Volver al login de empresas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
