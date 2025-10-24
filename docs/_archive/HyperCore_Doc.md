Documentation de Hyperliquid

Table des matières :
	•	À propos de Hyperliquid
	•	Core contributors
	•	Guide de démarrage (Onboarding)
	•	Comment commencer à trader
	•	Comment utiliser le HyperEVM
	•	Comment staker du HYPE
	•	Connexion mobile via QR code
	•	Exporter votre wallet email
	•	Faucet du testnet
	•	HyperCore
	•	Vue d’ensemble
	•	Bridge
	•	Serveurs API
	•	Clearinghouse
	•	Oracle
	•	Carnet d’ordres (Order book)
	•	Staking
	•	Vaults
	•	Vaults de protocole
	•	Pour les leaders de vault
	•	Pour les déposants de vault
	•	Multi-sig
	•	HyperEVM
	•	Outils pour les builders HyperEVM
	•	Hyperliquid Improvement Proposals (HIPs)
	•	HIP-1 : Standard de token natif
	•	HIP-2 : Hyperliquidity
	•	HIP-3 : Perpétuels déployés par les builders
	•	Frontend checks
	•	Trading
	•	Actifs perpétuels
	•	Spécifications des contrats
	•	Paliers de marge (Margin tiers)
	•	Frais
	•	Builder codes
	•	Carnet d’ordres
	•	Types d’ordre
	•	Ordres Take Profit et Stop Loss (TP/SL)
	•	Gestion de la marge (Margining)
	•	Liquidations
	•	Prix d’entrée et PnL
	•	Funding (taux de financement)
	•	Divers UI
	•	Auto-deleveraging (désendettement automatique)
	•	Indices de prix robustes
	•	Prévention d’auto-trading
	•	Graphiques de portfolio
	•	Hyperps
	•	Market making
	•	Validateurs
	•	Exécuter un validateur
	•	Programme de délégation
	•	Référencement (Referrals)
	•	Programme de parrainage : proposition de staking
	•	Points
	•	Données historiques
	•	Risques
	•	Programme de bug bounty
	•	Audits
	•	Brand kit (charte graphique)
	•	Pour les développeurs
	•	API
	•	Notation
	•	Identifiants d’actifs (Asset IDs)
	•	Tick size et lot size
	•	Nonces et wallets API
	•	Endpoint d’information (Info endpoint)
	•	Perpétuels
	•	Spot
	•	Endpoint d’échange (Exchange endpoint)
	•	WebSocket
	•	Subscriptions
	•	Requêtes Post
	•	Timeouts et heartbeats
	•	Réponses d’erreur (Error responses)
	•	Signature des requêtes
	•	Limites de taux et de comptes
	•	Optimisation de la latence
	•	Bridge2
	•	Déploiement d’actifs HIP-1 et HIP-2
	•	Actions du déployeur HIP-3
	•	HyperEVM (section développeurs)
	•	HyperEVM Mainnet et Testnet
	•	Nœuds (Nodes)
	•	Schémas de données L1
	•	Nœud fondation non-validateur

À propos de Hyperliquid

What is Hyperliquid? (Qu’est-ce que Hyperliquid ?)

Hyperliquid est une blockchain performante construite avec la vision d’un système financier totalement on-chain et ouvert. Liquidité, applications utilisateurs et activité de trading se regroupent sur une plateforme unifiée qui hébergera à terme l’ensemble de la finance.

Technical overview (Vue d’ensemble technique)

Hyperliquid est une blockchain de couche 1 (L1) écrite et optimisée en repartant de zéro.

Hyperliquid utilise un algorithme de consensus personnalisé appelé HyperBFT, inspiré de Hotstuff et de ses successeurs. L’algorithme et la couche réseau sont tous deux optimisés depuis le début pour répondre aux exigences uniques de cette L1.

L’exécution d’état de Hyperliquid est scindée en deux grands composants : HyperCore et HyperEVM. HyperCore comprend des carnets d’ordres de futures perpétuels et de spot entièrement on-chain. Chaque ordre, annulation, trade et liquidation se produit de manière transparente avec une finalité en un bloc, héritée du consensus HyperBFT. HyperCore prend en charge 200 000 ordres par seconde, et ce débit s’améliore constamment à mesure que le logiciel des nœuds est optimisé.

L’HyperEVM apporte la plateforme de smart contracts d’usage général, familière grâce à Ethereum, à la blockchain Hyperliquid. Grâce à HyperEVM, la liquidité performante et les primitives financières d’HyperCore sont disponibles en tant que briques de base permissionless pour tous les utilisateurs et builders. Voir la section de documentation HyperEVM pour plus de détails techniques.

Remarque : Une image d’architecture se trouve dans la documentation originale (non incluse ici).

Core contributors
Hyperliquid Labs est un core contributor soutenant la croissance de Hyperliquid, dirigé par Jeff et iliensinc, camarades de classe à Harvard. Les autres membres de l’équipe sont issus de Caltech et MIT, et ont précédemment travaillé chez Airtable, Citadel, Hudson River Trading et Nuro .

L’équipe faisait du market making propriétaire en crypto en 2020 et s’est lancée dans la DeFi durant l’été 2022. Les plateformes existantes souffraient de nombreux problèmes : une mauvaise conception de marché, une technologie déficiente et une UX maladroite. Il était facile de gagner de l’argent en tradant sur ces protocoles, mais consternant de voir à quel point la DeFi était en retard comparée aux plateformes centralisées. L’équipe a donc entrepris de construire un produit pouvant résoudre ces problèmes et offrir aux utilisateurs une expérience de trading fluide.

Concevoir une L1 décentralisée performante avec un DEX à carnet d’ordres intégré nécessite une compréhension approfondie du trading quantitatif, des technologies blockchain de pointe et une UX soignée — ce que l’équipe est bien positionnée pour délivrer. L’équipe s’engage activement auprès de la communauté et est à l’écoute de celle-ci ; vous êtes invités à rejoindre le serveur Discord pour poser des questions et partager vos retours.

Enfin, Hyperliquid Labs est autofinancée et n’a pas levé de capital externe, ce qui permet à l’équipe de se concentrer sur la construction d’un produit en lequel elle croit, sans pression extérieure.

Guide de démarrage (Onboarding)

(Cette section Onboarding liste des guides pratiques pour démarrer sur Hyperliquid.)

How to start trading – Comment commencer à trader

Cette section répond aux questions fréquentes pour débuter sur Hyperliquid.
	•	De quoi ai-je besoin pour trader sur Hyperliquid ?
Vous pouvez trader sur Hyperliquid avec un wallet DeFi standard ou en vous connectant via votre adresse email. Si vous utilisez un wallet DeFi, vous aurez besoin de :
	1.	Un wallet EVM – Si vous n’en avez pas déjà (par ex. Rabby, MetaMask, WalletConnect, Coinbase Wallet), vous pouvez en créer un facilement via rabby.io. Après avoir installé l’extension de wallet sur votre navigateur, créez un nouveau wallet. Veillez à sauvegarder votre phrase secrète (seed phrase) : quiconque y accède peut accéder à vos fonds. Ne partagez jamais votre clé privée. La bonne pratique est de noter votre seed phrase et de la conserver en lieu sûr.
	2.	Collatéral – Vous devez disposer soit :
	•	de USDC et d’ETH (pour le gas de dépôt) sur Arbitrum, ou
	•	de BTC sur Bitcoin, d’ETH sur Ethereum, ou de SOL/BONK/FARTCOIN/PUMP/SPX sur Solana, que vous pourrez échanger contre de l’USDC sur Hyperliquid.
	•	Comment m’onboarder sur Hyperliquid ?
Il existe différentes interfaces et applications pour utiliser Hyperliquid, notamment :
	•	Based (based.one) – application web, iOS, Android
	•	Dexari (dexari.com) – application iOS, Android
	•	Lootbase (lootbase.com) – application iOS, Android
	•	Phantom (phantom.com) – extension web, iOS, Android
	•	Hyperliquid Web App (app.hyperliquid.xyz) – application web
Connexion via email : Si vous choisissez de vous connecter sur app.hyperliquid.xyz avec votre email :
	1.	Cliquez sur le bouton « Connecter », entrez votre adresse email, et appuyez sur « Submit ». En quelques secondes, un code à 6 chiffres vous sera envoyé par email. Saisissez-le pour vous connecter.
	2.	Vous êtes maintenant connecté. Il ne vous reste plus qu’à déposer des fonds. Une nouvelle adresse blockchain est créée pour votre adresse email. Vous pouvez envoyer de l’USDC via Arbitrum, du BTC via Bitcoin, de l’ETH via Ethereum, ou du SOL/BONK/FARTCOIN/PUMP/SPX via Solana. Cela peut se faire facilement depuis un échange centralisé ou un autre wallet DeFi.
Connexion via wallet DeFi : Si vous préférez vous connecter à app.hyperliquid.xyz avec un wallet :
	1.	Cliquez sur « Connecter » et choisissez un wallet à connecter. Une fenêtre pop-up de votre extension wallet apparaîtra pour autoriser la connexion à Hyperliquid. Cliquez sur « Connecter ».
	2.	Cliquez sur le bouton « Enable Trading ». Votre extension wallet vous demandera de signer une transaction sans gas. Cliquez sur « Signer ».
	3.	Déposez des fonds sur Hyperliquid : choisissez entre USDC sur Arbitrum, BTC sur Bitcoin, ETH sur Ethereum, ou SOL/BONK/FARTCOIN/PUMP/SPX sur Solana.
	1.	Pour l’USDC : saisissez le montant à déposer et cliquez sur « Deposit ». Confirmez la transaction dans votre wallet EVM.
	2.	Pour les autres actifs : envoyez l’actif spot à l’adresse de destination indiquée. Notez que seul l’USDC est utilisé comme collatéral de trading, vous devrez donc vendre cet actif pour de l’USDC afin de trader des perpétuels ou d’autres actifs spot.
	4.	Vous êtes prêt à trader sur Hyperliquid !
	•	Comment trader des perpétuels sur Hyperliquid ?
