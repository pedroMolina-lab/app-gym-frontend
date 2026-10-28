import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'STRONG SANTIAGO | Gimnasio & Entrenamiento',
  description: 'Plataforma oficial de STRONG SANTIAGO para seguimiento de entrenamientos, rutinas personalizadas y membresías.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
