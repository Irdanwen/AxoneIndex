import React from 'react';
import Header from '@/components/layout/Header';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import TrustBar from '@/components/sections/TrustBar';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-axone-dark">
      <Header />
      <Hero />
      <About />
      <TrustBar />
      <Footer />
    </main>
  );
}
