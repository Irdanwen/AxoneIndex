import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Hero from '@/components/sections/Hero';

// Lazy loading des sections non critiques
const About = dynamic(() => import('@/components/sections/About'), {
  loading: () => <SectionLoader />,
});

const AxoneStars = dynamic(() => import('@/components/sections/AxoneStars'), {
  loading: () => <SectionLoader />,
});

const TrustBar = dynamic(() => import('@/components/sections/TrustBar'), {
  loading: () => <SectionLoader />,
});

const ActionSection = dynamic(() => import('@/components/sections/ActionSection'), {
  loading: () => <SectionLoader />,
});

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => <SectionLoader />,
});

// Composant de chargement pour les sections
const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-axone-accent/20 rounded-full"></div>
      <div className="w-16 h-16 border-4 border-axone-accent border-t-transparent rounded-full absolute inset-0 animate-spin"></div>
    </div>
  </div>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-axone-dark">
      <Hero />
      <Suspense fallback={<SectionLoader />}>
        <About />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <AxoneStars />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <TrustBar />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <ActionSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </main>
  );
}
