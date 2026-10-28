import { MainLayout } from '@/components/layout/MainLayout';
import { Settings } from 'lucide-react';

export default function AjustesPage() {
  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100">Ajustes</h1>
            <p className="text-xs text-slate-400">Preferencias de la aplicación y notificaciones</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
          <p className="text-sm">Configuraciones de cuenta y preferencias de la app.</p>
        </div>
      </div>
    </MainLayout>
  );
}