Sur Hyperliquid, les contrats perpétuels utilisent l’USDC comme collatéral pour prendre une position long ou short sur un token (sans acheter le token lui-même, contrairement au spot). Pour ouvrir un trade perpétuel :
	1.	Utilisez le sélecteur de tokens pour choisir le token sur lequel vous voulez ouvrir une position.
	2.	Décidez si vous voulez long ou short ce token. Si vous pensez que le prix va monter, ouvrez une position long. S’il va baisser, ouvrez une position short.
	3.	Définissez la taille de votre position via le curseur ou en saisissant le montant. (Rappel : taille de position = levier * collatéral).
	4.	Cliquez sur « Passer l’ordre » puis confirmez dans la fenêtre de confirmation. Vous pouvez cocher « Ne plus afficher ceci » pour ne pas avoir à confirmer chaque ordre à l’avenir.
	•	Comment déposer de l’USDC sur Hyperliquid ?
	1.	Vous aurez besoin d’ETH et d’USDC sur le réseau Arbitrum, car le bridge natif de Hyperliquid fonctionne entre Hyperliquid et Arbitrum. L’ETH ne sert qu’à payer le gas pour déposer de l’USDC (le trading sur Hyperliquid ne consomme pas de gas).
	•	Vous pouvez utiliser différents bridges, tels que : bridge.arbitrum.io, debridge.finance, mayan.finance, across.to, routernitro.com, jumper.exchange ou synapseprotocol.com.
	•	Alternativement, vous pouvez transférer des fonds directement vers Arbitrum depuis un échange centralisé si vous en utilisez un.
	2.	Une fois que vous avez de l’ETH et de l’USDC sur Arbitrum, vous pouvez déposer en cliquant sur le bouton « Deposit » sur app.hyperliquid.xyz/trade.
	•	Comment retirer de l’USDC de Hyperliquid ?
	1.	Sur la page Trade, cliquez sur « Withdraw » en bas à droite de l’interface.
	2.	Entrez le montant d’USDC à retirer et cliquez sur « Withdraw to Arbitrum ». Cette transaction ne coûte pas de gas : un frais fixe de 1 $ est appliqué pour chaque retrait.

(Navigation : Précédent : « Core contributors » – Suivant : « Comment utiliser le HyperEVM »)

Comment utiliser le HyperEVM

(Foire aux questions pour utiliser Hyperliquid EVM – « HyperEVM » désigne l’environnement EVM intégré à Hyperliquid.)

Pour les utilisateurs :
	•	Comment ajouter HyperEVM à mon wallet ?
Vous pouvez ajouter HyperEVM à votre extension de wallet via Chainlist ou en suivant les étapes ci-dessous :
	•	Dans votre extension de wallet, cliquez sur « Ajouter un réseau personnalisé » puis entrez les informations suivantes :
	•	Chain ID : 999
	•	Nom du réseau : Hyperliquid
	•	URL RPC : https://rpc.hyperliquid.xyz/evm
	•	URL d’explorateur de blocs (optionnel) : vous pouvez utiliser l’un des explorateurs communautaires, par exemple : hyperevmscan.io, purrsec.com ou hyperscan.com.
	•	Symbole de la devise : HYPE (token natif).
	•	Comment transférer des actifs vers et depuis HyperEVM ?
Vous pouvez envoyer des actifs vers HyperEVM depuis vos soldes Spot sur HyperCore, et inversement, via le bouton « Transfer to/from EVM » sur le tableau « Balances » de la page Trade ou Portfolio, ou en cliquant sur le bouton « EVM <-> Core Transfer ». (En d’autres termes, les transferts entre HyperCore et HyperEVM se font par l’interface de portefeuille Hyperliquid.)
	•	Que puis-je faire sur HyperEVM ?
HyperEVM permet d’utiliser les applications décentralisées compatibles EVM directement sur Hyperliquid, en profitant de la liquidité native de HyperCore. Vous pouvez explorer des annuaires d’applications, d’outils et autres construits par la communauté : HypurrCo, HL Eco, ASXN et Hyperliquid.wiki. Consultez également la FAQ d’onboarding HyperEVM pour d’autres questions fréquentes.
	•	Comment HyperEVM interagit-il avec le reste de Hyperliquid ?
HyperEVM n’est pas une blockchain séparée : il est sécurisé par le même consensus HyperBFT qu’HyperCore. Cela permet à HyperEVM d’interagir directement avec les composants d’HyperCore (carnets d’ordres spot et perpétuels, etc.). Par exemple, les smart contracts sur HyperEVM peuvent lire les prix des carnets HyperCore ou envoyer des ordres on-chain via des contrats système, offrant des possibilités inédites de composabilité on-chain.
	•	Pourquoi le gas sur HyperEVM peut-il « spiker » (augmenter fortement) ?
HyperEVM utilise une architecture à double blocs, combinant de petits blocs rapides et de gros blocs plus lents. Les frais de gas peuvent varier selon que votre transaction vise un « petit » ou « gros » bloc. (Voir la section Architecture à double bloc pour plus de détails.)
	•	Puis-je envoyer du HYPE (token natif) de HyperEVM vers un exchange centralisé ?
Si un exchange centralisé supporte Hyperliquid, vous pourrez déposer/retirer du HYPE depuis HyperEVM. Sinon, vous devrez transférer votre HYPE vers HyperCore (via l’adresse système de transfert 0x222...2222) puis utiliser le bridge Hyperliquid-Arbitrum pour récupérer des USDC, ou tout autre moyen selon l’exchange. (Note : la question implique le transfert de HYPE hors de Hyperliquid ; cela dépend du support de la part de l’exchange.)
	•	Comment bridge des actifs d’une autre chaîne vers HyperEVM ?
Vous pouvez utiliser des solutions cross-chain compatibles pour transférer des actifs d’autres chaînes vers HyperEVM. Par exemple, LayerZero et d’autres protocols de messaging (voir la section Crosschain messaging dans les outils HyperEVM) offrent des moyens de faire communiquer HyperEVM avec d’autres blockchains. En pratique, pour approvisionner HyperEVM en actifs, la façon la plus courante est de déposer sur HyperCore (via Arbitrum) puis de transférer vers EVM comme décrit plus haut.

Pour les builders : (Questions destinées aux développeurs construisant sur Hyperliquid EVM.)
	•	Que puis-je construire sur HyperEVM ?
Tout type d’application EVM traditionnelle peut être déployé sur HyperEVM, qui est un EVM complet. De plus, Hyperliquid offre des composants natifs uniques (carnets d’ordres on-chain sur HyperCore, vaults, etc.) que les builders peuvent exploiter via HyperEVM. Il s’agit d’un environnement très riche pour la DeFi on-chain, avec une base d’utilisateurs enthousiastes et une liquidité élevée. Cependant, HyperEVM est en évolution et toutes les fonctionnalités ne sont pas encore disponibles sur mainnet (par exemple, certains system contracts d’écriture ne sont pas encore actifs). Il est recommandé de suivre l’actualité du projet et de tester sur le testnet.
	•	Comment configurer un RPC ? Quels RPC sont disponibles ?
Le RPC public principal est https://rpc.hyperliquid.xyz/evm. Par ailleurs, des RPC tiers sont offerts par la communauté : HypurrScan, Stakely, QuickNode, etc. (Voir la section EVM RPCs dans les outils HyperEVM pour la liste complète). Vous pouvez aussi exécuter votre propre nœud Hyperliquid non-validateur pour un RPC privé si besoin, ou utiliser les dumps de données fournis (cf. Blocages EVM bruts pour l’indexation). Notez qu’il n’est pas nécessaire d’exécuter un nœud pour avoir un RPC : toutes les données de l’EVM sont également accessibles en temps réel via des buckets S3 publics, donc n’importe qui peut offrir un service RPC sans faire tourner un nœud complet.
	•	Comment obtenir du gas sur HyperEVM ?
Le token natif HYPE sert de gas sur HyperEVM. Vous pouvez acquérir du HYPE en l’achetant avec de l’USDC sur Hyperliquid (marché spot HYPE) puis en le transférant de HyperCore vers HyperEVM via la fonction de transfert native (en envoyant HYPE à l’adresse système 0x222...2222 sur HyperCore, qui crédite votre solde EVM). Alternativement, vous pouvez utiliser des bridges cross-chain mentionnés plus haut ou des services de faucet sur testnet. Sur mainnet, il n’y a pas de faucet : il faut obtenir du HYPE via le marché.
	•	Sur quelle version d’EVM HyperEVM est-il basé ?
HyperEVM est actuellement basé sur le hardfork Cancun (sans blobs). En pratique, cela signifie qu’il inclut notamment EIP-1559 (avec burn des base fees), et qu’il supprime les features liés aux blobs. HyperEVM brûle les priority fees (frais de priorité) car il utilise HyperBFT et non PoW : ces fees sont envoyés à l’adresse zéro sur HyperEVM. Notez que sur HyperEVM, HYPE a 18 décimales (comme un token ERC-20 classique) sur mainnet et testnet.
	•	Quelles différences entre HyperEVM et d’autres EVM comme Ethereum ?
L’essentiel du fonctionnement est le même, ce qui facilite la réutilisation d’outils et contrats Ethereum. Les principales différences sont :
	1.	Double système de blocs – Hyperliquid utilise des petits blocs rapides et des gros blocs lents (voir Architecture à double bloc) pour améliorer à la fois la latence et la capacité.
	2.	Interactions natives avec HyperCore – Étant sur la même chaîne, HyperEVM permet des interactions directes avec les carnets d’ordres et la liquidité native (via des precompiles de lecture ou des system contracts d’écriture), offrant une expérience intégrée unique pour la DeFi on-chain.

(Navigation : Précédent : « Comment commencer à trader » – Suivant : « Comment staker du HYPE »)

Comment staker du HYPE

(Cette section explique comment participer au staking du token natif HYPE sur Hyperliquid.)

Plusieurs plateformes permettent de staker du HYPE sur HyperCore, notamment :
	•	Hyperliquid App (interface officielle) – app.hyperliquid.xyz/staking
	•	Nansen – stake.nansen.ai/stake/hyperliquid
	•	ValiDAO – app.validao.xyz/stake/hyperliquid
	•	HypurrScan – hypurrscan.io/staking

Les étapes pour staker :
	1.	Obtenir du HYPE dans votre solde Spot sur HyperCore. Si vous détenez du HYPE sur HyperEVM, vous devrez d’abord le transférer depuis HyperEVM vers HyperCore (via l’adresse système 0x222...2222).
	2.	Transférer du HYPE de votre solde Spot vers votre solde Staking. (C’est l’action de staking proprement dite. Une fois sur le solde Staking, vos HYPE peuvent être délégués à un validateur.)
	3.	Choisir un validateur à déléguer – Sélectionnez un validateur auquel staker vos HYPE. Le staking auprès d’un validateur entraîne une période de verrouillage de 1 jour sur les fonds stakés.

