'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Dumbbell,
  Calendar,
  Layers,
  Repeat,
  FileText,
  PlusCircle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  User as UserIcon,
  Plus,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { MainLayout } from '@/components/layout/MainLayout';

// Interfaces de datos
interface ExerciseCatalogItem {
  id: string;
  name: string;
  description?: string | null;
  mediaUrl?: string | null;
}

interface AssignedExercise {
  id: string;
  dayId: string;
  exerciseId: string;
  sets: string;
  reps: string;
  notes?: string | null;
  order?: number;
  exercise: ExerciseCatalogItem;
}

interface DayItem {
  id: string;
  routineId: string;
  name: string;
  dayNumber: number;
  dayExercises?: AssignedExercise[];
}

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface RoutineData {
  id: string;
  name: string;
  description?: string | null;
  userId?: string | null;
  user?: StudentInfo;
  days: DayItem[];
}

interface AssignExerciseFormData {
  dayId: string;
  exerciseId: string;
  sets: string;
  reps: string;
  notes?: string;
}

function RoutineBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  // Estados de datos
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);

  // Estados para edición de días
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState<string>('');
  const [editingDayNumber, setEditingDayNumber] = useState<number>(1);
  const [isUpdatingDay, setIsUpdatingDay] = useState(false);

  // Estados para edición de ejercicios asignados
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingSets, setEditingSets] = useState<string>('');
  const [editingReps, setEditingReps] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [isUpdatingExercise, setIsUpdatingExercise] = useState(false);

  // Mensajes de feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configuración de react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignExerciseFormData>({
    defaultValues: {
      dayId: '',
      exerciseId: '',
      sets: '4',
      reps: '10-12',
      notes: '',
    },
  });

  // Ejercicio seleccionado actualmente para vista previa
  const selectedExerciseId = watch('exerciseId');
  const selectedExercisePreview = exercises.find((ex) => ex.id === selectedExerciseId);

  // Carga inicial: Catálogo de Ejercicios y Rutina del Alumno
  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Obtener catálogo de ejercicios
      const exercisesPromise = apiClient.get('/api/exercises');

      // 2. Obtener rutina del alumno
      const routinePromise = apiClient.get(`/api/routines/user/${userId}`).catch(async (err) => {
        // Si no tiene rutina (404), intentamos obtener los datos del usuario para mostrar su nombre
        if (err.response?.status === 404) {
          try {
            const userRes = await apiClient.get(`/api/users/${userId}`);
            setStudent({
              id: userRes.data.id,
              firstName: userRes.data.firstName,
              lastName: userRes.data.lastName,
              email: userRes.data.email,
            });
          } catch {
            // Silencioso si falla
          }
          return null;
        }
        throw err;
      });

      const [exercisesRes, routineRes] = await Promise.all([exercisesPromise, routinePromise]);

      setExercises(Array.isArray(exercisesRes.data) ? exercisesRes.data : []);

      if (routineRes && routineRes.data) {
        setRoutine(routineRes.data);
        if (routineRes.data.user) {
          setStudent(routineRes.data.user);
        }
      } else {
        setRoutine(null);
      }
    } catch (err: any) {
      console.error('Error fetching routine builder data:', err);
      setErrorMessage(err.response?.data?.message || 'Error al cargar los datos del constructor de rutina.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Acción 1: Asignar Ejercicio a un Día (POST /api/days/:dayId/exercises)
  const onAssignExercise = async (data: AssignExerciseFormData) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await apiClient.post(`/api/days/${data.dayId}/exercises`, {
        exerciseId: data.exerciseId,
        sets: data.sets,
        reps: data.reps,
        notes: data.notes?.trim() || undefined,
      });

      const assigned: AssignedExercise = response.data;

      // Actualizar el estado local inmediatamente
      setRoutine((prev) => {
        if (!prev) return prev;
        const updatedDays = prev.days.map((day) => {
          if (day.id === data.dayId) {
            const currentExercises = day.dayExercises || [];
            return {
              ...day,
              dayExercises: [...currentExercises, assigned],
            };
          }
          return day;
        });
        return { ...prev, days: updatedDays };
      });

      setSuccessMessage('¡Ejercicio asignado con éxito!');

      // Resetear campos manteniendo el día seleccionado para agilizar la carga consecutiva
      reset({
        dayId: data.dayId,
        exerciseId: '',
        sets: '4',
        reps: '10-12',
        notes: '',
      });

      // Auto ocultar mensaje tras 4 segundos
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error al asignar ejercicio:', err);
      setErrorMessage(err.response?.data?.message || 'No se pudo asignar el ejercicio al día seleccionado.');
    }
  };

  // Acción 2: Eliminar Ejercicio Asignado (DELETE /api/days/exercises/:dayExerciseId)
  const handleDeleteExercise = async (dayExerciseId: string, dayId: string) => {
    try {
      setDeletingExerciseId(dayExerciseId);
      await apiClient.delete(`/api/days/exercises/${dayExerciseId}`);

      setRoutine((prev) => {
        if (!prev) return prev;
        const updatedDays = prev.days.map((day) => {
          if (day.id === dayId) {
            return {
              ...day,
              dayExercises: (day.dayExercises || []).filter((ex) => ex.id !== dayExerciseId),
            };
          }
          return day;
        });
        return { ...prev, days: updatedDays };
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar el ejercicio del día.');
    } finally {
      setDeletingExerciseId(null);
    }
  };

  // Acción 3: Inicializar Rutina si el alumno no tiene ninguna
  const handleCreateInitialRoutine = async () => {
    try {
      setIsCreatingRoutine(true);
      setErrorMessage(null);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Alumno';

      // Creamos la rutina con 5 días: Día 1, Día 2, Día 3, Día 4, Día 5
      const response = await apiClient.post('/api/routines', {
        name: `Rutina Personalizada - ${studentName}`,
        description: 'Plan de entrenamiento adaptado',
        userId: userId,
        days: [
          { dayNumber: 1, name: 'Día 1' },
          { dayNumber: 2, name: 'Día 2' },
          { dayNumber: 3, name: 'Día 3' },
          { dayNumber: 4, name: 'Día 4' },
          { dayNumber: 5, name: 'Día 5' },
        ],
      });

      setRoutine(response.data);
      setSuccessMessage('¡Rutina inicial de 5 días creada exitosamente!');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error al inicializar la rutina.');
    } finally {
      setIsCreatingRoutine(false);
    }
  };

  // Acción 4: Agregar un nuevo día a la rutina existente (Día 6, etc.)
  const handleAddNewDay = async () => {
    if (!routine) return;

    try {
      setIsAddingDay(true);
      const nextDayNumber = (routine.days?.length || 0) + 1;
      const res = await apiClient.post('/api/days', {
        routineId: routine.id,
        name: `Día ${nextDayNumber}`,
        dayNumber: nextDayNumber,
      });

      const newDay: DayItem = {
        ...res.data,
        name: `Día ${nextDayNumber}`,
        dayExercises: [],
      };

      setRoutine((prev) => (prev ? { ...prev, days: [...(prev.days || []), newDay] } : prev));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear el día.');
    } finally {
      setIsAddingDay(false);
    }
  };

  // Acción 5: Eliminar Día de la rutina (DELETE /api/days/:dayId)
  const handleDeleteDay = async (dayId: string, dayNumber: number) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar el Día ${dayNumber}? Se borrarán también todos los ejercicios asociados a este día.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingDayId(dayId);
      await apiClient.delete(`/api/days/${dayId}`);

      setRoutine((prev) => {
        if (!prev) return prev;
        const remainingDays = (prev.days || []).filter((d) => d.id !== dayId);
        return {
          ...prev,
          days: remainingDays,
        };
      });

      // Si el día eliminado estaba seleccionado en el formulario, limpiarlo
      if (watch('dayId') === dayId) {
        reset((current) => ({ ...current, dayId: '' }));
      }

      setSuccessMessage(`¡Día ${dayNumber} eliminado correctamente!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error al eliminar día:', err);
      alert(err.response?.data?.message || 'Error al eliminar el día de entrenamiento.');
    } finally {
      setDeletingDayId(null);
    }
  };

  // Acción 6: Iniciar edición de un Día
  const handleStartEditDay = (day: DayItem) => {
    setEditingDayId(day.id);
    setEditingDayName(day.name || `Día ${day.dayNumber}`);
    setEditingDayNumber(day.dayNumber);
  };

  const handleCancelEditDay = () => {
    setEditingDayId(null);
    setEditingDayName('');
  };

  // Acción 7: Guardar cambios de un Día (PUT /api/days/:dayId)
  const handleSaveDay = async (dayId: string) => {
    if (!editingDayName.trim()) {
      alert('El nombre del día no puede estar vacío.');
      return;
    }

    try {
      setIsUpdatingDay(true);
      const res = await apiClient.put(`/api/days/${dayId}`, {
        name: editingDayName.trim(),
        dayNumber: Number(editingDayNumber) || 1,
      });

      setRoutine((prev) => {
        if (!prev) return prev;
        const updatedDays = (prev.days || []).map((d) => {
          if (d.id === dayId) {
            return {
              ...d,
              name: res.data.name,
              dayNumber: res.data.dayNumber,
            };
          }
          return d;
        });
        updatedDays.sort((a, b) => a.dayNumber - b.dayNumber);
        return { ...prev, days: updatedDays };
      });

      setSuccessMessage('¡Día actualizado con éxito!');
      setEditingDayId(null);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Error al editar día:', err);
      alert(err.response?.data?.message || 'Error al actualizar el día.');
    } finally {
      setIsUpdatingDay(false);
    }
  };

  // Acción 8: Iniciar edición de ejercicio asignado
  const handleStartEditExercise = (assigned: AssignedExercise) => {
    setEditingExerciseId(assigned.id);
    setEditingSets(assigned.sets);
    setEditingReps(assigned.reps);
    setEditingNotes(assigned.notes || '');
  };

  const handleCancelEditExercise = () => {
    setEditingExerciseId(null);
  };

  // Acción 9: Guardar cambios de ejercicio asignado (PUT /api/days/exercises/:dayExerciseId)
  const handleSaveExercise = async (dayExerciseId: string, dayId: string) => {
    if (!editingSets.trim() || !editingReps.trim()) {
      alert('Series y repeticiones son obligatorias.');
      return;
    }

    try {
      setIsUpdatingExercise(true);
      const res = await apiClient.put(`/api/days/exercises/${dayExerciseId}`, {
        sets: editingSets.trim(),
        reps: editingReps.trim(),
        notes: editingNotes.trim() || null,
      });

      setRoutine((prev) => {
        if (!prev) return prev;
        const updatedDays = prev.days.map((day) => {
          if (day.id === dayId) {
            const currentExercises = day.dayExercises || [];
            return {
              ...day,
              dayExercises: currentExercises.map((ex) =>
                ex.id === dayExerciseId
                  ? {
                      ...ex,
                      sets: res.data.sets,
                      reps: res.data.reps,
                      notes: res.data.notes,
                    }
                  : ex
              ),
            };
          }
          return day;
        });
        return { ...prev, days: updatedDays };
      });

      setSuccessMessage('¡Ejercicio actualizado con éxito!');
      setEditingExerciseId(null);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Error al actualizar ejercicio:', err);
      alert(err.response?.data?.message || 'Error al actualizar el ejercicio.');
    } finally {
      setIsUpdatingExercise(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6 pb-12">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            Constructor de Rutinas
          </span>
        </div>

        {/* Encabezado del Alumno y Rutina */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800/80 border border-neutral-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Alumno:{' '}
                  <strong className="text-white">
                    {student ? `${student.firstName} ${student.lastName}` : 'Cargando...'}
                  </strong>
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white">
                {routine?.name || 'Asignación de Entrenamiento'}
              </h1>
              {student?.email && (
                <p className="text-xs text-neutral-400 mt-0.5">{student.email}</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Dumbbell className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Notificaciones globales */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Loading Spinner inicial */}
        {isLoading && (
          <div className="bg-neutral-900/60 border border-neutral-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs text-neutral-400 font-medium">
              Cargando catálogo y rutina del alumno...
            </p>
          </div>
        )}

        {/* Estado: El alumno no tiene rutina creada todavía */}
        {!isLoading && !routine && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Este alumno no tiene una rutina activa</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Crea una rutina personalizada para habilitar la asignación de días y ejercicios del catálogo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateInitialRoutine}
              disabled={isCreatingRoutine}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm px-5 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isCreatingRoutine ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Inicializando...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Crear Rutina Inicial para este Alumno
                </>
              )}
            </button>
          </div>
        )}

        {/* FORMULARIO DE ASIGNACIÓN (React Hook Form) */}
        {!isLoading && routine && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Asignar Ejercicio a un Día</h2>
              </div>
              <span className="text-[11px] text-neutral-400">
                {exercises.length} disponibles en catálogo
              </span>
            </div>

            <form onSubmit={handleSubmit(onAssignExercise)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Selector de Día */}
                <div className="space-y-1.5">
                  <label htmlFor="dayId" className="block text-xs font-semibold text-neutral-300">
                    Día de Entrenamiento <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="dayId"
                    {...register('dayId', { required: 'Selecciona un día' })}
                    className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">-- Elige un Día --</option>
                    {routine.days?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || `Día ${d.dayNumber}`}
                      </option>
                    ))}
                  </select>
                  {errors.dayId && (
                    <span className="text-[11px] text-red-400">{errors.dayId.message}</span>
                  )}
                </div>

                {/* 2. Selector de Ejercicio del Catálogo */}
                <div className="space-y-1.5">
                  <label htmlFor="exerciseId" className="block text-xs font-semibold text-neutral-300">
                    Ejercicio del Catálogo <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="exerciseId"
                    {...register('exerciseId', { required: 'Selecciona un ejercicio' })}
                    className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">-- Selecciona del Catálogo --</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                  {errors.exerciseId && (
                    <span className="text-[11px] text-red-400">{errors.exerciseId.message}</span>
                  )}
                </div>
              </div>

              {/* Vista previa rápida del ejercicio seleccionado */}
              {selectedExercisePreview && (
                <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-neutral-800 overflow-hidden flex items-center justify-center flex-shrink-0 border border-neutral-700/50">
                    {selectedExercisePreview.mediaUrl ? (
                      selectedExercisePreview.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                        <video
                          src={selectedExercisePreview.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={selectedExercisePreview.mediaUrl}
                          alt={selectedExercisePreview.name}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <Dumbbell className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {selectedExercisePreview.name}
                    </p>
                    <p className="text-[11px] text-neutral-400 line-clamp-1">
                      {selectedExercisePreview.description || 'Sin descripción en catálogo.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Inputs de Series y Repeticiones */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="sets" className="block text-xs font-semibold text-neutral-300">
                    Series (Sets) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Layers className="w-4 h-4" />
                    </div>
                    <input
                      id="sets"
                      type="text"
                      placeholder="ej: 4 o 3-4"
                      {...register('sets', { required: 'Indica las series' })}
                      className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {errors.sets && (
                    <span className="text-[11px] text-red-400">{errors.sets.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reps" className="block text-xs font-semibold text-neutral-300">
                    Repeticiones (Reps) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <input
                      id="reps"
                      type="text"
                      placeholder="ej: 10-12 o Al fallo"
                      {...register('reps', { required: 'Indica las repeticiones' })}
                      className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {errors.reps && (
                    <span className="text-[11px] text-red-400">{errors.reps.message}</span>
                  )}
                </div>
              </div>

              {/* Indicaciones / Notas opcionales */}
              <div className="space-y-1.5">
                <label htmlFor="notes" className="block text-xs font-semibold text-neutral-300">
                  Indicaciones del Entrenador <span className="text-neutral-500">(opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    id="notes"
                    type="text"
                    placeholder="ej: RPE 8, pausa de 2 segundos en contracción"
                    {...register('notes')}
                    className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando asignación...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Asignar Ejercicio a la Rutina
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VISTA EN TIEMPO REAL: Días y Ejercicios Asignados */}
        {!isLoading && routine && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Días de la Rutina ({routine.days?.length || 0})
              </h2>

              {/* Botón para añadir otro día si se desea */}
              <button
                type="button"
                onClick={handleAddNewDay}
                disabled={isAddingDay}
                className="h-8 px-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {isAddingDay ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Agregar Día {(routine.days?.length || 0) + 1}</span>
              </button>
            </div>

            <div className="space-y-4">
              {routine.days?.map((day) => {
                const exercisesList = day.dayExercises || [];

                return (
                  <div
                    key={day.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Encabezado del Día */}
                    <div className="p-4 bg-neutral-900/90 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {editingDayId === day.id ? (
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-neutral-400 font-semibold">N°</span>
                            <input
                              type="number"
                              min="1"
                              value={editingDayNumber}
                              onChange={(e) => setEditingDayNumber(Number(e.target.value))}
                              className="w-14 h-8 bg-neutral-950 border border-neutral-700 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div className="flex-1 min-w-[160px]">
                            <input
                              type="text"
                              value={editingDayName}
                              onChange={(e) => setEditingDayName(e.target.value)}
                              placeholder="Nombre del día (ej: Pecho & Tríceps)"
                              className="w-full h-8 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveDay(day.id)}
                              disabled={isUpdatingDay}
                              className="h-8 px-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              {isUpdatingDay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditDay}
                              disabled={isUpdatingDay}
                              className="h-8 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                            {day.dayNumber}
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {day.name || `Día ${day.dayNumber}`}
                          </h3>
                        </div>
                      )}

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs text-neutral-400">
                          {exercisesList.length} {exercisesList.length === 1 ? 'ejercicio' : 'ejercicios'}
                        </span>

                        {editingDayId !== day.id && (
                          <button
                            type="button"
                            onClick={() => handleStartEditDay(day)}
                            title="Editar nombre y número de día"
                            className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-sky-400 hover:bg-sky-500/10 px-2.5 py-1 rounded-lg border border-neutral-800 hover:border-sky-500/20 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteDay(day.id, day.dayNumber)}
                          disabled={deletingDayId === day.id}
                          title={`Eliminar Día ${day.dayNumber}`}
                          className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1 rounded-lg border border-neutral-800 hover:border-red-500/20 transition-all disabled:opacity-40"
                        >
                          {deletingDayId === day.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Borrar</span>
                        </button>
                      </div>
                    </div>

                    {/* Lista de Ejercicios del Día */}
                    <div className="p-3 space-y-2.5 bg-neutral-950/40">
                      {exercisesList.length === 0 ? (
                        <p className="text-xs text-neutral-500 text-center py-4">
                          No hay ejercicios asignados a este día. Usa el formulario de arriba para agregar uno.
                        </p>
                      ) : (
                        exercisesList.map((assigned) => (
                          <div
                            key={assigned.id}
                            className="bg-neutral-900 border border-neutral-800/80 rounded-xl p-3 flex items-start gap-3 hover:border-neutral-700 transition-colors"
                          >
                            {/* Miniatura */}
                            <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-neutral-700/60">
                              {assigned.exercise?.mediaUrl ? (
                                assigned.exercise.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                                  <video
                                    src={assigned.exercise.mediaUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                  />
                                ) : (
                                  <img
                                    src={assigned.exercise.mediaUrl}
                                    alt={assigned.exercise.name}
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <Dumbbell className="w-5 h-5 text-neutral-600" />
                              )}
                            </div>

                            {/* Formulario de edición o vista normal del ejercicio */}
                            {editingExerciseId === assigned.id ? (
                              <div className="flex-1 space-y-2">
                                <h4 className="text-xs font-bold text-white">
                                  Editar: {assigned.exercise?.name}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-neutral-400 block mb-0.5">Series</label>
                                    <input
                                      type="text"
                                      value={editingSets}
                                      onChange={(e) => setEditingSets(e.target.value)}
                                      className="w-full h-7 bg-neutral-950 border border-neutral-700 rounded px-2 text-xs text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-neutral-400 block mb-0.5">Reps</label>
                                    <input
                                      type="text"
                                      value={editingReps}
                                      onChange={(e) => setEditingReps(e.target.value)}
                                      className="w-full h-7 bg-neutral-950 border border-neutral-700 rounded px-2 text-xs text-white"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-neutral-400 block mb-0.5">Notas / Indicaciones</label>
                                  <input
                                    type="text"
                                    value={editingNotes}
                                    onChange={(e) => setEditingNotes(e.target.value)}
                                    placeholder="ej: RPE 8, pausa de 2 seg"
                                    className="w-full h-7 bg-neutral-950 border border-neutral-700 rounded px-2 text-xs text-white"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveExercise(assigned.id, day.id)}
                                    disabled={isUpdatingExercise}
                                    className="h-7 px-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded flex items-center gap-1 transition disabled:opacity-50"
                                  >
                                    {isUpdatingExercise ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    <span>Guardar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEditExercise}
                                    disabled={isUpdatingExercise}
                                    className="h-7 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Detalles */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-white truncate">
                                    {assigned.exercise?.name || 'Ejercicio'}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded">
                                      {assigned.sets} series
                                    </span>
                                    <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                      {assigned.reps} reps
                                    </span>
                                  </div>
                                  {assigned.notes && (
                                    <p className="text-[11px] text-neutral-400 mt-1 italic">
                                      "{assigned.notes}"
                                    </p>
                                  )}
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditExercise(assigned)}
                                    title="Editar series, repeticiones o notas"
                                    className="text-neutral-500 hover:text-sky-400 p-1.5 rounded-lg hover:bg-sky-500/10 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExercise(assigned.id, day.id)}
                                    disabled={deletingExerciseId === assigned.id}
                                    title="Eliminar de este día"
                                    className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-40"
                                  >
                                    {deletingExerciseId === assigned.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function RoutineBuilderPage() {
  return (
    <AdminGuard>
      <Suspense
        fallback={
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-xs font-medium text-slate-400">Cargando constructor de rutinas...</p>
          </div>
        }
      >
        <RoutineBuilderContent />
      </Suspense>
    </AdminGuard>
  );
}
