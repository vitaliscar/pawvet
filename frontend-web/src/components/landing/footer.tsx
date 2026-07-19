import Link from 'next/link';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer id="contacto" className="bg-paw-950 py-14 text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-xs flex-col gap-4">
          <Link href="/" aria-label="PAWVET inicio">
            <Logo variant="light" />
          </Link>
          <p className="text-sm leading-relaxed text-cream/60">
            Huella Amiga — la plataforma chilena de citas veterinarias a domicilio y consultorio con
            profesionales verificados.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-widest text-cream/40">Plataforma</p>
            <a href="#como-funciona" className="text-sm text-cream/70 transition hover:text-cream">
              Cómo funciona
            </a>
            <a href="#servicios" className="text-sm text-cream/70 transition hover:text-cream">
              Servicios
            </a>
            <a href="#veterinarios" className="text-sm text-cream/70 transition hover:text-cream">
              Para veterinarios
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-widest text-cream/40">Legal</p>
            <span className="text-sm text-cream/70">Términos de servicio</span>
            <span className="text-sm text-cream/70">Política de privacidad</span>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-widest text-cream/40">Contacto</p>
            <span className="text-sm text-cream/70">hola@pawvet.cl</span>
            <span className="text-sm text-cream/70">Santiago, Chile</span>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-cream/10 px-6 pt-6">
        <p className="text-xs text-cream/40">
          © {new Date().getFullYear()} PAWVET. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