Pour unstaker, il suffit de faire le processus inverse :
	1.	Annuler la délégation (unstake) de vos HYPE auprès du validateur choisi.
	2.	Transférer vos HYPE de votre solde Staking vers votre solde Spot. Attention : le retrait du solde Staking vers le solde Spot prend 7 jours (période de déverrouillage).
	3.	Après 7 jours, vos HYPE apparaîtront à nouveau dans votre solde Spot et pourront être utilisés librement.

Remarque : Pour toute question supplémentaire, consultez la section Staking de cette documentation pour plus de détails techniques sur le fonctionnement du staking et des validateurs.

(Navigation : Précédent : « Comment utiliser le HyperEVM » – Suivant : « Connexion mobile via QR code »)

Connexion mobile via QR code

(Guide pour connecter un wallet mobile via un code QR.)
	1.	Connectez-vous sur Hyperliquid avec l’extension de wallet sur desktop (par ex. Rabby, MetaMask, etc.).
	2.	Sur votre téléphone, ouvrez l’application Hyperliquid ou wallet compatible et choisissez « Link Desktop Wallet » (Associer wallet desktop). L’application demandera d’activer la caméra et de scanner un QR code.
	3.	Sur le site web Hyperliquid (sur votre ordinateur), cliquez sur l’icône PC+mobile en haut à droite de la barre de navigation, puis signez la requête dans votre extension de wallet. Un QR code apparaîtra sur l’écran.
	4.	Avec votre téléphone, scannez ce QR code. Votre wallet mobile sera alors connecté à la session desktop de manière sécurisée.

Vous pouvez à présent trader en déplacement depuis votre téléphone, en utilisant le wallet relié à votre extension de navigateur.

(Navigation : Précédent : « Comment staker du HYPE » – Suivant : « Exporter votre wallet email »)

Exporter votre wallet email

(Comment récupérer la clé privée de votre wallet créé par connexion email.)

Rappel : Le contrat de bridge Hyperliquid n’accepte que les USDC sur Arbitrum envoyés via Arbitrum. Si vous envoyez accidentellement le mauvais actif à votre wallet DeFi (lié à votre email) :
	1.	Assurez-vous d’être connecté avec la même adresse email sur Hyperliquid.
	2.	Cliquez sur « Export Email Wallet » dans le menu des paramètres (icône en haut de l’interface).
	3.	Suivez les étapes dans la fenêtre popup pour copier votre clé privée du wallet email.
	4.	Importez cette clé privée dans l’extension de wallet de votre choix (Rabby, MetaMask, etc.). Vous aurez alors accès au même wallet via cette extension.

(Navigation : Précédent : « Connexion mobile via QR code » – Suivant : « Faucet du testnet »)

Faucet du testnet

Pour utiliser le faucet du testnet, vous devez d’abord avoir déposé des fonds sur le mainnet avec la même adresse. Ensuite, vous pouvez réclamer 1 000 USDC de testnet via le faucet : app.hyperliquid-testnet.xyz/drip.

Note : Si vous utilisez une connexion par email, Privy génère une adresse wallet différente pour le mainnet et le testnet. Vous pouvez exporter votre wallet email depuis le mainnet (comme expliqué ci-dessus), l’importer dans une extension de wallet (par ex. Rabby ou Metamask), puis l’utiliser pour vous connecter au testnet. Cela vous permet de retrouver la même adresse (et donc d’être éligible au faucet avec la condition de dépôt mainnet satisfaisée).

(Navigation : Précédent : « Exporter votre wallet email » – Suivant : « HyperCore »)

HyperCore

(HyperCore désigne le cœur de l’exécution sur Hyperliquid, incluant les carnets d’ordres on-chain pour le spot et les perpétuels.)

Vue d’ensemble

Hyperliquid perpétuels sont des produits dérivés sans date d’expiration. Au lieu de cela, ils utilisent des paiements de funding pour garantir que leur prix converge vers le prix spot sous-jacent au fil du temps .

Hyperliquid propose un style principal de margining pour les contrats perpétuels : marge en USDC, contrats linéaires libellés en USDT. Cela signifie que le prix oracle est libellé en USDT, mais la garantie (collatéral) est en USDC. Cela combine la meilleure liquidité avec la meilleure accessibilité. Notez qu’aucune conversion USDC/USDT n’est appliquée : techniquement, ces contrats sont de type quanto (PNL en USDT converti en USDC).

Lorsque l’actif spot sous-jacent a sa principale liquidité en USDC, le prix oracle est libellé en USDC. Actuellement, les seuls contrats perpétuels libellés en USDC sont PURR-USD et HYPE-USD, car leur source de prix spot la plus liquide est Hyperliquid elle-même.

Les spécifications de contrat Hyperliquid sont plus simples que sur la plupart des plateformes. Il y a peu de paramètres spécifiques par contrat et aucune restriction spécifique par adresse.

<table>
<caption>**Spécifications du contrat perpétuel Hyperliquid**</caption>
<thead>
<tr><th>Paramètre</th><th>Valeur</th></tr>
</thead>
<tbody>
<tr><td>Type d’instrument</td><td>Perpétuel linéaire</td></tr>
<tr><td>Contrat</td><td>1 unité de l’actif spot sous-jacent</td></tr>
<tr><td>Actif sous-jacent / Ticker</td><td>Indice oracle Hyperliquid de l’actif spot</td></tr>
<tr><td>Fraction de marge initiale</td><td>1 / (levier choisi par l’utilisateur)</td></tr>
<tr><td>Fraction de marge de maintenance</td><td>Moitié de la marge initiale au levier max</td></tr>
<tr><td>Mark price (prix de référence)</td><td>Voir <a href="#indices-de-prix-robustes">ici</a></td></tr>
<tr><td>Livraison / Expiration</td><td>Aucune (paiements de funding toutes les heures)</td></tr>
<tr><td>Limite de position</td><td>Aucune</td></tr>
<tr><td>Type de compte</td><td>Cross par wallet, ou marge isolée par position</td></tr>
<tr><td>Notionnel d’impact du funding</td><td>20 000 USDC pour BTC et ETH<br>6 000 USDC pour tous les autres actifs</td></tr>
<tr><td>Valeur max d’ordre au marché</td><td>15 000 000 $ si levier max ≥ 25x<br>5 000 000 $ si levier max ∈ [20x, 25x)<br>2 000 000 $ si levier max ∈ [10x, 20x)<br>500 000 $ sinon</td></tr>
<tr><td>Valeur max d’ordre limité</td><td>10 × la valeur max d’ordre marché</td></tr>
</tbody>
</table>


(Navigation : Précédent : « Trading » – Suivant : « Bridge »)

Bridge

Les dépôts vers le bridge sont signés par les validateurs et crédités dès qu’au moins 2/3 du pouvoir de staking a signé le dépôt .

Les retraits depuis Hyperliquid sont immédiatement déduits du solde L1 et doivent être signés par les validateurs sous forme de transactions séparées. Lorsque 2/3 du staking power ont signé le retrait, une transaction EVM peut être envoyée au contrat de bridge pour réclamer le retrait .

Après la demande de retrait on-chain, une période de contestation (dispute period) s’ouvre. Durant cette période, le bridge peut être verrouillé s’il y a une tentative malveillante de retrait ne correspondant pas à l’état de Hyperliquid. Pour déverrouiller le bridge dans un tel cas, il faudrait des signatures de wallets froids de 2/3 des validateurs (en poids de stake) .

Après la période de contestation, des transactions de finalisation sont envoyées pour distribuer les USDC aux adresses de destination correspondantes. Un mécanisme similaire est utilisé pour maintenir la liste des validateurs actifs et leurs stakes sur le contrat de bridge .

Les retraits n’exigent pas d’ETH Arbitrum de la part de l’utilisateur. À la place, un frais de retrait de 1 USDC est payé par l’utilisateur sur Hyperliquid pour couvrir les coûts en gas Arbitrum supportés par les validateurs .

Le code du bridge et sa logique par rapport au staking L1 ont été audités par Zellic. Le code complet du bridge se trouve sur le dépôt GitHub Hyperliquid, et la section Audits fournit les rapports d’audit correspondants .

(Navigation : Précédent : « Vue d’ensemble » – Suivant : « Serveurs API »)

Serveurs API

Les serveurs API écoutent les mises à jour d’un nœud et maintiennent localement l’état de la blockchain. Un serveur API sert des informations sur cet état et transfère également les transactions utilisateurs au nœud. L’API fournit deux types de flux de données : REST et WebSocket .

Lorsqu’une transaction utilisateur est envoyée à un serveur API, elle est relayée au nœud connecté, qui la diffuse ensuite dans le réseau dans le cadre du consensus HyperBFT. Une fois la transaction incluse dans un bloc validé sur la L1, le serveur API répond à la requête initiale avec le résultat d’exécution retourné par la L1 .

(Navigation : Précédent : « Bridge » – Suivant : « Clearinghouse »)

Clearinghouse

Le clearinghouse (chambre de compensation) des perpétuels est un composant de l’état d’exécution sur HyperCore. Il gère l’état de marge des comptes perpétuels pour chaque adresse, incluant le solde de marge et les positions ouvertes .

Les dépôts d’USDC sont crédités sur le solde de marge cross de l’adresse. Par défaut, les positions sont ouvertes en mode cross margin. Hyperliquid supporte également le mode isolé : l’utilisateur peut affecter de la marge spécifiquement à une position donnée, isolant le risque de liquidation de cette position du reste du compte . (En pratique, ce choix se fait via le sélecteur Cross ou Isolated lors de la prise de position.)

Le clearinghouse pour le spot fonctionne de manière analogue, en gérant les soldes de tokens spot et les holds (montants en cours d’utilisation dans des ordres) pour chaque adresse .

(Navigation : Précédent : « Serveurs API » – Suivant : « Oracle »)

Oracle

Les validateurs sont responsables de publier les prix oracle spot utilisés pour le funding de chaque contrat perpétuel, à une fréquence de toutes les 3 secondes . Ces prix oracles sont utilisés dans le calcul du taux de funding et comme composante du mark price pour les marginations, liquidations, triggers d’ordres TP/SL, etc.

Les prix oracles spot sont calculés par chaque validateur comme la médiane pondérée des prix spot de grands échanges centralisés (CEX) tels que Binance, OKX, Bybit, Kraken, Kucoin, Gate.io, MEXC (la doc indique des poids de 3, 2, 2, 1, 1, 1, 1, 1 respectivement) . Cela signifie que le prix oracle Hyperliquid pour un actif est fortement représentatif du marché global. Pour les actifs dont la liquidité principale spot se trouve sur Hyperliquid (par ex. HYPE), l’oracle n’inclut pas les sources externes tant qu’une liquidité suffisante n’est pas atteinte en interne. Inversement, pour les actifs dont la liquidité principale est externe (ex. BTC), l’oracle n’inclut pas le prix spot Hyperliquid dans son calcul .

