'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Dumbbell,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  User as UserIcon,
  BadgeCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { MainLayout } from '@/components/layout/MainLayout';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  routineId?: string | null;
  routine?: {
    id: string;
    name: string;
  } | null;
  activeSubscription?: any;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/api/users?role=CLIENT');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Error al obtener la lista de alumnos.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const email = (s.email || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <AdminGuard>
      <MainLayout>
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Panel de Administración
                </span>
                <h1 className="text-xl md:text-2xl font-black text-white mt-1.5">
                  Alumnos & Rutinas
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Selecciona a un alumno para armar o editar su rutina de ejercicios.
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar alumno por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="bg-neutral-900/60 border border-neutral-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs text-neutral-400 font-medium">Cargando lista de alumnos...</p>
            </div>
          )}

          {/* Lista de Alumnos */}
          {!isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Total Alumnos ({filteredStudents.length})
                </h2>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="bg-neutral-900/50 border border-dashed border-neutral-800 rounded-3xl p-8 text-center space-y-2">
                  <UserIcon className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">No se encontraron alumnos</p>
                  <p className="text-xs text-neutral-500">
                    {searchTerm ? 'Intenta con otro término de búsqueda.' : 'No hay clientes registrados en el sistema.'}
                  </p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const hasRoutine = !!(student.routineId || student.routine);

                  return (
                    <div
                      key={student.id}
                      className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center font-bold text-sm text-emerald-400 flex-shrink-0">
                          {student.firstName ? student.firstName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">
                              {student.firstName} {student.lastName}
                            </h3>
                            {hasRoutine ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <BadgeCheck className="w-3 h-3" />
                                Con Rutina
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                Sin Rutina
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">{student.email}</p>
                          {student.routine?.name && (
                            <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-500" />
                              {student.routine.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          href={`/admin/users/${student.id}/routine`}
                          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>{hasRoutine ? 'Gestionar Rutina' : 'Asignar Rutina'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </AdminGuard>
  );
}
