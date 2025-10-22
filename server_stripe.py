#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Serveur Python pour Tombobach avec intégration Stripe Checkout
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse
from datetime import datetime
import sys

# Charger les variables d'environnement depuis .env
def load_env():
    env_vars = {}
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        print("⚠️ Fichier .env non trouvé")
    return env_vars

env_vars = load_env()
STRIPE_SECRET_KEY = env_vars.get('STRIPE_SECRET_KEY', '')

# Vérifier si stripe est installé
try:
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    STRIPE_AVAILABLE = True
    print("✅ Stripe configuré avec succès")
except ImportError:
    STRIPE_AVAILABLE = False
    print("⚠️ Module stripe non installé. Installation en cours...")
    print("💡 Lancez: pip install stripe")

# Fichier de base de données
DB_FILE = 'payments_database.json'

def read_database():
    """Lire la base de données"""
    if not os.path.exists(DB_FILE):
        return {'tickets': []}
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Migration: si l'ancien format existe, le convertir
            if 'payments' in data and 'tickets' not in data:
                return {'tickets': []}
            return data
    except:
        return {'tickets': []}

def write_database(data):
    """Écrire dans la base de données"""
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur écriture DB: {e}")
        return False

class StripeHandler(SimpleHTTPRequestHandler):
    """Handler HTTP avec support Stripe"""
    
    def end_headers(self):
        """Ajouter les headers CORS à toutes les réponses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Gérer les requêtes OPTIONS (CORS)"""
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        """Gérer les requêtes POST"""
        if self.path == '/create-checkout-session':
            self.handle_create_checkout()
        elif self.path == '/save-payment':
            self.handle_save_payment()
        else:
            self.send_error(404)
    
    def do_GET(self):
        """Gérer les requêtes GET"""
        if self.path.startswith('/admin/payments'):
            self.handle_get_payments()
        elif self.path.startswith('/admin/stats'):
            self.handle_get_stats()
        else:
            # Servir les fichiers statiques
            super().do_GET()
    
    def handle_create_checkout(self):
        """Créer une session Stripe Checkout"""
        try:
            # Lire le corps de la requête
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            print(f"📥 Requête reçue pour {data['firstName']} {data['lastName']}")
            print(f"   Tickets: {data['tickets']}, Montant: {data['amount']}€")
            
            if not STRIPE_AVAILABLE or not STRIPE_SECRET_KEY or STRIPE_SECRET_KEY == 'sk_test_VOTRE_CLE_SECRETE_ICI':
                # Mode simulation
                print("⚠️ Mode simulation activé")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {'url': '/success.html?simulation=true'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Créer une session Stripe Checkout
            origin = self.headers.get('Origin', 'http://localhost:8000')
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f"Tombobach - {data['tickets']} ticket{'s' if data['tickets'] > 1 else ''}",
                            'description': 'La grande Tombola des Bachelor Arts et Métiers',
                        },
                        'unit_amount': int(data['amount'] * 100),  # Centimes
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{origin}/success.html?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{origin}/?canceled=true",
                customer_email=data['email'],
                metadata={
                    'tickets': str(data['tickets']),
                    'firstName': data['firstName'],
                    'lastName': data['lastName'],
                    'phone': data['phone']
                }
            )
            
            # Réponse
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {'url': session.url}
            self.wfile.write(json.dumps(response).encode())
            
            print(f"✅ Session Checkout créée pour {data['firstName']} {data['lastName']}")
            print(f"🔗 URL Stripe: {session.url}")
            
        except Exception as e:
            print(f"❌ Erreur création checkout: {e}")
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error = {'error': str(e)}
            self.wfile.write(json.dumps(error).encode())
    
    def handle_save_payment(self):
        """Sauvegarder un paiement - 1 ligne par ticket"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Lire la base de données
            db = read_database()
            
            # Vérifier si le champ vendeur est présent, sinon utiliser 'Aucun'
            vendeur = data.get('vendeur', 'Aucun')
            
            # Calculer le premier numéro de ticket
            # Le numéro de ticket = nombre total de lignes + 1
            first_ticket_number = len(db['tickets']) + 1
            
            # Créer une ligne pour chaque ticket acheté
            ticket_numbers = []
            for i in range(data['tickets']):
                ticket_number = first_ticket_number + i
                ticket_numbers.append(ticket_number)
                
                ticket_entry = {
                    'id': ticket_number,
                    'firstName': data['firstName'],
                    'lastName': data['lastName'],
                    'email': data['email'],
                    'phone': data['phone'],
                    'vendeur': vendeur,
                    'amount': data.get('amount', 5),  # Montant par défaut de 5€
                    'date': datetime.now().isoformat()
                }
                
                db['tickets'].append(ticket_entry)
            
            # Sauvegarder dans la base de données
            write_database(db)
            
            # Réponse
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {'success': True, 'ticketNumbers': ticket_numbers}
            self.wfile.write(json.dumps(response).encode())
            
            if len(ticket_numbers) == 1:
                print(f"💾 Ticket sauvegardé: N°{ticket_numbers[0]} - {data['firstName']} {data['lastName']}")
            else:
                print(f"💾 Tickets sauvegardés: N°{ticket_numbers[0]} à {ticket_numbers[-1]} - {data['firstName']} {data['lastName']} - {data['amount']}€")
            
        except Exception as e:
            print(f"❌ Erreur sauvegarde: {e}")
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.end_headers()
    
    def handle_get_payments(self):
        """Récupérer tous les tickets"""
        try:
            db = read_database()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(db['tickets']).encode())
        except Exception as e:
            print(f"❌ Erreur récupération tickets: {e}")
            self.send_response(500)
            self.end_headers()
    
    def handle_get_stats(self):
        """Récupérer les statistiques"""
        try:
            db = read_database()
            tickets = db.get('tickets', [])
            
            # Calculer les statistiques globales
            total_tickets = len(tickets)
            total_revenue = sum(ticket.get('amount', 5) for ticket in tickets)  # 5€ par défaut si non spécifié
            
            # Calculer les statistiques par vendeur
            vendeurs = {}
            for ticket in tickets:
                vendeur = ticket.get('vendeur', 'Aucun')
                if vendeur not in vendeurs:
                    vendeurs[vendeur] = {
                        'tickets': 0,
                        'montant': 0
                    }
                vendeurs[vendeur]['tickets'] += 1
                vendeurs[vendeur]['montant'] += ticket.get('amount', 5)  # 5€ par défaut
            
            # Trier les vendeurs par montant décroissant
            vendeurs_tries = [
                {
                    'nom': v,
                    'tickets': data['tickets'],
                    'montant': data['montant']
                }
                for v, data in sorted(
                    vendeurs.items(),
                    key=lambda x: x[1]['montant'],
                    reverse=True
                )
            ]
            
            response = {
                'totalTickets': total_tickets,
                'totalRevenue': total_revenue,
                'vendeurs': vendeurs_tries
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            print(f"Erreur récupération stats: {e}")
            import traceback
            traceback.print_exc()
            self.send_error(500, f"Erreur serveur: {str(e)}")

def run_server(port=8000):
    """Lancer le serveur"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, StripeHandler)
    
    print("\n" + "="*60)
    print("🎫 Serveur Tombobach démarré avec succès !")
    print("="*60)
    print(f"🌐 Site web: http://localhost:{port}")
    print(f"📊 Interface admin: http://localhost:{port}/admin.html")
    print(f"💾 Base de données: {os.path.abspath(DB_FILE)}")
    
    if STRIPE_AVAILABLE and STRIPE_SECRET_KEY and STRIPE_SECRET_KEY != 'sk_test_VOTRE_CLE_SECRETE_ICI':
        print("✅ Mode Stripe Checkout ACTIVÉ")
        print("🧪 Utilisez la carte de test: 4242 4242 4242 4242")
    else:
        print("⚠️  Mode SIMULATION (Stripe non configuré)")
        if not STRIPE_AVAILABLE:
            print("💡 Pour activer Stripe: pip install stripe")
    
    print("="*60)
    print("Appuyez sur Ctrl+C pour arrêter le serveur\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Serveur arrêté")
        httpd.server_close()

if __name__ == '__main__':
    # Vérifier si un port est spécifié
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except:
            pass
    
    run_server(port)
