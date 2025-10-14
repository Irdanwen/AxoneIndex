# Bot de Rebalancement HyperEVM

## Description

Ce bot automatise le processus de rebalancement sur HyperEVM testnet en appelant périodiquement la fonction `rebalancePortfolio(0,0)` du contrat `CoreInteractionHandler`. Il envoie des notifications Telegram avec le résultat de chaque opération et les balances actuelles sur Hyper Core.

## Fonctionnalités

- 🔄 Appel automatique de `rebalancePortfolio(0,0)` toutes les 60 minutes
- 📱 Notifications Telegram en temps réel
- 💰 Affichage de l'équité USD et de la balance USDC
- 🔒 Gestion sécurisée des clés privées via variables d'environnement
- 📊 Logs détaillés des transactions et des erreurs

## Prérequis

- Python 3.10 ou supérieur
- Un portefeuille EVM enregistré comme rebalancer sur le contrat
- Un bot Telegram configuré
- Accès au réseau HyperEVM testnet

## Installation

1. Cloner le dépôt et naviguer vers le dossier du bot :
```bash
cd rebalancingbot
```

2. Installer les dépendances Python :
```bash
pip install -r requirements.txt
```

3. Créer le fichier de configuration `.env` à partir du modèle :
```bash
cp .env.example .env
```

4. Éditer le fichier `.env` avec vos paramètres :
```env
RPC_URL=https://rpc.hyperliquid-testnet.xyz/evm
PRIVATE_KEY=votre_clé_privée_ici
HANDLER_ADDRESS=0x_adresse_du_contrat_handler
TELEGRAM_TOKEN=votre_token_telegram
TELEGRAM_CHAT_ID=votre_chat_id
```

## Configuration

### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `RPC_URL` | URL du nœud RPC HyperEVM testnet | `https://rpc.hyperliquid-testnet.xyz/evm` |
| `PRIVATE_KEY` | Clé privée du portefeuille rebalancer | `0x...` (64 caractères hex) |
| `HANDLER_ADDRESS` | Adresse du contrat CoreInteractionHandler | `0x...` (40 caractères hex) |
| `TELEGRAM_TOKEN` | Token du bot Telegram | Obtenu depuis @BotFather |
| `TELEGRAM_CHAT_ID` | ID du chat/utilisateur à notifier | Nombre ou @username |

### Configuration Telegram

1. Créer un bot avec @BotFather sur Telegram
2. Récupérer le token du bot
3. Envoyer un message au bot
4. Obtenir le chat ID via : `https://api.telegram.org/bot<TOKEN>/getUpdates`

## Utilisation

### Développement

Lancer le bot en mode développement :
```bash
python bot.py
```

Le bot effectuera immédiatement un rebalancement au démarrage, puis toutes les 60 minutes.

### Production

#### Option 1 : Service systemd (Linux)

1. Créer un fichier service :
```bash
sudo nano /etc/systemd/system/rebalancing-bot.service
```

2. Ajouter la configuration :
```ini
[Unit]
Description=HyperEVM Rebalancing Bot
After=network.target

[Service]
Type=simple
User=votre_utilisateur
WorkingDirectory=/chemin/vers/rebalancingbot
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 /chemin/vers/rebalancingbot/bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Démarrer et activer le service :
```bash
sudo systemctl daemon-reload
sudo systemctl enable rebalancing-bot
sudo systemctl start rebalancing-bot
```

#### Option 2 : Docker

1. Créer un Dockerfile :
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY bot.py .
CMD ["python", "bot.py"]
```

2. Construire et lancer :
```bash
docker build -t rebalancing-bot .
docker run -d --env-file .env --name rebalancing-bot rebalancing-bot
```

#### Option 3 : PM2

```bash
pm2 start bot.py --name rebalancing-bot --interpreter python3
pm2 save
pm2 startup
```

## Sécurité

⚠️ **IMPORTANT** : 
- **Ne jamais commiter le fichier `.env`** contenant votre clé privée
- Utiliser un fichier `.gitignore` pour exclure `.env`
- Conserver des sauvegardes sécurisées de votre clé privée
- Utiliser des permissions restrictives sur le fichier `.env` : `chmod 600 .env`
- En production, considérer l'utilisation d'un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)

## Architecture

Le bot utilise les composants suivants :
- **web3.py** : Interaction avec la blockchain HyperEVM
- **schedule** : Planification des tâches périodiques
- **requests** : Envoi des notifications Telegram
- **python-dotenv** : Gestion des variables d'environnement

### Flux d'exécution

1. Chargement de la configuration depuis `.env`
2. Connexion au nœud RPC HyperEVM
3. Initialisation du contrat `CoreInteractionHandler`
4. Toutes les 60 minutes :
   - Appel de `rebalancePortfolio(0, 0)`
   - Récupération des balances (équité USD et USDC)
   - Envoi de la notification Telegram
   - Logging des résultats

## Dépannage

### Le bot ne se connecte pas au RPC
- Vérifier que l'URL RPC est correcte
- Tester la connexion : `curl <RPC_URL>`
- Vérifier la connectivité réseau

### Erreur d'estimation de gas
- Vérifier que l'adresse est bien enregistrée comme rebalancer
- S'assurer que le portefeuille a suffisamment d'ETH pour les frais
- Vérifier l'adresse du contrat handler

### Notifications Telegram non reçues
- Vérifier le token et le chat ID
- S'assurer que le bot est démarré sur Telegram
- Tester manuellement : `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=test`

## Logs

Le bot affiche des logs dans la console avec :
- Horodatage de chaque opération
- Hash des transactions
- Statut de succès/échec
- Messages d'erreur détaillés

Pour conserver les logs en production :
```bash
python bot.py >> rebalancing.log 2>&1
```

## Support

Pour toute question ou problème :
1. Vérifier les logs pour les messages d'erreur
2. S'assurer que toutes les variables d'environnement sont correctement configurées
3. Consulter la documentation HyperEVM testnet

## Licence

Ce projet est fourni tel quel, sans garantie d'aucune sorte.