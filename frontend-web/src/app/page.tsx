import Image from 'next/image';
import Link from 'next/link';
import { createServerPb } from '@/lib/pocketbase/server';
import styles from './home.module.css';

export default async function HomePage() {
  const pb = await createServerPb();
  const isAdmin = pb.authStore.isValid && pb.authStore.record?.role === 'admin';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="PAWVET, inicio">
          <span className={styles.brandMark} aria-hidden="true">P</span>
          <span>PAWVET<span className={styles.brandPeriod}>.</span></span>
        </Link>
        <nav className={styles.nav} aria-label="Navegación principal">
          <a href="#propuesta">La experiencia</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#veterinarios">Para veterinarios</a>
        </nav>
        <Link href={isAdmin ? '/dashboard' : '/login'} className={styles.headerLink}>
          {isAdmin ? 'Ir al panel' : 'Acceso al panel'} <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.status}>Atención veterinaria a domicilio · Chile</p>
          <h1 id="hero-title">El cuidado llega<br />a <em>su lugar feliz.</em></h1>
          <p className={styles.heroLead}>
            Estamos creando una forma más cercana de cuidar a tu mascota: atención profesional en casa, con información clara desde el primer paso.
          </p>
          <div className={styles.heroActions}>
            <a href="#como-funciona" className={styles.primaryButton}>Conoce la propuesta <span aria-hidden="true">↗</span></a>
            <span className={styles.launchNote}>PAWVET está en preparación</span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <Image
            src="/visita-veterinaria-en-casa.png"
            alt="Veterinaria atiende a un perro acompañado por su tutora en casa"
            fill
            priority
            sizes="(max-width: 850px) 100vw, 55vw"
            className={styles.heroImage}
          />
          <div className={styles.imageCaption}>Una visita pensada para ellos, en el espacio que conocen.</div>
        </div>
      </section>

      <div className={styles.promiseStrip} aria-label="Principios de PAWVET">
        <span>Cuidado en casa</span><span className={styles.stripDot} aria-hidden="true" />
        <span>Profesionales verificados</span><span className={styles.stripDot} aria-hidden="true" />
        <span>Información a la vista</span>
      </div>

      <section id="propuesta" className={styles.intro}>
        <div className={styles.introLabel}>Nuestra idea de cuidado</div>
        <div>
          <h2>Una consulta puede sentirse<br /><em>mucho más cercana.</em></h2>
          <p>Tu mascota se queda en su entorno. Tú sabes quién la atenderá, dónde y cuándo. El profesional llega con tiempo para conocerla y dejar un registro útil para seguir cuidándola.</p>
        </div>
      </section>

      <section id="como-funciona" className={styles.process}>
        <div className={styles.processHead}>
          <h2>Así será tu experiencia</h2>
          <p>Estamos construyendo una reserva sencilla, con la información que necesitas antes de decidir.</p>
        </div>
        <div className={styles.processGrid}>
          <article className={styles.processItem}>
            <span className={styles.processNumber}>01</span>
            <h3>Encuentra a tu profesional</h3>
            <p>Explora veterinarios según tu ubicación y revisa su perfil y servicios.</p>
          </article>
          <article className={styles.processItem}>
            <span className={styles.processNumber}>02</span>
            <h3>Elige una visita</h3>
            <p>Consulta la disponibilidad y los detalles de la atención antes de agendar.</p>
          </article>
          <article className={styles.processItem}>
            <span className={styles.processNumber}>03</span>
            <h3>Sigue su cuidado</h3>
            <p>Guarda la información clínica de tu mascota para sus próximos controles.</p>
          </article>
        </div>
      </section>

      <section id="veterinarios" className={styles.vetSection}>
        <div className={styles.vetSymbol} aria-hidden="true">P<span>.</span></div>
        <div className={styles.vetCopy}>
          <h2>Para quienes cuidan<br /><em>todos los días.</em></h2>
          <p>PAWVET también está pensado para veterinarios: perfiles verificados, disponibilidad organizada y antecedentes clínicos accesibles durante la atención.</p>
          <p className={styles.vetStatus}>La incorporación de profesionales se habilitará en una próxima etapa.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>PAWVET<span>.</span></span>
        <span>Cuidado veterinario más cerca de casa.</span>
        <span>© {new Date().getFullYear()} PAWVET · Chile</span>
      </footer>
    </main>
  );
}
