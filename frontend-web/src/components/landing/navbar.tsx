import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Logo } from '@/components/logo';

const LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#veterinarios', label: 'Para veterinarios' },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-paw-100/60 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="PAWVET inicio">
          <Logo />
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/70 transition hover:text-paw-700"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full bg-paw-600 px-5 py-2 text-sm font-semibold text-cream transition hover:bg-paw-700 focus:outline-none focus:ring-2 focus:ring-paw-500 focus:ring-offset-2 focus:ring-offset-cream">
                Iniciar sesión
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-full bg-paw-600 px-5 py-2 text-sm font-semibold text-cream transition hover:bg-paw-700"
            >
              Ir al panel
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
