'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTenant } from '@/app/contexts/TenantContext';
import { useAdmin } from '@/app/contexts/AdminContext';
import { Button } from '@/app/components/ui/Button';

export default function Navigation() {
    const { currentTenant, logout } = useTenant();
    const { isAuthenticated: isAdmin, admin, logout: adminLogout } = useAdmin();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleAdminLogout = () => {
        adminLogout();
        router.push('/');
    };

    // Si no hay tenant ni admin, mostrar solo link de admin login
    if (!currentTenant && !isAdmin) {
        return (
            <nav className="border-b border-neutral-700 bg-neutral-900/50 sticky top-0 z-40">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link
                            href="/"
                            className="text-xl font-bold text-emerald-400"
                        >
                            CRMTA2
                        </Link>
                        <Link href="/admin-login">
                            <Button variant="ghost" size="sm">
                                🔐 Admin Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>
        );
    }

    // Si es admin pero no hay tenant, mostrar navegación de admin
    if (isAdmin && !currentTenant) {
        const adminNavLinks = [
            { href: '/admin/tenants', label: '🏢 Gestión de Empresas' },
        ];

        return (
            <nav className="border-b border-neutral-700 bg-neutral-900/50 sticky top-0 z-40">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link
                            href="/"
                            className="text-xl font-bold text-emerald-400"
                        >
                            CRMTA2
                        </Link>
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:block text-sm text-neutral-400">
                                <span className="font-medium text-emerald-400">
                                    Admin: {admin?.username}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAdminLogout}
                            >
                                Salir Admin
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    if (!currentTenant) {
        return null;
    }

    const navLinks = [
        { href: '/prints', label: '📄 Impresiones' },
        { href: '/prints/totals', label: '📊 Totales' },
        { href: '/prints/new', label: '💰 Nueva Impresión' },
        { href: '/admin/machines', label: '🔧 Máquinas' },
        { href: '/admin/workers', label: '👥 Trabajadores' },
        { href: '/admin/materials', label: '📦 Materiales' },
        { href: '/admin/settings', label: '⚙️ Configuraciones' },
        { href: '/admin/fixed-expenses', label: '💸 Gastos Fijos' },
        { href: '/admin/salaries', label: '💰 Salarios' },
        { href: '/admin/models', label: '📐 Modelos 3D' },
        { href: '/admin/currency', label: '🌍 Moneda' },
        { href: '/admin/keys', label: '🔐 Claves' },
    ];

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname?.startsWith(href);
    };

    return (
        <nav className="border-b border-neutral-700 bg-neutral-900/50 sticky top-0 z-40">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo y menú desktop */}
                    <div className="flex items-center">
                        <Link
                            href="/"
                            className="text-xl font-bold text-emerald-400"
                        >
                            CRMTA2
                        </Link>

                        {/* Menú desktop - oculto en móviles */}
                        <div className="hidden lg:flex items-center ml-8 space-x-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isActive(link.href)
                                            ? 'text-emerald-400 bg-emerald-950/30'
                                            : 'text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Botones de acción y menú hamburguesa */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Info empresa - oculto en móviles pequeños */}
                        <div className="hidden sm:block text-sm text-neutral-400">
                            <span className="font-medium text-emerald-400">
                                {currentTenant}
                            </span>
                        </div>

                        {/* Botones de acción - ocultos en móviles */}
                        <div className="hidden md:flex items-center space-x-2">
                            {isAdmin && (
                                <Link href="/admin/tenants">
                                    <Button variant="ghost" size="sm">
                                        🏢 Gestión Admin
                                    </Button>
                                </Link>
                            )}
                            <Link href="/admin/tenants">
                                <Button variant="ghost" size="sm">
                                    🏢 Gestión
                                </Button>
                            </Link>

                            {isAdmin && (
                                <div className="text-xs text-neutral-400 px-2">
                                    Admin: {admin?.username}
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                            >
                                Cambiar Empresa
                            </Button>

                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAdminLogout}
                                >
                                    Salir Admin
                                </Button>
                            )}
                        </div>

                        {/* Botón hamburguesa - solo móviles */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="Toggle menu"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {mobileMenuOpen ? (
                                    <path d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Menú móvil desplegable */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-neutral-700">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                                        isActive(link.href)
                                            ? 'text-emerald-400 bg-emerald-950/30'
                                            : 'text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* Botones de acción en móvil */}
                            <div className="pt-4 pb-2 space-y-2 border-t border-neutral-700 mt-2">
                                <div className="px-3 py-2 text-sm text-neutral-400">
                                    Empresa:{' '}
                                    <span className="font-medium text-emerald-400">
                                        {currentTenant}
                                    </span>
                                </div>
                                {isAdmin && (
                                    <div className="px-3 py-2 text-sm text-neutral-400">
                                        Admin:{' '}
                                        <span className="font-medium text-emerald-400">
                                            {admin?.username}
                                        </span>
                                    </div>
                                )}
                                {isAdmin && (
                                    <Link
                                        href="/admin/tenants"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2 text-base font-medium rounded-md text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800"
                                    >
                                        🏢 Gestión Admin
                                    </Link>
                                )}
                                <Link
                                    href="/admin/tenants"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 text-base font-medium rounded-md text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800"
                                >
                                    🏢 Gestión de Empresas
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 text-base font-medium rounded-md text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800"
                                >
                                    Cambiar Empresa
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            handleAdminLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 text-base font-medium rounded-md text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800"
                                    >
                                        Salir Admin
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
