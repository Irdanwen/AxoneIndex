"use client";
import { useEffect, useState } from 'react';
import Footer from '@/components/layout/Footer';
import GlassCard from '@/components/ui/GlassCard';
import SectionTitle from '@/components/ui/SectionTitle';

export default function DocumentationPage() {
  const [selectedSection, setSelectedSection] = useState('overview');

  useEffect(() => {
    const updateFromHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash?.replace('#', '');
      setSelectedSection(hash || 'overview');
    };
    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);
    return () => window.removeEventListener('hashchange', updateFromHash);
  }, []);
  const protocolConceptsIds = ['overview-index', 'rebalancing', 'hypercore', 'hyperunit'];
  const tokenDesignIds = ['token', 'launch', 'revenue', 'fees', 'inflation', 'value', 'buyback'];
  const growthIds = ['introduction', 'epoch0', 'epoch1', 'epoch2'];
  const orderedSectionIds = ['overview', ...protocolConceptsIds, ...tokenDesignIds, ...growthIds];
  function SectionNav({ currentId }: { currentId: string }) {
    const index = orderedSectionIds.indexOf(currentId);
    const prevId = index > 0 ? orderedSectionIds[index - 1] : null;
    const nextId = index >= 0 && index < orderedSectionIds.length - 1 ? orderedSectionIds[index + 1] : null;
    const goTo = (id: string | null) => {
      if (!id) return;
      if (typeof window !== 'undefined') {
        window.location.hash = `#${id}`;
      }
    };
    return (
      <div className="flex items-center justify-between gap-4 mt-[3rem] !mt-[3rem] mb-[3rem]">
        <button
          onClick={() => goTo(prevId)}
          disabled={!prevId}
          className={`btn-primary px-4 py-2 rounded-lg ${!prevId ? 'opacity-50 pointer-events-none' : ''}`}
          aria-label="Section précédente"
        >
          ← Section précédente
        </button>
        <button
          onClick={() => goTo(nextId)}
          disabled={!nextId}
          className={`btn-primary px-4 py-2 rounded-lg ${!nextId ? 'opacity-50 pointer-events-none' : ''}`}
          aria-label="Section suivante"
        >
          Section suivante →
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-axone-dark text-white-pure">
      
      <main className="container-custom section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de navigation */}
          <div className="lg:col-span-1">
            <GlassCard padding="sm" className="group p-3 hover:p-6 md:p-3 md:hover:p-6 transition-all duration-300 ease-out sticky top-[10rem] mt-[10rem] mb-[10rem] hover:mb-[5rem]">
              <h2 className="text-2xl font-bold text-axone-accent mb-2 group-hover:mb-6 transition-all duration-300 ease-out">
                Documentation
              </h2>
              
              <div className="hidden group-hover:block transition-all duration-300 ease-out">
                <nav className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-white-60 mb-2">PROTOCOL CONCEPTS</div>
                    <div className="space-y-1">
                      <a href="#overview-index" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'overview-index' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🎯 Overview</a>
                      <a href="#rebalancing" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'rebalancing' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>⚖️ Smart Rebalancing</a>
                      <a href="#hypercore" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'hypercore' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🌊 Axone x Hypercore</a>
                      <a href="#hyperunit" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'hyperunit' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🛡️ Axone x HyperUnit</a>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold tracking-wide text-white-60 mb-2">TOKEN DESIGN</div>
                    <div className="space-y-1">
                      <a href="#token" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'token' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>⭐ Le Token Axone</a>
                      <a href="#launch" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'launch' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🚀 Lancement</a>
                      <a href="#revenue" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'revenue' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>💠 Revenue</a>
                      <a href="#fees" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'fees' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>💰 Gestion des frais</a>
                      <a href="#inflation" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'inflation' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>📈 Inflation maîtrisée</a>
                      <a href="#value" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'value' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🔥 Partage de la valeur</a>
                      <a href="#buyback" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'buyback' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🌀 Buyback & Burn</a>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold tracking-wide text-white-60 mb-2">STRATEGIE DE CROISSANCE</div>
                    <div className="space-y-1">
                      <a href="#introduction" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'introduction' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🌾 Introduction</a>
                      <a href="#epoch0" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'epoch0' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🌟 Époque 0</a>
                      <a href="#epoch1" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'epoch1' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🌍 Époque 1</a>
                      <a href="#epoch2" className={`nav-link block py-2 px-3 rounded-lg transition-colors ${selectedSection === 'epoch2' ? 'bg-axone-flounce-10' : 'hover:bg-axone-flounce-10'}`}>🚀 Époque 2</a>
                    </div>
                  </div>
                </nav>
              </div>
              
              <div className="mt-2 group-hover:mt-6 pt-0 group-hover:pt-6 border-t border-transparent group-hover:border-white-10 transition-all duration-300 ease-out">
                <a 
                  href="/referral" 
                  className="btn-primary w-full flex justify-center"
                >
                  Accéder à la plateforme
                </a>
              </div>
            </GlassCard>
          </div>
          
          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className="space-y-0">
              {/* Section Axone */}
              {selectedSection === 'overview' && (
              <section id="overview" className="scroll-mt-20 px-8 space-y-8">
                <SectionTitle 
                  title="Axone" 
                  subtitle="Comprendre le système AxoneIndex" 
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-8 text-white-85 text-lg">
                    <p>🚀 Bienvenue dans l’univers d’Axone</p>
                    <p>
                      Dans un monde où les opportunités Web3 se multiplient à une vitesse vertigineuse, investir devient à la fois plus prometteur… et plus complexe.
                      Trop de choix. Trop de volatilité. Trop de bruit.
                    </p>
                    <p>Axone a été conçu pour changer la donne.</p>
                    <p>
                      🎯 Notre mission : rendre l’investissement Web3 simple, intelligent et accessible à tous.
                      Nous nous inspirons d’un modèle qui a fait ses preuves dans la finance traditionnelle : l’investissement par indices. À l’image du S&P 500, les produits Axone regroupent plusieurs actifs, optimisent leur répartition, et s’adaptent en continu à la réalité du marché.
                    </p>
                    <p>Mais ici, tout se passe on-chain, avec transparence, flexibilité et performance.</p>
                    <p>
                      En construisant sur les fondations technologiques d’Hyperliquid et d’Unit, nous ouvrons une nouvelle ère pour la gestion de portefeuille décentralisée : plus agile, plus liquide, plus pertinente.
                    </p>
                    <p>Axone, c’est la voie intelligente pour diversifier dans le Web3 — sans compromis entre simplicité et puissance.</p>
                  </div>
                </GlassCard>
                <SectionNav currentId="overview" />
              </section>
              )}

              {/* Section Overview */}
              <section id="overview-index" className={`scroll-mt-20 space-y-8 ${selectedSection !== 'overview-index' ? 'hidden' : ''}`}>
                <SectionTitle 
                  title="🎯 Overview" 
                  subtitle="Axone Index – L’investissement Web3, réinventé" 
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-6 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🌐 Axone Index – L’investissement Web3, réinventé</h3>
                    <p>
                      L’univers crypto évolue vite, mais investir intelligemment ne devrait pas être un casse-tête.
                      Avec Axone Index, nous avons repensé la façon de s’exposer au marché.
                    </p>
                    <p>
                      🔹 Un seul actif en entrée, une exposition instantanée à plusieurs projets crypto.
                      Fini la chasse aux places de marché liquides, la gestion manuelle des swaps ou l’analyse interminable des frais cachés.
                      Axone regroupe tout dans un produit unique, pensé pour maximiser l’efficacité et réduire la complexité.
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <div className="space-y-8 text-white-85">
                    <p className="font-semibold">Nos indices vous permettent de :</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Simplifier vos investissements, en un clic.</li>
                      <li>Diversifier vos positions sans effort.</li>
                      <li>Sécuriser vos allocations avec une infrastructure décentralisée fiable et transparente.</li>
                    </ul>
                    <p>
                      Avec Axone, vous gagnez du temps, vous réduisez vos risques, et vous profitez du potentiel du Web3, sans les frictions habituelles.
                    </p>
                    <p>💡 Axone Index, c’est la porte d’entrée idéale vers un portefeuille crypto optimisé et intelligent.</p>
                  </div>
                </GlassCard>
                <SectionNav currentId="overview-index" />
              </section>

              {/* Section Introduction */}
              {selectedSection === 'introduction' && (
              <section id="introduction" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🌾 Introduction" 
                  subtitle="Lancement progressif, communautaire"
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🌱 Un lancement progressif, pensé pour la communauté</h3>
                    <p>
                      Axone est avant tout un projet communautaire et innovant, conçu pour durer et croître avec son écosystème.
                      Plutôt qu’un lancement unique et précipité, nous avons choisi une approche progressive et inclusive, afin d’aligner au mieux les intérêts de tous les participants.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Un déploiement en plusieurs époques, chacune jouant un rôle stratégique dans :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>La montée en puissance du protocole, étape par étape.</li>
                        <li>La mitigation des risques, pour éviter les déséquilibres liés à un lancement trop concentré.</li>
                        <li>La maximisation de la liquidité, afin d’assurer une expérience fluide pour tous les investisseurs et utilisateurs.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 Notre objectif : construire Axone avec et pour sa communauté, en donnant à chacun l’opportunité de participer aux moments clés de son évolution.
                  </p>
                </GlassCard>
                <SectionNav currentId="introduction" />
              </section>
              )}

              {/* Section Époque 0 */}
              {selectedSection === 'epoch0' && (
              <section id="epoch0" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🌟 Époque 0" 
                  subtitle="Les premiers bâtisseurs d’Axone"
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🌟 Époque 0 – Les premiers bâtisseurs d’Axone</h3>
                    <p>
                      L’Époque 0 marque les premiers pas d’Axone, une phase pionnière où chaque membre de la communauté joue un rôle clé dans la construction du protocole.
                      C’est le moment où le soutien des premiers utilisateurs a le plus d’impact et de valeur, posant les bases de tout ce qui suivra.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🚀 Stratégie de l’Époque 0 :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Accès exclusif à la plateforme via invitation et code de parrainage.</li>
                        <li>Code et smart contracts privés, afin de minimiser les risques durant cette phase sensible.</li>
                        <li>Système à points déjà actif, permettant de récompenser concrètement les premiers participants.</li>
                        <li>Frais des index collectés utilisés pour financer le développement initial du protocole.</li>
                        <li>Création de premiers index “bluechips”, offrant une exposition simple et robuste aux projets majeurs du Web3.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 Rejoindre l’Époque 0, c’est faire partie du cercle des pionniers, ceux qui auront façonné l’avenir d’Axone dès ses premiers instants.
                  </p>
                </GlassCard>
                <SectionNav currentId="epoch0" />
              </section>
              )}

              {/* Section Époque 1 */}
              {selectedSection === 'epoch1' && (
              <section id="epoch1" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🌍 Époque 1" 
                  subtitle="L’ouverture d’Axone au monde"
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🌍 Époque 1 – L’ouverture d’Axone au monde</h3>
                    <p>
                      L’Époque 1 marque une étape clé dans l’histoire d’Axone : la fin de la phase confidentielle et l’entrée dans une ère d’expansion ouverte et transparente.
                      C’est le moment où la communauté s’agrandit, la réputation se forge, et où Axone s’affirme comme un acteur incontournable de l’investissement Web3.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🚀 Stratégie de l’Époque 1 :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Ouverture complète de la plateforme, accessible à tous les utilisateurs sans restriction.</li>
                        <li>Renforcement de la sécurité, avec des audits publiés pour instaurer une confiance totale.</li>
                        <li>Passage en open-source, pour offrir transparence et collaboration à la communauté.</li>
                        <li>Poursuite du système à points, récompensant toujours les utilisateurs actifs et engagés.</li>
                        <li>Multiplication des produits d’index, diversifiant les opportunités d’investissement et élargissant l’écosystème Axone.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 L’Époque 1, c’est l’envol d’Axone, une phase où la vision se concrétise et où chaque nouvel utilisateur contribue à bâtir une force collective mondiale.
                  </p>
                </GlassCard>
                <SectionNav currentId="epoch1" />
              </section>
              )}

              {/* Section Époque 2 */}
              <section id="epoch2" className={`scroll-mt-20 ${selectedSection !== 'epoch2' ? 'hidden' : ''}`}>
                <SectionTitle 
                  title="🚀 Époque 2" 
                  subtitle="L’accomplissement de la vision Axone"
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-6 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🚀 Époque 2 – L’accomplissement de la vision Axone</h3>
                    <p>
                      L’Époque 2 marque le moment décisif où Axone passe du stade de la promesse à celui de la pleine réalisation de son potentiel.
                      C’est l’ère où l’écosystème atteint sa maturité, où les fondations posées lors des premières époques portent enfin leurs fruits pour la communauté.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🌟 Stratégie de l’Époque 2 :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Fin du système à points, après avoir rempli son rôle de récompense pionnière.</li>
                        <li>Achat du ticker Hypercore, renforçant notre ancrage dans l’écosystème Hyperliquid.</li>
                        <li>Vente publique du token $AXN et TGE (Token Generation Event), ouvrant une nouvelle phase de liquidité et d’accessibilité.</li>
                        <li>Inclusion du token $AXN dans les stratégies de nos vaults, créant une demande organique et durable.</li>
                        <li>Activation de la distribution de l’inflation aux détenteurs d’index, alignant encore plus leur engagement avec la croissance du protocole.</li>
                        <li>Redirection des frais vers le vault de staking Axone, renforçant les rewards pour les holders.</li>
                        <li>Mise en place du Buyback & Burn, soutenant la valeur du token sur le long terme.</li>
                        <li>Lancement de la roadmap long terme, amorçant une nouvelle ère d’innovation et d’expansion pour Axone.</li>
                      </ul>
                    </div>
                      </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                      <p className="text-white-85">
                    💡 Époque 2, c’est l’instant où Axone tient toutes ses promesses, offrant un protocole complet, durable et tourné vers l’avenir, au service de sa communauté.
                  </p>
                </GlassCard>
                <SectionNav currentId="epoch2" />
              </section>

              {/* Section Smart Rebalancing */}
              {selectedSection === 'rebalancing' && (
              <section id="rebalancing" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="⚖️ Smart Rebalancing" 
                  subtitle="Rééquilibrage automatique et dynamique" 
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">⚡ Smart Rebalancing – L’intelligence derrière nos Index</h3>
                    <p>
                      Les marchés crypto évoluent vite, et vos investissements doivent suivre le rythme.
                      C’est pourquoi les index Axone ne se contentent pas d’être passifs : ils sont dynamiques et intelligents.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed">
                        🔹 <span className="font-semibold">Toutes les heures</span>, nos index se rééquilibrent automatiquement.
                        Ils vendent une partie des actifs qui surperforment, rachètent ceux sous-évalués, et ajustent votre exposition en continu.
                      </p>
                      <p className="leading-relaxed">
                        Résultat : vos gains sont sécurisés, vos allocations optimisées, et votre portefeuille évolue avec le marché – sans effort de votre part.
                      </p>
                    </div>
                  </div>
                </GlassCard>
                    
                <GlassCard className="p-[2rem]">
                      <p className="text-white-85">
                    💡 Axone automatise ce que les meilleurs traders font manuellement, pour que votre capital travaille à plein potentiel.
                  </p>
                </GlassCard>
                <SectionNav currentId="rebalancing" />
              </section>
              )}

              {/* Section Axone x Hypercore */}
              {selectedSection === 'hypercore' && (
              <section id="hypercore" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🌊 Axone x Hypercore" 
                  subtitle="Liquidité native via Hyperliquid Hypercore" 
                />
                
                <GlassCard className="p-[2rem] mb-[2rem]">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">💧 Axone x Hypercore – La puissance de la liquidité native</h3>
                    <p>
                      La performance d’un index dépend en grande partie de la qualité de sa liquidité.
                      C’est pourquoi Axone s’appuie directement sur Hypercore, le moteur de liquidité d’Hyperliquid, pour offrir une expérience sans friction.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed">
                        🔹 Frais réduits. Slippage minimal. Exécution instantanée.
                        En se connectant à la source même de la liquidité, nos index bénéficient des meilleures conditions du marché, garantissant à chaque investisseur une efficacité maximale à chaque transaction.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 Avec Axone, vos investissements accèdent directement à la profondeur de marché la plus performante du Web3.
                  </p>
                </GlassCard>
                <SectionNav currentId="hypercore" />
              </section>
              )}

              {/* Section Axone x HyperUnit */}
              {selectedSection === 'hyperunit' && (
              <section id="hyperunit" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🛡️ Axone x HyperUnit" 
                  subtitle="Transparence et sécurité au cœur des index" 
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🛡️ Axone x HyperUnit – Transparence et sécurité au cœur de nos Index</h3>
                    <p>
                      La confiance est la base de tout investissement.
                      C’est pourquoi les index Axone s’appuient directement sur HyperUnit, garantissant l’utilisation d’actifs natifs, sûrs et transparents.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed">
                        🔹 Pas d’intermédiaires inutiles. Pas de bridges fragiles. Pas de points de défaillance évitables.
                        Grâce à HyperUnit, nos produits s’alignent pleinement avec la philosophie d’Hyperliquid :
                      </p>
                      <p className="leading-relaxed">Sécurité renforcée par des protocoles solides et éprouvés.</p>
                      <p className="leading-relaxed">Transparence totale, chaque actif étant traçable et vérifiable on-chain.</p>
                      <p className="leading-relaxed">Modularité, ouvrant la voie à un marché Web3 vaste, interconnecté et fiable.</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 Avec Axone, vos investissements sont protégés à la source, conçus pour durer et évoluer en toute confiance.
                  </p>
                </GlassCard>
                <SectionNav currentId="hyperunit" />
              </section>
              )}

              {/* Section Le Token Axone */}
              {selectedSection === 'token' && (
              <section id="token" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="⭐ Le Token Axone" 
                  subtitle="Le token natif $AXN"
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">💠 Le Token Axone – Au cœur de la création de valeur</h3>
                    <p>
                      Chez Axone, notre token n’est pas un simple jeton utilitaire : il est intrinsèquement lié à l’écosystème et à nos index.
                      Dès sa conception, nous avons pensé son allocation, son utilité et son rôle économique pour qu’il crée et redistribue de la valeur à ceux qui croient en notre vision.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Un token conçu pour :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Participer activement au fonctionnement du protocole et de ses produits.</li>
                        <li>Capturer la croissance générée par les index et l’activité de la plateforme.</li>
                        <li>Récompenser durablement les détenteurs du token natif Axone.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 Détenir du $AXN, c’est détenir une part de l’avenir que nous construisons : un Web3 plus simple, plus efficace et plus accessible à tous.
                  </p>
                </GlassCard>
                <SectionNav currentId="token" />
              </section>
              )}

              {/* Section Lancement */}
              {selectedSection === 'launch' && (
              <section id="launch" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🚀 Lancement" 
                  subtitle="Approche communautaire et équitable"
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🚀 Un lancement équitable, pensé pour la communauté</h3>
                    <p>
                      Chez Axone, nous croyons que le Web3 doit rester fidèle à ses principes : équité, ouverture et décentralisation.
                      C’est pourquoi le lancement initial de notre token suivra une approche 100% communautaire, sans compromis.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Concrètement :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Une vente publique ouverte à tous, accessible sans barrière d’entrée.</li>
                        <li>Une distribution par système à points récompensant les premiers utilisateurs de nos index, ceux qui auront soutenu les débuts du protocole.</li>
                        <li>Aucun Venture Capital, aucune vente privée à de grands groupes : notre token n’appartient pas à une poignée d’investisseurs, mais à toute la communauté.</li>
                        <li>Aucune allocation privilégiée pour l’équipe, qui sera financée uniquement par la vente publique d’une partie des tokens.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 100% du supply sera reversé à la communauté. Axone est conçu pour être construit, détenu et gouverné par ceux qui y croient réellement.
                  </p>
                </GlassCard>
                <SectionNav currentId="launch" />
              </section>
              )}

              {/* Section Revenue */}
              {selectedSection === 'revenue' && (
              <section id="revenue" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="💠 Revenue" 
                  subtitle="Synergie entre index et token $AXN"
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-8 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🔗 Un lien fort entre les Index et le Token Axone</h3>
                    <p>
                      Les index sont au cœur de la vision d’Axone.
                      Il est donc naturel que notre token natif, le $AXN, soit étroitement intégré à leur fonctionnement.
                      Nous avons imaginé un système conçu pour créer un cercle vertueux entre nos produits, notre protocole et notre communauté.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Comment cela fonctionne :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Les index génèrent des frais, utilisés pour soutenir le protocole et créer de la valeur.</li>
                        <li>Chaque index achète et détient des tokens $AXN, directement sur le marché, créant une pression acheteuse organique et durable.</li>
                        <li>En échange, les processeurs des index reçoivent 100% de l’inflation du token $AXN, générant ainsi un revenu supplémentaire pour leurs produits.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <div className="space-y-3 text-white-85">
                    <p className="leading-relaxed font-semibold">🔹 Pour les détenteurs du token $AXN :</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>50% des frais de création d’index sont reversés en $HYPE, offrant un revenu direct à la communauté.</li>
                      <li>50% restants servent à un mécanisme de buyback & burn, réduisant l’offre circulante et soutenant la valeur du token.</li>
                    </ul>
                    <p>💡 Axone crée une synergie unique entre produits et tokenomics, où chaque nouvel index renforce l’écosystème et alimente la croissance à long terme du $AXN.</p>
                  </div>
                </GlassCard>
                <SectionNav currentId="revenue" />
              </section>
              )}

              {/* Section Gestion des frais */}
              {selectedSection === 'fees' && (
              <section id="fees" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="💰 Gestion des frais" 
                  subtitle="Un moteur de valeur durable"
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-6 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">💰 Gestion des frais – Un moteur de valeur durable</h3>
                    <p>
                      Chez Axone, chaque interaction avec nos index contribue à renforcer l’écosystème et à créer de la valeur pour la communauté.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Concrètement :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Lorsqu’un utilisateur achète un index, 0,5% du montant est prélevé en frais.</li>
                        <li>Le même pourcentage est appliqué lors de la revente de l’index.</li>
                        <li>Ces frais ne sont pas captés pour du profit immédiat : ils sont réinvestis dans le protocole, alimentant les mécanismes qui génèrent de la valeur long terme pour l’ensemble des utilisateurs.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 Chaque transaction renforce Axone, soutenant la croissance de la plateforme, la performance des produits et la solidité du token $AXN.
                  </p>
                </GlassCard>
                <SectionNav currentId="fees" />
              </section>
              )}

              {/* Section Inflation maîtrisée */}
              {selectedSection === 'inflation' && (
              <section id="inflation" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="📈 Inflation maîtrisée" 
                  subtitle="Une croissance partagée avec nos utilisateurs"
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-6 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">📈 Inflation maîtrisée – Une croissance partagée avec nos utilisateurs</h3>
                    <p>
                      Le token $AXN est conçu pour croître avec son écosystème et récompenser ceux qui font vivre le protocole.
                      L’inflation est fixe à 3% par an et est désormais calculée sur la supply circulante (et non la supply totale),
                      avec la possibilité d’exclure certaines adresses (trésorerie, vesting, burn) du calcul.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Concrètement :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Le contrat calcule la supply circulante via <code>circulatingSupply()</code> et distribue l’inflation en conséquence.</li>
                        <li>Les adresses non-circulantes peuvent être gérées par l’owner via <code>setExcludedFromCirculating(address,bool)</code>.</li>
                        <li>Cette inflation est intégralement reversée aux détenteurs des index Axone, renforçant leur implication dans le protocole.</li>
                        <li>Elle accroît la valeur des index au fil du temps, offrant une récompense supplémentaire aux investisseurs engagés.</li>
                        <li>Elle stimule l’adoption des produits Axone, en créant un cercle vertueux où l’activité génère davantage de bénéfices pour la communauté.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>
                    
                <GlassCard className="p-[2rem]">
                      <p className="text-white-85">
                    💡 Chez Axone, l’inflation n’est pas une dilution : c’est un levier de croissance et de partage de valeur pour nos utilisateurs.
                  </p>
                </GlassCard>
                <SectionNav currentId="inflation" />
              </section>
              )}

              {/* Section Partage de la valeur */}
              {selectedSection === 'value' && (
              <section id="value" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🔥 Partage de la valeur" 
                  subtitle="Axone au cœur de l’écosystème Hyperliquid"
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-6 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🔥 Partage de la valeur – Axone au cœur de l’écosystème Hyperliquid</h3>
                    <p>
                      Chez Axone, nous croyons que la valeur générée par la plateforme doit revenir à sa communauté tout en renforçant l’écosystème qui nous fait grandir.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Notre engagement :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>50% des frais collectés sont convertis en $HYPE, le token natif d’Hyperliquid.</li>
                        <li>Ces fonds sont ensuite déposés dans un vault dédié, redistribuant directement cette valeur réelle aux détenteurs du token $AXN.</li>
                        <li>Ce mécanisme aligne profondément Axone et Hyperliquid, en ancrant notre protocole dans son vecteur de liquidité tout en offrant un flux de revenus tangible à notre communauté.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>
                    
                <GlassCard className="p-[2rem]">
                      <p className="text-white-85">
                    💡 Plus l’activité sur Axone croît, plus la valeur redistribuée augmente – un cercle vertueux où tout l’écosystème en sort gagnant.
                  </p>
                </GlassCard>
                <SectionNav currentId="value" />
              </section>
              )}

              {/* Section Buyback & Burn */}
              {selectedSection === 'buyback' && (
              <section id="buyback" className="scroll-mt-20 space-y-8">
                <SectionTitle 
                  title="🌀 Buyback & Burn" 
                  subtitle="Un soutien organique et durable au $AXN"
                />
                
                <GlassCard className="p-[2rem] mb-8">
                  <div className="space-y-6 text-white-85">
                    <h3 className="text-xl font-bold text-axone-accent">🔄 Buyback & Burn – Un soutien organique et durable au $AXN</h3>
                    <p>
                      Chez Axone, nous avons conçu un mécanisme simple mais puissant pour soutenir la valeur du token dans le temps et créer un impact direct pour notre communauté.
                    </p>
                    <div className="space-y-3">
                      <p className="leading-relaxed font-semibold">🔹 Chaque jour, 50% des frais collectés sont utilisés pour racheter des tokens $AXN sur le marché, puis les brûler définitivement.</p>
                      <p className="leading-relaxed">Ce processus :</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Réduit l’offre en circulation, soutenant la valeur du $AXN de manière naturelle et progressive.</li>
                        <li>Profite indirectement aux index contenant du $AXN, renforçant leur exposition.</li>
                        <li>Compense l’inflation, protégeant les détenteurs sur le long terme.</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-[2rem]">
                  <p className="text-white-85">
                    💡 Plus l’activité sur la plateforme croît, plus le mécanisme de Buyback & Burn agit comme un moteur de rareté et de valorisation du $AXN.
                  </p>
                </GlassCard>
                <SectionNav currentId="buyback" />
              </section>
              )}

              

              
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

