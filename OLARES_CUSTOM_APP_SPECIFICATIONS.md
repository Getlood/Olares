# Spécifications pour Créer une Application Custom Olares

## 📋 Vue d'ensemble

Ce document fournit les spécifications complètes pour créer une application custom compatible avec Olares OS. Basé sur l'expérience réussie du chart Stalwart v0.1.0.

**Philosophie**: "Less is More" - Configuration minimale viable, puis extension au besoin.

---

## 🎯 Prérequis

### Informations nécessaires

Avant de commencer, rassemblez les informations suivantes sur l'application :

- **Nom de l'application** (ex: `stalwart`, `nextcloud`, `wordpress`)
- **Description courte** (1 ligne)
- **Image Docker** (repository + tag)
- **Port(s) de l'application**
  - Port web principal (si applicable)
  - Ports additionnels (mail, database, etc.)
- **Besoins de stockage** (données persistantes)
- **Ressources** (CPU/RAM minimales et maximales)
- **Configuration initiale** (variables d'environnement, credentials par défaut)
- **Icône** (URL publique, de préférence SVG)

---

## 📁 Structure de Fichiers Requise

```
<app-name>/
├── Chart.yaml                 # Métadonnées Helm (REQUIS)
├── OlaresManifest.yaml        # Configuration Olares (REQUIS)
├── values.yaml                # Valeurs configurables (REQUIS)
├── README.md                  # Documentation utilisateur (RECOMMANDÉ)
├── owners                     # Propriétaires GitHub (OPTIONNEL)
├── .helmignore                # Exclusions de packaging (RECOMMANDÉ)
├── crds/                      # Custom Resource Definitions (si nécessaire)
└── templates/
    ├── _helpers.tpl          # Fonctions helper Helm (REQUIS)
    ├── deployment.yaml       # Déploiement Kubernetes (REQUIS)
    ├── service.yaml          # Service Kubernetes (REQUIS)
    ├── pvc.yaml              # Stockage persistant (si nécessaire)
    └── NOTES.txt             # Instructions post-install (RECOMMANDÉ)
```

---

## 📄 Spécifications par Fichier

### 1. Chart.yaml

**Rôle**: Métadonnées Helm standard.

**Format minimal**:

```yaml
apiVersion: v2
name: <app-name>
description: <short-description>
type: application
version: <chart-version>  # Ex: 0.1.0
appVersion: "<app-version>"  # Ex: "latest" ou "1.2.3"
maintainers:
  - name: <your-name-or-community>
    email: <optional-email>
```

**Règles**:
- `name` DOIT correspondre au nom du dossier
- `apiVersion` DOIT être `v2`
- `type` DOIT être `application`
- `version` suit SemVer (ex: 0.1.0, 1.0.0)
- `appVersion` correspond à la version de l'app upstream

**Exemple** (Stalwart):
```yaml
apiVersion: v2
name: stalwart
description: Modern all-in-one email server (IMAP, JMAP, SMTP)
type: application
version: 0.1.0
appVersion: "latest"
maintainers:
  - name: community
```

---

### 2. OlaresManifest.yaml

**Rôle**: Configuration spécifique Olares (permissions, entrances, middleware).

**Format minimal**:

```yaml
olaresManifest.version: '0.9.0'
olaresManifest.type: app

metadata:
  name: <app-name>
  appid: <8-char-hex>  # Voir section Calcul appid
  title: <Display Title>
  description: <Longer description>
  icon: <icon-url>
  version: <same-as-Chart.yaml>
  categories:
    - <category>  # Utilities, Productivity, Social, etc.

entrances:
  - name: <entrance-name>
    host: <app-name>
    port: <port-number>
    title: <Display Title>
    authLevel: private  # ou public

permission:
  appData: true   # Si besoin de stocker des données
  appCache: true  # Si besoin de cache
  # userData: true  # Si besoin d'accès aux données utilisateur (rare)

spec:
  versionName: '<version>'
  promoteImage:
    - <screenshot-url-1>
    - <screenshot-url-2>
  fullDescription: |
    <Detailed markdown description>

  requiredMemory: <min-memory>  # Ex: 256Mi
  requiredDisk: <min-disk>      # Ex: 512Mi
  requiredCpu: <min-cpu>        # Ex: 0.1
  limitedMemory: <max-memory>   # Ex: 1Gi
  limitedCpu: <max-cpu>         # Ex: 1

options:
  dependencies:
    - name: terminus
      version: ">=1.6.0-0"
      type: system
```

**Règles**:
- `olaresManifest.version` DOIT être `'0.9.0'`
- `olaresManifest.type` DOIT être `app`
- `metadata.name` DOIT correspondre à Chart.yaml et au nom du dossier
- `metadata.appid` DOIT être calculé correctement (voir ci-dessous)
- `entrances` au moins une pour applications web
- `permission.appData` pour stockage dans `.Values.userspace.appData`
- `permission.appCache` pour cache dans `.Values.userspace.appCache`

**Catégories disponibles**:
- `Utilities`
- `Productivity`
- `Social`
- `Entertainment`
- `Development`
- `Communication`
- `Blockchain`

---

### 3. Calcul de l'appid

**CRITIQUE**: L'appid DOIT être calculé correctement pour éviter les erreurs de validation.

**Méthode**:
```bash
# Méthode 1: MD5 du nom de l'app, tronqué à 8 caractères
echo -n "<app-name>" | md5sum | cut -c1-8

# Exemple avec "stalwart"
echo -n "stalwart" | md5sum | cut -c1-8
# Résultat: e51f5a8f
```

**Exemple de calcul pour différentes apps**:
```bash
# nextcloud
echo -n "nextcloud" | md5sum | cut -c1-8  # -> 9a4e8f12

# wordpress
echo -n "wordpress" | md5sum | cut -c1-8  # -> 5d5b09f6

# jellyfin
echo -n "jellyfin" | md5sum | cut -c1-8   # -> 8a9c3d4e
```

---

### 4. values.yaml

**Rôle**: Valeurs par défaut configurables.

**Format minimal**:

```yaml
# Image Docker
image:
  repository: <docker-repo>/<image-name>
  pullPolicy: IfNotPresent
  tag: "<version-or-latest>"

# Ressources Kubernetes
resources:
  limits:
    cpu: <max-cpu>      # Ex: 1000m (= 1 CPU)
    memory: <max-mem>   # Ex: 1Gi
  requests:
    cpu: <min-cpu>      # Ex: 100m
    memory: <min-mem>   # Ex: 256Mi

# Stockage persistant (si applicable)
persistence:
  size: <size>  # Ex: 10Gi
  storageClass: ""  # Laisser vide pour défaut

# Configuration application
config:
  # Variables spécifiques à l'application
  # Ex pour Stalwart:
  # adminPassword: "changeme123"
  # logLevel: "info"
```

**Règles**:
- Garder MINIMAL - seulement les valeurs essentielles
- Pas de valeurs hardcodées qui devraient être templates
- Les secrets/passwords doivent être changeables
- Éviter la sur-configuration

**Exemple** (Stalwart):
```yaml
image:
  repository: stalwartlabs/stalwart
  pullPolicy: IfNotPresent
  tag: "latest"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 100m
    memory: 256Mi

persistence:
  size: 10Gi
  storageClass: ""

config:
  adminPassword: "changeme123"
  logLevel: "info"
```

---

### 5. templates/_helpers.tpl

**Rôle**: Fonctions helper Helm réutilisables.

**Format standard** (à utiliser tel quel):

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "<app-name>.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "<app-name>.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "<app-name>.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "<app-name>.labels" -}}
helm.sh/chart: {{ include "<app-name>.chart" . }}
{{ include "<app-name>.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "<app-name>.selectorLabels" -}}
app.kubernetes.io/name: {{ include "<app-name>.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

**Règle**: Remplacer `<app-name>` partout par le nom réel de votre app.

---

### 6. templates/deployment.yaml

**Rôle**: Déploiement Kubernetes de l'application.

**Format minimal**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "<app-name>.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "<app-name>.labels" . | nindent 4 }}
spec:
  replicas: 1
  selector:
    matchLabels:
      {{- include "<app-name>.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "<app-name>.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: <app-name>
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}

        # Ports exposés
        ports:
        - name: <port-name>
          containerPort: <port-number>
          protocol: TCP
        # Ajouter d'autres ports si nécessaire

        # Variables d'environnement (si nécessaire)
        env:
        - name: <ENV_VAR_NAME>
          value: "{{ .Values.config.<configKey> }}"
        # Ajouter d'autres env vars si nécessaire

        # Probes de santé
        livenessProbe:
          tcpSocket:
            port: <main-port-name>
          initialDelaySeconds: 30
          periodSeconds: 10

        readinessProbe:
          tcpSocket:
            port: <main-port-name>
          initialDelaySeconds: 10
          periodSeconds: 5

        # Ressources
        resources:
          {{- toYaml .Values.resources | nindent 10 }}

        # Volumes montés (si nécessaire)
        volumeMounts:
        - name: data
          mountPath: <app-data-path>  # Ex: /data, /opt/app, /var/lib/app
        - name: appdata
          mountPath: /appdata
        - name: appcache
          mountPath: /appcache

      # Définition des volumes
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: {{ include "<app-name>.fullname" . }}-data
      - name: appdata
        hostPath:
          path: {{ .Values.userspace.appData }}/<app-name>
          type: DirectoryOrCreate
      - name: appcache
        hostPath:
          path: {{ .Values.userspace.appCache }}/<app-name>
          type: DirectoryOrCreate
```

**Règles importantes**:

1. **Ports**: Définir TOUS les ports que l'app expose
   - Utiliser des noms descriptifs (`http`, `smtp`, `imap`, etc.)
   - Protocol: `TCP` ou `UDP`

2. **Variables d'environnement**:
   - SEULEMENT celles nécessaires au démarrage
   - Référencer `.Values.config.*`
   - Éviter les secrets hardcodés

3. **Probes**:
   - `tcpSocket` pour applications simples
   - `httpGet` pour applications web (avec path `/health` ou `/`)
   - `exec` pour commandes custom
   - Ajuster `initialDelaySeconds` selon le temps de démarrage

4. **Volumes**:
   - `data`: PVC pour données persistantes critiques
   - `appdata`: Données applicatives dans `.Values.userspace.appData`
   - `appcache`: Cache dans `.Values.userspace.appCache`
   - Chemins de montage selon la documentation de l'app

5. **Ressources**:
   - Toujours définir `limits` ET `requests`
   - `requests` = minimum garanti
   - `limits` = maximum autorisé

**Exemple** (Stalwart - simplifié):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "stalwart.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "stalwart.labels" . | nindent 4 }}
spec:
  replicas: 1
  selector:
    matchLabels:
      {{- include "stalwart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "stalwart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: stalwart
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}

        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        - name: smtp
          containerPort: 25
          protocol: TCP
        - name: imap
          containerPort: 143
          protocol: TCP
        - name: imaps
          containerPort: 993
          protocol: TCP

        env:
        - name: STALWART_ADMIN_PASSWORD
          value: "{{ .Values.config.adminPassword }}"

        livenessProbe:
          tcpSocket:
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10

        readinessProbe:
          tcpSocket:
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5

        resources:
          {{- toYaml .Values.resources | nindent 10 }}

        volumeMounts:
        - name: data
          mountPath: /opt/stalwart
        - name: appdata
          mountPath: /appdata
        - name: appcache
          mountPath: /appcache

      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: {{ include "stalwart.fullname" . }}-data
      - name: appdata
        hostPath:
          path: {{ .Values.userspace.appData }}/stalwart
          type: DirectoryOrCreate
      - name: appcache
        hostPath:
          path: {{ .Values.userspace.appCache }}/stalwart
          type: DirectoryOrCreate
```

---

### 7. templates/service.yaml

**Rôle**: Service Kubernetes pour exposer les ports.

**Format minimal**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "<app-name>.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "<app-name>.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  ports:
  - name: <port-name>
    port: <port-number>
    targetPort: <port-name>
    protocol: TCP
  # Ajouter d'autres ports si nécessaire
  selector:
    {{- include "<app-name>.selectorLabels" . | nindent 4 }}
```

**Règles**:
- `type: ClusterIP` (défaut Olares)
- Un port par ligne
- `port` = port du service
- `targetPort` = référence au nom du port dans deployment
- `selector` DOIT correspondre aux labels du deployment

**Exemple** (Stalwart):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "stalwart.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "stalwart.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  ports:
  - name: http
    port: 8080
    targetPort: http
    protocol: TCP
  - name: smtp
    port: 25
    targetPort: smtp
    protocol: TCP
  - name: imap
    port: 143
    targetPort: imap
    protocol: TCP
  - name: imaps
    port: 993
    targetPort: imaps
    protocol: TCP
  selector:
    {{- include "stalwart.selectorLabels" . | nindent 4 }}
```

---

### 8. templates/pvc.yaml

**Rôle**: PersistentVolumeClaim pour stockage persistant.

**Format** (si l'app a besoin de stockage):

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ include "<app-name>.fullname" . }}-data
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "<app-name>.labels" . | nindent 4 }}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ .Values.persistence.size }}
  {{- if .Values.persistence.storageClass }}
  storageClassName: {{ .Values.persistence.storageClass }}
  {{- end }}
```

**Règles**:
- `accessModes: ReadWriteOnce` pour la plupart des apps
- `storage` référence `.Values.persistence.size`
- `storageClass` conditionnel (laisser vide pour défaut)

**Quand l'utiliser**:
- Application avec base de données locale
- Application avec fichiers utilisateur (uploads, médias)
- PAS pour configuration statique ou cache

---

### 9. templates/NOTES.txt

**Rôle**: Instructions affichées après installation.

**Format**:

```
Thank you for installing {{ .Chart.Name }}!

Your application has been deployed to namespace: {{ .Release.Namespace }}

To access the application:
1. Open the Olares Desktop
2. Click on the "{{ .Chart.Name | title }}" icon
3. Log in with the default credentials:
   - Username: <default-username>
   - Password: <default-password>

IMPORTANT: Please change the default password immediately!

For more information:
- Documentation: <docs-url>
- Support: <support-url>

To check the deployment status:
  kubectl get pods -n {{ .Release.Namespace }} | grep {{ include "<app-name>.fullname" . }}

To view logs:
  kubectl logs -n {{ .Release.Namespace }} -l app.kubernetes.io/name={{ include "<app-name>.name" . }}
```

**Règles**:
- Concis et actionable
- Mentionner les credentials par défaut
- Rappeler de changer les passwords
- Liens vers documentation
- Commandes kubectl utiles

---

### 10. README.md

**Rôle**: Documentation utilisateur principale.

**Structure recommandée**:

```markdown
# <App Name>

<Short description>

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

1. Open Olares DevBox/Studio
2. Upload the chart package
3. Click Install
4. Wait for deployment to complete

## First Access

1. Open the app from Olares Desktop
2. Default credentials:
   - Username: `<username>`
   - Password: `<password>`
3. **Important**: Change the password immediately

## Configuration

### Basic Setup

<Steps for basic configuration>

### Advanced Options

<Optional advanced configuration>

## Persistence

This application stores data in:
- `/appdata/<app-name>`: Application data
- `/appcache/<app-name>`: Cache files
- PVC `<app-name>-data`: Critical persistent data

## Resource Requirements

- **Memory**: <min> - <max>
- **CPU**: <min> - <max>
- **Storage**: <default-size>

## Ports

- `<port>`: <description>
- `<port>`: <description>

## Support

- Website: <url>
- Documentation: <url>
- Issues: <url>

## License

<License info>
```

---

## 🔧 Fichiers Optionnels

### .helmignore

**Rôle**: Exclure des fichiers du package.

**Contenu standard**:

```
# Documentation
*.md
!README.md
*.txt
!templates/NOTES.txt

# Development
.git/
.gitignore
.DS_Store
*.swp
*.bak
*.tmp

# CI/CD
.github/
.gitlab-ci.yml

# Testing
test/
tests/
```

### owners

**Rôle**: Définir les propriétaires GitHub pour reviews.

**Format**:

```
- name: <github-username>
  email: <email>
```

---

## 🎯 Checklist de Création

Utilisez cette checklist pour créer une nouvelle app:

### Phase 1: Préparation

- [ ] Nom de l'app défini (lowercase, sans caractères spéciaux)
- [ ] Image Docker identifiée et testée localement
- [ ] Ports nécessaires identifiés
- [ ] Besoins de stockage évalués
- [ ] Documentation upstream consultée
- [ ] appid calculé avec MD5

### Phase 2: Structure

- [ ] Dossier `<app-name>/` créé
- [ ] `Chart.yaml` créé
- [ ] `OlaresManifest.yaml` créé avec appid correct
- [ ] `values.yaml` créé avec config minimale
- [ ] `templates/_helpers.tpl` créé

### Phase 3: Templates Kubernetes

- [ ] `templates/deployment.yaml` créé
  - [ ] Image correcte
  - [ ] Ports tous définis
  - [ ] Variables d'env nécessaires
  - [ ] Probes configurées
  - [ ] Volumes montés si nécessaire
- [ ] `templates/service.yaml` créé
  - [ ] Tous les ports exposés
  - [ ] Selector correct
- [ ] `templates/pvc.yaml` créé si stockage nécessaire

### Phase 4: Documentation

- [ ] `README.md` créé
- [ ] `templates/NOTES.txt` créé avec instructions
- [ ] `.helmignore` créé

### Phase 5: Validation

- [ ] Nom cohérent partout (Chart.yaml, OlaresManifest.yaml, dossier)
- [ ] appid correct dans OlaresManifest.yaml
- [ ] Pas de valeurs hardcodées (tout dans values.yaml)
- [ ] Templates utilisent `{{ include "app.xyz" . }}`
- [ ] Indentation YAML correcte (2 espaces)

### Phase 6: Package

- [ ] Package créé: `helm package <app-name>/`
- [ ] Taille raisonnable (< 10 KB pour config simple)
- [ ] Archive renommée: `<app-name>-v<version>.tar.gz`

### Phase 7: Test

- [ ] Upload dans Olares réussi
- [ ] Installation sans erreurs
- [ ] Pod démarre (status Running)
- [ ] Pas de CrashLoopBackOff
- [ ] Interface accessible si applicable
- [ ] Données persistent après redémarrage

---

## ⚠️ Erreurs Courantes et Solutions

### Erreur 1: "metadata.appid is required"

**Cause**: `appid` manquant dans OlaresManifest.yaml

**Solution**:
```bash
# Calculer l'appid
echo -n "<app-name>" | md5sum | cut -c1-8

# Ajouter dans OlaresManifest.yaml
metadata:
  appid: <résultat-md5>
```

### Erreur 2: "name mismatch"

**Cause**: Nom incohérent entre Chart.yaml, OlaresManifest.yaml et nom du dossier

**Solution**: Vérifier que ces 3 endroits ont EXACTEMENT le même nom:
- Nom du dossier: `<app-name>/`
- `Chart.yaml`: `name: <app-name>`
- `OlaresManifest.yaml`: `metadata.name: <app-name>`

### Erreur 3: CrashLoopBackOff

**Causes possibles**:
1. Image Docker incorrecte
2. Variables d'environnement manquantes/incorrectes
3. Chemin de montage volume incorrect
4. Port incorrect
5. Commande de démarrage incorrecte

**Debugging**:
```bash
# Voir les logs du pod
kubectl logs -n user-space-<username> <pod-name>

# Voir les événements
kubectl describe pod -n user-space-<username> <pod-name>

# Voir logs du crash précédent
kubectl logs -n user-space-<username> <pod-name> --previous
```

**Solutions**:
1. Vérifier l'image Docker sur Docker Hub
2. Consulter la doc officielle de l'app pour les env vars requises
3. Vérifier les chemins de données dans la doc
4. Tester l'image localement avec `docker run`

### Erreur 4: Interface web inaccessible

**Causes possibles**:
1. Port incorrect dans `entrances`
2. Service ne route pas vers le bon port
3. Container n'écoute pas sur le bon port

**Solution**:
```yaml
# Vérifier cohérence:

# OlaresManifest.yaml
entrances:
  - port: 8080  # <-- Doit correspondre au service

# service.yaml
ports:
  - port: 8080  # <-- Doit correspondre à l'entrance
    targetPort: http  # <-- Doit correspondre au deployment

# deployment.yaml
ports:
  - name: http  # <-- Référencé par targetPort
    containerPort: 8080  # <-- Port réel de l'app
```

### Erreur 5: Données ne persistent pas

**Cause**: Volume non monté ou mauvais chemin

**Solution**:
```yaml
# deployment.yaml - vérifier volumeMounts
volumeMounts:
- name: data
  mountPath: <chemin-correct-selon-doc-app>

# ET volumes
volumes:
- name: data
  persistentVolumeClaim:
    claimName: {{ include "app.fullname" . }}-data

# Vérifier que pvc.yaml existe
```

### Erreur 6: Ressources insuffisantes

**Cause**: `requests` trop élevés ou `limits` trop bas

**Solution**:
```yaml
# values.yaml - ajuster selon les besoins réels
resources:
  requests:
    cpu: 100m      # Minimum raisonnable
    memory: 128Mi  # Minimum raisonnable
  limits:
    cpu: 2000m     # Maximum généreux
    memory: 2Gi    # Maximum généreux
```

---

## 📊 Exemples de Configurations par Type d'App

### App Web Simple (ex: Static site, Dashboard)

**Caractéristiques**:
- 1 port HTTP
- Peu de mémoire
- Pas de stockage persistant nécessaire

**Ports**:
```yaml
# deployment.yaml
ports:
- name: http
  containerPort: 80
  protocol: TCP
```

**Entrances**:
```yaml
# OlaresManifest.yaml
entrances:
  - name: web
    host: <app-name>
    port: 80
    title: <App Title>
    authLevel: private
```

### App avec Base de Données (ex: Nextcloud, WordPress)

**Caractéristiques**:
- 1 port HTTP
- Stockage important
- Variables de config DB

**PVC**:
```yaml
# pvc.yaml - nécessaire
# values.yaml
persistence:
  size: 20Gi  # Plus grand pour données utilisateur
```

**Volumes**:
```yaml
volumeMounts:
- name: data
  mountPath: /var/www/html  # Ex WordPress
- name: appdata
  mountPath: /appdata
```

### App Multi-Ports (ex: Mail server, Game server)

**Caractéristiques**:
- Plusieurs ports (HTTP + autres protocoles)
- Ports non-standard

**Ports** (ex: Mail):
```yaml
# deployment.yaml
ports:
- name: http
  containerPort: 8080
- name: smtp
  containerPort: 25
- name: imap
  containerPort: 143
- name: imaps
  containerPort: 993

# service.yaml - exposer TOUS les ports
ports:
- name: http
  port: 8080
  targetPort: http
- name: smtp
  port: 25
  targetPort: smtp
- name: imap
  port: 143
  targetPort: imap
- name: imaps
  port: 993
  targetPort: imaps
```

**Entrances** (seulement HTTP):
```yaml
# OlaresManifest.yaml
entrances:
  - name: admin
    host: <app-name>
    port: 8080  # Seulement le port web
    title: Admin Interface
```

### App Gourmande en Ressources (ex: Jellyfin, Plex)

**Ressources**:
```yaml
# values.yaml
resources:
  limits:
    cpu: 4000m    # 4 CPU
    memory: 4Gi
  requests:
    cpu: 1000m    # 1 CPU minimum
    memory: 1Gi

# OlaresManifest.yaml
spec:
  requiredMemory: 1Gi
  requiredCpu: 1
  limitedMemory: 4Gi
  limitedCpu: 4
```

---

## 🚀 Workflow Complet: De Zéro à Installation

### Étape 1: Recherche

```bash
# Identifier l'image Docker officielle
# Exemple: https://hub.docker.com/r/nextcloud/nextcloud

# Noter:
# - Image: nextcloud/nextcloud
# - Tag recommandé: latest ou version spécifique
# - Port par défaut: 80
# - Volumes: /var/www/html
# - Env vars: (voir doc)
```

### Étape 2: Calcul appid

```bash
# Nom de l'app choisi
APP_NAME="nextcloud"

# Calculer appid
echo -n "$APP_NAME" | md5sum | cut -c1-8
# Résultat: 9a4e8f12
```

### Étape 3: Création Structure

```bash
# Créer le dossier
mkdir nextcloud
cd nextcloud

# Créer les fichiers
touch Chart.yaml
touch OlaresManifest.yaml
touch values.yaml
touch README.md
touch .helmignore

# Créer templates/
mkdir templates
touch templates/_helpers.tpl
touch templates/deployment.yaml
touch templates/service.yaml
touch templates/pvc.yaml
touch templates/NOTES.txt
```

### Étape 4: Remplir les Fichiers

Utiliser les templates de ce document en remplaçant `<app-name>` par `nextcloud`.

### Étape 5: Package

```bash
# Retour au dossier parent
cd ..

# Packager
helm package nextcloud/

# Renommer
mv nextcloud-0.1.0.tgz nextcloud-v0.1.0.tar.gz

# Vérifier taille
ls -lh nextcloud-v0.1.0.tar.gz
```

### Étape 6: Upload et Test

```bash
# 1. Ouvrir Olares DevBox/Studio
# 2. Upload nextcloud-v0.1.0.tar.gz
# 3. Install
# 4. Vérifier:

# Status pod
kubectl get pods -n user-space-<username> | grep nextcloud

# Logs
kubectl logs -n user-space-<username> <pod-name>

# Service
kubectl get svc -n user-space-<username> | grep nextcloud

# PVC
kubectl get pvc -n user-space-<username> | grep nextcloud
```

---

## 📚 Ressources et Références

### Documentation Olares

- **Package Guidelines**: https://github.com/beclab/Olares/blob/main/docs/developer/develop/package/recommend.md
- **Chart Structure**: https://github.com/beclab/Olares/tree/main/docs/developer/develop/package
- **Examples**: `apps/.olares/config/user/helm-charts/` dans le repo Olares

### Outils

```bash
# Helm
helm lint <app-name>/          # Valider syntaxe
helm template <app-name>/       # Tester templating
helm package <app-name>/        # Créer package

# Kubernetes
kubectl get pods -A             # Tous les pods
kubectl describe pod <name>     # Détails pod
kubectl logs <name>             # Logs pod

# MD5 pour appid
echo -n "<app-name>" | md5sum | cut -c1-8
```

### Checklist Finale avant Upload

```
✓ Nom cohérent partout
✓ appid calculé correctement
✓ Image Docker vérifiée
✓ Ports tous définis
✓ Volumes configurés si nécessaire
✓ Ressources raisonnables
✓ Documentation complète
✓ Package créé et renommé
✓ Taille < 10 KB
```

---

## 💡 Bonnes Pratiques

### 1. Philosophie "Minimal Viable Product"

- Commencer avec la config la plus simple qui fonctionne
- Ajouter des features progressivement
- Éviter la sur-ingénierie

### 2. Documentation

- README.md clair et concis
- NOTES.txt avec credentials par défaut
- Commenter les sections complexes

### 3. Sécurité

- JAMAIS de passwords hardcodés
- Toujours rappeler de changer les mots de passe par défaut
- Permissions minimales nécessaires

### 4. Ressources

- `requests` = usage normal attendu
- `limits` = 2-3x les requests
- Ajuster après monitoring en production

### 5. Maintenance

- Versionner correctement (SemVer)
- CHANGELOG.md pour tracker les changements
- Tester après chaque modification

---

## 🎓 Template Vide Prêt à l'Emploi

Voici un template complet à copier/coller pour démarrer rapidement:

### Chart.yaml
```yaml
apiVersion: v2
name: APP_NAME
description: APP_DESCRIPTION
type: application
version: 0.1.0
appVersion: "latest"
maintainers:
  - name: community
```

### OlaresManifest.yaml
```yaml
olaresManifest.version: '0.9.0'
olaresManifest.type: app

metadata:
  name: APP_NAME
  appid: CALCULATED_APPID
  title: APP_TITLE
  description: APP_LONG_DESCRIPTION
  icon: ICON_URL
  version: 0.1.0
  categories:
    - Utilities

entrances:
  - name: web
    host: APP_NAME
    port: PORT_NUMBER
    title: APP_TITLE
    authLevel: private

permission:
  appData: true
  appCache: true

spec:
  versionName: '0.1.0'
  fullDescription: |
    Full description here

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
  repository: DOCKER_REPO/IMAGE_NAME
  pullPolicy: IfNotPresent
  tag: "latest"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 100m
    memory: 256Mi

persistence:
  size: 10Gi
  storageClass: ""

config:
  # Add app-specific config here
```

---

## ✨ Résumé

Pour créer une app Olares custom:

1. **Identifier** l'app, l'image Docker, les ports, le stockage
2. **Calculer** l'appid avec MD5
3. **Créer** la structure de fichiers
4. **Remplir** les templates (Chart.yaml, OlaresManifest.yaml, values.yaml, deployment, service, pvc)
5. **Documenter** (README.md, NOTES.txt)
6. **Packager** avec `helm package`
7. **Tester** upload et installation dans Olares
8. **Débugger** si nécessaire avec kubectl logs/describe
9. **Itérer** et améliorer

**Philosophie**: Simple d'abord, complexe ensuite. Configuration minimale viable.

---

**Créé à partir de l'expérience Stalwart v0.1.0 (succès confirmé)**

Date: 2025-11-18
Version: 1.0.0
