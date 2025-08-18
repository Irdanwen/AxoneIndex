import React from 'react';
import Header from '@/components/layout/Header';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import HowItWorks from '@/components/sections/HowItWorks';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <HowItWorks />
      <Footer />
    </main>
  );
}
