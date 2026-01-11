"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSettings, deleteSetting } from "@/app/lib/resources";
import type { Setting } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Alert } from "@/app/components/ui/Alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/Table";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchSettings();
      setSettings(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, key: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la configuración "${key}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      clearError();
      await deleteSetting(id);
      setSettings(settings.filter(s => s.id !== id));
    } catch (err) {
      handleError(err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatValue = (key: string, value: number) => {
    if (key.includes("beneficio") || key.includes("margen")) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando configuraciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuraciones</h1>
          <p className="text-neutral-400">Gestiona las configuraciones del sistema</p>
        </div>
        <Link href="/admin/settings/new">
          <Button>Nueva Configuración</Button>
        </Link>
      </div>

      {error.message && (
        <Alert variant="error" className="mb-6">
          <div>
            <p className="font-medium">{error.message}</p>
            {error.details && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {error.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </Alert>
      )}

      {settings.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay configuraciones</h3>
          <p className="text-neutral-500 mb-4">Comienza agregando la primera configuración del sistema.</p>
          <Link href="/admin/settings/new">
            <Button>Agregar Primera Configuración</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium font-mono text-sm">{setting.key}</TableCell>
                  <TableCell className="font-mono text-sm">{formatValue(setting.key, setting.value)}</TableCell>
                  <TableCell className="text-neutral-400">{setting.description || "Sin descripción"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/settings/${setting.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === setting.id}
                        onClick={() => handleDelete(setting.id, setting.key)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-blue-700 bg-blue-950/40 p-4">
        <h3 className="font-semibold text-blue-100 mb-2">ℹ️ Configuraciones Importantes</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• <code className="bg-blue-900/50 px-1 rounded">margen_de_beneficio</code> - Margen de beneficio para cálculos de precios (ej: 0.25 = 25%)</li>
          <li>• <code className="bg-blue-900/50 px-1 rounded">beneficio</code> - Alias para margen_de_beneficio (compatibilidad legacy)</li>
          <li>• <code className="bg-blue-900/50 px-1 rounded">valor_dolar_default</code> - Valor por defecto del dólar si no se obtiene de la API</li>
        </ul>
      </div>
    </div>
  );
}
