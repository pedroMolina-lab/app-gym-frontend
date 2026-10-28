'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  Dumbbell,
  UploadCloud,
  FileVideo,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { apiClient } from '@/lib/axios';

interface CatalogExerciseFormData {
  name: string;
  description: string;
  media: FileList;
}

export default function NewExercisePage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CatalogExerciseFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Manejar previsualización de imagen/video al seleccionar archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
      setValue('media', files, { shouldValidate: true });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CatalogExerciseFormData) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Instanciar FormData para envío multipart/form-data al catálogo
      const formData = new FormData();
      formData.append('name', data.name.trim());
      if (data.description && data.description.trim().length > 0) {
        formData.append('description', data.description.trim());
      }

      // 2. Adjuntar el archivo multimedia si existe
      if (data.media && data.media.length > 0) {
        formData.append('media', data.media[0]);
      } else if (selectedFile) {
        formData.append('media', selectedFile);
      }

      // 3. Petición POST a /api/exercises con Axios
      const response = await apiClient.post('/api/exercises', formData);

      const createdExercise = response.data;
      setSuccessMsg(
        `¡Ejercicio "${createdExercise.name || data.name}" guardado exitosamente en el catálogo!`
      );

      // Limpiar formulario y archivo seleccionado
      reset();
      handleRemoveFile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message || 'Error en el servidor al registrar el ejercicio.';
        setErrorMsg(message);
      } else {
        setErrorMsg('Ocurrió un error inesperado al subir el ejercicio. Inténtalo nuevamente.');
      }
    }
  };

  return (
    <AdminGuard>
      <MainLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Header con navegación de regreso */}
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
                  Nuevo Ejercicio Reutilizable
                </h1>
              </div>
            </div>
          </div>

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
                  <button
                    type="button"
                    onClick={() => setSuccessMsg(null)}
                    className="font-bold underline underline-offset-4 text-emerald-400 hover:text-emerald-300"
                  >
                    Crear otro ejercicio
                  </button>
                  <Link
                    href="/"
                    className="text-slate-300 underline underline-offset-4 hover:text-slate-100"
                  >
                    Ir al inicio
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

          {/* Formulario Mobile-First */}
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
                    placeholder="Ej. Press de Banca Plano con Barra"
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
                    placeholder="Ej. Ejercicio compuesto para desarrollo de pectoral mayor, tríceps y deltoides anterior."
                    disabled={isSubmitting}
                    {...register('description')}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Input de Archivo Multimedia (image/* o video/*) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Archivo Multimedia (Foto o Video Demostrativo)
                </label>
                <p className="text-[11px] text-slate-400">
                  Formatos permitidos: Imágenes (PNG, JPG, WEBP) o Videos (MP4, WEBM). Máximo 50MB.
                </p>

                {/* Previsualización del archivo cargado */}
                {selectedFile && previewUrl ? (
                  <div className="relative rounded-xl border border-slate-700 bg-slate-800/50 p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {selectedFile.type.startsWith('video/') ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30">
                          <FileVideo className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="Previsualización"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isSubmitting}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                      title="Quitar archivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Dropzone / Botón de selección */
                  <label
                    htmlFor="media"
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/20 p-6 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all duration-200"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">
                      Toca o arrastra para subir Foto o Video
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      MP4, MOV, JPG, PNG o WEBP (hasta 50 MB)
                    </span>
                    <input
                      id="media"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      disabled={isSubmitting}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Botón de Enviar (Mobile-First: h-12 con loading state) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-sm text-slate-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Guardando en el catálogo...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Guardar en Catálogo</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </MainLayout>
    </AdminGuard>
  );
}
