# 🚀 Installation et Configuration Stripe Checkout

## ✅ Vous avez déjà configuré vos clés Stripe !

Vos clés sont dans :
- `.env` (clé secrète pour le serveur)
- `config.js` (clé publique pour le frontend)

## 📦 Étapes pour activer les paiements Stripe

### 1. Installer Node.js

1. Téléchargez Node.js depuis : https://nodejs.org/
2. Choisissez la version **LTS** (recommandée)
3. Installez-le (suivez l'assistant d'installation)
4. Redémarrez votre terminal/PowerShell

### 2. Installer les dépendances

Ouvrez un terminal dans le dossier du projet et lancez :

```bash
npm install
```

Cela va installer :
- `express` (serveur web)
- `stripe` (API Stripe)
- `dotenv` (gestion des variables d'environnement)
- `cors` (autoriser les requêtes cross-origin)

### 3. Lancer le serveur

```bash
npm start
```

Vous devriez voir :
```
🚀 Serveur démarré sur http://localhost:3000
📊 Interface admin: http://localhost:3000/admin.html
💾 Base de données: C:\Users\lyham\site tombola\payments_database.json
```

### 4. Tester le site

1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Cliquez sur "Acheter" pour un pack de tickets
3. Remplissez le formulaire (Prénom, Nom, Email, Téléphone)
4. Cliquez sur "Continuer vers le paiement"
5. **Vous serez redirigé vers la page Stripe Checkout** 🎉

## 🧪 Cartes de test Stripe

Sur la page Stripe Checkout, utilisez ces numéros de carte :

### ✅ Paiement réussi
- **Numéro** : `4242 4242 4242 4242`
- **Date** : N'importe quelle date future (ex: 12/25)
- **CVC** : N'importe quel 3 chiffres (ex: 123)
- **Code postal** : N'importe lequel (ex: 75001)

### ❌ Paiement refusé
- **Numéro** : `4000 0000 0000 0002`

### 🔐 3D Secure (authentification)
- **Numéro** : `4000 0027 6000 3184`

Plus de cartes de test : https://stripe.com/docs/testing

## 📊 Consulter les paiements

Ouvrez `http://localhost:3000/admin.html` pour voir :
- Nombre total de paiements
- Tickets vendus
- Revenu total
- Liste complète des paiements
- Export CSV

## 🎯 Comment ça fonctionne

1. **Formulaire** : L'utilisateur remplit ses informations
2. **Redirection** : Il est redirigé vers Stripe Checkout (page sécurisée de Stripe)
3. **Paiement** : Il entre ses informations de carte sur Stripe
4. **Retour** : Après paiement, il revient sur `success.html`
5. **Sauvegarde** : Le paiement est enregistré dans `payments_database.json`

## ⚠️ Mode Test

**IMPORTANT** : Vous êtes en mode TEST
- Aucun argent réel n'est débité
- Utilisez uniquement les cartes de test Stripe
- Les paiements apparaissent dans votre Dashboard Stripe Test

## 🔄 Si vous n'installez pas Node.js

Le site fonctionne quand même en **mode simulation** :
- Ouvrez directement `index.html`
- Les paiements sont simulés
- Sauvegarde dans le localStorage du navigateur
- Consultez `admin.html` pour voir les paiements

## 🆘 Problèmes courants

### "npm n'est pas reconnu"
→ Node.js n'est pas installé ou le terminal n'a pas été redémarré

### "Cannot find module 'stripe'"
→ Lancez `npm install` dans le dossier du projet

### "Error: No such file or directory .env"
→ Le fichier `.env` existe déjà, vérifiez qu'il contient vos clés

### Le serveur ne démarre pas
→ Vérifiez que le port 3000 n'est pas déjà utilisé

## ✅ Checklist

- [x] Clés Stripe configurées dans `.env`
- [x] Clé publique dans `config.js`
- [ ] Node.js installé
- [ ] `npm install` exécuté
- [ ] `npm start` lancé
- [ ] Site accessible sur `http://localhost:3000`
- [ ] Test de paiement avec carte `4242 4242 4242 4242`

## 🎉 C'est prêt !

Une fois Node.js installé et le serveur lancé, votre site de billeterie est 100% fonctionnel avec Stripe Checkout !

Bonne chance pour votre tombola Tombobach ! 🎫✨
