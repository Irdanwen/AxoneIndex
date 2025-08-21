import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GlassCard from '@/components/ui/GlassCard';
import SectionTitle from '@/components/ui/SectionTitle';
import Stat from '@/components/ui/Stat';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-axone-dark text-white-pure">
      <Header />
      
      <main className="container-custom section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de navigation */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-axone-accent mb-6">
                Documentation
              </h2>
              
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Vue d\'ensemble' },
                  { id: 'referral', label: 'Système de parrainage' },
                  { id: 'contracts', label: 'Smart Contracts' },
                  { id: 'api', label: 'API Reference' },
                  { id: 'faq', label: 'FAQ' }
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="nav-link block py-2 px-3 rounded-lg hover:bg-axone-flounce-10 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              
              <div className="mt-8 pt-6 border-t border-white-10">
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
            <div className="space-y-section">
              {/* Section Vue d'ensemble */}
              <section id="overview" className="scroll-mt-20">
                <SectionTitle 
                  title="Vue d'ensemble" 
                  subtitle="Comprendre le système AxoneIndex" 
                />
                
                <GlassCard className="p-8 mb-8">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white-85 text-lg mb-6">
                      AxoneIndex est une plateforme de gestion de référencement blockchain 
                      permettant de créer et suivre des programmes de parrainage décentralisés.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <Stat 
                        value="15,000+" 
                        label="Utilisateurs actifs" 
                        icon="👥" 
                        gradient="from-axone-accent to-axone-flounce"
                      />
                      <Stat 
                        value="450+" 
                        label="Contrats déployés" 
                        icon="💻" 
                        gradient="from-axone-flounce to-axone-dark"
                      />
                      <Stat 
                        value="98%" 
                        label="Taux de réussite" 
                        icon="✅" 
                        gradient="from-axone-accent to-axone-dark"
                      />
                    </div>
                  </div>
                </GlassCard>
              </section>

              {/* Section Système de parrainage */}
              <section id="referral" className="scroll-mt-20">
                <SectionTitle 
                  title="Système de parrainage" 
                  subtitle="Fonctionnement technique" 
                />
                
                <GlassCard className="p-6 mb-6">
                  <h3 className="text-xl font-bold text-axone-accent mb-4">
                    Architecture technique
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-axone-accent text-axone-dark p-2 rounded-lg flex-shrink-0">
                        1
                      </div>
                      <p className="text-white-85">
                        Lorsqu&apos;un utilisateur crée un lien de parrainage, un hash cryptographique 
                        est généré via <code className="bg-axone-black-20 px-2 py-1 rounded">testHash.ts</code>
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="bg-axone-flounce text-axone-dark p-2 rounded-lg flex-shrink-0">
                        2
                      </div>
                      <p className="text-white-85">
                        Le contrat <code className="bg-axone-black-20 px-2 py-1 rounded">ReferralRegistry.sol</code> 
                        stocke la relation entre les adresses Ethereum
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-axone-accent mb-4">
                    Exemple de code
                  </h3>
                  
                  <div className="bg-axone-black-20 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <div><span className="text-axone-accent">import</span> {'{'} registerReferral, getReferralCount {'}'} from &quot;@/lib/referralUtils&quot;;</div>
                    <div></div>
                    <div><span className="text-axone-flounce">const</span> handleReferral = <span className="text-axone-accent">async</span> (referrer: string, referee: string) =&gt; {'{'}</div>
                    <div>&nbsp;&nbsp;<span className="text-axone-accent">try</span> {'{'}</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-axone-flounce">const</span> tx = <span className="text-axone-accent">await</span> registerReferral(referrer, referee);</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-axone-accent">await</span> tx.wait();</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-axone-flounce">console</span>.log(<span className="text-white-60">&quot;Parrainage enregistré !&quot;</span>);</div>
                    <div>&nbsp;&nbsp;{'}'} <span className="text-axone-accent">catch</span> (error) {'{'}</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-axone-flounce">console</span>.error(error);</div>
                    <div>&nbsp;&nbsp;{'}'}</div>
                    <div>{'}'}</div>
                  </div>
                </GlassCard>
              </section>

              {/* Section Smart Contracts */}
              <section id="contracts" className="scroll-mt-20">
                <SectionTitle 
                  title="Smart Contracts" 
                  subtitle="Architecture blockchain" 
                />
                
                <GlassCard className="p-6 mb-6">
                  <h3 className="text-xl font-bold text-axone-accent mb-4">
                    ReferralRegistry.sol
                  </h3>
                  
                  <p className="text-white-85 mb-4">
                    Le contrat principal qui gère l&apos;enregistrement et le suivi des parrainages.
                  </p>
                  
                  <div className="bg-axone-black-20 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <div><span className="text-axone-accent">contract</span> ReferralRegistry {'{'}</div>
                    <div>&nbsp;&nbsp;mapping(address =&gt; address) <span className="text-axone-flounce">public</span> referrals;</div>
                    <div>&nbsp;&nbsp;mapping(address =&gt; uint256) <span className="text-axone-flounce">public</span> referralCounts;</div>
                    <div></div>
                    <div>&nbsp;&nbsp;<span className="text-axone-accent">function</span> registerReferral(address referrer, address referee) <span className="text-axone-flounce">external</span> {'{'}</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;require(referrer != referee, <span className="text-white-60">&quot;Cannot refer yourself&quot;</span>);</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;referrals[referee] = referrer;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;referralCounts[referrer]++;</div>
                    <div>&nbsp;&nbsp;{'}'}</div>
                    <div>{'}'}</div>
                  </div>
                </GlassCard>
              </section>

              {/* Section API Reference */}
              <section id="api" className="scroll-mt-20">
                <SectionTitle 
                  title="API Reference" 
                  subtitle="Fonctions et utilitaires" 
                />
                
                <GlassCard className="p-6 mb-6">
                  <h3 className="text-xl font-bold text-axone-accent mb-4">
                    Fonctions principales
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-axone-flounce mb-2">
                        registerReferral(referrer, referee)
                      </h4>
                      <p className="text-white-85 mb-2">
                        Enregistre un nouveau parrainage entre deux adresses Ethereum.
                      </p>
                      <div className="bg-axone-black-20 rounded-lg p-3 text-sm">
                        <div><span className="text-axone-accent">Parameters:</span> referrer (address), referee (address)</div>
                        <div><span className="text-axone-accent">Returns:</span> Transaction receipt</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-axone-flounce mb-2">
                        getReferralCount(address)
                      </h4>
                      <p className="text-white-85 mb-2">
                        Récupère le nombre de parrainages effectués par une adresse.
                      </p>
                      <div className="bg-axone-black-20 rounded-lg p-3 text-sm">
                        <div><span className="text-axone-accent">Parameters:</span> address (string)</div>
                        <div><span className="text-axone-accent">Returns:</span> number</div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </section>

              {/* Section FAQ */}
              <section id="faq" className="scroll-mt-20">
                <SectionTitle 
                  title="FAQ" 
                  subtitle="Questions fréquentes" 
                />
                
                <GlassCard className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-axone-accent mb-2">
                        Comment créer un lien de parrainage ?
                      </h3>
                      <p className="text-white-85">
                        Connectez votre wallet Ethereum et utilisez la fonction de génération de lien 
                        dans l&apos;interface utilisateur. Un hash unique sera créé automatiquement.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-axone-accent mb-2">
                        Les parrainages sont-ils réversibles ?
                      </h3>
                      <p className="text-white-85">
                        Non, une fois enregistré sur la blockchain, un parrainage ne peut pas être 
                        modifié ou supprimé pour garantir l&apos;intégrité du système.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-axone-accent mb-2">
                        Quels réseaux sont supportés ?
                      </h3>
                      <p className="text-white-85">
                        Actuellement, le système fonctionne sur Ethereum mainnet et les réseaux de test 
                        (Sepolia, Goerli). D&apos;autres réseaux EVM-compatibles seront ajoutés prochainement.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

