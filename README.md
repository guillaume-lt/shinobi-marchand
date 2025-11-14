# Shinobi NPC Positions Tracker

Application de suivi automatique des positions du marchand ambulant et du mineur dans le jeu Shinobi.fr.

## Fonctionnalités

- ✅ Mise à jour automatique toutes les heures (à l'heure pile, heure européenne)
- ✅ Cache intelligent pour éviter les appels API inutiles
- ✅ Interface moderne et responsive
- ✅ Affichage en temps réel du temps jusqu'à la prochaine mise à jour

## Installation locale

```bash
npm install
```

Créer un fichier `.env` :
```
SHINOBI_LOGIN=votre_login
SHINOBI_PASSWORD=votre_password
PORT=3000
NODE_ENV=production
```

Lancer le serveur :
```bash
npm start
```

## Déploiement

### Option 1 : Render (Recommandé - Gratuit)

1. **Créer un compte** sur [render.com](https://render.com)

2. **Créer un nouveau Web Service** :
   - Cliquer sur "New +" → "Web Service"
   - Connecter votre repository GitHub/GitLab
   - Ou utiliser "Public Git repository" et coller l'URL de votre repo

3. **Configuration** :
   - **Name** : `shinobi-marchand` (ou votre choix)
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Choisir "Free"

4. **Variables d'environnement** :
   - Cliquer sur "Environment"
   - Ajouter :
     - `SHINOBI_LOGIN` = votre login
     - `SHINOBI_PASSWORD` = votre mot de passe
     - `NODE_ENV` = `production`
     - `PORT` = laisser vide (Render définit automatiquement)

5. **Déployer** :
   - Cliquer sur "Create Web Service"
   - Attendre le déploiement (2-3 minutes)
   - Votre app sera disponible sur `https://votre-app.onrender.com`

### Option 2 : Railway (Gratuit avec crédits)

1. **Créer un compte** sur [railway.app](https://railway.app)

2. **Nouveau projet** :
   - Cliquer sur "New Project"
   - "Deploy from GitHub repo" (ou "Empty Project" puis upload)

3. **Configuration** :
   - Railway détecte automatiquement Node.js
   - Si besoin, définir :
     - **Start Command** : `npm start`

4. **Variables d'environnement** :
   - Onglet "Variables"
   - Ajouter :
     - `SHINOBI_LOGIN`
     - `SHINOBI_PASSWORD`
     - `NODE_ENV` = `production`

5. **Déployer** :
   - Railway déploie automatiquement
   - URL disponible dans l'onglet "Settings" → "Domains"

### Option 3 : Fly.io (Gratuit)

1. **Installer Fly CLI** :
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Se connecter** :
   ```bash
   fly auth login
   ```

3. **Créer l'app** :
   ```bash
   fly launch
   ```

4. **Configurer les secrets** :
   ```bash
   fly secrets set SHINOBI_LOGIN=votre_login
   fly secrets set SHINOBI_PASSWORD=votre_password
   fly secrets set NODE_ENV=production
   ```

5. **Déployer** :
   ```bash
   fly deploy
   ```

## Notes importantes

- ⚠️ **Gratuit mais avec limitations** :
  - Render : App peut "s'endormir" après 15 min d'inactivité (premier chargement lent)
  - Railway : 500 heures/mois gratuites
  - Fly.io : 3 VMs gratuites

- 🔒 **Sécurité** : Ne jamais commiter le fichier `.env` (déjà dans `.gitignore`)

- 📝 **Pour éviter l'endormissement sur Render** :
  - Utiliser un service de monitoring gratuit (UptimeRobot, cron-job.org)
  - Configurer un ping toutes les 5 minutes sur votre URL

## Structure du projet

```
shinobi-marchand/
├── server.js          # Serveur Express avec API
├── index.html         # Interface utilisateur
├── package.json       # Dépendances
├── .env              # Variables d'environnement (non commité)
└── .gitignore        # Fichiers à ignorer
```

## API Endpoints

- `GET /` - Interface web
- `GET /api/positions` - Récupère toutes les positions (depuis le cache)
- `GET /api/marchand-position` - Position du marchand
- `GET /api/mineur-position` - Position du mineur

