'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User as UserIcon,
  Search,
  Filter,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  Mail,
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { MainLayout } from '@/components/layout/MainLayout';

/**
 * Función auxiliar requerida:
 * Retorna true si la diferencia entre la fecha de vencimiento y hoy es de 3 días o menos
 * (incluyendo fechas pasadas / vencidas).
 */
export function isExpiringSoon(expirationDate: string): boolean {
  if (!expirationDate) return false;
  const exp = new Date(expirationDate);
  if (isNaN(exp.getTime())) return false;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expMidnight = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());

  const diffMs = expMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 3 días o menos (ej: 3, 2, 1, 0 días, o números negativos si ya expiró)
  return diffDays <= 3;
}

/**
 * Retorna la cantidad de días restantes (o días de retraso si es negativo)
 */
function getDaysRemaining(expirationDate: string): number {
  if (!expirationDate) return 0;
  const exp = new Date(expirationDate);
  if (isNaN(exp.getTime())) return 0;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expMidnight = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());

  const diffMs = expMidnight.getTime() - todayMidnight.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una fecha ISO a string amigable DD/MM/AAAA
 */
function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Helper para obtener string YYYY-MM-DD para inputs date de HTML
 */
function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SubscriptionItem {
  id: string;
  userId: string;
  paymentDate: string;
  expirationDate: string;
  startDate?: string;
  endDate?: string;
  user?: StudentUser;
  createdAt?: string;
}

