# 🚀 Guide de déploiement complet

## ⚠️ IMPORTANT : Pourquoi ça ne marche pas actuellement ?

GitHub Pages ne peut **PAS** exécuter de serveur Node.js. Il faut déployer le backend séparément.

## 📋 Architecture :

- **Frontend** (HTML/CSS/JS) → GitHub Pages ✅
- **Backend** (Node.js/Stripe) → Railway/Render ❌ (à faire)

---

## 🚀 Étape 1 : Déployer le backend sur Railway

### 1.1 Créer un compte
1. Va sur https://railway.app
2. Connecte-toi avec GitHub

### 1.2 Créer un nouveau projet
1. Clique sur "New Project"
2. Sélectionne "Deploy from GitHub repo"
3. Choisis `Tombobach`
4. Railway va détecter automatiquement Node.js

### 1.3 Configurer les variables d'environnement
Dans Railway, va dans "Variables" et ajoute :

```
STRIPE_PUBLIC_KEY=ta_clé_publique_stripe_réelle
STRIPE_SECRET_KEY=ta_clé_secrète_stripe_réelle
EMAIL_USER=bachelor.linternational@gmail.com
EMAIL_PASS=ton_mot_de_passe_application_gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 1.4 Récupérer l'URL Railway
Une fois déployé, Railway te donnera une URL comme :
```
https://tombobach-production.up.railway.app
```

**COPIE CETTE URL !**

---

## 🔧 Étape 2 : Mettre à jour le fichier api-config.js

1. Ouvre le fichier `api-config.js`
2. Remplace `https://TON-URL-RAILWAY.up.railway.app` par ton URL Railway
3. Exemple :
```javascript
const API_URL = 'https://tombobach-production.up.railway.app';
```

---

## 📤 Étape 3 : Upload sur GitHub

1. Va sur https://github.com/Lyham67/Tombobach
2. Upload/Modifie ces fichiers :
   - `api-config.js` (avec la vraie URL Railway)
   - `index.html`
   - `script.js`
   - `success.html`
   - `admin.html`
   - `bachelocurieux.html`

---

## ✅ Étape 4 : Tester

1. **Frontend** : https://lyham67.github.io/Tombobach/
2. **Backend** : https://ton-url-railway.up.railway.app
3. **Test paiement** : Clique sur une formule et teste !

---

## 🔐 Cartes de test Stripe

Si tu utilises encore le mode test :
- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- Date : n'importe quelle date future
- CVC : n'importe quel 3 chiffres

---

## 🆘 Problèmes courants

### Erreur 405 Not Allowed
→ Le backend n'est pas déployé ou l'URL dans `api-config.js` est incorrecte

### Erreur CORS
→ Vérifie que `server.js` a bien `app.use(cors())`

### Email ne fonctionne pas
→ Configure un mot de passe d'application Gmail (voir CONFIG_EMAIL.md)

---

## 📞 Support

Si ça ne marche toujours pas, vérifie :
1. Railway est bien déployé (vert)
2. L'URL dans `api-config.js` est correcte
3. Les variables d'environnement sont bien configurées
4. Les fichiers sont bien uploadés sur GitHub
