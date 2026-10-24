import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'PAWVET | Cuidado veterinario en casa',
  description: 'PAWVET prepara una nueva forma de conectar familias en Chile con atención veterinaria a domicilio.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
