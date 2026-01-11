"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchFixedExpenses, deleteFixedExpense } from "@/app/lib/resources";
import type { FixedExpense } from "@/app/lib/types/resources";
import { Button } from "@/app/components/ui/Button";
import { Alert } from "@/app/components/ui/Alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/Table";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import { formatCurrency } from "@/app/lib/utils";
import { useTenant } from "@/app/contexts/TenantContext";

export default function FixedExpensesPage() {
  const { currentTenant } = useTenant();
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await fetchFixedExpenses();
      setExpenses(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, tipoGasto: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el gasto "${tipoGasto}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      clearError();
      await deleteFixedExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (err) {
      handleError(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Cargando gastos fijos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gastos Fijos</h1>
          <p className="text-neutral-400">Gestiona los gastos fijos de la empresa</p>
          {currentTenant && (
            <p className="text-sm text-emerald-400">
              Empresa: <span className="font-medium">{currentTenant}</span>
            </p>
          )}
        </div>
        <Link href="/admin/fixed-expenses/new">
          <Button>Agregar Gasto Fijo</Button>
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

      {expenses.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">No hay gastos fijos</h3>
          <p className="text-neutral-500 mb-4">Comienza agregando tu primer gasto fijo.</p>
          <Link href="/admin/fixed-expenses/new">
            <Button>Agregar Primer Gasto Fijo</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Gasto</TableHead>
                <TableHead>Monto (USD)</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.tipo_gasto}</TableCell>
                  <TableCell>{formatCurrency(expense.monto_usd)}</TableCell>
                  <TableCell>{expense.categoria || "-"}</TableCell>
                  <TableCell>{new Date(expense.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/fixed-expenses/${expense.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === expense.id}
                        onClick={() => handleDelete(expense.id, expense.tipo_gasto)}
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
    </div>
  );
}
