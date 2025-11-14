# 🔧 Résoudre l'erreur 500/502 sur Render

## Problème
Vous voyez "Erreur de connexion" et "Impossible de se connecter (cookies non reçus)".

Cela signifie que **les variables d'environnement ne sont pas configurées** sur Render.

## ✅ Solution : Configurer les variables d'environnement

### Étape 1 : Vérifier l'endpoint de santé

D'abord, vérifiez la configuration :
```
https://votre-app.onrender.com/api/health
```

Cela vous dira si les variables sont configurées.

### Étape 2 : Ajouter les variables sur Render

1. **Aller sur votre dashboard Render** : [dashboard.render.com](https://dashboard.render.com)

2. **Sélectionner votre service** `shinobi-marchand`

3. **Cliquer sur "Environment"** dans le menu de gauche

4. **Ajouter ces 3 variables** :

   ```
   SHINOBI_LOGIN
   ```
   Valeur : `kamikaz` (votre login)

   ```
   SHINOBI_PASSWORD
   ```
   Valeur : `tagazokplop` (votre mot de passe)

   ```
   NODE_ENV
   ```
   Valeur : `production`

5. **Cliquer sur "Save Changes"**

6. **Render va redéployer automatiquement** (attendre 1-2 minutes)

### Étape 3 : Vérifier que ça fonctionne

1. Attendre que le déploiement soit terminé (statut "Live")
2. Rafraîchir votre page web
3. Les positions devraient maintenant s'afficher !

## 🔍 Vérification

Si ça ne fonctionne toujours pas :

1. **Vérifier les logs** :
   - Sur Render, cliquer sur "Logs"
   - Chercher les erreurs

2. **Vérifier l'endpoint de santé** :
   ```
   https://votre-app.onrender.com/api/health
   ```
   - Si `hasLogin: false` ou `hasPassword: false` → Les variables ne sont pas bien configurées
   - Vérifier qu'il n'y a pas d'espaces dans les valeurs

3. **Vérifier les credentials** :
   - Tester avec les mêmes identifiants en local
   - S'assurer qu'ils fonctionnent toujours

## ⚠️ Notes importantes

- Les variables sont **sensibles** - ne les partagez jamais publiquement
- Après avoir ajouté les variables, Render redéploie automatiquement
- Le premier chargement peut prendre 30-60 secondes (app qui se réveille)

