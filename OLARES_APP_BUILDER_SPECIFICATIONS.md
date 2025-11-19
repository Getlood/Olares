# Cahier des Charges - Olares App Builder

## 📋 Vue d'ensemble du projet

### Objectif
Créer une application web interactive pour Olares OS permettant de générer automatiquement des charts Helm d'applications custom à partir d'un dépôt GitHub et d'un formulaire guidé.

### Problème résolu
Actuellement, créer une application custom Olares nécessite :
- Connaissance approfondie de Helm et Kubernetes
- Compréhension des spécificités Olares (OlaresManifest, appid, etc.)
- Création manuelle de multiples fichiers YAML
- Risque d'erreurs de configuration

**Solution** : Un assistant formulaire qui automatise tout le processus.

---

## 🎯 Fonctionnalités principales

### 1. Assistant de création par formulaire

Interface web en plusieurs étapes (wizard) permettant de :
- Importer depuis un dépôt GitHub
- Configurer automatiquement les paramètres
- Générer le chart complet
- Packager et exporter

### 2. Import depuis GitHub

- Analyser un dépôt GitHub
- Détecter automatiquement :
  - Dockerfile ou image Docker utilisée
  - Ports exposés
  - Variables d'environnement
  - Volumes nécessaires
  - Dépendances (databases, etc.)

### 3. Génération automatique

- Créer tous les fichiers requis (Chart.yaml, OlaresManifest.yaml, etc.)
- Calculer automatiquement l'appid
- Valider la configuration
- Packager en .tar.gz prêt à uploader

### 4. Templates et présets

- Templates pour types d'apps courants
- Présets de configuration
- Bibliothèque d'exemples

---

## 👥 Utilisateurs cibles

### Profil primaire : Développeur débutant Olares
- Connaissance basique de Docker
- Peu ou pas d'expérience Kubernetes/Helm
- Veut déployer son app sur Olares rapidement

### Profil secondaire : Développeur expérimenté
- Connaît Kubernetes/Helm
- Veut gagner du temps sur les spécificités Olares
- Cherche à standardiser ses charts

---

## 🔧 Architecture technique

### Stack technologique proposée

#### Frontend
- **Framework** : React ou Vue.js
- **UI Library** : Material-UI ou Ant Design
- **Form Management** : Formik ou React Hook Form
- **State Management** : Redux ou Zustand
- **HTTP Client** : Axios

#### Backend
- **Runtime** : Node.js
- **Framework** : Express.js ou Fastify
- **Template Engine** : Handlebars ou EJS (pour générer YAML)
- **GitHub API** : Octokit
- **YAML Parser** : js-yaml
- **Package Generation** : tar-stream

#### Déploiement Olares
- Image Docker : Alpine + Node.js
- Port : 3000 (frontend + backend)
- Stockage : appData pour sauvegarder projets
- Permissions : Aucune permission spéciale requise

---

## 📐 Spécifications fonctionnelles détaillées

### Module 1 : Interface d'accueil

#### Écran : Dashboard

**Éléments** :
- Bouton principal : "Créer une nouvelle application"
- Liste des projets en cours (si sauvegardés)
- Exemples et templates prédéfinis
- Lien vers documentation

**Actions** :
- Cliquer "Créer nouvelle app" → Wizard étape 1
- Cliquer sur projet existant → Reprendre édition
- Cliquer sur template → Dupliquer et éditer

---

### Module 2 : Wizard de création (6 étapes)

#### Étape 1 : Informations de base

**Champs** :

| Champ | Type | Requis | Validation | Aide |
|-------|------|--------|------------|------|
| Nom de l'application | text | ✓ | lowercase, alphanumeric, max 63 chars | Le nom technique (ex: `nextcloud`, `wordpress`) |
| Titre affiché | text | ✓ | max 100 chars | Le nom visible dans Olares (ex: "Nextcloud Files") |
| Description courte | text | ✓ | max 200 chars | Une ligne descriptive |
| Description complète | textarea | ✓ | markdown | Description détaillée avec formatage |
| Catégorie | select | ✓ | enum | Utilities, Productivity, Social, etc. |
| Icône | url | ✓ | valid URL | URL vers SVG ou PNG (recommandé: SVG) |
| Version | text | ✓ | semver | Version initiale (ex: 0.1.0) |

**Calcul automatique** :
- `appid` : Calculé automatiquement à partir du nom
- Affichage : "Votre appid sera : `e51f5a8f`"

**Validation** :
- Nom unique (vérifier qu'il n'existe pas déjà)
- URL icône accessible
- Format semver valide

**Boutons** :
- "Suivant" → Étape 2

---

#### Étape 2 : Source Docker

