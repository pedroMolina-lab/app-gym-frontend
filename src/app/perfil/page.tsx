'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User as UserIcon,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface SubscriptionData {
  id: string;
  startDate: string;
  endDate: string;
  paymentDate?: string;
  expirationDate?: string;
}

interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp?: string | null;
  role: string;
  activeSubscription?: SubscriptionData | null;
  latestSubscription?: SubscriptionData | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const { user: authUser, logout, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await apiClient.get<UserProfileData>('/api/users/me');
      setProfile(res.data);
    } catch (err: unknown) {
      console.error('Error al cargar perfil:', err);
      setErrorMsg('No se pudo cargar la información del perfil.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [fetchProfile, isAuthenticated]);

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tomar suscripción activa o la última registrada
  const subscription = profile?.activeSubscription || profile?.latestSubscription;

  // Cálculo seguro memoizado para evitar ejecuciones impuras de Date() y desajustes de hidratación
  const { isSubscriptionActive, daysRemaining, formattedEndDate, formattedStartDate } = useMemo(() => {
    if (!subscription?.endDate) {
      return {
        isSubscriptionActive: false,
        daysRemaining: 0,
        formattedEndDate: null,
        formattedStartDate: null,
      };
    }

    try {
      const today = new Date();
      const end = new Date(subscription.endDate);

      if (isNaN(end.getTime())) {
        return {
          isSubscriptionActive: false,
          daysRemaining: 0,
          formattedEndDate: null,
          formattedStartDate: null,
        };
      }

      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfTarget = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const diffMs = startOfTarget.getTime() - startOfToday.getTime();
      const days = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      const active = Boolean(profile?.activeSubscription || end >= today);

      const fEnd = end.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const fStart = subscription.startDate
        ? new Date(subscription.startDate).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : null;

      return {
        isSubscriptionActive: active,
        daysRemaining: days,
        formattedEndDate: fEnd,
        formattedStartDate: fStart,
      };
    } catch {
      return {
        isSubscriptionActive: false,
        daysRemaining: 0,
        formattedEndDate: null,
        formattedStartDate: null,
      };
    }
  }, [subscription, profile?.activeSubscription]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-slate-950 shadow-lg shadow-sky-500/20">
              <UserIcon className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Panel del Alumno
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-100">
                Mi Perfil
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchProfile}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={fetchProfile}
              className="font-bold underline text-rose-300 hover:text-rose-200"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Estado de Carga (Skeletons - activo durante carga o antes de montar cliente) */}
        {(!isMounted || isLoading) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((id) => (
              <div
                key={id}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4 animate-pulse"
              >
                <div className="h-5 w-36 rounded bg-slate-800" />
                <div className="space-y-3 pt-2">
                  <div className="h-4 w-48 rounded bg-slate-800/60" />
                  <div className="h-4 w-32 rounded bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contenido Principal con las 2 Tarjetas */}
        {isMounted && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* TARJETA 1: DATOS PERSONALES */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5 md:p-6 backdrop-blur-xl shadow-lg shadow-black/20 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3.5">
                  <UserIcon className="h-5 w-5 text-sky-400" />
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Datos Personales
                  </h2>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Nombre Completo */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nombre y Apellido
                    </span>
                    <p className="text-base font-bold text-slate-100 mt-0.5">
                      {profile?.firstName || authUser?.firstName || 'Alumno'}{' '}
                      {profile?.lastName || authUser?.lastName || ''}
                    </p>
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Correo Electrónico
                    </span>
                    <p className="text-sm font-medium text-slate-300 flex items-center gap-2 mt-0.5 font-mono">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      {profile?.email || authUser?.email || 'email@ejemplo.com'}
                    </p>
                  </div>

                  {/* Teléfono / WhatsApp */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Teléfono / WhatsApp
                    </span>
                    <p className="text-sm font-medium text-slate-300 flex items-center gap-2 mt-0.5">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      {profile?.whatsapp || authUser?.whatsapp || 'No registrado'}
                    </p>
                  </div>

                  {/* Rol */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tipo de Cuenta
                    </span>
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-xs font-bold text-sky-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                      {profile?.role === 'CLIENT' ? 'Alumno' : profile?.role || 'Cliente'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TARJETA 2: MEMBRESÍA / INSCRIPCIÓN */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5 md:p-6 backdrop-blur-xl shadow-lg shadow-black/20 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-5 w-5 text-sky-400" />
                    <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                      Membresía
                    </h2>
                  </div>

                  {/* Badge Dinámico de Estado */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
                      isSubscriptionActive
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSubscriptionActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    />
                    {isSubscriptionActive ? 'Activa' : subscription ? 'Vencida' : 'Sin membresía'}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Fecha de Vencimiento */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Fecha de Vencimiento
                    </span>
                    <p className="text-base font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                      <Calendar className="h-4 w-4 text-sky-400" />
                      {formattedEndDate || 'No registra fecha de expiración'}
                    </p>
                  </div>

                  {/* Días restantes o aviso de renovación */}
                  {isSubscriptionActive && (
                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3.5 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-sky-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-sky-200">
                          {daysRemaining === 0
                            ? '¡Último día de membresía disponible!'
                            : daysRemaining === 1
                            ? 'Te queda 1 día de entrenamiento'
                            : `Te quedan ${daysRemaining} días de entrenamiento`}
                        </span>
                        <p className="text-[11px] text-sky-300/80">
                          Acceso habilitado al gimnasio y a tu rutina diaria.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isSubscriptionActive && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-rose-200">
                          {subscription
                            ? 'Tu cuota mensual se encuentra vencida'
                            : 'Aún no posees una membresía activa'}
                        </span>
                        <p className="text-[11px] text-rose-300/80 mt-0.5">
                          Acércate a la recepción o comunícate con el administrador para regularizar tu inscripción.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fecha de Inicio / Pago */}
                  {formattedStartDate && (
                    <div className="pt-1 text-xs text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        Último pago registrado el {formattedStartDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Cerrar Sesión */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-4 py-2.5 text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
