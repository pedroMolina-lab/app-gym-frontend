'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Flame,
  ArrowRight,
  Play,
  Loader2,
  AlertCircle,
  FileVideo,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { apiClient } from '@/lib/axios';

interface ExerciseItem {
  id: string;
  name: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: 'PHOTO' | 'VIDEO' | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirigir a los clientes directamente a su rutina personal
  useEffect(() => {
    if (isAuthenticated && user?.role === 'CLIENT') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Consulta al endpoint real del backend: GET /api/exercises
  const fetchExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const response = await apiClient.get<ExerciseItem[]>('/api/exercises');
      setExercises(response.data || []);
    } catch (err: unknown) {
      console.error('Error al cargar catálogo de ejercicios:', err);
      setErrorMsg('No se pudieron sincronizar los ejercicios desde el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Banner de Bienvenida / Entrenamiento */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-sky-800 to-slate-950 p-6 text-white shadow-xl shadow-sky-950/40">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-sky-200">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              STRONG SANTIAGO • Catálogo Central
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Entrenamiento de Alto Rendimiento
            </h1>
            <p className="text-sm text-sky-100 max-w-md">
              Explora los ejercicios disponibles en el catálogo oficial de Strong Santiago con demostraciones multimedia en alta resolución.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/admin/exercises/new"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 text-sky-400 hover:bg-slate-900 px-5 py-2.5 text-sm font-bold shadow-md transition-transform active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                Crear Nuevo Ejercicio
              </Link>
            </div>
          </div>
          {/* Decoración visual */}
          <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />
        </div>


        {/* Sección del Catálogo de Ejercicios Dinámico */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 md:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-sky-400" />
                Catálogo de Ejercicios
              </h2>
              <p className="text-xs text-slate-400">
                Ejercicios centrales almacenados en Supabase Storage
              </p>
            </div>

            <button
              type="button"
              onClick={fetchExercises}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/60 transition disabled:opacity-50"
              title="Refrescar catálogo"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>

          {/* Estado de Error */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={fetchExercises}
                className="font-bold underline underline-offset-4 text-rose-300 hover:text-rose-200"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Estado de Carga (Skeletons) */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((skeletonId) => (
                <div
                  key={skeletonId}
                  className="flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-800/30 p-4 animate-pulse"
                >
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-800" />
                    <div className="h-3 w-2/3 rounded bg-slate-800/60" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado Vacío (Sin ejercicios aún) */}
          {!isLoading && exercises.length === 0 && (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
                <Dumbbell className="h-6 w-6" />
              </div>
              <h3 className="text-sm md:text-base font-bold text-slate-200">
                Aún no hay ejercicios registrados en el catálogo
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Los ejercicios creados por los administradores y profesores de Strong Santiago aparecerán aquí con sus fotos y videos demostrativos.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/exercises/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 text-xs font-bold transition shadow-md shadow-sky-500/20"
                >
                  <PlusCircle className="h-4 w-4" />
                  Crear Primer Ejercicio
                </Link>
              </div>
            </div>
          )}

          {/* Renderizado Dinámico de Ejercicios Reales */}
          {!isLoading && exercises.length > 0 && (
            <div className="space-y-3">
              {exercises.map((exercise, index) => {
                const isVideo =
                  exercise.mediaType === 'VIDEO' ||
                  Boolean(exercise.mediaUrl?.match(/\.(mp4|webm|mov|ogg)($|\?)/i));

                return (
                  <div
                    key={exercise.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-800/40 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/70"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Índice Numérico */}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold text-slate-400 mt-1 sm:mt-0">
                        {index + 1}
                      </span>

                      {/* Contenedor Multimedia (Foto o Video) */}
                      <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-inner">
                        {exercise.mediaUrl ? (
                          isVideo ? (
                            <div className="relative h-full w-full bg-slate-950 flex items-center justify-center">
                              <video
                                src={exercise.mediaUrl}
                                preload="metadata"
                                playsInline
                                muted
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <FileVideo className="h-6 w-6 text-emerald-400" />
                              </div>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={exercise.mediaUrl}
                              alt={exercise.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-800/60 text-slate-500">
                            <Dumbbell className="h-7 w-7 stroke-1" />
                          </div>
                        )}
                      </div>

                      {/* Información Textual */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm md:text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {exercise.name}
                          </h3>
                          {exercise.mediaUrl && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                              {isVideo ? 'Video' : 'Foto'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {exercise.description || 'Sin descripción adicional en el catálogo.'}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Link
                        href={`/admin/exercises/${exercise.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      >
                        <Pencil className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Editar</span>
                      </Link>

                      {exercise.mediaUrl && (
                        <a
                          href={exercise.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-slate-700 transition"
                        >
                          Ver Multimedia
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