**Méthode 1 : Depuis Docker Hub**

| Champ | Type | Requis | Exemple |
|-------|------|--------|---------|
| Repository Docker | text | ✓ | `stalwartlabs/stalwart` |
| Tag | text | ✓ | `latest` ou `1.2.3` |

**Actions** :
- Bouton "Vérifier" → Appel API Docker Hub pour valider
- Si OK → Afficher infos (taille, dernière mise à jour, etc.)

**Méthode 2 : Depuis GitHub Repository**

| Champ | Type | Requis | Exemple |
|-------|------|--------|---------|
| URL GitHub | text | ✓ | `https://github.com/owner/repo` |
| Branche | text | - | `main` (défaut) |

**Actions** :
- Bouton "Analyser" → Scan du repo
- Détection automatique :
  - Recherche de `Dockerfile`
  - Recherche de `docker-compose.yml`
  - Extraction de l'image si référencée
  - Si Dockerfile trouvé → Option "Build image" ou "Use existing"

**Résultat** :
```
✓ Image détectée : namespace/image:tag
✓ Dockerfile trouvé : /Dockerfile
✓ Ports détectés : 8080, 25, 143, 993
✓ Variables d'env détectées : ADMIN_PASSWORD, LOG_LEVEL
```

**Boutons** :
- "Retour" → Étape 1
- "Suivant" → Étape 3

---

#### Étape 3 : Configuration des ports

**Interface** : Tableau dynamique

| Port Name | Container Port | Protocol | Type | Description |
|-----------|----------------|----------|------|-------------|
| http | 8080 | TCP | Web UI | Interface web admin |
| smtp | 25 | TCP | Network | Mail sending |
| ... | ... | ... | ... | ... |

**Actions** :
- Bouton "Ajouter port" → Nouvelle ligne
- Bouton "Supprimer" sur chaque ligne
- Auto-détection depuis Dockerfile `EXPOSE`

**Champs par port** :

| Champ | Type | Requis | Validation |
|-------|------|--------|------------|
| Nom | text | ✓ | lowercase, alpha, max 15 chars |
| Port | number | ✓ | 1-65535 |
| Protocole | select | ✓ | TCP / UDP |
| Type | select | ✓ | Web UI / Network / Internal |
| Description | text | - | max 100 chars |

**Entrances (accès web)** :

Option : "Ce port est une interface web accessible"
- Si cochée → Créer une entrance dans OlaresManifest
- Champs additionnels :
  - Titre entrance (ex: "Admin Panel")
  - Niveau d'auth : Private / Public

**Validation** :
- Pas de ports dupliqués
- Au moins un port défini
- Si "Web UI" → Au moins une entrance

**Boutons** :
- "Retour" → Étape 2
- "Suivant" → Étape 4

---

#### Étape 4 : Stockage et volumes

**Section 1 : Stockage persistant (PVC)**

Option : "Cette application nécessite un stockage persistant"

Si cochée :

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| Taille | text | ✓ | 10Gi |
| Chemin de montage | text | ✓ | `/data` |
| Description | text | - | Données applicatives |

**Auto-détection** :
- Scan Dockerfile pour `VOLUME` directives
- Proposition de chemins courants : `/data`, `/var/lib/app`, `/opt/app`

**Section 2 : Volumes Olares**

**appData** :
- [ ] Utiliser appData
- Chemin de montage : `/appdata` (défaut)
- Usage : Configuration et métadonnées

**appCache** :
- [ ] Utiliser appCache
- Chemin de montage : `/appcache` (défaut)
- Usage : Cache temporaire

**Section 3 : Volumes additionnels (avancé)**

Tableau dynamique pour volumes custom (hostPath, configMap, secret, etc.)

**Boutons** :
- "Retour" → Étape 3
- "Suivant" → Étape 5

---

#### Étape 5 : Variables d'environnement et configuration

**Section 1 : Variables d'environnement**

Tableau dynamique :

| Nom variable | Valeur par défaut | Type | Secret | Description |
|--------------|-------------------|------|--------|-------------|
| ADMIN_PASSWORD | changeme123 | string | ✓ | Mot de passe admin |
| LOG_LEVEL | info | select | - | Niveau de log |

**Actions** :
- Auto-détection depuis Dockerfile `ENV`
- Bouton "Ajouter variable"
- Types : string, number, boolean, select
- Option "Secret" → Masquer dans UI et values.yaml

**Section 2 : Ressources**

| Ressource | Minimum (requests) | Maximum (limits) |
|-----------|-------------------|------------------|
| CPU | 100m | 1000m |
| Mémoire | 256Mi | 1Gi |

**Aide** :
- Slider avec suggestions selon type d'app
- Presets : "Light", "Medium", "Heavy"