Le prix oracle final utilisé par le clearinghouse est la médiane des prix soumis par tous les validateurs, chaque validateur étant pondéré par sa stake (son poids en staking) . Cela assure qu’aucun validateur unique ne puisse manipuler le prix oracle, tant que plus d’un tiers sont honnêtes.

(Navigation : Précédent : « Clearinghouse » – Suivant : « Carnet d’ordres »)

Carnet d’ordres (Order book)

(La documentation technique du carnet d’ordres se trouve également dans la section HyperCore, mais ici on rappelle l’essentiel côté utilisateur.)

L’état HyperCore inclut un carnet d’ordres pour chaque actif. Ce carnet d’ordres fonctionne de manière similaire à ceux des échanges centralisés, mais entièrement on-chain . Les ordres sont placés à des prix qui sont des multiples entiers de la tick size définie pour le marché, et pour des tailles qui sont des multiples entiers de la lot size. Les ordres se confrontent selon la priorité prix-temps classique (les meilleurs prix s’exécutent en premier, et à prix égal l’ordre le plus ancien est prioritaire) .

Une particularité unique de Hyperliquid est que la mempool et la logique de consensus connaissent la sémantique des transactions relatives aux carnets d’ordres. Cela permet de trier les transactions d’un même bloc en trois catégories :
	1.	Actions qui n’ajoutent aucun ordre GTC ou IOC au carnet (càd autres que placement d’ordre)
	2.	Annulations d’ordre
	3.	Actions qui ajoutent au moins un ordre GTC ou IOC 

Ces catégories sont exécutées séquentiellement dans chaque bloc, et au sein de chaque catégorie, dans l’ordre où elles ont été proposées par le producteur de bloc . Cela garantit une exécution cohérente et sans surprise même en cas de concurrence entre placement et annulation d’ordres d’un même utilisateur.

(Navigation : Précédent : « Oracle » – Suivant : « Staking »)

Staking

(Section technique sur le staking du token HYPE et la délégation aux validateurs. Voir également la section Onboarding pour un guide pratique.)

Basics – Principes de base

Le staking de HYPE sur Hyperliquid s’effectue au sein d’HyperCore. Tout comme l’USDC peut être transféré entre les comptes perps et spot, le HYPE peut être transféré entre le compte spot et le compte staking .

Depuis le compte de staking, le HYPE peut être délégué à un ou plusieurs validateurs. (Dans la documentation, « delegate » et « stake » sont utilisés de manière interchangeable, car Hyperliquid ne supporte que du staking délégué type DPoS.) .

Chaque validateur doit se self-staker un minimum de 10 000 HYPE pour devenir actif. Une fois actif, un validateur produit des blocs et reçoit des récompenses proportionnelles au total de HYPE délégué (stake total). Les validateurs peuvent appliquer une commission sur les récompenses de staking pour leurs délégateurs. Cette commission ne peut jamais être augmentée au-delà de 1% (elle ne peut qu’être réduite dans le temps), empêchant ainsi un validateur d’attirer un grand montant de stake puis d’augmenter drastiquement sa commission pour exploiter ses délégateurs .

Les délégations à un validateur ont une période de lockup de 1 jour. Une fois ce délai écoulé, le délégateur peut retirer tout ou partie de sa délégation à tout moment. Lorsqu’un délégateur retire (undelegate), le solde revient instantanément sur le compte de staking du délégateur .

Les transferts du compte spot vers le compte staking sont instantanés. En revanche, les transferts du compte staking vers le compte spot sont soumis à une file d’attente de 7 jours (unstaking queue). Ce mécanisme, courant dans la plupart des chaînes PoS, sert à dissuader les attaques sur le consensus en pénalisant par du slashing ou d’autres mesures sociales les comportements malveillants de grande ampleur. À ce jour, il n’y a pas de mécanisme automatique de slashing implémenté sur Hyperliquid .

Par exemple, si vous initiez un transfert de staking vers spot de 100 HYPE le 11 mars à 08:00 UTC, et un autre de 50 HYPE le 12 mars à 09:00 UTC, alors les 100 HYPE seront disponibles le 18 mars à 08:00:01 UTC et les 50 HYPE le 19 mars à 09:00:01 UTC (soit 7 jours plus tard pour chacun) .

Le taux de récompense du staking est inspiré de celui d’Ethereum : le taux de récompense annuel est inversement proportionnel à la racine carrée du total de HYPE staké. Par exemple, à 400 millions de HYPE staké au total, le taux de récompense annuel est d’environ 2,37% . Les récompenses de staking proviennent de la réserve d’émission future (émission du token HYPE).

Les récompenses sont calculées chaque minute et distribuées aux stakers chaque jour. Elles sont automatiquement re-déléguées au validateur staké, c’est-à-dire composées dans la même délégation. Les récompenses sont basées sur le minimum de HYPE que chaque délégateur a eu staké durant chaque epoch de staking (chaque epoch = 100 000 rounds de consensus, ~90 minutes) .

Technical Details – Détails techniques

(Cette sous-section détaille l’architecture du staking et du consensus.)

La notion de quorum est essentielle aux algorithmes de consensus modernes comme HyperBFT. Un quorum est tout ensemble de validateurs détenant plus des 2/3 du stake total du réseau. L’exigence du consensus est qu’un quorum de stake soit honnête (non Byzantin). Il est donc de la responsabilité de chaque staker de ne déléguer qu’à des validateurs de confiance.

Le consensus HyperBFT avance par rounds, unités fondamentales regroupant un ensemble de transactions plus les signatures d’un quorum de validateurs. Chaque round peut être validé après certaines conditions, puis est transmis à l’état d’exécution pour traitement. Une propriété clé de l’algorithme est que tous les nœuds honnêtes s’accordent sur la liste ordonnée des rounds validés.

L’ensemble des validateurs évolue par epochs de 100 000 rounds (environ 90 minutes sur mainnet). Le set de validateurs et leurs stakes sont fixes pendant chaque epoch de staking.

Les validateurs peuvent voter pour mettre en jail (écarter) leurs pairs qui n’envoient pas les messages de consensus de manière suffisamment réactive ou fréquente. Lorsqu’un quorum de votes de jail est atteint contre un validateur, celui-ci est mis en jailed (exclu) et ne participe plus au consensus, et ne génère plus de récompenses pour ses délégateurs. Un validateur peut se unjail lui-même après avoir diagnostiqué et corrigé les problèmes, sous réserve des limites on-chain sur la fréquence des unjails. Notez que le jailing n’est pas identique au slashing : le slashing est réservé aux comportements malveillants prouvés (ex. double signature de blocs).

(Navigation : Précédent : « Carnet d’ordres » – Suivant : « Vaults »)

Vaults

Les vaults sont une primitive puissante et flexible intégrée à HyperCore. Les stratégies exécutées via des vaults bénéficient des mêmes fonctionnalités avancées que le DEX : liquidations des comptes surendettés, stratégies de market making à haut débit, etc. Finies les vaults traditionnelles qui se contentent de rééquilibrer deux tokens : sur Hyperliquid, un vault peut exécuter des stratégies complexes de trading on-chain .

Tout le monde peut déposer dans un vault pour gagner une part des profits. En échange, le propriétaire du vault (vault leader) reçoit 10% des profits totaux générés par sa stratégie (note : les vaults de protocole, gérés par Hyperliquid, n’ont ni frais ni profit share) . Les vaults peuvent être gérés par un trader individuel ou automatisées par un market maker algorithmique. Chaque stratégie comportant ses propres risques, les utilisateurs doivent évaluer attentivement le risque et l’historique de performance d’un vault avant d’y déposer des fonds .

(Navigation : Précédent : « Staking » – Suivant : « Vaults de protocole »)

Vaults de protocole

Le Hyperliquidity Provider (HLP) est un vault protocolaire qui réalise du market making et des liquidations, en recevant une fraction des frais de trading en récompense.

HLP démocratise des stratégies autrefois réservées à des acteurs privilégiés sur d’autres échanges. La communauté peut fournir de la liquidité à ce vault et partager ses profits et pertes. HLP est entièrement détenu par la communauté.

Le dépôt dans HLP est soumis à une période d’indisponibilité de 4 jours. Autrement dit, vous pouvez retirer vos fonds 4 jours après votre dernier dépôt. Par exemple, si vous déposez le 14 septembre à 08h00, vous pourrez retirer à partir du 18 septembre à 08h00.

Pour plus d’informations sur HLP, voir ces articles de blog (en anglais) : « Hyperliquidity Provider (HLP): democratizing market making » et « HLP update: 3 months in ». (Remarque : ces blogs peuvent ne pas être à jour.)

(Navigation : Précédent : « Vaults » – Suivant : « Pour les leaders de vault »)

Pour les leaders de vault

(FAQ pour les créateurs/gestionnaires de vaults communautaires.)
	•	Quels sont les avantages de créer un vault en tant que leader ?
Les leaders de vault reçoivent 10% des profits générés pour avoir géré le vault. Les vaults offrent à un trader la possibilité de partager ses stratégies avec sa communauté tout en étant rémunéré pour ses performances.
	•	Comment créer un vault ?
Tout utilisateur peut créer un vault :
	1.	Choisissez un nom et rédigez une description pour votre vault. (Note : nom et description ne pourront plus être modifiés par la suite).
	2.	Déposez au minimum 100 USDC dans votre vault pour le lancer.
Créer un vault entraîne des frais fixes de 100 USDC de gas, qui sont distribués au protocole de la même manière que les frais de trading.
Pour s’assurer que les leaders ont du « skin in the game » (un engagement financier), vous devez maintenir une part ≥ 5% des parts du vault en permanence. Vous ne pourrez pas retirer si cela fait tomber votre part en-dessous de 5%.
	•	Comment gérer mon vault ?
Sur la page Trade, dans le menu déroulant d’adresses (en haut de l’interface), sélectionnez le vault que vous souhaitez gérer. Dès lors, toutes les opérations de trading que vous effectuez seront au nom du vault : l’interface de trading (solde, positions, etc.) reflétera le compte du vault. Pour repasser sur votre compte personnel, sélectionnez « Master » en haut du menu déroulant des adresses.
	•	Comment fermer mon vault ?
