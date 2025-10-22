# Configuration de l'envoi d'emails

## 📧 Configuration Gmail (Recommandé)

Pour envoyer des emails de confirmation, vous devez configurer un compte Gmail :

### 1. Créer un mot de passe d'application Gmail

1. Allez sur votre compte Google : https://myaccount.google.com/
2. Cliquez sur "Sécurité" dans le menu de gauche
3. Activez la "Validation en deux étapes" si ce n'est pas déjà fait
4. Recherchez "Mots de passe des applications"
5. Créez un nouveau mot de passe d'application :
   - Sélectionnez "Autre (nom personnalisé)"
   - Nommez-le "Tombola Bachelor"
   - Copiez le mot de passe généré (16 caractères)

### 2. Modifier le fichier .env

Ouvrez le fichier `.env` et modifiez ces lignes :

```env
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application_16_caracteres
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**Exemple :**
```env
EMAIL_USER=tombola.bachelor@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 3. Redémarrer le serveur

Après avoir modifié le `.env`, redémarrez le serveur :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
node server.js
```

## ✅ Test de l'envoi d'emails

1. Faites un achat test sur le site
2. Vérifiez la console du serveur :
   - ✅ "Email de confirmation envoyé" = succès
   - ❌ "Erreur email" = problème de configuration
3. Vérifiez la boîte mail du client

## 🔧 Autres fournisseurs d'email

### Outlook / Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

## ⚠️ Important

- **Ne partagez JAMAIS votre fichier .env** (il contient vos mots de passe)
- Le fichier .env est déjà dans .gitignore
- Utilisez un mot de passe d'application, pas votre mot de passe Gmail principal