**Section 3 : Configuration avancée**

Accordion replié par défaut :
- **Probes de santé** :
  - Liveness probe (type: TCP/HTTP/Exec)
  - Readiness probe (type: TCP/HTTP/Exec)
  - Délais et intervalles
- **Security Context** :
  - runAsUser, runAsGroup
  - fsGroup
  - Capabilities
- **Init Containers** :
  - Ajouter init containers si nécessaire

**Boutons** :
- "Retour" → Étape 4
- "Suivant" → Étape 6

---

#### Étape 6 : Revue et génération

**Interface** : 3 colonnes

**Colonne 1 : Résumé de la configuration**

```
✓ Application : Stalwart Mail Server
✓ Image : stalwartlabs/stalwart:latest
✓ Ports : 4 (http, smtp, imap, imaps)
✓ Stockage : 10Gi PVC + appData + appCache
✓ Variables : 2 env vars
✓ Ressources : 256Mi-1Gi RAM, 100m-1000m CPU
```

**Colonne 2 : Aperçu des fichiers**

Onglets :
- Chart.yaml
- OlaresManifest.yaml
- values.yaml
- deployment.yaml
- service.yaml
- pvc.yaml (si applicable)
- README.md
- NOTES.txt

**Affichage** : Code YAML avec syntax highlighting

**Actions** :
- Bouton "Éditer" sur chaque onglet → Modal avec éditeur de code
- Bouton "Réinitialiser" → Revenir à l'auto-généré

**Colonne 3 : Validation**

Checklist automatique :

```
✓ Nom cohérent partout
✓ appid calculé : e51f5a8f
✓ Image Docker vérifiée
✓ Ports valides
✓ Entrances configurées
✓ Ressources définies
✓ Templates valides (Helm lint)
⚠ Avertissement : Mot de passe par défaut présent
```

**Actions** :
- Bouton "Valider" → Helm lint des templates
- Affichage des erreurs/warnings si présents

**Boutons finaux** :
- "Retour" → Étape 5
- "Sauvegarder projet" → Enregistrer dans appData
- "Télécharger .tar.gz" → Package Helm
- "Déployer directement" → Install dans Olares (si permissions)

---

### Module 3 : Génération et export

#### Fonction : Génération des fichiers

**Backend API** : `POST /api/generate`

**Input** : JSON avec toute la configuration du wizard

**Process** :
1. Valider les données (schéma Joi ou Zod)
2. Générer chaque fichier depuis templates Handlebars
3. Calculer appid (MD5)
4. Remplacer les placeholders
5. Valider YAML (js-yaml parse)
6. Créer arborescence en mémoire

**Output** : Objet avec tous les fichiers

```json
{
  "files": {
    "Chart.yaml": "apiVersion: v2\n...",
    "OlaresManifest.yaml": "olaresManifest.version: '0.9.0'\n...",
    "values.yaml": "image:\n  repository: ...",
    "templates/_helpers.tpl": "{{/*\nExpand...",
    "templates/deployment.yaml": "apiVersion: apps/v1\n...",
    "templates/service.yaml": "apiVersion: v1\n...",
    "templates/pvc.yaml": "apiVersion: v1\n...",
    "templates/NOTES.txt": "Thank you...",
    "README.md": "# App Name\n...",
    ".helmignore": "*.md\n..."
  }
}
```

#### Fonction : Packaging

**Backend API** : `POST /api/package`

**Input** : Fichiers générés

**Process** :
1. Créer structure de dossiers temporaire
2. Écrire tous les fichiers
3. Exécuter `helm package <dir>/`
4. Renommer selon convention : `<app-name>-v<version>.tar.gz`
5. Retourner le fichier binaire

**Output** : Fichier .tar.gz (stream)

**Frontend** :
- Téléchargement automatique du fichier
- Notification : "Package créé : stalwart-v0.1.0.tar.gz (4.1 KB)"

---

### Module 4 : Gestion des projets

#### Fonctionnalités

**Sauvegarde** :
- Sauvegarder projet en cours dans appData
- Format : JSON avec toute la config
- Nom de fichier : `<app-name>-project.json`

**Chargement** :
- Reprendre un projet sauvegardé
- Pré-remplir le wizard avec les données

**Export/Import** :
- Exporter projet en JSON
- Importer projet depuis JSON
- Partager projets entre utilisateurs

**Historique** :
- Versioning des projets
- Comparaison entre versions
- Rollback possible

---

### Module 5 : Templates et présets

#### Bibliothèque de templates

**Templates prédéfinis** :

1. **Web App Simple**
   - 1 port HTTP
   - Pas de stockage persistant
   - Config minimale

