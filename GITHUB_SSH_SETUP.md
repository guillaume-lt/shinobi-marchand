# Configuration SSH pour GitHub

## ✅ Clé SSH créée !

Votre clé SSH a été générée avec succès. Voici comment l'ajouter à GitHub :

## 📋 Étape 1 : Copier votre clé publique

Votre clé publique est :
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILW800KCHmB1ghSHommMhx4cWY2FLiBPoGTMt1ImFSxM github-shinobi-marchand
```

**Pour la copier facilement :**
```bash
pbcopy < ~/.ssh/id_ed25519_github.pub
```
(Cela copie la clé dans votre presse-papiers)

## 🔑 Étape 2 : Ajouter la clé à GitHub

1. **Aller sur GitHub.com** et vous connecter
2. Cliquer sur votre **avatar** (en haut à droite) → **Settings**
3. Dans le menu de gauche : **SSH and GPG keys**
4. Cliquer sur **"New SSH key"**
5. Remplir le formulaire :
   - **Title** : `Shinobi Marchand` (ou un nom de votre choix)
   - **Key** : Coller la clé publique (celle ci-dessus, ou utiliser `Cmd+V` si vous avez fait `pbcopy`)
6. Cliquer sur **"Add SSH key"**

## ✅ Étape 3 : Tester la connexion

```bash
ssh -T git@github.com
```

Vous devriez voir :
```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

## 🚀 Étape 4 : Utiliser SSH avec votre repository

### Si vous créez un nouveau repo sur GitHub :

1. Créer le repository sur GitHub (sans initialiser avec README)
2. Utiliser l'URL SSH (commence par `git@github.com:`) :

```bash
git remote add origin git@github.com:votre-username/shinobi-marchand.git
git push -u origin main
```

### Si vous avez déjà un repo avec HTTPS :

```bash
# Voir l'URL actuelle
git remote -v

# Changer pour SSH
git remote set-url origin git@github.com:votre-username/shinobi-marchand.git

# Vérifier
git remote -v

# Tester
git push
```

## 📝 Notes

- ✅ La configuration SSH est déjà faite dans `~/.ssh/config`
- ✅ Vous n'aurez plus besoin de taper votre mot de passe
- ✅ Plus sécurisé que HTTPS avec token

## 🔧 Dépannage

**Erreur "Permission denied"** :
- Vérifier que la clé est bien ajoutée sur GitHub
- Tester : `ssh -T git@github.com`

**Erreur "Host key verification failed"** :
```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

