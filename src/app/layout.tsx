import type { Metadata } from 'next'
import './globals.css'
import { WagmiProvider } from '@/components/providers/WagmiProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Axone Finance - L\'avenir de la finance décentralisée',
  description: 'Axone Finance révolutionne l\'écosystème DeFi avec des solutions innovantes, une sécurité de pointe et une expérience utilisateur exceptionnelle.',
  keywords: 'DeFi, finance décentralisée, crypto, blockchain, Axone Finance, staking, yield farming',
  authors: [{ name: 'Axone Finance Team' }],
  creator: 'Axone Finance',
  publisher: 'Axone Finance',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://axone-finance.com'),
  openGraph: {
    title: 'Axone Finance - L\'avenir de la finance décentralisée',
    description: 'Axone Finance révolutionne l\'écosystème DeFi avec des solutions innovantes, une sécurité de pointe et une expérience utilisateur exceptionnelle.',
    url: 'https://axone-finance.com',
    siteName: 'Axone Finance',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Axone Finance - Plateforme DeFi',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Axone Finance - L\'avenir de la finance décentralisée',
    description: 'Axone Finance révolutionne l\'écosystème DeFi avec des solutions innovantes, une sécurité de pointe et une expérience utilisateur exceptionnelle.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#011f26" />
        <meta name="color-scheme" content="dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Axone Finance" />
        <meta name="application-name" content="Axone Finance" />
        <meta name="msapplication-TileColor" content="#011f26" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="antialiased bg-background">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-axone-accent text-axone-dark px-4 py-2 rounded-lg font-semibold z-50 focus:outline-none focus:ring-2 focus:ring-axone-accent focus:ring-offset-2 focus:ring-offset-axone-dark"
        >
          Aller au contenu principal
        </a>
        <div className="min-h-screen bg-axone-dark">
          <WagmiProvider>
            <ThemeProvider>
              <Header />
              <div id="main-content" className="pt-20 md:pt-24">
                {children}
              </div>
            </ThemeProvider>
          </WagmiProvider>
        </div>
      </body>
    </html>
  )
}
