#!/usr/bin/env python3
"""
Bot de rebalancement pour HyperEVM testnet
Appelle périodiquement rebalancePortfolio(0,0) sur le contrat CoreInteractionHandler
et envoie des notifications Telegram avec le résultat et la balance Hyper Core.
"""

import os
import time
import schedule
import requests
from dotenv import load_dotenv
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account

# Charger les variables d'environnement
load_dotenv()

# Configuration
RPC_URL = os.getenv('RPC_URL')
PRIVATE_KEY = os.getenv('PRIVATE_KEY')
HANDLER_ADDRESS = os.getenv('HANDLER_ADDRESS')
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

# Vérifier que toutes les variables sont présentes
if not all([RPC_URL, PRIVATE_KEY, HANDLER_ADDRESS, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]):
    raise ValueError("Toutes les variables d'environnement doivent être définies dans le fichier .env")

# ABI minimal du contrat CoreInteractionHandler
HANDLER_ABI = [
    {
        "inputs": [
            {"internalType": "uint128", "name": "cloidBtc", "type": "uint128"},
            {"internalType": "uint128", "name": "cloidHype", "type": "uint128"}
        ],
        "name": "rebalancePortfolio",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "equitySpotUsd1e18",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "usdcCoreTokenId",
        "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "coreUser", "type": "address"},
            {"internalType": "uint64", "name": "tokenId", "type": "uint64"}
        ],
        "name": "spotBalance",
        "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Initialiser Web3
web3 = Web3(Web3.HTTPProvider(RPC_URL))

# Ajouter le middleware POA si nécessaire (pour certains réseaux de test)
web3.middleware_onion.inject(geth_poa_middleware, layer=0)

# Vérifier la connexion
if not web3.is_connected():
    raise ConnectionError(f"Impossible de se connecter au nœud RPC: {RPC_URL}")

# Obtenir l'adresse publique à partir de la clé privée
account = Account.from_key(PRIVATE_KEY)
public_address = account.address

# Initialiser le contrat
handler_contract = web3.eth.contract(
    address=Web3.to_checksum_address(HANDLER_ADDRESS),
    abi=HANDLER_ABI
)

print(f"Bot initialisé avec l'adresse: {public_address}")
print(f"Contrat handler: {HANDLER_ADDRESS}")
print(f"RPC: {RPC_URL}")


def send_telegram_message(message):
    """Envoie un message via Telegram"""
    try:
        response = requests.get(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            params={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            }
        )
        if response.status_code != 200:
            print(f"Erreur Telegram: {response.text}")
    except Exception as e:
        print(f"Erreur lors de l'envoi du message Telegram: {e}")


def get_balances():
    """Récupère les balances depuis Hyper Core"""
    try:
        # Récupérer l'équité en USD
        equity_raw = handler_contract.functions.equitySpotUsd1e18().call()
        equity_usd = equity_raw / 1e18
        
        # Récupérer la balance USDC
        usdc_token_id = handler_contract.functions.usdcCoreTokenId().call()
        usdc_raw = handler_contract.functions.spotBalance(
            Web3.to_checksum_address(HANDLER_ADDRESS),
            usdc_token_id
        ).call()
        usdc_balance = usdc_raw / 1e8
        
        return equity_usd, usdc_balance
    except Exception as e:
        print(f"Erreur lors de la récupération des balances: {e}")
        return None, None


def rebalance():
    """Fonction principale de rebalancement"""
    print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Début du rebalancement...")
    
    try:
        # Toujours utiliser cloid_btc = 0 et cloid_hype = 0
        cloid_btc = 0
        cloid_hype = 0
        
        # Récupérer le nonce
        nonce = web3.eth.get_transaction_count(public_address)
        
        # Estimer le gas
        gas_estimate = handler_contract.functions.rebalancePortfolio(
            cloid_btc, cloid_hype
        ).estimate_gas({'from': public_address})
        
        # Obtenir le prix du gas
        gas_price = web3.eth.gas_price
        
        # Construire la transaction
        transaction = handler_contract.functions.rebalancePortfolio(
            cloid_btc, cloid_hype
        ).build_transaction({
            'from': public_address,
            'nonce': nonce,
            'gas': int(gas_estimate * 1.2),  # Ajouter 20% de marge
            'gasPrice': gas_price,
        })
        
        # Signer la transaction
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key=PRIVATE_KEY)
        
        # Envoyer la transaction
        tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Transaction envoyée: {tx_hash.hex()}")
        
        # Attendre le reçu
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
        
        # Récupérer les balances
        equity_usd, usdc_balance = get_balances()
        
        # Préparer le message
        if receipt.status == 1:
            message = (
                "✅ <b>Rebalancement réussi</b>\n\n"
                f"📊 Transaction: <code>{tx_hash.hex()}</code>\n"
                f"⛽ Gas utilisé: {receipt.gasUsed:,}\n"
                f"🔢 Block: {receipt.blockNumber:,}\n\n"
                f"💰 <b>Balances Hyper Core:</b>\n"
            )
        else:
            message = (
                "❌ <b>Rebalancement échoué</b>\n\n"
                f"📊 Transaction: <code>{tx_hash.hex()}</code>\n"
                f"⛽ Gas utilisé: {receipt.gasUsed:,}\n"
                f"🔢 Block: {receipt.blockNumber:,}\n\n"
                f"💰 <b>Balances Hyper Core:</b>\n"
            )
        
        if equity_usd is not None:
            message += f"• Équité USD: ${equity_usd:,.2f}\n"
        if usdc_balance is not None:
            message += f"• Balance USDC: {usdc_balance:,.2f} USDC\n"
        
        print(f"Statut de la transaction: {'Succès' if receipt.status == 1 else 'Échec'}")
        
    except Exception as e:
        print(f"Erreur lors du rebalancement: {e}")
        
        # Essayer quand même de récupérer les balances
        equity_usd, usdc_balance = get_balances()
        
        message = (
            "❌ <b>Erreur lors du rebalancement</b>\n\n"
            f"🚫 Erreur: {str(e)}\n\n"
            f"💰 <b>Balances Hyper Core:</b>\n"
        )
        
        if equity_usd is not None:
            message += f"• Équité USD: ${equity_usd:,.2f}\n"
        if usdc_balance is not None:
            message += f"• Balance USDC: {usdc_balance:,.2f} USDC\n"
    
    # Envoyer le message Telegram
    send_telegram_message(message)
    print("Notification Telegram envoyée")


def main():
    """Fonction principale"""
    print("🤖 Bot de rebalancement démarré")
    print("📅 Exécution prévue toutes les 60 minutes")
    
    # Exécuter immédiatement au démarrage
    rebalance()
    
    # Planifier l'exécution toutes les 60 minutes
    schedule.every(60).minutes.do(rebalance)
    
    # Boucle principale
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()