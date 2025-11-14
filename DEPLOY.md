# Guide de déploiement rapide

## 🚀 Déploiement sur Render (Recommandé - Le plus simple)

### Étape 1 : Préparer votre code
```bash
# Initialiser git si pas déjà fait
git init
git add .
git commit -m "Initial commit"

# Créer un repository sur GitHub
# Puis :
git remote add origin https://github.com/votre-username/shinobi-marchand.git
git push -u origin main
```

### Étape 2 : Déployer sur Render

1. **Aller sur** [render.com](https://render.com) et créer un compte (gratuit)

2. **Créer un nouveau Web Service** :
   - Cliquer sur "New +" → "Web Service"
   - Connecter votre compte GitHub
   - Sélectionner votre repository `shinobi-marchand`

3. **Configuration** :
   ```
   Name: shinobi-marchand
   Region: Frankfurt (ou le plus proche de vous)
   Branch: main
   Root Directory: (laisser vide)
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Variables d'environnement** (très important !) :
   - Cliquer sur "Environment" dans le menu de gauche
   - Ajouter ces variables :
     ```
     SHINOBI_LOGIN = kamikaz
     SHINOBI_PASSWORD = tagazokplop
     NODE_ENV = production
     ```
   - ⚠️ **Ne pas** ajouter PORT (Render le définit automatiquement)

5. **Déployer** :
   - Cliquer sur "Create Web Service"
   - Attendre 2-3 minutes pour le build
   - Votre app sera disponible sur : `https://shinobi-marchand.onrender.com`

### Étape 3 : Éviter l'endormissement (optionnel mais recommandé)

Render endort les apps gratuites après 15 min d'inactivité. Pour éviter ça :

1. **Utiliser UptimeRobot** (gratuit) :
   - Aller sur [uptimerobot.com](https://uptimerobot.com)
   - Créer un compte
   - "Add New Monitor"
   - Type: HTTP(s)
   - URL: votre URL Render
   - Monitoring Interval: 5 minutes
   - Cela gardera votre app active

## 🚂 Alternative : Railway

1. **Aller sur** [railway.app](https://railway.app)

2. **Nouveau projet** → "Deploy from GitHub repo"

3. **Variables d'environnement** :
   - Onglet "Variables"
   - Ajouter : `SHINOBI_LOGIN`, `SHINOBI_PASSWORD`, `NODE_ENV=production`

4. **Déployer** : Automatique après connexion du repo

## ✅ Vérification

Une fois déployé, vérifier que :
- ✅ L'app se charge sans erreur
- ✅ Les positions s'affichent
- ✅ Le statut montre la prochaine mise à jour

## 🔧 Dépannage

**Erreur "Cannot find module"** :
- Vérifier que `package.json` contient toutes les dépendances
- Vérifier que le build command est `npm install`

**Erreur de connexion** :
- Vérifier que les variables d'environnement sont bien définies
- Vérifier les credentials dans `.env` (local) ou dans les variables d'environnement (production)

**App qui s'endort** :
- Utiliser UptimeRobot ou similaire pour ping régulier
- Ou passer sur Railway/Fly.io qui n'ont pas ce problème

