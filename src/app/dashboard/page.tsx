'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Calendar,
  Layers,
  Repeat,
  ChevronDown,
  FileVideo,
  AlertCircle,
  Loader2,
  RefreshCw,
  Flame,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface CatalogExercise {
  id: string;
  name: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: 'PHOTO' | 'VIDEO' | null;
}

interface DayExercisePivot {
  id: string;
  dayId: string;
  exerciseId: string;
  sets: string;
  reps: string;
  notes: string | null;
  exercise?: CatalogExercise;
}

interface DayWithExercises {
  id: string;
  dayNumber: number;
  name: string;
  routineId: string;
  dayExercises?: DayExercisePivot[];
}

interface UserRoutine {
  id: string;
  name: string;
  description: string | null;
  userId?: string | null;
  days?: DayWithExercises[];
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [routine, setRoutine] = useState<UserRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirigir al login si el usuario no tiene sesión activa
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Control de estado para los días expandidos del Acordeón
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Control de estado para el modal de ejercicio ampliado
  const [selectedExercise, setSelectedExercise] = useState<DayExercisePivot | null>(null);

  const toggleDayAccordion = (dayId: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  // Consulta al endpoint del cliente: GET /api/routines/me
  const fetchMyRoutine = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.get<UserRoutine>('/api/routines/me');
      const data = response.data;
      setRoutine(data);

      // Por defecto en móvil, expandir automáticamente el primer día para mejorar la UX
      if (data?.days && data.days.length > 0) {
        setExpandedDays({ [data.days[0].id]: true });
      }
    } catch (err: unknown) {
      console.error('Error al cargar la rutina del alumno:', err);
      // El backend retorna 404 si el usuario aún no tiene rutina asignada
      setErrorMsg('No tienes ninguna rutina asignada por el momento.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyRoutine();
    }
  }, [fetchMyRoutine, isAuthenticated]);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header del Dashboard del Alumno */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Mi Plan de Entrenamiento
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-sky-400" />
              {routine?.name || 'Mi Rutina Semanal'}
            </h1>
            {routine?.description && (
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
                {routine.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={fetchMyRoutine}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            title="Actualizar rutina"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>

        {/* Estado de Carga (Skeletons) */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((skId) => (
              <div
                key={skId}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-40 rounded bg-slate-800" />
                  <div className="h-4 w-16 rounded bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado: Sin Rutina Asignada */}
        {!isLoading && (!routine || !routine.days || routine.days.length === 0) && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 md:p-12 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Dumbbell className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base md:text-lg font-bold text-slate-100">
                Aún no tienes una rutina asignada
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tu entrenador o el administrador del gimnasio armará tu plan de entrenamiento personalizado en breve.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchMyRoutine}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Verificar de nuevo</span>
            </button>
          </div>
        )}

        {/* Listado de Días con Diseño Acordeón (Mobile-First) */}
        {!isLoading && routine?.days && routine.days.length > 0 && (
          <div className="space-y-3.5">
            {routine.days.map((day) => {
              const isExpanded = Boolean(expandedDays[day.id]);
              const exercises = day.dayExercises || [];

              return (
                <div
                  key={day.id}
                  className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/50 backdrop-blur-xl transition-all duration-200 shadow-lg shadow-black/20 hover:border-slate-700/80"
                >
                  {/* Encabezado del Día (Botón del Acordeón) */}
                  <button
                    type="button"
                    onClick={() => toggleDayAccordion(day.id)}
                    aria-expanded={isExpanded}
                    className="w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors duration-150 hover:bg-slate-800/30"
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      {/* Badge con número de día */}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 font-black text-xs text-slate-950 shadow-md shadow-blue-500/20">
                        D{day.dayNumber}
                      </span>

                      {/* Título del Día */}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm md:text-base font-bold text-slate-100 truncate">
                            Día {day.dayNumber}
                          </h2>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'} asignados
                        </span>
                      </div>
                    </div>

                    {/* Indicador Flecha con animación */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-sky-400 bg-sky-500/10' : ''
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {/* Contenido Desplegable: Ejercicios del Día */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 md:p-5 space-y-3 animate-in fade-in duration-200">
                      {exercises.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-500 italic">
                          No hay ejercicios asignados a este día todavía.
                        </p>
                      ) : (
                        exercises.map((dayEx, exIndex) => {
                          const catalog = dayEx.exercise;
                          const isVideo =
                            catalog?.mediaType === 'VIDEO' ||
                            Boolean(catalog?.mediaUrl?.match(/\.(mp4|webm|mov)($|\?)/i));

                          return (
                            <div
                              key={dayEx.id}
                              onClick={() => setSelectedExercise(dayEx)}
                              className="cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 md:p-4 transition-all duration-200 hover:border-sky-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-sky-950/20 space-y-3"
                            >
                              <div className="flex items-start gap-3.5">
                                {/* Índice */}
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-400 mt-0.5">
                                  {exIndex + 1}
                                </span>

                                {/* Miniatura Multimedia */}
                                <div className="relative h-14 w-14 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900">
                                  {catalog?.mediaUrl ? (
                                    isVideo ? (
                                      <div className="relative h-full w-full bg-slate-950 flex items-center justify-center text-teal-400">
                                        <FileVideo className="h-6 w-6" />
                                      </div>
                                    ) : (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src={catalog.mediaUrl}
                                        alt={catalog.name}
                                        className="h-full w-full object-cover"
                                      />
                                    )
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-500 bg-slate-800">
                                      <Dumbbell className="h-5 w-5" />
                                    </div>
                                  )}
                                </div>

                                {/* Información del Ejercicio */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-bold text-slate-100 truncate">
                                      {catalog?.name || 'Ejercicio sin nombre'}
                                    </h3>
                                  </div>

                                  {catalog?.description && (
                                    <p className="text-xs text-slate-400 line-clamp-1">
                                      {catalog.description}
                                    </p>
                                  )}

                                  {/* Prescripción Personalizada (Sets y Reps de la tabla pivot) */}
                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-300 border border-sky-500/20">
                                      <Layers className="h-3 w-3 text-sky-400" />
                                      {dayEx.sets} {Number(dayEx.sets) === 1 ? 'Serie' : 'Series'}
                                    </span>

                                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-500/20">
                                      <Repeat className="h-3 w-3 text-blue-400" />
                                      {dayEx.reps} Repeticiones
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Notas del Entrenador (opcional) */}
                              {dayEx.notes && (
                                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90 flex items-start gap-2">
                                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                                  <span className="leading-relaxed">
                                    <strong>Indicación del profe:</strong> {dayEx.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Overlay / Detalle Ampliado de Ejercicio */}
        {selectedExercise && (() => {
          const catalog = selectedExercise.exercise;
          const isVideo =
            catalog?.mediaType === 'VIDEO' ||
            Boolean(catalog?.mediaUrl?.match(/\.(mp4|webm|mov|ogg)($|\?)/i));

          return (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setSelectedExercise(null)}
            >
              <div
                className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Botón flotante para cerrar */}
                <button
                  type="button"
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Contenedor Multimedia Ampliado */}
                <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-slate-800">
                  {catalog?.mediaUrl ? (
                    isVideo ? (
                      <video
                        src={catalog.mediaUrl}
                        controls
                        autoPlay
                        playsInline
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={catalog.mediaUrl}
                        alt={catalog.name}
                        className="h-full w-full object-contain"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Dumbbell className="h-12 w-12" />
                      <span className="text-xs">Sin demostración multimedia</span>
                    </div>
                  )}
                </div>

                {/* Información y Prescripción del Ejercicio */}
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-100">
                      {catalog?.name || 'Ejercicio sin nombre'}
                    </h3>
                    {catalog?.description && (
                      <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {catalog.description}
                      </p>
                    )}
                  </div>

                  {/* Series y Repeticiones destacadas */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 px-4 py-2">
                      <Layers className="h-4 w-4 text-sky-400" />
                      <span className="text-xs sm:text-sm font-bold text-sky-300">
                        {selectedExercise.sets} {Number(selectedExercise.sets) === 1 ? 'Serie' : 'Series'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2">
                      <Repeat className="h-4 w-4 text-blue-400" />
                      <span className="text-xs sm:text-sm font-bold text-blue-300">
                        {selectedExercise.reps} Repeticiones
                      </span>
                    </div>
                  </div>

                  {/* Indicaciones del Entrenador */}
                  {selectedExercise.notes && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 flex items-start gap-2.5">
                      <MessageSquare className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong className="text-amber-300">Nota del entrenador:</strong> {selectedExercise.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
}
