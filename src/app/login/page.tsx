'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/axios';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredSuccess = searchParams.get('registered') === 'true';

  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });
      const { token, user } = response.data;
      setAuth(token, user);
      if (user?.role === 'CLIENT') {
        router.push('/dashboard');
      } else {
        router.push('/admin/users');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Brand */}
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
        <p className="text-xs text-slate-400">Inicia sesión para acceder a tus entrenamientos</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl shadow-black/40">
        <form onSubmit={handleSubmit} className="space-y-4">
          {registeredSuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-400" />
              <span>¡Cuenta creada exitosamente! Ya puedes iniciar sesión.</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 font-bold text-sm text-slate-950 transition hover:bg-sky-400 active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-sky-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-xs text-slate-400">
            ¿No tienes una cuenta aún?{' '}
            <Link
              href="/register"
              className="font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-xs">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
