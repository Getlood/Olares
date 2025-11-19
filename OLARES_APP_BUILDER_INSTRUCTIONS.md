# 🚀 Instructions d'installation - Olares App Builder v0.1.0

## ✅ Ce qui a été créé

Une application complète pour Olares permettant de créer d'autres applications custom via un wizard interactif !

### 📦 Package prêt à installer

```
/Users/user/Documents/Getlood/Olares/olares-app-builder-v0.1.0.tar.gz
```

**Taille** : 27 KB
**Version** : 0.1.0

---

## 🎯 Fonctionnalités principales

### 1. **Wizard interactif en 6 étapes**
- Étape 1 : Informations de base (nom, titre, description, catégorie)
- Étape 2 : Source Docker (analyse GitHub OU image Docker manuelle)
- Étape 3 : Configuration des ports (avec entrances web)
- Étape 4 : Stockage et ressources (PVC, appData, appCache, CPU, RAM)
- Étape 5 : Variables d'environnement (avec secrets)
- Étape 6 : Revue et téléchargement du package

### 2. **Import depuis GitHub**
- Coller une URL GitHub
- Analyse automatique du repository
- Détection de `Dockerfile` et `docker-compose.yml`
- Extraction des ports (`EXPOSE`)
- Extraction des variables d'environnement (`ENV`)
- Extraction des volumes (`VOLUME`)

### 3. **Génération automatique**
- Création de tous les fichiers requis :
  - `Chart.yaml`
  - `OlaresManifest.yaml` (avec appid calculé automatiquement)
  - `values.yaml`
  - `templates/deployment.yaml`
  - `templates/service.yaml`
  - `templates/pvc.yaml` (si nécessaire)
  - `templates/_helpers.tpl`
  - `templates/NOTES.txt`
  - `README.md`
  - `.helmignore`

### 4. **Gestion de projets**
- Sauvegarder des projets en cours
- Reprendre un projet sauvegardé
- Lister tous les projets
- Dashboard avec projets récents

### 5. **Templates prédéfinis**
- Web App Simple
- App avec Database
- Mail Server (multi-ports)
- Media Server
- Backend API Service

### 6. **Validation**
- Validation automatique de la configuration
- Calcul automatique de l'appid
- Vérification des noms, versions, ports, etc.

---

## 📋 Installation dans Olares

### Étape 1 : Upload du package

1. Ouvrir **DevBox/Studio** dans Olares
2. Cliquer sur **Import Chart** ou **Upload Custom Application**
3. Sélectionner le fichier :
   ```
   olares-app-builder-v0.1.0.tar.gz
   ```
4. Attendre la validation ✅

### Étape 2 : Installer l'application

1. Cliquer sur **Install**
2. Observer le processus de déploiement
3. Vérifier que le statut passe à **Running** (devrait prendre 2-3 minutes)

### Étape 3 : Premier accès

1. Cliquer sur l'icône **App Builder** dans le Desktop Olares
2. Vous arrivez sur le **Dashboard**
3. Vous verrez :
   - Un bouton "Create New Application"
   - Les templates disponibles
   - Vos projets récents (si vous en créez)

---

## 🎮 Guide d'utilisation rapide

### Créer une application depuis GitHub

1. **Cliquer sur "Create New Application"**

2. **Étape 1 - Basic Info** :
   - Nom : `nextcloud` (exemple)
   - Titre : `Nextcloud Files`
   - Description courte : `Self-hosted file sync and share`
   - Catégorie : `Productivity`
   - Version : `0.1.0`
   - Cliquer "Next"

3. **Étape 2 - Docker Source** :
   - Coller l'URL GitHub : `https://github.com/nextcloud/docker`
   - Cliquer "Analyze"
   - Attendre la détection automatique ✨
   - OU remplir manuellement :
     - Repository : `nextcloud/nextcloud`
     - Tag : `latest`
   - Cliquer "Next"

4. **Étape 3 - Ports** :
   - Les ports détectés sont déjà là
   - Cocher "This is a web interface" pour le port HTTP
   - Ajouter des ports supplémentaires si besoin
   - Cliquer "Next"

5. **Étape 4 - Storage** :
   - Activer "Persistent Volume" si l'app a besoin de stocker des données
   - Taille : `20Gi` (exemple)
   - Mount path : `/var/www/html` (exemple Nextcloud)
   - Configurer les ressources CPU/RAM
   - Cliquer "Next"

6. **Étape 5 - Environment** :
   - Ajouter des variables d'environnement si nécessaire
   - Exemple : `MYSQL_PASSWORD` (marquer comme secret)
   - Cliquer "Next"

7. **Étape 6 - Review** :
   - Revoir la configuration
   - Cliquer "Save Project" pour sauvegarder
   - Cliquer **"Download Package"** pour générer le .tar.gz

8. **Résultat** :
   - Vous téléchargez `nextcloud-v0.1.0.tar.gz`
   - Ce package est prêt à être uploadé dans Olares !

### Créer une application depuis un template