Sur la page dédiée à votre vault, cliquez sur le menu Leader Actions puis sélectionnez « Close Vault ». Une fenêtre modale vous demandera de confirmer la fermeture du vault. Attention : toutes les positions ouvertes du vault doivent être fermées avant de pouvoir clôturer le vault. Une fois la fermeture confirmée, tous les déposants reçoivent automatiquement leur part des fonds du vault.
	•	Que se passe-t-il pour les positions ouvertes d’un vault lorsqu’un utilisateur retire ses fonds ?
Si le vault dispose de suffisamment de marge pour maintenir les positions ouvertes après un retrait, le retrait n’affecte pas ces positions ouvertes. Si la marge restante devient insuffisante, les ordres ouverts utilisant de la marge seront annulés, en commençant par ceux consommant le moins de marge jusqu’à retrouver un niveau de marge suffisant pour honorer le retrait. Si malgré cela la marge reste insuffisante, 20% des positions du vault sont automatiquement clôturées (vente forcée partielle). Ce processus est répété jusqu’à libérer assez de marge pour permettre le retrait de l’utilisateur. (En d’autres termes, le système réduit les positions du vault de manière graduelle pour permettre les retraits tout en maintenant la sécurité du vault.) Le leader du vault peut par ailleurs configurer le vault pour toujours clôturer proportionnellement les positions lors des retraits, afin de maintenir des prix de liquidation similaires pour toutes les positions restantes.

(Navigation : Précédent : « Vaults de protocole » – Suivant : « Pour les déposants de vault »)

Pour les déposants de vault

(FAQ pour les utilisateurs qui déposent dans des vaults gérés par des leaders.)
	•	Quels sont les avantages de déposer dans un vault ?
En déposant, vous obtenez une part des profits ou des pertes du vault. Si vous admirez ou faites confiance à certains traders, vous pouvez déposer dans leurs vaults pour vous exposer à leurs stratégies de trading. Par exemple : si vous déposez 100 USDC dans un vault qui a 900 USDC de dépôts, le total passe à 1 000 USDC et vous détenez 10% des parts. Si la valeur du vault double à 2 000 USDC sans nouveaux dépôts ni retraits d’autrui, vous pourriez retirer 200 USDC (10%), moins 10 USDC de commission de performance du leader (10% des profits), soit un total de 190 USDC. Notez qu’il peut y avoir un léger slippage au retrait si des positions doivent être clôturées. Important : le trading comporte des risques : les performances passées d’un vault ne garantissent pas les résultats futurs.
	•	Comment trouver un vault dans lequel déposer ?
Sur la page Vaults de l’app Hyperliquid, vous pouvez consulter les statistiques de chaque vault (APY, total des dépôts, etc.). En cliquant sur un vault spécifique, vous accédez à plus d’informations : PnL, drawdown maximal, volume, positions ouvertes, historique des trades, etc. Vous pouvez voir combien de personnes ont déposé dans le vault et depuis combien de temps.
	•	Comment déposer dans un vault ?
Déposer est simple : sur la page du vault, saisissez le montant d’USDC que vous souhaitez déposer et cliquez sur « Deposit » (Déposer). Votre dépôt sera pris en compte immédiatement, augmentant le total du vault et vos parts correspondantes.
	•	Comment suivre la performance des vaults dans lesquels j’ai déposé ?
Vous pouvez suivre la performance de n’importe quel vault sur sa page dédiée. Dans l’onglet Your Performance (Votre performance), vous verrez l’évolution de vos dépôts (profit/perte réalisés, etc.). Sur la page Portfolio de l’application, vous trouverez également le solde total de vos parts à travers tous les vaults où vous avez déposé.
	•	Comment retirer d’un vault ?
Retirer est aussi simple que déposer : sur la page du vault, passez à l’onglet Withdraw (Retrait), entrez le montant à retirer et cliquez sur « Withdraw ». Notez que pour le vault HLP (géré par Hyperliquid), le lock-up est de 4 jours avant retrait, et pour les vaults utilisateurs, le lock-up est de 1 jour. Cela signifie que si vous avez déposé il y a moins que la période de lock-up, vous devrez attendre son expiration avant de pouvoir retirer.

(Navigation : Précédent : « Pour les leaders de vault » – Suivant : « Multi-sig »)

Multi-sig

(Support natif des comptes multi-signatures sur Hyperliquid.)

Fonctionnalité avancée : HyperCore prend en charge nativement les actions multi-sig. Cela permet à plusieurs clés privées de contrôler un même compte, pour une sécurité accrue. Contrairement à d’autres chaînes où les comptes multi-sig reposent sur des smart contracts, sur HyperCore c’est une primitive intégrée au protocole .

Le workflow multi-sig est le suivant :
	•	Pour convertir un utilisateur en utilisateur multi-sig, celui-ci envoie une action ConvertToMultiSigUser listant les « utilisateurs autorisés » (adresses autorisées) et le nombre minimum de ces utilisateurs requis pour signer une action. Les utilisateurs autorisés doivent déjà exister sur Hyperliquid (càd avoir un compte utilisateur). Une fois converti en multi-sig, toutes les actions du compte devront être envoyées via la procédure multi-sig .
	•	Pour envoyer une action via multi-sig, chaque utilisateur autorisé doit signer un payload. Une action de type MultiSig encapsule n’importe quelle action normale et inclut la liste des signatures des utilisateurs autorisés .
	•	Le payload MultiSig contient aussi l’adresse du compte multi-sig cible et l’utilisateur autorisé qui soumettra finalement l’action MultiSig sur la blockchain (on l’appelle le leader de la transaction multi-sig) .
	•	Lorsque l’action multi-sig est envoyée, seul le nonce de l’utilisateur autorisé leader est vérifié et incrémenté (les nonces des autres signataires ne bougent pas) .
	•	De même, le leader peut être un wallet API d’un utilisateur autorisé : dans ce cas, c’est le nonce de ce wallet API (agent) qui est vérifié et consommé .
	•	Un compte multi-sig peut mettre à jour sa liste d’utilisateurs autorisés et/ou le seuil requis en envoyant une action MultiSig qui encapsule une action ConvertToMultiSigUser avec le nouvel état (nouvelle liste d’autorisations). On peut donc modifier la composition du multi-sig ou le retour en arrière .
	•	Un utilisateur multi-sig peut être reconverti en utilisateur normal en envoyant un ConvertToMultiSigUser via le processus multi-sig, en définissant la liste des utilisateurs autorisés comme vide (seul le paramètre threshold restant). Ainsi, le compte redevient un compte standard contrôlé par une seule clé .

Notes diverses :
	•	L’adresse leader (qui envoie la transaction sur la chaîne) doit être un utilisateur autorisé, pas le compte multi-sig lui-même.
	•	Chaque signature doit se baser sur les mêmes informations (même nonce, même leader, même payload) pour être valides toutes ensemble.
	•	Le leader doit collecter toutes les signatures nécessaires avant de soumettre l’action multi-sig.
	•	Un même utilisateur peut à la fois être un compte multi-sig ET un utilisateur autorisé pour un autre compte multi-sig. Un utilisateur peut être autorisé pour plusieurs comptes multi-sig. Un compte multi-sig peut avoir jusqu’à 10 utilisateurs autorisés maximum.

Important pour les utilisateurs HyperEVM : convertir un compte en multi-sig ne change pas le contrôle du compte EVM correspondant par le wallet d’origine. Un compte multi-sig HyperCore reste contrôlable sur HyperEVM par la clé d’origine. De plus, CoreWriter (contrat d’envoi d’ordres HyperCore via EVM) n’est pas compatible avec les utilisateurs multi-sig. En général, il est déconseillé de faire interagir un compte multi-sig avec HyperEVM tant avant qu’après conversion, car certaines fonctionnalités ne sont pas prévues pour eux.

(Navigation : Précédent : « Pour les déposants de vault » – Suivant : « HyperEVM » (section développeurs))

HyperEVM

(Section principale consacrée à HyperEVM du point de vue infrastructure et développeur, en complément de la section Onboarding plus haut.)

Mainnet vs Testnet : Sur Hyperliquid, l’HyperEVM existe en Mainnet et en Testnet. Tous deux fonctionnent de manière similaire, avec quelques différences notables : le Chain ID est 999 pour mainnet et 998 pour testnet, et certaines fonctionnalités ou limitations peuvent être différentes sur le testnet (par exemple, la performance ou le statut alpha de certaines fonctions). Dans les deux cas, le HYPE a 18 décimales.

Les sections suivantes décrivent le fonctionnement interne d’HyperEVM et ses interactions avec HyperCore.

HyperEVM (introduction technique)

(Cette partie recoupe la section « Dual-block architecture » et suivantes pour le développeur.)

Hyperliquid propose deux types de blocs EVM pour l’HyperEVM : des petits blocs produits très fréquemment, et des gros blocs produits moins souvent. Ce design en architecture à double bloc vise à découpler la vitesse de production des blocs et leur taille, permettant d’améliorer simultanément la latence (avec des petits blocs rapides) et la capacité de traitement (avec des gros blocs plus denses).

Actuellement, les paramètres initiaux (conservateurs) sont : un bloc rapide toutes les 1 seconde avec une limite de 2 millions de gas, et un bloc lent toutes les 1 minute avec une limite de 30 millions de gas. Les deux types de blocs s’intercalent selon une séquence déterministe, chaque bloc EVM recevant un numéro de bloc unique dans l’ordre global. La mempool on-chain de l’HyperEVM est scindée en deux mempools indépendants pour ces deux types de blocs. (En pratique, un flag interne usingBigBlocks permet de cibler l’un ou l’autre type de bloc pour les transactions, comme décrit plus bas.)

Exécution des transactions HyperEVM : la mempool de HyperEVM n’accepte que les prochaines 8 transactions (par nonce) par adresse, et purge celles plus anciennes que 24h sans exécution. Cela assure une rotation régulière des transactions en attente.

Les développeurs peuvent déployer des contrats volumineux sur HyperEVM en profitant des gros blocs. Concrètement :
	1.	Le déployeur envoie une action JSON (via HyperCore) avec {"type": "evmUserModify", "usingBigBlocks": true} pour indiquer que ses transactions EVM doivent cibler les gros blocs plutôt que les petits (c’est un flag au niveau utilisateur sur HyperCore). Cette action doit être envoyée depuis un compte HyperCore existant (vous pouvez convertir votre adresse EVM en compte HyperCore en lui envoyant un actif pour la créer automatiquement).
	2.	Facultativement, le déployeur peut utiliser la méthode JSON-RPC bigBlockGasPrice au lieu de gasPrice pour estimer les frais base gas d’un prochain gros bloc.