function SubscriptionsContent() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPIRING' | 'ACTIVE'>('ALL');

  // Estado del Modal de Nuevo Pago
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalUserId, setModalUserId] = useState('');
  const [modalPaymentDate, setModalPaymentDate] = useState(() => toDateInputValue(new Date()));
  const [modalExpirationDate, setModalExpirationDate] = useState(() => {
    const future = new Date();
    future.setMonth(future.getMonth() + 1);
    return toDateInputValue(future);
  });
  const [modalError, setModalError] = useState<string | null>(null);

  // Cargar suscripciones y alumnos
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const [subsRes, studentsRes] = await Promise.all([
        apiClient.get('/api/subscriptions'),
        apiClient.get('/api/users?role=CLIENT').catch(() => ({ data: [] })),
      ]);

      setSubscriptions(Array.isArray(subsRes.data) ? subsRes.data : []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
    } catch (err: any) {
      console.error('Error al cargar suscripciones:', err);
      setErrorMsg(err.response?.data?.message || 'Error al sincronizar las suscripciones del servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manejar creación de nuevo pago
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalUserId) {
      setModalError('Debes seleccionar un alumno.');
      return;
    }
    if (!modalPaymentDate || !modalExpirationDate) {
      setModalError('Las fechas de pago y vencimiento son obligatorias.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/api/subscriptions', {
        userId: modalUserId,
        paymentDate: modalPaymentDate,
        expirationDate: modalExpirationDate,
      });

      setSuccessMsg('¡Pago de inscripción registrado exitosamente!');
      setIsModalOpen(false);

      // Resetear campos
      setModalUserId('');
      const today = new Date();
      setModalPaymentDate(toDateInputValue(today));
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setModalExpirationDate(toDateInputValue(nextMonth));

      // Recargar lista
      fetchData();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error al registrar pago:', err);
      setModalError(err.response?.data?.message || 'No se pudo guardar la inscripción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de suscripciones
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const fullName = `${sub.user?.firstName || ''} ${sub.user?.lastName || ''}`.toLowerCase();
    const email = (sub.user?.email || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);

    const expDate = sub.expirationDate || sub.endDate || '';
    const expiring = isExpiringSoon(expDate);

    if (!matchesSearch) return false;
    if (filterType === 'EXPIRING') return expiring;
    if (filterType === 'ACTIVE') return !expiring;
    return true;
  });

  const expiringCount = subscriptions.filter((s) => isExpiringSoon(s.expirationDate || s.endDate || '')).length;

  return (
    <MainLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
        {/* Banner Superior */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-5 md:p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Gestión Administrativa
                </span>
                {expiringCount > 0 && (
                  <span className="text-[11px] uppercase tracking-wider font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 animate-pulse">
                    {expiringCount} por vencer / vencidas
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Inscripciones y Pagos
              </h1>
              <p className="text-xs md:text-sm text-neutral-400 mt-1">
                Control de membresías activas, alertas de vencimiento y cobros.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={fetchData}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registrar Pago</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notificaciones de éxito / error */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Filtros y Buscador */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por alumno o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                filterType === 'ALL'
                  ? 'bg-neutral-800 text-white border-neutral-700 shadow-sm'
                  : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              Todos ({subscriptions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('EXPIRING')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                filterType === 'EXPIRING'
                  ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-sm'
                  : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-red-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Por Vencer / Vencidas ({expiringCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ACTIVE')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                filterType === 'ACTIVE'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm'
                  : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-emerald-400'
              }`}
            >
              Al Día ({subscriptions.length - expiringCount})
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="bg-neutral-900/60 border border-neutral-800 p-12 rounded-3xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs text-neutral-400 font-medium">Cargando registros de inscripciones...</p>
          </div>
        )}

        {/* Tabla / Lista de Pagos con Renderizado Condicional */}
        {!isLoading && (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 shadow-xl bg-neutral-900/80">
            {filteredSubscriptions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CreditCard className="w-10 h-10 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No se encontraron pagos</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {searchTerm
                    ? 'Ningún registro coincide con los términos de búsqueda.'
                    : 'Aún no se han registrado inscripciones o pagos en el sistema.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/70 text-[11px] uppercase tracking-wider font-bold text-neutral-400">
                      <th className="py-3.5 px-4 md:px-5">Alumno</th>
                      <th className="py-3.5 px-4">Fecha de Pago</th>
                      <th className="py-3.5 px-4">Vencimiento</th>
                      <th className="py-3.5 px-4">Estado / Alerta</th>
                      <th className="py-3.5 px-4 text-right">Días Restantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 text-xs md:text-sm">
                    {filteredSubscriptions.map((sub) => {
                      const expDate = sub.expirationDate || sub.endDate || '';
                      const payDate = sub.paymentDate || sub.startDate || '';
                      const expiring = isExpiringSoon(expDate);
                      const daysLeft = getDaysRemaining(expDate);

                      return (
                        <tr
                          key={sub.id}
                          className={`transition-colors ${
                            expiring
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-medium'
                              : 'bg-white text-slate-800 dark:bg-neutral-900/60 dark:text-neutral-200 hover:bg-neutral-800/40'
                          }`}
                        >
                          {/* Alumno */}
                          <td className="py-4 px-4 md:px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                  expiring
                                    ? 'bg-red-200 text-red-900 dark:bg-red-500/20 dark:text-red-300'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {sub.user?.firstName ? sub.user.firstName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div className="truncate">
                                <p className="font-bold truncate">
                                  {sub.user ? `${sub.user.firstName} ${sub.user.lastName}` : 'Alumno no asignado'}
                                </p>
                                <p
                                  className={`text-[11px] truncate ${
                                    expiring ? 'text-red-700 dark:text-red-400' : 'text-neutral-400'
                                  }`}
                                >
                                  {sub.user?.email || 'Sin correo'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Fecha de Pago */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 opacity-60" />
                              <span>{formatDate(payDate)}</span>
                            </div>
                          </td>

                          {/* Fecha de Vencimiento */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Clock className="w-3.5 h-3.5 opacity-60" />
                              <span>{formatDate(expDate)}</span>
                            </div>
                          </td>

                          {/* Badge de Alerta Visual */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {expiring ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-200 text-red-900 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/30">
                                <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400 animate-bounce" />
                                {daysLeft < 0 ? 'VENCIDA' : daysLeft === 0 ? 'VENCE HOY' : 'VENCE PRONTO'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                AL DÍA
                              </span>
                            )}
                          </td>

                          {/* Días Restantes */}
                          <td className="py-4 px-4 text-right whitespace-nowrap font-bold">
                            {daysLeft < 0 ? (
                              <span className="text-red-600 dark:text-red-400">
                                Hace {Math.abs(daysLeft)} días
                              </span>
                            ) : daysLeft === 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">Hoy</span>
                            ) : (
                              <span>
                                {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL: REGISTRAR NUEVO PAGO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Registrar Nuevo Pago</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleCreatePayment} className="mt-4 space-y-4">
                {modalError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Selector de Alumno */}
                <div className="space-y-1.5">
                  <label htmlFor="studentSelect" className="block text-xs font-semibold text-neutral-300">
                    Seleccionar Alumno <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="studentSelect"
                    value={modalUserId}
                    onChange={(e) => setModalUserId(e.target.value)}
                    required
                    className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">-- Elige un Alumno --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.firstName} {st.lastName} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha de Pago */}
                <div className="space-y-1.5">
                  <label htmlFor="paymentDate" className="block text-xs font-semibold text-neutral-300">
                    Fecha de Pago (Inicio) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="paymentDate"
                      type="date"
                      value={modalPaymentDate}
                      onChange={(e) => {
                        const newPay = e.target.value;
                        setModalPaymentDate(newPay);
                        // Sugerir automáticamente 1 mes después
                        if (newPay) {
                          const d = new Date(newPay);
                          d.setMonth(d.getMonth() + 1);
                          setModalExpirationDate(toDateInputValue(d));
                        }
                      }}
                      required
                      className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Fecha de Vencimiento */}
                <div className="space-y-1.5">
                  <label htmlFor="expirationDate" className="block text-xs font-semibold text-neutral-300">
                    Fecha de Vencimiento <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="expirationDate"
                      type="date"
                      value={modalExpirationDate}
                      onChange={(e) => setModalExpirationDate(e.target.value)}
                      required
                      className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Pago</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function AdminSubscriptionsPage() {
  return (
    <AdminGuard>
      <Suspense
        fallback={
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-xs font-medium text-slate-400">Cargando inscripciones...</p>
          </div>
        }
      >
        <SubscriptionsContent />
      </Suspense>
    </AdminGuard>
  );
}
