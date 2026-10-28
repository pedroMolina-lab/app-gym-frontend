'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { registerSchema, RegisterFormData } from '@/lib/validations/auth';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      whatsapp: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // 1. Enviar petición POST a /api/auth/register con los datos validados
      await apiClient.post('/api/auth/register', {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        whatsapp: data.whatsapp.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      // 2. Inicio de sesión automático tras registro exitoso
      try {
        const loginRes = await apiClient.post('/api/auth/login', {
          email: data.email.toLowerCase().trim(),
          password: data.password,
        });

        if (loginRes.data?.token && loginRes.data?.user) {
          setAuth(loginRes.data.token, loginRes.data.user);
          router.push('/');
          return;
        }
      } catch {
        // En caso de que el auto-login falle, redirigir al login con confirmación
        router.push('/login?registered=true');
        return;
      }

      router.push('/');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const serverMessage =
          error.response?.data?.message || 'Error en el servidor al registrar la cuenta.';
        setError('root', { message: serverMessage });
      } else {
        setError('root', {
          message: 'Ocurrió un error inesperado al procesar el registro. Inténtalo de nuevo.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 px-4 py-8 md:py-12 text-slate-100 overflow-y-auto selection:bg-sky-500/20 selection:text-sky-300">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand / Logo Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black border border-slate-800 p-1.5 shadow-xl shadow-sky-950/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="STRONG SANTIAGO" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white uppercase italic leading-none">
              STR<span className="text-sky-400">ONG</span>
            </h1>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-300 uppercase mt-1">
              SANTIAGO
            </p>
          </div>
          <p className="text-xs md:text-sm text-slate-400 max-w-xs mx-auto">
            Completa tus datos para acceder a tus rutinas y entrenamientos personalizados.
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Mensaje de Error Global del Backend */}
            {errors.root?.message && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed font-medium">{errors.root.message}</span>
              </div>
            )}

            {/* Agrupación: Nombre y Apellido (Apilados en móvil, 2 columnas en desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="text-xs font-semibold text-slate-300">
                  Nombre <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Ej. Juan"
                    disabled={isSubmitting}
                    {...register('firstName')}
                    className={`h-12 w-full rounded-xl border bg-slate-800/60 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-1 ${
                      errors.firstName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-[11px] font-medium text-rose-400 pl-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Apellido */}
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="text-xs font-semibold text-slate-300">
                  Apellido <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Ej. Pérez"
                    disabled={isSubmitting}
                    {...register('lastName')}
                    className={`h-12 w-full rounded-xl border bg-slate-800/60 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-1 ${
                      errors.lastName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-[11px] font-medium text-rose-400 pl-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label htmlFor="whatsapp" className="text-xs font-semibold text-slate-300">
                WhatsApp <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="whatsapp"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+5491112345678 (mínimo 10 dígitos)"
                  disabled={isSubmitting}
                  {...register('whatsapp')}
                  className={`h-12 w-full rounded-xl border bg-slate-800/60 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-1 ${
                    errors.whatsapp
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {errors.whatsapp && (
                <p className="text-[11px] font-medium text-rose-400 pl-1">
                  {errors.whatsapp.message}
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-300">
                Correo Electrónico <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  disabled={isSubmitting}
                  {...register('email')}
                  className={`h-12 w-full rounded-xl border bg-slate-800/60 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-1 ${
                    errors.email
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-400 pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Contraseña <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isSubmitting}
                  {...register('password')}
                  className={`h-12 w-full rounded-xl border bg-slate-800/60 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-1 ${
                    errors.password
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-400 pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botón de Enviar (Mobile-First: Grande, h-12 con loading state) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 font-bold text-sm text-slate-950 shadow-lg shadow-sky-500/20 transition-all duration-200 hover:bg-sky-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Registrarme</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Footer Enlace Login */}
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <p className="text-xs text-slate-400">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link
                href="/login"
                className="font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
