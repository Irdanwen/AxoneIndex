import React from 'react';
import Header from '@/components/layout/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-axone-dark">
      <Header />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white-pure mb-4">
            Test - Header fonctionnel
          </h1>
          <p className="text-white-75">
            Si vous voyez ce message, le Header fonctionne
          </p>
        </div>
      </div>
    </main>
  );
}
