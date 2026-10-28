'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  Dumbbell,
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Save,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { apiClient } from '@/lib/axios';

interface EditExerciseFormData {
  name: string;
  description: string;
  media: FileList;
}

interface CurrentExerciseData {
  id: string;
  name: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: 'PHOTO' | 'VIDEO' | null;
}

function EditExerciseForm() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multimedia actual almacenada en Supabase
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [existingMediaType, setExistingMediaType] = useState<'PHOTO' | 'VIDEO' | null>(null);

  // Nuevo archivo seleccionado por el usuario para reemplazo
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFilePreviewUrl, setNewFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditExerciseFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Cargar datos actuales del ejercicio vía GET /api/exercises/:id
  const fetchExerciseData = useCallback(async () => {
    if (!id) return;
    setIsLoadingInitial(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.get<CurrentExerciseData>(`/api/exercises/${id}`);
      const data = response.data;

      reset({
        name: data.name,
        description: data.description || '',
      });

      setExistingMediaUrl(data.mediaUrl);
      setExistingMediaType(data.mediaType);
    } catch (err: unknown) {
      console.error('Error al obtener ejercicio:', err);
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'No se encontró el ejercicio solicitado.');
      } else {
        setErrorMsg('Error al conectar con el servidor.');
      }
    } finally {
      setIsLoadingInitial(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchExerciseData();
  }, [fetchExerciseData]);

  // Manejar selección de nuevo archivo multimedia
  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setNewFile(file);

      if (newFilePreviewUrl) {
        URL.revokeObjectURL(newFilePreviewUrl);
      }
      setNewFilePreviewUrl(URL.createObjectURL(file));
      setValue('media', files, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleCancelNewFile = () => {
    setNewFile(null);
    if (newFilePreviewUrl) {
      URL.revokeObjectURL(newFilePreviewUrl);
      setNewFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: EditExerciseFormData) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Armar FormData para el envío
      const formData = new FormData();
      formData.append('name', data.name.trim());
      formData.append('description', data.description ? data.description.trim() : '');

      // 2. Solo agregar 'media' si el usuario seleccionó un archivo nuevo
      if (newFile) {
        formData.append('media', newFile);
      } else if (data.media && data.media.length > 0) {
        formData.append('media', data.media[0]);
      }

      // 3. Enviar petición PUT a /api/exercises/:id mediante Axios
      const response = await apiClient.put<CurrentExerciseData>(`/api/exercises/${id}`, formData);

      const updated = response.data;
      setSuccessMsg(`¡Ejercicio "${updated.name}" actualizado exitosamente!`);

      // Actualizar datos locales
      setExistingMediaUrl(updated.mediaUrl);
      setExistingMediaType(updated.mediaType);
      handleCancelNewFile();

      reset({
        name: updated.name,
        description: updated.description || '',
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Error en el servidor al actualizar el ejercicio.');
      } else {
        setErrorMsg('Ocurrió un error inesperado al guardar los cambios.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header con botón de regreso */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Catálogo Central
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-emerald-400" />
              Editar Ejercicio
            </h1>
          </div>
        </div>
      </div>

      {/* Estado de Carga Inicial */}
      {isLoadingInitial && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-slate-400 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-xs">Cargando datos del ejercicio...</p>
        </div>
      )}

      {/* Banner de Éxito */}
      {successMsg && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs md:text-sm text-emerald-300 animate-in fade-in"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{successMsg}</p>
            <div className="mt-2 flex gap-3">
              <Link
                href="/"
                className="font-bold underline underline-offset-4 text-emerald-400 hover:text-emerald-300"
              >
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Error */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs md:text-sm text-rose-300 animate-in fade-in"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Formulario de Edición */}
      {!isLoadingInitial && (
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 md:p-8 backdrop-blur-xl shadow-xl shadow-black/40">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Nombre del Ejercicio */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-300">
                Nombre del Ejercicio <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Dumbbell className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  disabled={isSubmitting}
                  {...register('name', {
                    required: 'El nombre del ejercicio es obligatorio',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                  })}
                  className="h-12 w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-[11px] font-medium text-rose-400 pl-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Descripción del Ejercicio */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-slate-300">
                Descripción / Músculo Objetivo <span className="text-slate-500">(Opcional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <textarea
                  id="description"
                  rows={3}
                  disabled={isSubmitting}
                  {...register('description')}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Sección Multimedia */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Archivo Multimedia Demostrativo
                </label>
                <span className="text-[11px] text-slate-400">Reemplazo Opcional</span>
              </div>

              {/* 1. Vista de Multimedia Existente en Supabase */}
              {!newFile && existingMediaUrl && (
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                      {existingMediaType === 'VIDEO' || existingMediaUrl.match(/\.(mp4|webm|mov)($|\?)/i) ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-950 text-teal-400">
                          <FileVideo className="h-6 w-6" />
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={existingMediaUrl}
                          alt="Multimedia Actual"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 mb-1">
                        Multimedia Actual en Servidor
                      </span>
                      <p className="text-xs text-slate-300 font-medium truncate max-w-xs">
                        Archivo alojado en Supabase Storage
                      </p>
                    </div>
                  </div>

                  <a
                    href={existingMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-400 hover:underline shrink-0"
                  >
                    Ver original
                  </a>
                </div>
              )}

              {/* 2. Vista de Nuevo Archivo Seleccionado */}
              {newFile && newFilePreviewUrl ? (
                <div className="relative rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-emerald-500/30 bg-slate-900">
                      {newFile.type.startsWith('video/') ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-950 text-teal-400">
                          <FileVideo className="h-6 w-6" />
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={newFilePreviewUrl}
                          alt="Nuevo archivo"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="truncate">
                      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30 mb-1">
                        Reemplazo preparado
                      </span>
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {newFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(newFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelNewFile}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20 transition"
                    title="Cancelar reemplazo"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Deshacer</span>
                  </button>
                </div>
              ) : (
                /* Dropzone para seleccionar nuevo archivo */
                <label
                  htmlFor="media"
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/20 p-5 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all duration-200"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-1.5">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {existingMediaUrl ? 'Toca para cambiar la foto o video actual' : 'Toca para subir una foto o video'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    MP4, MOV, JPG, PNG o WEBP (hasta 50 MB)
                  </span>
                  <input
                    id="media"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    disabled={isSubmitting}
                    onChange={handleNewFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Botón de Guardar Cambios */}
            <button
              type="submit"
              disabled={isSubmitting || (!isDirty && !newFile)}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-sm text-slate-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Guardando cambios en Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Actualizar Ejercicio</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function EditExercisePage() {
  return (
    <AdminGuard>
      <MainLayout>
        <Suspense
          fallback={
            <div className="min-h-[50vh] w-full flex items-center justify-center text-slate-400 text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mr-2" />
              <span>Cargando editor...</span>
            </div>
          }
        >
          <EditExerciseForm />
        </Suspense>
      </MainLayout>
    </AdminGuard>
  );
}
