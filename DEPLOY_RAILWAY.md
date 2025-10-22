# 🚀 Déployer le backend sur Railway

## Étape 1 : Créer un compte Railway

1. Va sur https://railway.app
2. Clique sur "Start a New Project"
3. Connecte-toi avec GitHub

## Étape 2 : Déployer depuis GitHub

1. Clique sur "Deploy from GitHub repo"
2. Sélectionne ton repo `Tombobach`
3. Railway va détecter automatiquement Node.js

## Étape 3 : Configurer les variables d'environnement

1. Dans Railway, clique sur ton projet
2. Va dans l'onglet "Variables"
3. Ajoute ces variables :

```
STRIPE_PUBLIC_KEY=pk_test_51SKKby9939hQuArOW2s0kzvHxm6eM0PCFUfO340NHoPYFCX5naEnb6GVsFc65pSm8tWwP6IoYGSK1W7LnhzYF4SF0014ejUmLw
STRIPE_SECRET_KEY=sk_test_51SKKby9939hQuArODVIiqsRUGZJOkD3xFBC75fzzNyP5AX4Y9YNS7Xtzhk6bTdMzUIcoqvkzzrzE8n51ZBEslqUw00gLBMzv72
EMAIL_USER=bachelor.linternational@gmail.com
EMAIL_PASS=ton_mot_de_passe_application_gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

## Étape 4 : Récupérer l'URL du backend

1. Une fois déployé, Railway te donnera une URL comme :
   `https://tombobach-production.up.railway.app`
2. **Copie cette URL !**

## Étape 5 : Mettre à jour les fichiers frontend

Tu dois maintenant mettre à jour 3 fichiers avec l'URL Railway :

### 1. `script.js` (ligne 387)
```javascript
const response = await fetch('https://TON-URL-RAILWAY.up.railway.app/create-checkout-session', {
```

### 2. `success.html` (ligne 192)
```javascript
fetch('https://TON-URL-RAILWAY.up.railway.app/save-payment', {
```

### 3. `admin.html` (lignes 306 et 360)
```javascript
const response = await fetch('https://TON-URL-RAILWAY.up.railway.app/admin/stats');
// et
const response = await fetch('https://TON-URL-RAILWAY.up.railway.app/admin/payments');
```

## Étape 6 : Créer un fichier Procfile (optionnel)

Railway devrait détecter automatiquement, mais tu peux créer un fichier `Procfile` :

```
web: node server.js
```

## Étape 7 : Push les changements

```bash
git add .
git commit -m "Update backend URLs for Railway"
git push origin main
```

## ✅ Vérification

1. Ton backend est sur Railway : `https://ton-url.up.railway.app`
2. Ton frontend est sur GitHub Pages : `https://lyham67.github.io/Tombobach/`
3. Les deux communiquent ensemble !

## 🔧 Dépannage

- **Erreur CORS** : Vérifie que `server.js` a bien `app.use(cors())`
- **Erreur 500** : Vérifie les logs dans Railway
- **Email ne fonctionne pas** : Vérifie que tu as bien configuré le mot de passe d'application Gmail

## 💡 Alternative : Render

Si Railway ne fonctionne pas, tu peux aussi utiliser Render (gratuit) :
1. https://render.com
2. "New Web Service"
3. Connecte ton repo GitHub
4. Même configuration que Railway
