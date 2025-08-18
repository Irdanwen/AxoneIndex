import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Axone Finance - The smart way to diversify',
  description: 'Axone Finance révolutionne l\'investissement Web3 avec des indices intelligents et une diversification automatique. Investissez simplement et efficacement dans le monde crypto.',
  keywords: 'DeFi, crypto, investissement, indices, Web3, diversification, blockchain, Hyperliquid, Unit',
  authors: [{ name: 'Axone Finance' }],
  openGraph: {
    title: 'Axone Finance - The smart way to diversify',
    description: 'La voie intelligente pour diversifier dans le Web3 — sans compromis entre simplicité et puissance.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Axone Finance - The smart way to diversify',
    description: 'La voie intelligente pour diversifier dans le Web3',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
