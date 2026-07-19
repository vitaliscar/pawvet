import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'PAWVET — El veterinario llega a tu puerta',
  description:
    'Huella Amiga: agenda atención veterinaria a domicilio o en consultorio con profesionales verificados en Chile.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${display.variable} ${body.variable} bg-cream`}>
        <body className="font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
