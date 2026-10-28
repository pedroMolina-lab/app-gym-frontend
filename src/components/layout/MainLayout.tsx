'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Dumbbell,
  User as UserIcon,
  LogOut,
  Users,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Enlaces exclusivos para Alumnos / Clientes normales
const clientNavItems: NavItem[] = [
  {
    label: 'Rutina',
    href: '/dashboard',
    icon: Dumbbell,
  },
  {
    label: 'Perfil',
    href: '/perfil',
    icon: UserIcon,
  },
];

// Enlaces exclusivos para Administradores / Profesores
const adminNavItems: NavItem[] = [
  {
    label: 'Alumnos & Rutinas',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Inscripciones & Pagos',
    href: '/admin/subscriptions',
    icon: CreditCard,
  },
  {
    label: 'Crear Ejercicio',
    href: '/admin/exercises/new',
    icon: Dumbbell,
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Consumo del estado global desde Zustand
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Verificación de rol: ADMIN o TRAINER (Profesor)
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'TRAINER';

  // Selección condicional de items de navegación
  const navItems = isAdminOrStaff ? adminNavItems : clientNavItems;

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard' || pathname === '/rutina';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/20 selection:text-sky-300">
      {/* =========================================================================
          DESKTOP SIDEBAR (Visible únicamente en pantallas md: y superiores)
          Mobile-First: hidden en móviles, md:flex en escritorio
      ========================================================================== */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-r md:border-slate-800/80 md:bg-slate-900/90 md:backdrop-blur-xl">
        {/* Brand / Logo Section */}
        <Link
          href="/"
          className="flex h-18 items-center gap-3.5 border-b border-slate-800/80 px-5 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black border border-slate-800 p-1 shadow-md shadow-sky-950/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="STRONG SANTIAGO" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-wider text-white uppercase italic leading-none">
              STR<span className="text-sky-400">ONG</span>
            </span>
            <span className="text-[9px] font-bold tracking-[0.25em] text-slate-300 uppercase mt-1">
              SANTIAGO
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación de Escritorio con Renderizado Condicional por Rol */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            {isAdminOrStaff ? 'Módulos de Gestión' : 'Mi Entrenamiento'}
          </p>

          {/* Renderizado condicional mediante operador ternario */}
          {isAdminOrStaff ? (
            // ================== VISTA EXCLUSIVA PARA ADMIN / PROFESOR ==================
            <div className="space-y-1.5">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                      active
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-sm shadow-sky-500/10'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                        active ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            // ================== VISTA EXCLUSIVA PARA ALUMNO / CLIENTE ==================
            <div className="space-y-1.5">
              {clientNavItems.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                      active
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-sm shadow-sky-500/10'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                        active ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Tarjeta de Usuario & Logout (Pie del Sidebar) */}
        <div className="border-t border-slate-800/80 p-4">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between rounded-xl bg-slate-800/40 p-3 border border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-bold text-xs text-sky-300 border border-sky-500/30">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="truncate text-xs font-semibold text-slate-200">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-sky-400"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP APP BAR (Visible únicamente en móvil, hidden en md:)
      ========================================================================== */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-800/70 bg-slate-950/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-black border border-slate-800 p-0.5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="STRONG SANTIAGO" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-wide text-white uppercase italic leading-none">
              STR<span className="text-sky-400">ONG</span>
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-slate-300 uppercase">
              SANTIAGO
            </span>
          </div>
        </Link>

        {isAuthenticated && user && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-300">
              Hola, <span className="font-semibold text-sky-400">{user.firstName}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          CONTENIDO PRINCIPAL
          Reglas Mobile-First:
          - pb-20 en móvil para evitar superposición con la barra inferior
          - md:pl-64 en escritorio para desplazar el contenido tras el sidebar
      ========================================================================== */}
      <main className="flex-1 w-full pb-20 pt-4 px-4 md:pl-64 md:pb-8 md:pt-6 md:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION BAR (Visible únicamente en móvil, hidden en md:)
          Renderizado condicional estricto según el rol del usuario
      ========================================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t border-slate-800/90 bg-slate-900/95 px-2 backdrop-blur-lg md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors duration-150',
                active ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200',
                  active && 'bg-sky-500/15'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    active && 'scale-110 stroke-[2.5]'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight font-medium transition-colors text-center truncate px-1',
                  active ? 'font-bold text-sky-400' : 'text-slate-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;
