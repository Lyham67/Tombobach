# 🎫 Tombobach - Site de Billeterie en Ligne

## La grande Tombola des Bachelor Arts et Métiers !

Site de billeterie moderne et fonctionnel avec système de paiement Stripe (mode test) et base de données intégrée.

## 🚀 Fonctionnalités

### ✨ Page d'accueil
- Hero section avec animation
- Design moderne et responsive
- Bouton d'appel à l'action

### 🎁 Section "Les lots à gagner"
- **3 cartes de lots principaux** personnalisables
- **Cliquez sur les images** pour uploader vos photos de lots
- **Cliquez sur les textes** pour modifier les titres et descriptions
- Bouton "Voir tous les lots" pour accéder à la galerie complète
- Les modifications sont sauvegardées automatiquement

### 🖼️ Galerie complète des lots
- **12 emplacements** pour tous vos lots
- Upload d'images par simple clic
- Titres éditables pour chaque lot
- Design en grille responsive

### 🎟️ Section Tickets avec 4 offres
1. **1 ticket** - 2€
2. **3 tickets** - 5€ (Populaire - Économisez 1€)
3. **5 tickets** - 8€ (Bon plan - Économisez 2€)
4. **10 tickets** - 15€ (Meilleure offre - Économisez 5€)

### 💳 Système de paiement Stripe (Mode Test)
- **Intégration Stripe complète** en mode test
- Formulaire avec Prénom, Nom, Email et Téléphone
- Élément de carte bancaire sécurisé Stripe
- **Mode simulation** si Stripe n'est pas configuré
- Validation et gestion des erreurs
- Confirmation de paiement

## 📦 Installation

### Mode Simple (Sans paiement réel)
1. Ouvrez `index.html` dans votre navigateur
2. Le site fonctionne en **mode simulation**
3. Les paiements sont enregistrés localement
4. Accédez à `admin.html` pour voir les paiements simulés

### Mode Complet (Avec Stripe)
1. **Installer Node.js** si ce n'est pas déjà fait
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Configurer Stripe** :
   - Créez un compte sur [Stripe](https://stripe.com)
   - Récupérez vos clés de test sur le [Dashboard Stripe](https://dashboard.stripe.com/test/apikeys)
   - Ouvrez le fichier `.env` et ajoutez vos clés :
     ```
     STRIPE_PUBLIC_KEY=pk_test_VOTRE_CLE_PUBLIQUE
     STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
     ```
   - Ouvrez `config.js` et ajoutez votre clé publique :
     ```javascript
     const STRIPE_CONFIG = {
         publicKey: 'pk_test_VOTRE_CLE_PUBLIQUE'
     };
     ```

4. **Démarrer le serveur** :
   ```bash
   npm start
   ```
5. Ouvrez `http://localhost:3000` dans votre navigateur

## 🎨 Personnalisation

### Modifier les lots
1. **Lots principaux** : Cliquez sur les 3 premières cartes pour uploader et modifier
2. **Tous les lots** : Descendez à la section "Tous les lots à gagner" (12 emplacements)
3. Cliquez sur les images pour les uploader
4. Cliquez sur les titres pour les modifier
5. Les changements sont sauvegardés automatiquement

### Modifier les couleurs
Éditez le fichier `styles.css` et modifiez les variables CSS au début :
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #7c3aed;
    --accent-color: #f59e0b;
}
```

## 📱 Responsive
Le site s'adapte automatiquement à tous les écrans :
- 💻 Desktop
- 📱 Tablette
- 📱 Mobile

## 🛠️ Technologies utilisées
- HTML5
- CSS3 (avec animations et gradients)
- JavaScript Vanilla
- **Stripe.js** (paiements sécurisés)
- **Node.js + Express** (serveur backend)
- **LocalStorage** (stockage local en mode simulation)
- Google Fonts (Poppins)

## 💾 Base de données

### Mode Simulation
- Les paiements sont stockés dans le **localStorage** du navigateur
- Accédez à `admin.html` pour consulter les paiements
- Les données persistent tant que vous ne videz pas le cache

### Mode Serveur
- Les paiements sont stockés dans `payments_database.json`
- Fichier JSON lisible et modifiable
- Sauvegarde automatique à chaque paiement
- API REST pour consulter les données

## 📊 Interface Admin

Accédez à l'interface d'administration : `admin.html`

### Fonctionnalités :
- ✅ **Statistiques en temps réel**
  - Nombre total de paiements
  - Tickets vendus
  - Revenu total
- ✅ **Liste complète des paiements**
  - Prénom, Nom, Email, Téléphone
  - Nombre de tickets et montant
  - Date et heure
  - Statut (Simulation / Réussi)
- ✅ **Export CSV**
  - Téléchargez toutes les données
  - Format compatible Excel
- ✅ **Actualisation automatique** toutes les 10 secondes

## 🧪 Tester les paiements Stripe

### Cartes de test Stripe :
- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0027 6000 3184`

**Date d'expiration** : N'importe quelle date future  
**CVC** : N'importe quel 3 chiffres  
**Code postal** : N'importe quel code

Plus d'infos : [Documentation Stripe](https://stripe.com/docs/testing)

## 📝 Structure des fichiers

```
site tombola/
├── index.html          # Page principale
├── admin.html          # Interface d'administration
├── styles.css          # Styles CSS
├── script.js           # JavaScript frontend
├── config.js           # Configuration Stripe (frontend)
├── server.js           # Serveur Node.js (backend)
├── package.json        # Dépendances Node.js
├── .env               # Clés Stripe (à configurer)
├── payments_database.json  # Base de données (créé automatiquement)
└── README.md          # Documentation
```

## 🚀 Déploiement

### Pour un site statique (mode simulation) :
- Hébergez sur **Netlify**, **Vercel**, ou **GitHub Pages**
- Seuls les fichiers HTML, CSS et JS sont nécessaires

### Pour un site complet (avec Stripe) :
- Hébergez sur **Heroku**, **Railway**, ou **Render**
- Configurez les variables d'environnement
- Déployez le serveur Node.js

## 🔒 Sécurité

- ✅ Clés Stripe dans fichier `.env` (non versionné)
- ✅ Clé secrète uniquement côté serveur
- ✅ Validation des paiements côté serveur
- ✅ Éléments de carte Stripe sécurisés
- ⚠️ **N'utilisez QUE les clés de test** pour ce projet

## 📞 Support

Pour toute question ou problème :
1. Consultez la [documentation Stripe](https://stripe.com/docs)
2. Vérifiez que vos clés sont correctement configurées
3. Consultez la console du navigateur pour les erreurs

## 🎉 Bonne chance pour votre tombola !

---

**Créé pour Tombobach - Bachelor Arts et Métiers 2025**  
**Mode test Stripe intégré - Aucun paiement réel**