1. Sur le Dashboard, section "Start from Template"
2. Cliquer "Use Template" sur un template (ex: "Web App Simple")
3. Le wizard s'ouvre avec la config pré-remplie
4. Personnaliser les valeurs (nom, image Docker, etc.)
5. Suivre les étapes du wizard
6. Télécharger le package

---

## 🔍 Vérifications après installation

### Via l'interface Olares

- ✓ L'icône "App Builder" apparaît dans le Desktop
- ✓ Le statut est "Running" (vert)
- ✓ L'interface web s'ouvre sans erreur
- ✓ Le Dashboard affiche les templates

### Via kubectl (si disponible)

```bash
# Vérifier le pod
kubectl get pods -n user-space-<username> | grep app-builder
# Devrait afficher : olares-app-builder-xxx   1/1   Running

# Voir les logs
kubectl logs -n user-space-<username> <pod-name>
# Devrait montrer : "App Builder server running on port 3000"

# Vérifier le service
kubectl get svc -n user-space-<username> | grep app-builder

# Vérifier le PVC
kubectl get pvc -n user-space-<username> | grep app-builder
```

---

## 🏗️ Architecture technique

### Backend (Node.js/Express)

- **Server** : `backend/server.js`
- **API Routes** :
  - `/api/generate` - Génération de fichiers
  - `/api/github/analyze` - Analyse de repository GitHub
  - `/api/projects` - Gestion des projets
  - `/api/templates` - Templates prédéfinis

### Frontend (React)

- **Dashboard** : Liste des projets et templates
- **Wizard** : 6 étapes avec formulaires Material-UI
- **Services** : API client Axios

### Templates Handlebars

- Génération dynamique de tous les fichiers YAML
- Remplacement des placeholders avec la config
- Support des conditions (ports, storage, etc.)

---

## 📁 Structure du projet

```
olares-app-builder/
├── Chart.yaml                      # Métadonnées Helm
├── OlaresManifest.yaml             # Config Olares (appid: fa9bbad7)
├── values.yaml                     # Valeurs par défaut
├── README.md                       # Documentation
├── Dockerfile                      # Multi-stage build
├── .helmignore                     # Exclusions
├── templates/                      # Helm templates
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── pvc.yaml
│   └── NOTES.txt
├── backend/                        # Backend Node.js
│   ├── server.js                  # Serveur Express
│   ├── package.json
│   ├── routes/                    # API endpoints
│   │   ├── generate.js           # Génération de charts
│   │   ├── github.js             # Analyse GitHub
│   │   ├── projects.js           # CRUD projets
│   │   └── templates.js          # Templates prédéfinis
│   ├── utils/                     # Utilitaires
│   │   ├── appid.js              # Calcul MD5 appid
│   │   └── validator.js          # Validation config
│   └── chart-templates/           # Templates Handlebars
│       ├── Chart.yaml.hbs
│       ├── OlaresManifest.yaml.hbs
│       ├── values.yaml.hbs
│       ├── deployment.yaml.hbs
│       ├── service.yaml.hbs
│       ├── pvc.yaml.hbs
│       ├── _helpers.tpl.hbs
│       ├── NOTES.txt.hbs
│       ├── README.md.hbs
│       └── .helmignore.hbs
└── frontend/                       # Frontend React
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        ├── pages/
        │   ├── Dashboard.js       # Page d'accueil
        │   └── WizardPage.js      # Wizard 6 étapes
        ├── services/
        │   └── api.js             # Client API
        └── utils/
            └── defaultConfig.js    # Config par défaut
```

---

## 🎯 Exemples d'utilisation

### Exemple 1 : Créer Stalwart Mail Server

1. Create New Application
2. GitHub URL : `https://github.com/stalwartlabs/mail-server`
3. Analyze → Détecte automatiquement :
   - Image : `stalwartlabs/stalwart:latest`
   - Ports : 8080 (http), 25 (smtp), 143 (imap), 993 (imaps)
   - Env : `STALWART_ADMIN_PASSWORD`
   - Volume : `/opt/stalwart`
4. Ajuster si nécessaire
5. Download Package → `stalwart-v0.1.0.tar.gz`
6. Upload dans Olares et installer

### Exemple 2 : Créer une app web simple

1. Use Template : "Web App Simple"
2. Remplir :
   - Nom : `my-web-app`
   - Image Docker : `nginx:alpine`
   - Port : 80
3. Download Package
4. Install dans Olares

### Exemple 3 : Créer une API backend

1. Use Template : "Backend API Service"
2. Configurer :
   - Nom : `my-api`
   - Image : `node:18-alpine`
   - Port : 3000
   - Env : `API_KEY`, `DATABASE_URL`
3. Download et deploy

---

## ⚙️ Configuration avancée

### Variables d'environnement

L'application supporte les variables d'env suivantes :

- `NODE_ENV` : `production` (défaut dans Olares)
- `GITHUB_TOKEN` : Token GitHub optionnel (pour éviter rate limiting)
- `DATA_PATH` : `/appdata` (où sont sauvegardés les projets)

