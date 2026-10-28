'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const isStaff = user?.role === 'ADMIN' || user?.role === 'TRAINER';

    // Si está autenticado pero su rol NO es personal (ADMIN o TRAINER), redirigir al inicio
    if (user && !isStaff) {
      router.replace('/');
      return;
    }

    // Usuario autenticado con rol de gestión
    if (user && isStaff) {
      setIsAuthorized(true);
    }
  }, [isAuthenticated, user, router]);

  // Pantalla de carga mientras se valida la sesión y el rol
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <p className="text-xs font-medium text-slate-400">Verificando permisos de acceso...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
