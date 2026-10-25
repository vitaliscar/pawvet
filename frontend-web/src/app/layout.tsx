import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const DESCRIPTION =
  'Veterinarios verificados a domicilio en Providencia y Ñuñoa. Ve el precio final y reserva en minutos.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'PAWVET | Veterinario a domicilio', template: '%s | PAWVET' },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'PAWVET',
    title: 'PAWVET | Veterinario a domicilio',
    description: DESCRIPTION,
    images: [{ url: '/visita-veterinaria-en-casa.png', alt: 'Veterinaria atiende a un perro en su casa' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