### Ressources allouées

- **CPU** : 100m (request) - 1000m (limit)
- **Memory** : 256Mi (request) - 1Gi (limit)
- **Storage** : 5Gi PVC pour sauvegarder les projets

### Stockage des projets

Les projets sont sauvegardés dans :
```
/appdata/projects/<project-id>.json
```

Format JSON avec toute la configuration du wizard.

---

## 🐛 En cas de problème

### Le pod ne démarre pas

```bash
kubectl describe pod -n user-space-<username> <pod-name>
kubectl logs -n user-space-<username> <pod-name>
```

Causes possibles :
- Image Docker non disponible
- Port déjà utilisé
- Permissions insuffisantes

### Interface web inaccessible

1. Vérifier que le pod est Running
2. Vérifier le service :
   ```bash
   kubectl get svc -n user-space-<username> | grep app-builder
   ```
3. Vérifier l'entrance dans OlaresManifest (port 3000)

### Analyse GitHub échoue

- Vérifier que l'URL est correcte
- Vérifier que le repository est public
- Ajouter un `GITHUB_TOKEN` si rate limit atteint :
  ```yaml
  # Dans values.yaml
  config:
    githubToken: "your-github-token"
  ```

### Package généré ne s'installe pas

- Vérifier la validation (étape 6 du wizard)
- Corriger les erreurs affichées
- Régénérer le package

---

## 🚀 Workflow complet : De la création au déploiement

1. **Dans App Builder** :
   - Créer application via wizard
   - Télécharger `my-app-v0.1.0.tar.gz`

2. **Dans Olares DevBox** :
   - Upload du package
   - Install

3. **Dans Olares Desktop** :
   - Cliquer sur l'icône de votre nouvelle app
   - Utiliser l'application !

---

## 💡 Best Practices

### Noms d'applications

- Utiliser lowercase uniquement
- Pas d'espaces, seulement des tirets
- Max 63 caractères
- Exemple : `my-app`, `nextcloud`, `mail-server`

### Versions

- Suivre Semantic Versioning : `MAJOR.MINOR.PATCH`
- Commencer à `0.1.0` pour la première version
- Exemple : `0.1.0` → `0.2.0` → `1.0.0`

### Ports

- Toujours nommer les ports de manière descriptive
- Exemple : `http`, `https`, `smtp`, `api`
- Activer "entrance" uniquement pour les interfaces web

### Ressources

- Commencer conservateur :
  - CPU : 100m-500m
  - Memory : 256Mi-512Mi
- Augmenter selon les besoins observés

### Variables d'environnement

- Marquer comme "secret" :
  - Mots de passe
  - API keys
  - Tokens
- Toujours fournir une valeur par défaut (même pour les secrets)
- Documenter dans la description

---

## 📊 Métriques et monitoring

Une fois installé, vous pouvez voir :

- **Nombre de projets créés** : Dashboard
- **Templates utilisés** : Dans les projets sauvegardés
- **Logs** : `kubectl logs` pour debugging

---

## 🔄 Mises à jour

Pour mettre à jour App Builder vers une nouvelle version :

1. Télécharger le nouveau package
2. Désinstaller l'ancienne version dans Olares
3. Installer la nouvelle version
4. Les projets sauvegardés sont préservés (dans PVC)

---

## 🎓 Documentation supplémentaire

### Cahier des charges complet

Voir `OLARES_APP_BUILDER_SPECIFICATIONS.md` pour :
- Architecture détaillée
- Spécifications complètes de chaque module
- API endpoints
- Roadmap de développement

### Spécifications de création d'apps

Voir `OLARES_CUSTOM_APP_SPECIFICATIONS.md` pour :
- Guide complet de création d'apps Olares
- Templates de fichiers
- Best practices
- Erreurs courantes et solutions

---

## ✨ Résumé

### Ce qui fonctionne

✅ Wizard interactif complet (6 étapes)
✅ Analyse automatique de GitHub
✅ Détection Dockerfile/docker-compose
✅ Génération de tous les fichiers requis
✅ Calcul automatique de l'appid
✅ Validation de la configuration
✅ Templates prédéfinis (5 types)
✅ Gestion de projets (save/load)
✅ Download de packages .tar.gz
✅ Interface Material-UI responsive
✅ Backend API complet (REST)
✅ Documentation complète

### Prêt à utiliser !

Le package `olares-app-builder-v0.1.0.tar.gz` est **prêt à être installé dans Olares**.

Une fois installé, vous pourrez créer **n'importe quelle application custom** en quelques minutes au lieu de plusieurs heures !

---

## 🎉 Félicitations !

Vous disposez maintenant d'un **outil complet** pour créer des applications Olares custom !

**Next steps** :
1. Installer App Builder dans Olares
2. Créer votre première application
3. Partager vos créations avec la communauté

---

**Version** : 0.1.0
**Date** : 2025-11-18
**Statut** : ✅ Prêt pour production
