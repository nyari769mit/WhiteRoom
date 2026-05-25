'use client';

import { Nav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { BeforeAfter } from '@/components/landing/before-after';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Maritime } from '@/components/landing/maritime';
import { Pricing } from '@/components/landing/pricing';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <BeforeAfter />
      <HowItWorks />
      <Maritime />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}
