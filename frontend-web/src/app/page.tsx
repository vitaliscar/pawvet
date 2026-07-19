import { Cta } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { ForVets } from '@/components/landing/for-vets';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Navbar } from '@/components/landing/navbar';
import { Services } from '@/components/landing/services';
import { Trust } from '@/components/landing/trust';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Services />
        <ForVets />
        <Trust />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