(Navigation : Précédent : « Multi-sig » – [Suivant : « Dual-block architecture » (archi double bloc) dans la section développeurs)

Dual-block architecture

(Déjà introduit ci-dessus, on rappelle ici les détails pour les développeurs.)

Le throughput total de l’HyperEVM est réparti entre des blocs petits produits à un rythme rapide et des blocs grands produits à un rythme plus lent. La motivation principale de cette architecture est de pouvoir améliorer séparément la latence et la capacité, là où les utilisateurs veulent des blocs plus rapides et les builders veulent des blocs plus gros pour des transactions volumineuses. Au lieu d’un compromis, le système à double bloc permet d’améliorer les deux axes simultanément.

Dans l’implémentation, les deux types de blocs EVM s’intercalent dans la suite des blocs Hyperliquid, avec une séquence unique de numéros de bloc EVM. En d’autres termes, les blocs EVM ont un numéro unique commun, et on peut déterminer si un numéro correspond à un bloc « rapide » ou « lent » via l1_block_time % x (selon le paramétrage du protocole).

Les transactions EVM sont triées dans deux mempools distincts selon un flag usingBigBlocks paramétrable par utilisateur. Par défaut, un utilisateur envoie ses transactions sur les petits blocs. En réglant son état evmUserModify comme vu plus haut, un builder peut choisir d’utiliser les gros blocs pour certaines opérations (par ex. le déploiement de gros smart contracts).

Les paramètres actuels (susceptibles d’évolution) sont : fast blocks toutes les 1 seconde (limite gas ~2 000 000) et slow blocks toutes les 60 secondes (limite gas ~30 000 000). Ces valeurs pourront être augmentées progressivement pour accroître le débit au fur et à mesure que l’exécution sera optimisée.

(Navigation : Précédent : « HyperEVM (introduction) » – Suivant : « Données brutes de blocs HyperEVM »)

Raw HyperEVM block data

(Données brutes de blocs HyperEVM pour indexation.)

Les développeurs exécutant un nœud non-validateur peuvent indexer l’HyperEVM en utilisant les données écrites localement dans ~/hl/data/evm_block_and_receipts. Ces données sont écrites après la vérification de chaque bloc validé par le nœud, ce qui signifie qu’elles n’ajoutent pas de risque de confiance supplémentaire par rapport à l’utilisation directe du RPC d’un nœud.

Les développeurs souhaitant indexer l’HyperEVM sans faire tourner de nœud peuvent utiliser le bucket S3 public : aws s3 ls s3://hl-mainnet-evm-blocks/ --request-payer requester. (Il existe un bucket similaire s3://hl-testnet-evm-blocks/ pour le testnet.).

Par prudence, il est envisageable de combiner les deux sources de données (locale et S3) : en s’appuyant principalement sur les données locales, tout en utilisant S3 en secours pour la résilience.

Ces données brutes permettent de construire des services comme des explorateurs de blocs ou d’autres outils d’indexation. Elles sont publiques, mais celui qui les utilise doit payer les coûts de transfert de données (d’où l’option --request-payer sur S3). Les fichiers sont nommés de manière prédictive par numéro de bloc EVM, par exemple s3://hl-mainnet-evm-blocks/0/6000/6123.rmp.lz4. Les fichiers sont formatés en MessagePack puis compressés en LZ4.

(Exemple : le SDK Python fournit un script d’exemple pour indexer les blocs EVM : evm_block_indexer.py).

(Navigation : Précédent : « Dual-block architecture » – Suivant : « Interagir avec HyperCore (depuis HyperEVM) »)

Interacting with HyperCore (depuis HyperEVM)

(Interaction entre un smart contract sur HyperEVM et l’état HyperCore, via des precompiles de lecture et un contrat système d’écriture.)

Read precompiles – Precompiles de lecture

L’Hyperliquid EVM fournit des precompiles (contrats pré-déployés d’adresses 0x…0800+) permettant de requêter des informations d’HyperCore. Ces precompiles commencent à l’adresse 0x000...0800 et offrent des méthodes pour obtenir divers renseignements : positions perp d’un utilisateur, soldes spot, valeur de vaults, délégations de staking, prix oracles, numéro de bloc L1, etc.

Ces valeurs renvoyées reflètent l’état HyperCore le plus récent au moment où le bloc EVM est construit. Autrement dit, depuis un smart contract sur HyperEVM, ces precompiles donnent un accès direct et instantané aux données on-chain d’HyperCore.

Un fichier Solidity L1Read.sol (fourni par l’équipe) décrit ces precompiles de lecture. Par exemple, l’appel suivant interroge le prix oracle du 3e perp sur le testnet :

cast call 0x0000000000000000000000000000000000000807 \
  0x0000000000000000000000000000000000000000000000000000000000000003 \
  --rpc-url https://rpc.hyperliquid-testnet.xyz/evm 

(Dans cet exemple, le precompile 0x…807 est sans doute le precompile pour lire le prix oracle, et l’argument 0x…3 sélectionne le 3e perp. La commande retourne un nombre codé en hexadécimal correspondant au prix multiplié par son facteur d’échelle.)

Pour convertir les résultats bruts en nombres à virgule flottante, il faut diviser le prix renvoyé par 10^(6 - szDecimals) pour les perps et par 10^(8 - baseAssetSzDecimals) pour les spots, comme indiqué dans la documentation technique.

Note : Si un precompile est appelé avec des entrées invalides (par ex. un ID d’actif non valide ou une adresse de vault inexistante), il renverra une erreur et consommera tout le gas fourni à l’appel. Le coût en gas d’un precompile est 2000 + 65 * output_len (output_len étant la taille de la sortie).

CoreWriter contract – Contrat d’écriture (CoreWriter)

Un contrat système est déployé à l’adresse 0x333...3333 sur HyperEVM pour permettre l’envoi de transactions d’HyperEVM vers HyperCore. Ce contrat, appelé ici CoreWriter, consomme ~25 000 gas avant d’émettre un log qui sera traité par HyperCore comme une action à exécuter. En pratique, un appel basique coûte ~47 000 gas (dont ~22 000 gas effectifs + ~25 000 gas brûlés). Le code Solidity correspondant, CoreWriter.sol, est fourni en documentation (en pièces jointes).

Encodage des actions (détails)

Chaque action HyperCore envoyée via CoreWriter doit être encodée selon un format précis, pour être transmise en tant que log. Le format du payload est le suivant :
	•	Byte 1 : version d’encodage (actuellement 1)
	•	Bytes 2-4 : ID de l’action (un entier 24-bit big-endian)
	•	Bytes restants : encodage de l’action (les paramètres de l’action en ABI)

Le champ Action ID correspond à un identifiant unique pour chaque type d’action HyperCore (limit order, vault transfer, staking, etc.). La liste des actions ID est fournie dans la doc (voir le tableau plus bas). L’encodage de chaque action est simplement l’encodage ABI (concaténation de ses paramètres en types Solidity).

Pour éviter tout avantage de latence possible via l’HyperEVM contournant la mempool L1, certaines actions envoyées via CoreWriter sont retardées on-chain de quelques secondes. Concrètement, les actions d’ordres (order actions) et de transferts de vault envoyées via CoreWriter subissent un délai on-chain avant exécution. Cela n’a aucun effet notable sur l’expérience utilisateur, car de toute façon l’utilisateur attend déjà la confirmation d’au moins un small block. Ces actions retardées apparaissent deux fois dans l’explorateur L1 : une première fois comme mises en file d’attente, puis comme exécutées par HyperCore.

Le tableau ci-dessous résume les actions supportées via CoreWriter, avec leur ID et leur encodage :

Action ID	Action	Champs (Fields)	Type Solidity	Notes
1	Limit order	(asset, isBuy, limitPx, sz, reduceOnly, encodedTif, cloid)	(uint32, bool, uint64, uint64, bool, uint8, uint128)	encodedTif : 1 pour Alo (TAL), 2 pour Gtc, 3 pour Ioc. cloid : 0 si pas de client order ID, sinon le nombre donné. Les champs limitPx et sz sont exprimés en quantités entières (prix ×10^8, size ×10^8).
2	Vault transfer	(vault, isDeposit, usd)	(address, bool, uint64)	Transfert de capital entre un vault et le wallet maître. usd en centimes d’USDC (6 décimales).
3	Token delegate	(validator, wei, isUndelegate)	(address, uint64, bool)	Délégation de stake HYPE : wei = montant en wei (1e-18 HYPE), isUndelegate = true pour retirer.
4	Staking deposit	(wei)	(uint64)	Dépôt de HYPE du wallet vers le solde staking (HYPE en wei).
5	Staking withdraw	(wei)	(uint64)	Retrait de HYPE du solde staking vers le solde spot (applique le lockup 7j).
6	Spot send	(destination, token, wei)	(address, uint64, uint64)	Transfert on-chain d’un token spot vers une autre adresse (ou subAccount, voir action 13).
7	USD class transfer	(ntl, toPerp)	(uint64, bool)	Transfert interne Spot<->Perp : ntl = montant en USDC (6 déc.), toPerp = true pour Spot→Perp, false pour Perp→Spot.
8	Finalize EVM Contract	(token, encodedFinalizeEvmContractVariant, createNonce)	(uint64, uint8, uint64)	Finalisation du lien entre un contrat EVM et un actif HyperCore (voir HIP-3). encodedFinalizeEvmContractVariant : 1=Create, 2=FirstStorageSlot, 3=CustomStorageSlot. createNonce est utilisé si variant=Create.
9	Add API wallet	(API wallet address, API wallet name)	(address, string)	Ajout d’un wallet API (sous-compte) avec un nom. Si le nom est vide, le wallet devient principal (agent par défaut).
10	Cancel order by oid	(asset, oid)	(uint32, uint64)	Annulation d’ordre par son ID unique.
11	Cancel order by cloid	(asset, cloid)	(uint32, uint128)	Annulation d’ordre par client order ID (fourni à la création).
12	Approve builder fee	(maxFeeRate, builder address)	(uint64, address)	Autoriser un builder code : maxFeeRate en décibips (ex. 10 = 0,01%), builder address = adresse du builder. Note : 0 annule l’autorisation.
13 (test)	Send asset (testnet seulement)	(destination, subAccount, source_dex, destination_dex, token, wei)	(address, address, uint32, uint32, uint64, uint64)	Transfert cross-dex testnet : subAccount non-zero → envoi depuis un subaccount, source_dex / destination_dex (uint32 max = Hyperliquid) pour indiquer si on transfère entre dex (testnet).

(Remarque : l’action 13 est spécifique testnet pour tests cross-dex ; non pertinente sur mainnet.)

L’extrait ci-dessous montre un exemple de contract Solidity envoyant une action via CoreWriter : une fonction sendUsdClassTransfer qui transfère  ntl USDC d’un compte perp (USD class) vers le spot (toPerp = false). L’action est encodée en bytes, avec les 4 premiers octets = version (0x01) + action ID (0x000007 pour l’action 7 = USD class transfer), suivis des paramètres encodés ABI (ici ntl et toPerp) :

contract CoreWriterCaller {
    function sendUsdClassTransfer(uint64 ntl, bool toPerp) external {
        bytes memory encodedAction = abi.encode(ntl, toPerp);
        bytes memory data = new bytes(4 + encodedAction.length);
        data[0] = 0x01;
        data[1] = 0x00;
        data[2] = 0x00;
        data[3] = 0x07;
        for (uint256 i = 0; i < encodedAction.length; i++) {
            data[4 + i] = encodedAction[i];
        }
        CoreWriter(0x3333333333333333333333333333333333333333).sendRawAction(data);
    }
}

(Ce contract utilise l’interface CoreWriter.sendRawAction(bytes) pour envoyer l’action encodée. Dans cet exemple, ntl est converti en bytes sur 8 octets, toPerp sur 1 octet, etc., conformément à l’ABI.)

Conclusion : La fonctionnalité CoreWriter permet à un smart contract EVM d’envoyer des actions sur HyperCore. Il faut cependant veiller à respecter les formats et contraintes, et comprendre que ces actions n’ont lieu réellement que si elles sont entièrement signées (pour multi-sig le cas échéant) et soumises, et qu’il existe quelques subtilités (délai on-chain, etc.) décrites ci-dessus.

(Navigation : Précédent : « Interagir avec HyperCore » – Suivant : « Validateurs »)

Validateurs

(Les validateurs sont les nœuds de consensus HyperBFT qui produisent les blocs Hyperliquid. Ils sont au cœur du consensus et du staking.)

Exécuter un validateur

(Guide pour faire tourner un nœud validateur Hyperliquid.)

Documentation pour l’exécution des nœuds : Vous pouvez faire tourner un nœud en suivant les étapes décrites sur le dépôt GitHub Hyperliquid (voir hyperliquid-dex/node). En pratique, il y a deux types de nœuds : les nœuds validateurs et les nœuds non-validateurs (full nodes sans participation au consensus). Pour exécuter un validateur, il faut**:**
	•	Avoir une machine fiable et sécurisée (idéalement un serveur dédié)
	•	Compiler et lancer le client Hyperliquid en mode validator
	•	Avoir au moins 10 000 HYPE stakés sur votre adresse pour être éligible comme validateur actif

(Note : Les détails exacts du setup de validateur (fichiers de configuration, clés consensus, connexion au réseau) sont fournis dans la doc technique ou GitHub, et dépassent le cadre d’un résumé.)

En résumé, exécuter un validateur implique d’assumer la responsabilité de produire des blocs, de maintenir un uptime élevé et une bonne connectivité réseau, sans quoi le validateur peut être mis en jailed (temporairement écarté) comme expliqué dans la section Staking. Les validateurs gagnent des récompenses de staking (part du taux annuel mentionné plus haut) proportionnellement à leur stake total (self-stake + délégations) après déduction de leur commission éventuelle.

(Navigation : Précédent : « Hyperps » – Suivant : « Programme de délégation »)

Programme de délégation

(Délégation de HYPE aux validateurs, voir aussi section Staking.)

Hyperliquid propose un programme de délégation incitatif pour encourager la décentralisation du staking. En délégant vos HYPE à un validateur de confiance, vous contribuez à la sécurité du réseau et gagnez des récompenses de staking (automatiquement réinvesties comme vu plus haut).

La Proposition de Programme de Délégation (Staking referral program) discute peut-être de mécanismes pour inciter le parrainage de nouveaux délégateurs ou la redistribution des commissions. (Cf. section Referrals -> Proposal: Staking referral program.)

(Navigation : Précédent : « Exécuter un validateur » – Suivant : « Référencement »)

Référencement (Referrals)

(Programme de parrainage d’utilisateurs.)

Hyperliquid propose un programme de parrainage (Referral Program) pour encourager l’adoption. Chaque utilisateur peut inviter des amis via un code parrain. Les utilisateurs parrainés bénéficient d’une réduction sur les frais de trading, et les parrains reçoivent une commission sur le volume de trading de leurs filleuls, jusqu’à certaines limites.

La Proposition: Staking referral program suggère d’étendre le système de parrainage en intégrant des incitations liées au staking (par ex. bonus si les filleuls stakent du HYPE, etc.). Cette proposition vise à allier la croissance de la base utilisateurs à celle du staking en incitant les parrains à amener des stakers.

(Note : le programme de referral actuel applique une réduction de frais pour le filleul sur ses premiers 25 M$ de volume, et une commission pour le parrain sur les premiers 1 Md$ de volume du filleul . Les détails chiffrés sont couverts dans la section Fees ci-dessous.)

(Navigation : Précédent : « Validateurs » – Suivant : « Points »)

Points

(Système de points de fidélité ou de récompense, possiblement.)

Hyperliquid peut attribuer des points aux utilisateurs pour certaines actions (trading, programmes communautaires, etc.). Ces points n’ont pas de valeur monétaire mais pourraient être utilisés pour des classements, des avantages spéciaux ou une future gouvernance.

*(Note : la doc ne détaille pas ici, mais mentionne Points dans le menu. On peut supposer un système de points de trading ou de récompenses.)

(Navigation : Précédent : « Référencement » – Suivant : « Données historiques »)

Données historiques

Hyperliquid fournit des données historiques de trading, via API ou dumps, pour la transparence et l’analyse. Les utilisateurs ou développeurs peuvent récupérer l’historique des trades, du PnL, etc., soit via l’API Info (type = history ou analytics) soit via des sources comme Goldsky, Allium, etc. (Voir Indexing / subgraphs dans la section outils HyperEVM, où il est mentionné des services comme Goldsky et Allium offrant des endpoints pour l’historique sur Hyperliquid.)

(Navigation : Précédent : « Points » – Suivant : « Risques »)

Risques

(Section décrivant les risques associés à Hyperliquid.)

Comme tout protocole DeFi, Hyperliquid comporte des risques :
	•	Risque de marché : volatilité des actifs tradés, pouvant mener à des pertes importantes (liquidations, etc.). L’utilisation de levier amplifie ce risque.
	•	Risque technique : bien qu’audité, le code pourrait contenir des bugs. La double architecture de blocs, l’HyperEVM et HyperCore sont innovants mais complexes, donc un défaut pourrait entraîner des dysfonctionnements.
	•	Risque de liquidation systémique : en cas de mouvement extrême, de nombreux comptes pourraient être liquidés simultanément. Hyperliquid atténue cela via partial liquidation (liquidations partielles par tranche de 20%) et via le Liquidator Vault (qui gère les backstops et évite la socialisation des pertes), mais un événement sans précédent pourrait mettre ces mécanismes à rude épreuve.
	•	Risque de contrepartie : sur Hyperliquid, la contrepartie de chaque trade est un autre utilisateur ou le HLP. Si ce dernier devenait insuffisant ou un pool de liquidité se vidait, cela pourrait impacter les sorties de positions.
	•	Risque de smart contract : les contrats d’Hyperliquid (bridge, HyperEVM, vaults) pourraient être la cible de hacks s’il existe des failles.

(La section Risques encourage sans doute les utilisateurs à bien comprendre le fonctionnement et à n’investir que ce qu’ils peuvent se permettre de perdre, etc.)

(Navigation : Précédent : « Données historiques » – Suivant : « Bug bounty »)

Programme de bug bounty

Hyperliquid dispose d’un programme de bug bounty pour encourager la découverte responsable de vulnérabilités. Les chercheurs en sécurité qui trouvent des bugs critiques peuvent les rapporter et recevoir une récompense en fonction de la sévérité. Cela fait partie de l’engagement de Hyperliquid pour la sécurité.

(Détails potentiels : le bug bounty est probablement géré via une plateforme comme Immunefi ou géré directement, avec des récompenses allant jusqu’à X USD pour des bugs critiques, etc. Les utilisateurs intéressés sont invités à consulter la page officielle du programme ou le dépôt GitHub pour les détails sur la portée et les conditions.)

(Navigation : Précédent : « Risques » – Suivant : « Audits »)

Audits

Hyperliquid a fait l’objet d’audits de sécurité par des cabinets spécialisés, notamment Zellic (mentionné pour le bridge)  et possiblement d’autres (les améliorations HIP-1, HIP-2, etc., ou le code HyperEVM, ont pu être audités séparément).

Les rapports d’audit sont disponibles et transparents, détaillant les vulnérabilités trouvées (et corrigées). Les audits couvrent le contrat de bridge L1, les contrats d’exécution Hyperliquid, etc. Hyperliquid recommande vivement aux utilisateurs de consulter ces audits pour comprendre les mesures de sécurité en place.

(Navigation : Précédent : « Bug bounty » – Suivant : « Brand kit »)

Brand kit (charte graphique)

Le Brand kit de Hyperliquid comprend les logos, palettes de couleurs, et directives d’utilisation de la marque Hyperliquid. Les partenaires ou créateurs de contenu peuvent s’y référer pour respecter l’identité visuelle du projet. Le kit inclut le logo officiel Hyperliquid en différentes résolutions, les symboles (par ex. l’icône du token HYPE), etc.

(Les éléments de charte graphique sont généralement disponibles sur un espace GitBook ou via un lien de téléchargement. Hyperliquid souhaite que sa marque soit utilisée de manière cohérente et professionnelle.)

(Navigation : Précédent : « Audits » – Suivant : « Pour les développeurs »)

Pour les développeurs

(Section dédiée aux informations techniques détaillées et à l’API publique pour les développeurs intégrant Hyperliquid.)

API

(Documentation de l’API publique Hyperliquid, utilisable via REST ou WebSocket, ou via le SDK Python.)

La documentation de l’API publique se trouve ci-après. Vous pouvez également utiliser l’API via le SDK Python Hyperliquid : disponible sur GitHub, ainsi qu’un SDK Rust (moins maintenu) et des SDK TypeScript écrits par la communauté.

De plus, CCXT maintient des intégrations multi-langages compatibles avec l’API standard CCXT, y compris pour Hyperliquid.

Toutes les exemples d’appels d’API utilisent l’URL Mainnet https://api.hyperliquid.xyz, mais il est possible d’effectuer les mêmes requêtes sur le Testnet en utilisant l’URL correspondante https://api.hyperliquid-testnet.xyz.

(Navigation : Précédent : « Brand kit » – [Suivant : détails de l’API)

Voici les principaux points de l’API Hyperliquid :
	•	Notation : toutes les quantités (prix, tailles, etc.) sont exprimées en unités entières selon la notation du marché. Par exemple, le prix d’un perp est donné en ticks (avec 8 décimales implicites), et la taille en lots (8 décimales implicites). L’API documente ces facteurs d’échelle pour chaque marché.
	•	Identifiants d’actifs (Asset IDs) : chaque actif (token ou paire) est identifié par un entier ID utilisé dans l’API (par ex. 0 = BTC, 1 = ETH, etc. – voir l’endpoint info pour la liste ou la doc Asset IDs). Cela permet des réponses plus compactes.
	•	Tick size & lot size : pour chaque marché, tickSize (taille de pas de cotation) et lotSize (taille minimale de lot) sont définis. Ex : pour BTC-USD, tickSize = 0.5 USDC, lotSize = 0.001 BTC (ce sont des valeurs d’exemple). L’API retourne ces paramètres dans /info pour permettre aux clients de bien formater les ordres.
	•	Nonces et wallets API : chaque requête d’API privée doit inclure un nonce unique et monotone pour la signature, et la signature est calculée avec la clé privée du compte ou du wallet API (sous-compte) utilisé. Un utilisateur peut créer des wallets API (voir l’action CoreWriter ID 9) avec des noms, qui agissent comme des sous-comptes dotés de leurs propres nonces et permissions. Cela permet de segmenter l’activité API (par ex. un wallet API pour un bot de trading, un autre pour une autre stratégie).
	•	Endpoint d’info (Info endpoint) : l’endpoint GET /info (ou l’équivalent WebSocket) fournit des informations générales sur l’échange et sur l’utilisateur. Il comporte plusieurs types de requêtes, selon le champ type du JSON envoyé :
	•	« notation » : renvoie les paramètres généraux (liste des marchés, leurs asset IDs, tick/lot sizes, etc.),
	•	« assetIDs » : renvoie la mapping ID <-> nom d’actif,
	•	« info » : renvoie un ensemble d’informations sur les marchés, l’état du user, etc. (D’après la structure, on voit dans la doc un champ meta qui contient la table des marges tiers, un champ referral pour le programme referral, etc. Cf. plus bas.)
	•	« perpetuals » : renvoie des données spécifiques sur les marchés perpétuels,
	•	« spot » : renvoie des données spécifiques sur les marchés spot,
	•	« referral » : renvoie l’état du programme de parrainage pour un user (user: adresse du parrain, etc.).
(Exemple d’appel info: {"type": "info"} ou pour un champ spécifique, {"type": "maxBuilderFee", "user": "0x...", "builder": "0x..."} pour les builder fees comme mentionné plus haut.)
	•	Endpoint d’échange (Exchange endpoint) : il permet d’envoyer des ordres et autres requêtes de trading (place order, cancel order, transfers…). L’API d’échange s’aligne sur le design CCXT/REST : on envoie une requête POST signée avec le payload JSON contenant l’action (par ex. {"action": "cancel", "oid": 12345} pour annuler l’ordre 12345). L’API propose un ensemble de types d’actions correspondant aux actions Core (limit, market, withdrawal, etc.).
	•	WebSocket : l’API WebSocket fournit un flux temps-réel pour les données de marché (ticker, carnets, trades) et notifications de compte (ordre exécuté, liquidation, etc.). Il est possible de s’abonner à différents canaux via des messages de subscription ({"type": "subscribe", "feeds": [...]}). Par exemple, on peut s’abonner aux flux orderbook d’un marché, trades, tickers, ou fills de son compte.
	•	Subscriptions : on envoie un message de type subscribe avec la liste des flux désirés. Certains flux publics n’exigent pas d’authentification (market data), les flux privés nécessitent d’abord un message de login signé.
	•	Requêtes Post via WebSocket : l’API WebSocket permet aussi d’envoyer des commandes (passer un ordre, annuler) via un message avec un champ type: "request" ou similaire, avec la signature et le nonce comme par l’API REST. Cela permet d’avoir une connexion unique pour tout faire.
	•	Timeouts et heartbeats : la connexion WebSocket envoie périodiquement des heartbeats pour maintenir la connexion. Si aucune activité n’est détectée pendant un certain temps, le serveur peut envoyer un ping ou terminer la connexion. L’API encourage les clients à répondre aux pings ou à envoyer un message de heartbeat pour éviter la déconnexion.
	•	Réponses d’erreur : en cas d’erreur (mauvaise signature, paramètre invalide, solde insuffisant, etc.), l’API renvoie un code d’erreur standardisé et un message descriptif. Par exemple, {"error": "InvalidNonce", "message": "nonce must be greater than X"}. La documentation liste les erreurs possibles (InvalidNonce, InsufficientBalance, etc.).
	•	Signature des requêtes : les requêtes privées doivent être signées avec la clé privée du compte (ou du wallet API). La signature est typiquement calculée en SHA256 sur (méthode + endpoint + payload + nonce) puis signée en ECDSA secp256k1. L’entête doit inclure l’adresse (X-API-Addr) et la signature (X-API-Sig), ainsi que le nonce utilisé. (Le SDK Python gère cela automatiquement.)
	•	Limites de taux (Rate limits) et limites utilisateur : L’API impose des limites de requêtes par IP (1200 requêtes par minute agrégées sur REST, d’après la doc). De plus, il peut y avoir des limites par utilisateur (ex. max 15 ordres/s). Ces limites visent à protéger la plateforme et assurent une équité. Pour des besoins de market making très intensifs, contacter l’équipe pour discuter d’exemptions éventuellement.
	•	Optimisation de la latence : L’API Hyperliquid est conçue pour une latence minimale, surtout via WebSocket. Les serveurs API sont déployés de manière géographiquement optimisée (par ex. en Asie et Amérique du Nord) pour minimiser la latence vers le nœud. Un guide d’optimisation mentionne d’utiliser les colocations (liens direct aux API servers via gRPC?), et l’utilisation du champ sendAt (peut-être un paramètre interne pour anticiper l’envoi pile au bon moment sur un gros bloc). (Ceci est spéculatif : la doc mentionne peut-être des conseils aux traders haute fréquence, comme calibrer l’horloge avec le consensus, etc. L’absence de matching engine off-chain signifie que la latence de propagation des ordres sur le réseau Hyperliquid est critique pour le market making.)
	•	Bridge2 : un second bridge ou bridge contract peut exister (nommé Bridge2 dans l’API). Il pourrait s’agir du nouveau contrat de bridge reliant Hyperliquid à d’autres L1 (peut-être un Bridge Bitcoin ou un Bridge interne). L’API Bridge2 pourrait permettre d’interagir (déposer, retirer) via un protocole cross-chain comme LayerZero.
	•	Déploiement d’actifs HIP-1 & HIP-2 : L’API offre des actions ou endpoints pour déployer de nouveaux tokens natifs (HIP-1) et initialiser l’Hyperliquidity (HIP-2). Par exemple, un vault leader qui suit HIP-2 paramètre startPx, nOrders, orderSz, nSeededLevels via une action. L’API info renvoie possiblement un champ pour hyperliquidity en attente. C’est un sujet complexe : typiquement, un builder propose de lancer un nouveau perp (via HIP-3) ou un spot token (HIP-1 + HIP-2) et utilise l’API pour soumettre la transaction de déploiement. L’API mentionne en effet les actions correspondantes (Bridge2, Deploy HIP-1 assets, HIP-3 actions).
	•	Actions du déployeur HIP-3 : Ce sont les actions qu’un deployer de perp builder (HIP-3) peut faire via l’API : setOracle, setLeverageLimits, haltTrading (settlement) etc. Elles correspondent aux responsabilités du déployeur mentionnées plus haut. L’API permet ainsi aux deployers de gérer leurs marchés. Par exemple, {"action": "setOraclePrice", ...} ou choses similaires, signées par un compte possédant 1M HYPE staké (car condition pour deployer un perp, stake requirement).

(Navigation : Précédent : « Brand kit » – Suivant : « HyperEVM (dev) »)

HyperEVM (section développeurs)

(Contenu technique déjà couvert dans HyperEVM introduction ci-dessus. On peut résumer l’architecture duale, mainnet/testnet, certaines limitations.)

(Navigation : Précédent : « API » – Suivant : « Nœuds »)

Nœuds (Nodes)

Hyperliquid permet à quiconque d’exécuter un nœud complet (non-validateur) pour accéder aux données on-chain en temps réel, participer au réseau en relayant les transactions, etc. La documentation Nodes fournit toutes les informations nécessaires (dépendances, compilation, configuration).

Il y a deux modes principaux :
	•	Validateur – nécessite une clé de validation et du HYPE staké (voir plus haut).
	•	Non-validateur – un nœud qui suit le réseau sans valider, utile pour les API server, indexeurs, etc.

Exécuter un nœud non-validateur (foundation node ou full node) ne requiert pas de stake et permet de contribuer à la robustesse du réseau (plus de pairs). Hyperliquid Labs propose une implémentation Foundation node pour ceux qui veulent juste un RPC local sans valider (voir foundation-non-validating node plus bas).

(Navigation : Précédent : « HyperEVM (dev) » – Suivant : « Schémas de données L1 »)

Schémas de données L1

Hyperliquid L1 utilise des schémas de données spécifiques pour stocker l’état on-chain (positions, ordres, comptes, etc.). Les data schemas L1 décrivent comment les données sont structurées dans la base de données interne du nœud (par exemple, clef/valeur pour chaque table du clearinghouse, mapping user->positions, etc.). Ces schémas sont principalement utiles aux développeurs du protocole ou à ceux qui veulent interroger la base de données du nœud directement.

(À moins d’être un contributeur technique, la plupart des utilisateurs n’auront pas à se soucier de ces schémas – ils utiliseront l’API de plus haut niveau.)

Nœud fondation non-validateur

Hyperliquid fournit une configuration de nœud dite foundation non-validating node, destinée aux fondations ou entités souhaitant un nœud sans participer au consensus. Ce nœud suit la chaîne, stocke l’historique complet, et expose des endpoints RPC publics (optionnellement). C’est un nœud « archival » et robuste, maintenant la décentralisation du réseau en fournissant des points d’accès supplémentaires.

(C’est un nœud typiquement utilisé par les partenaires ou block explorers, etc., qui ne veulent pas valider mais soutenir l’infrastructure.)

(Fin de la documentation.)

⸻

Dernière mise à jour de cette documentation : 5 septembre 2025.