2. **App avec Database**
   - Port HTTP + port DB
   - PVC pour données
   - Variables de connexion DB

3. **Mail Server**
   - Multiples ports (SMTP, IMAP, etc.)
   - Stockage important
   - Config réseau

4. **Media Server**
   - Port HTTP
   - Gros stockage
   - Ressources élevées

5. **Service Backend (API)**
   - Port custom
   - Pas d'entrance (internal)
   - Monitoring activé

**Format template** :

```json
{
  "name": "Web App Simple",
  "description": "Application web avec interface HTTP simple",
  "icon": "https://...",
  "preset": {
    "ports": [
      { "name": "http", "containerPort": 80, "protocol": "TCP", "type": "web" }
    ],
    "resources": {
      "requests": { "cpu": "100m", "memory": "128Mi" },
      "limits": { "cpu": "500m", "memory": "512Mi" }
    },
    "persistence": {
      "enabled": false
    }
  }
}
```

**Actions** :
- Parcourir templates
- Aperçu
- Utiliser (pré-remplir wizard)
- Créer template custom depuis projet existant

---

### Module 6 : Intégration GitHub

#### Fonctionnalité : Analyse de repository

**API Backend** : `POST /api/github/analyze`

**Input** :
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "branch": "main"
}
```

**Process** :
1. Parser URL pour extraire owner/repo
2. Appel GitHub API (Octokit) :
   - GET `/repos/{owner}/{repo}` (infos générales)
   - GET `/repos/{owner}/{repo}/contents/Dockerfile` (si existe)
   - GET `/repos/{owner}/{repo}/contents/docker-compose.yml` (si existe)
   - GET `/repos/{owner}/{repo}/readme` (pour description)

3. Parser Dockerfile pour extraire :
   - Image de base (`FROM`)
   - Ports exposés (`EXPOSE`)
   - Variables d'env (`ENV`)
   - Volumes (`VOLUME`)
   - Commande de démarrage (`CMD` / `ENTRYPOINT`)

4. Parser docker-compose.yml pour extraire :
   - Image
   - Ports mapping
   - Volumes
   - Environment variables
   - Depends_on (détection dépendances)

**Output** :
```json
{
  "repository": {
    "name": "stalwart",
    "description": "Modern email server",
    "language": "Rust",
    "stars": 1234,
    "license": "AGPL-3.0"
  },
  "docker": {
    "image": "stalwartlabs/stalwart:latest",
    "ports": [
      { "container": 8080, "name": "http" },
      { "container": 25, "name": "smtp" },
      { "container": 143, "name": "imap" },
      { "container": 993, "name": "imaps" }
    ],
    "env": [
      { "name": "STALWART_ADMIN_PASSWORD", "default": "changeme123" },
      { "name": "LOG_LEVEL", "default": "info" }
    ],
    "volumes": [
      { "path": "/opt/stalwart", "description": "Application data" }
    ]
  }
}
```

**Utilisation** :
- Pré-remplir automatiquement les étapes 2, 3, 4, 5 du wizard

---

### Module 7 : Validation et tests

#### Validation Helm

**API Backend** : `POST /api/validate`

**Process** :
1. Générer fichiers temporaires
2. Exécuter `helm lint <dir>/`
3. Parser output
4. Retourner erreurs/warnings

**Output** :
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Chart.yaml: icon should be an URL"
  ]
}
```

#### Tests de déploiement (simulation)

**API Backend** : `POST /api/test-deploy`

**Process** :
1. Générer templates avec `helm template`
2. Valider YAML Kubernetes
3. Vérifier :
   - Labels et selectors cohérents
   - Références de ports correctes
   - Montages de volumes valides
   - Resources définies

**Output** :
```json
{
  "deployable": true,
  "checks": {
    "labels": "✓ Cohérents",
    "ports": "✓ Tous référencés",
    "volumes": "✓ Correctement montés",
    "resources": "✓ Définis"
  },
  "warnings": []
}
```

---

## 🎨 Spécifications UI/UX

### Design System

