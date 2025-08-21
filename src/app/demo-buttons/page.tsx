'use client'

import { Button } from '@/components/ui'
import { ArrowRight, Download, Heart, Settings, Trash2, CheckCircle, Sparkles } from 'lucide-react'

export default function DemoButtonsPage() {
  return (
    <div className="min-h-screen bg-axone-dark p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4">
            Démonstration des Boutons Axone
          </h1>
          <p className="text-white-75 text-lg max-w-2xl mx-auto">
            Découvrez les nouveaux boutons élégants avec des dégradés et des effets inspirés de votre charte graphique
          </p>
        </div>

        <div className="space-y-16">
          {/* Boutons Default */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Boutons Principaux</h2>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Small
              </Button>
              <Button size="default">
                <ArrowRight className="w-4 h-4 mr-2" />
                Default
              </Button>
              <Button size="md">
                <Settings className="w-4 h-4 mr-2" />
                Medium
              </Button>
              <Button size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Large
              </Button>
              <Button size="xl">
                <Heart className="w-6 h-6 mr-2" />
                Extra Large
              </Button>
            </div>
          </section>

          {/* Boutons Premium */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Boutons Premium</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="premium" size="md">
                <Sparkles className="w-4 h-4 mr-2" />
                Premium Effect
              </Button>
              <Button variant="premium" size="lg">
                <ArrowRight className="w-5 h-5 mr-2" />
                Premium Large
              </Button>
            </div>
          </section>

          {/* Boutons Outline */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Boutons Outline</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" size="sm">
                Outline Small
              </Button>
              <Button variant="outline" size="default">
                <Settings className="w-4 h-4 mr-2" />
                Outline Default
              </Button>
              <Button variant="outline" size="lg">
                <ArrowRight className="w-5 h-5 mr-2" />
                Outline Large
              </Button>
            </div>
          </section>

          {/* Boutons Secondary */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Boutons Secondaires (Effet Verre)</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="sm">
                Secondary Small
              </Button>
              <Button variant="secondary" size="default">
                <Download className="w-4 h-4 mr-2" />
                Secondary Default
              </Button>
              <Button variant="secondary" size="lg">
                <Heart className="w-5 h-5 mr-2" />
                Secondary Large
              </Button>
            </div>
          </section>

          {/* Boutons Ghost */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Boutons Ghost</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="ghost" size="sm">
                Ghost Small
              </Button>
              <Button variant="ghost" size="default">
                <Settings className="w-4 h-4 mr-2" />
                Ghost Default
              </Button>
              <Button variant="ghost" size="lg">
                <ArrowRight className="w-5 h-5 mr-2" />
                Ghost Large
              </Button>
            </div>
          </section>

          {/* Boutons Success et Destructive */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Boutons d'Action</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="success" size="default">
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer
              </Button>
              <Button variant="destructive" size="default">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </section>

          {/* Boutons Links */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Liens Stylés</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="link" size="sm">
                Lien Simple
              </Button>
              <Button variant="link" size="default">
                <ArrowRight className="w-4 h-4 mr-1" />
                Lien avec Icône
              </Button>
            </div>
          </section>

          {/* Boutons Icon */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Boutons Icônes</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="default" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </section>

          {/* États Désactivés */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white-pure mb-6">États Désactivés</h2>
            <div className="flex flex-wrap gap-4">
              <Button disabled>Default Disabled</Button>
              <Button variant="outline" disabled>Outline Disabled</Button>
              <Button variant="secondary" disabled>Secondary Disabled</Button>
              <Button variant="ghost" disabled>Ghost Disabled</Button>
            </div>
          </section>

          {/* Navigation */}
          <section className="glass-card p-8 text-center">
            <h2 className="text-2xl font-bold text-white-pure mb-6">Navigation</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="secondary" asChild>
                <a href="/">
                  ← Retour à l'accueil
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/vaults">
                  Voir les Vaults
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