**Palette de couleurs** :
- Primaire : Bleu Olares (#0066CC)
- Secondaire : Gris (#6B7280)
- Succès : Vert (#10B981)
- Avertissement : Jaune (#F59E0B)
- Erreur : Rouge (#EF4444)

**Typographie** :
- Titres : Inter, Bold
- Corps : Inter, Regular
- Code : JetBrains Mono

**Composants** :
- Boutons : Material Design
- Inputs : Avec validation inline
- Tooltips : Sur tous les champs avec aide contextuelle
- Loaders : Pendant analyse GitHub, génération

### Navigation

**Wizard** :
- Stepper en haut (6 étapes)
- Indicateur de progression
- Possibilité de revenir en arrière
- Sauvegarde auto toutes les 30 secondes

**Responsivité** :
- Desktop : Layout 2 colonnes (formulaire + aperçu)
- Tablet : Layout 1 colonne avec onglets
- Mobile : Wizard simplifié

### Feedback utilisateur

**Messages de succès** :
- Toast notification en haut à droite
- Animation de confirmation
- Lien vers action suivante

**Messages d'erreur** :
- Inline sous le champ concerné
- Toast pour erreurs globales
- Suggestions de correction

**Aide contextuelle** :
- Icône "?" à côté de chaque champ
- Popover avec explication détaillée
- Exemples concrets
- Liens vers documentation

---

## 📊 Modèle de données

### Structure du projet sauvegardé

```json
{
  "projectId": "uuid-v4",
  "createdAt": "2025-11-18T10:30:00Z",
  "updatedAt": "2025-11-18T10:35:00Z",
  "version": "1.0",

  "metadata": {
    "name": "stalwart",
    "appid": "e51f5a8f",
    "title": "Stalwart Mail Server",
    "description": "Modern all-in-one email server",
    "descriptionLong": "Full markdown description...",
    "category": "Utilities",
    "icon": "https://...",
    "version": "0.1.0",
    "maintainer": {
      "name": "community",
      "email": ""
    }
  },

  "docker": {
    "repository": "stalwartlabs/stalwart",
    "tag": "latest",
    "pullPolicy": "IfNotPresent",
    "source": {
      "type": "dockerhub",
      "url": "https://hub.docker.com/r/stalwartlabs/stalwart"
    }
  },

  "ports": [
    {
      "name": "http",
      "containerPort": 8080,
      "protocol": "TCP",
      "type": "web",
      "description": "Web admin interface",
      "entrance": {
        "enabled": true,
        "title": "Stalwart Admin",
        "authLevel": "private"
      }
    },
    {
      "name": "smtp",
      "containerPort": 25,
      "protocol": "TCP",
      "type": "network",
      "description": "SMTP server"
    }
  ],

  "storage": {
    "pvc": {
      "enabled": true,
      "size": "10Gi",
      "mountPath": "/opt/stalwart",
      "storageClass": ""
    },
    "appData": {
      "enabled": true,
      "mountPath": "/appdata"
    },
    "appCache": {
      "enabled": true,
      "mountPath": "/appcache"
    },
    "customVolumes": []
  },

  "environment": [
    {
      "name": "STALWART_ADMIN_PASSWORD",
      "value": "changeme123",
      "type": "string",
      "secret": true,
      "description": "Admin password"
    },
    {
      "name": "LOG_LEVEL",
      "value": "info",
      "type": "select",
      "options": ["debug", "info", "warn", "error"],
      "description": "Log verbosity"
    }
  ],

  "resources": {
    "requests": {
      "cpu": "100m",
      "memory": "256Mi"
    },
    "limits": {
      "cpu": "1000m",
      "memory": "1Gi"
    }
  },

  "probes": {
    "liveness": {
      "enabled": true,
      "type": "tcpSocket",
      "port": "http",
      "initialDelaySeconds": 30,
      "periodSeconds": 10
    },
    "readiness": {
      "enabled": true,
      "type": "tcpSocket",
      "port": "http",
      "initialDelaySeconds": 10,
      "periodSeconds": 5
    }
  },

  "advanced": {
    "securityContext": null,
    "initContainers": [],
    "annotations": {},
    "labels": {}
  }
}
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Projects
```
GET    /api/projects              # Liste tous les projets
POST   /api/projects              # Créer nouveau projet
GET    /api/projects/:id          # Récupérer un projet
PUT    /api/projects/:id          # Mettre à jour projet
DELETE /api/projects/:id          # Supprimer projet
POST   /api/projects/:id/export   # Exporter en JSON
POST   /api/projects/import       # Importer depuis JSON
```

### GitHub
```
POST   /api/github/analyze        # Analyser un repo
GET    /api/github/search         # Rechercher repos
```

### Docker
```
POST   /api/docker/verify         # Vérifier image existe
GET    /api/docker/tags/:image    # Lister tags disponibles
```

### Generation
```
POST   /api/generate              # Générer fichiers chart
POST   /api/validate              # Valider configuration
POST   /api/package               # Packager en .tar.gz
POST   /api/test-deploy           # Test simulation
```

### Templates
```
GET    /api/templates             # Liste templates
GET    /api/templates/:id         # Récupérer template
POST   /api/templates             # Créer template custom
```

---

## 🧪 Plan de tests

### Tests unitaires

**Backend** :
- Génération de chaque fichier (Chart.yaml, OlaresManifest.yaml, etc.)
- Calcul appid (MD5)
- Validation YAML
- Parsing Dockerfile
- Parsing docker-compose.yml

**Frontend** :
- Validation formulaires
- Calcul automatique de valeurs
- Navigation wizard
- Sauvegarde/chargement projet

### Tests d'intégration

- Import depuis GitHub → Génération → Package
- Création complète via wizard → Export → Import
- Validation Helm lint sur fichiers générés

### Tests E2E

**Scénarios** :

1. **Happy path complet** :
   - Créer nouvelle app
   - Remplir wizard (6 étapes)
   - Générer chart
   - Télécharger package
   - Vérifier intégrité .tar.gz

2. **Import GitHub** :
   - Coller URL GitHub
   - Analyse automatique
   - Vérifier pré-remplissage
   - Ajuster config
   - Générer

3. **Utiliser template** :
   - Sélectionner "Web App Simple"
   - Personnaliser
   - Générer
   - Comparer avec template original

4. **Erreurs de validation** :
   - Nom invalide → Afficher erreur
   - Port dupliqué → Bloquer passage étape suivante
   - Image inexistante → Warning

5. **Sauvegarde/reprise** :
   - Commencer projet
   - Sauvegarder à étape 3
   - Fermer application
   - Rouvrir
   - Reprendre à étape 3

### Tests de charge

- Génération simultanée de 10 charts
- Import de gros repos GitHub (>1GB)
- Parsing de Dockerfile complexes (multi-stage)

---

## 📦 Structure de l'application Olares

### Fichiers du chart App Builder

```
olares-app-builder/
├── Chart.yaml
├── OlaresManifest.yaml
├── values.yaml
├── README.md
├── .helmignore
└── templates/
    ├── _helpers.tpl
    ├── deployment.yaml
    ├── service.yaml
    ├── pvc.yaml
    └── NOTES.txt
```

### Chart.yaml

```yaml
apiVersion: v2
name: olares-app-builder
description: Interactive wizard to create custom Olares applications
type: application
version: 0.1.0
appVersion: "1.0.0"
maintainers:
  - name: community
```

### OlaresManifest.yaml

```yaml
olaresManifest.version: '0.9.0'
olaresManifest.type: app

metadata:
  name: olares-app-builder
  appid: a7b3c5d2  # MD5("olares-app-builder")[:8]
  title: App Builder
  description: Create custom Olares applications with an interactive wizard
  icon: https://raw.githubusercontent.com/example/icon.svg
  version: 0.1.0
  categories:
    - Development

entrances:
  - name: web
    host: olares-app-builder
    port: 3000
    title: App Builder
    authLevel: private

permission:
  appData: true
  appCache: false

spec:
  versionName: '0.1.0'
  fullDescription: |
    # App Builder

    Interactive wizard to create custom Olares applications.

    ## Features
    - Import from GitHub repositories
    - Auto-detect Docker configuration
    - Generate complete Helm charts
    - Built-in validation
    - Template library

  requiredMemory: 256Mi
  requiredDisk: 512Mi
  requiredCpu: 0.1
  limitedMemory: 1Gi
  limitedCpu: 1

options:
  dependencies:
    - name: terminus
      version: ">=1.6.0-0"
      type: system
```

### values.yaml

```yaml
image:
  repository: olares/app-builder
  pullPolicy: IfNotPresent
  tag: "1.0.0"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 100m
    memory: 256Mi

persistence:
  size: 5Gi  # Pour sauvegarder projets

config:
  githubToken: ""  # Optionnel, pour API rate limit plus élevé
```

---

## 🚀 Roadmap de développement

### Phase 1 : MVP (4 semaines)

**Semaine 1-2 : Backend**
- [ ] Setup projet Node.js + Express
- [ ] API génération fichiers (Chart.yaml, OlaresManifest, values.yaml)
- [ ] API packaging (.tar.gz)
- [ ] Tests unitaires génération

**Semaine 3-4 : Frontend**
- [ ] Setup React + UI library
- [ ] Wizard 6 étapes (interface basique)
- [ ] Formulaires avec validation
- [ ] Intégration API génération
- [ ] Téléchargement package

**Fonctionnalités MVP** :
- Création manuelle (pas d'import GitHub)
- Templates basiques seulement
- Génération et téléchargement
- Pas de sauvegarde projets

### Phase 2 : Intégration GitHub (2 semaines)

**Semaine 5-6**
- [ ] API GitHub (Octokit)
- [ ] Parsing Dockerfile
- [ ] Parsing docker-compose.yml
- [ ] Auto-détection config
- [ ] Pré-remplissage wizard

### Phase 3 : Gestion projets (2 semaines)

**Semaine 7-8**
- [ ] Sauvegarde projets dans appData
- [ ] Dashboard avec liste projets
- [ ] Export/Import JSON
- [ ] Versioning projets

### Phase 4 : Templates et validation (2 semaines)

**Semaine 9-10**
- [ ] Bibliothèque de templates
- [ ] Créer template depuis projet
- [ ] Validation Helm lint
- [ ] Tests de déploiement simulation
- [ ] Amélioration messages d'erreur

### Phase 5 : Polissage et documentation (1 semaine)

**Semaine 11**
- [ ] Documentation utilisateur
- [ ] Tooltips et aide contextuelle
- [ ] Amélioration UX
- [ ] Tests E2E
- [ ] Déploiement production

---

## 📈 Métriques de succès

### KPIs techniques

- **Taux de génération réussie** : >95%
- **Temps de génération** : <5 secondes
- **Taille package** : <20 KB en moyenne
- **Taux de validation Helm** : >98%

### KPIs utilisateur

- **Taux de complétion wizard** : >80%
- **Temps moyen de création** : <10 minutes
- **Taux d'adoption templates** : >60%
- **Satisfaction utilisateur** : >4/5

### KPIs business

- **Nombre d'apps créées** : +50 dans les 3 premiers mois
- **Nombre d'utilisateurs actifs** : +100
- **Taux de rétention** : >70%

---

## 🔒 Sécurité

### Considérations

1. **Validation des inputs** :
   - Tous les champs validés (XSS, injection)
   - URL GitHub vérifiées (pas de SSRF)
   - Taille fichiers limitée

2. **Secrets** :
   - GitHub token optionnel (stocké chiffré)
   - Pas de stockage de credentials utilisateur
   - Variables marquées "secret" → masquées dans UI

3. **Rate limiting** :
   - API GitHub : Gestion du rate limit
   - API génération : Max 10 requêtes/minute/user

4. **Sandbox** :
   - Génération fichiers dans environnement isolé
   - Pas d'exécution de code arbitrary
   - Validation YAML stricte

---

## 🌐 Internationalisation

### Langues supportées (Phase 2+)

- Anglais (défaut)
- Français
- Allemand
- Espagnol
- Chinois

### Éléments à traduire

- Interface wizard (labels, tooltips, messages)
- Messages d'erreur
- Documentation
- Templates descriptions

---

## 📚 Documentation requise

### Documentation utilisateur

1. **Guide de démarrage rapide**
   - Créer sa première app en 5 minutes
   - Screenshots de chaque étape

2. **Guide complet**
   - Explication détaillée de chaque champ
   - Best practices
   - Exemples concrets

3. **FAQ**
   - Erreurs courantes
   - Troubleshooting
   - Limitations connues

4. **Templates**
   - Description de chaque template
   - Quand les utiliser
   - Comment les personnaliser

### Documentation développeur

1. **Architecture**
   - Stack technique
   - Structure du code
   - Flow de données

2. **API Reference**
   - Liste de tous les endpoints
   - Paramètres et réponses
   - Exemples de requêtes

3. **Contribution**
   - Setup environnement dev
   - Conventions de code
   - Process de review

4. **Déploiement**
   - Build Docker image
   - Packaging chart
   - Installation dans Olares

---

## 🎁 Fonctionnalités bonus (Nice to have)

### Phase ultérieure

1. **Marketplace de templates**
   - Partager templates entre utilisateurs
   - Rating et commentaires
   - Templates officiels vs community

2. **Déploiement direct**
   - Bouton "Déployer maintenant"
   - Install automatique dans Olares
   - Monitoring du déploiement

3. **Édition visuelle**
   - Drag & drop pour configurer architecture
   - Graphique de l'infrastructure
   - Preview en temps réel

4. **Intégration CI/CD**
   - Webhook GitHub
   - Auto-rebuild sur push
   - Tests automatiques

5. **Collaboration**
   - Partager projet avec d'autres users
   - Commentaires et suggestions
   - Historique des modifications

6. **Assistant IA**
   - Suggestions automatiques de config
   - Optimisation ressources
   - Détection de problèmes potentiels

7. **Multi-app (dependencies)**
   - Créer stack complète (app + DB + cache)
   - Gestion des dépendances
   - Ordre de déploiement

---

## 💰 Estimation de ressources

### Développement

- **Backend Developer** : 6 semaines (full-time)
- **Frontend Developer** : 6 semaines (full-time)
- **UI/UX Designer** : 2 semaines (part-time)
- **QA Tester** : 2 semaines (part-time)
- **Tech Writer** : 1 semaine (documentation)

**Total** : ~14 semaines-personne

### Infrastructure

- **Développement** :
  - Repository GitHub
  - CI/CD (GitHub Actions)
  - Environnement de test

- **Production** :
  - Image Docker (publique sur Docker Hub)
  - Chart packagé et disponible

---

## 📞 Support et maintenance

### Canaux de support

1. **Documentation** : Site web avec guides
2. **GitHub Issues** : Bug reports et feature requests
3. **Discord/Slack** : Community support
4. **Email** : Support prioritaire (si applicable)

### Maintenance

- **Mises à jour** : Tous les mois
- **Bug fixes** : Sous 48h pour critiques
- **Nouvelles fonctionnalités** : Trimestrielles
- **Compatibilité** : Avec dernière version Olares

---

## ✅ Critères d'acceptation

### Le MVP est considéré complet quand :

1. [ ] Utilisateur peut créer une app via wizard (6 étapes)
2. [ ] Génération de tous les fichiers requis fonctionne
3. [ ] Calcul appid automatique correct
4. [ ] Package .tar.gz téléchargeable
5. [ ] Package uploadable et installable dans Olares
6. [ ] Application déployée fonctionne sans CrashLoopBackOff
7. [ ] Validation Helm lint sans erreurs
8. [ ] Documentation utilisateur disponible
9. [ ] Tests E2E passent à 100%
10. [ ] Interface responsive (desktop + tablet)

---

## 📝 Annexes

### Annexe A : Exemples de Dockerfile à parser

**Exemple simple** :
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Extraction** :
- Image : `node:18-alpine`
- Port : `3000`
- Workdir : `/app`

**Exemple complexe** :
```dockerfile
FROM rust:1.70 AS builder
WORKDIR /build
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates
WORKDIR /opt/stalwart
COPY --from=builder /build/target/release/stalwart /usr/local/bin/
EXPOSE 8080 25 143 993
ENV STALWART_ADMIN_PASSWORD=changeme
VOLUME ["/opt/stalwart"]
CMD ["stalwart"]
```

**Extraction** :
- Image finale : `debian:bookworm-slim` (ignorer builder)
- Ports : `8080, 25, 143, 993`
- Env : `STALWART_ADMIN_PASSWORD=changeme`
- Volume : `/opt/stalwart`
- Workdir : `/opt/stalwart`

### Annexe B : Regex patterns utiles

```javascript
// Extraction ports depuis EXPOSE
const EXPOSE_REGEX = /^EXPOSE\s+(\d+(?:\/(?:tcp|udp))?(?:\s+\d+(?:\/(?:tcp|udp))?)*)/gim

// Extraction ENV
const ENV_REGEX = /^ENV\s+([A-Z_][A-Z0-9_]*)\s*=?\s*(.*)$/gim

// Extraction VOLUME
const VOLUME_REGEX = /^VOLUME\s+\[?"?(\/[^\]"]+)"?\]?/gim

// Extraction FROM (dernière seulement)
const FROM_REGEX = /^FROM\s+([^\s]+)(?:\s+AS\s+.*)?$/gim
```

### Annexe C : Structure de la base de données (si nécessaire)

**Table : projects**

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FOREIGN KEY |
| name | VARCHAR(255) | NOT NULL |
| config | JSONB | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

**Table : templates**

| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| config | JSONB | NOT NULL |
| official | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 🎯 Résumé exécutif

### Problème
Créer des applications Olares custom est complexe et nécessite des connaissances approfondies en Helm et Kubernetes.

### Solution
**Olares App Builder** : Une application web interactive avec un wizard en 6 étapes permettant de créer automatiquement des charts Helm compatibles Olares.

### Fonctionnalités clés
1. Import depuis GitHub avec auto-détection
2. Wizard guidé avec validation en temps réel
3. Génération automatique de tous les fichiers
4. Bibliothèque de templates
5. Téléchargement du package prêt à déployer

### Bénéfices
- **Gain de temps** : 10 minutes vs plusieurs heures
- **Réduction d'erreurs** : Validation automatique
- **Accessibilité** : Pas besoin d'être expert Kubernetes
- **Standardisation** : Charts conformes aux guidelines Olares

### Effort
- **Développement** : 11 semaines
- **Équipe** : 2 dev + 1 designer + 1 QA
- **Déploiement** : Application Olares standard

### ROI
- Augmentation du nombre d'apps custom
- Adoption plus rapide de la plateforme
- Réduction des tickets support
- Community engagement

---

**Version** : 1.0.0
**Date** : 2025-11-18
**Auteur** : Basé sur l'expérience Stalwart v0.1.0
**Statut** : Cahier des charges complet - Prêt pour développement
