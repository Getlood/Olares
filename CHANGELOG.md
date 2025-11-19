# Changelog - Stalwart Mail Server Chart

## [0.1.0] - 2025-11-18

### 🎯 Réécriture complète

Cette version représente une **réécriture complète** du chart en suivant strictement les guidelines officielles d'Olares.

### ✨ Ajouté
- Structure de chart conforme aux guidelines Olares
- Documentation centralisée dans README.md
- NOTES.txt pour instructions post-installation
- Configuration minimale viable

### 🔧 Modifié
- **OlaresManifest.yaml** : Simplifié de 128 à 66 lignes
- **values.yaml** : Simplifié de 82 à 27 lignes
- **deployment.yaml** : Simplifié de 152 à 68 lignes
- **service.yaml** : Simplifié de 47 à 24 lignes
- Image Docker : Utilisation de `stalwartlabs/stalwart:latest`
- Entrances : Réduit à 1 seule (admin web)
- Ports : Réduit à 4 essentiels (http, smtp, imap, imaps)
- Ressources : Optimisées (256Mi-1Gi RAM, 100m-1000m CPU)

### 🗑️ Supprimé
- Configuration PostgreSQL (pas nécessaire au démarrage)
- Ports mail secondaires (ajoutables plus tard)
- ServiceAccount template (non nécessaire)
- Documentation fragmentée (10 fichiers MD supprimés)
- Configuration sur-complexe
- Variables d'environnement inutiles

### 📊 Métriques
- Taille du package : 15 KB → 4.1 KB (-73%)
- Nombre de fichiers : 14 → 10 (-29%)
- Lignes de code totales : -55% en moyenne

### 🎯 Philosophie
Cette version adopte le principe **"Less is More"** :
- Configuration minimale pour démarrer
- Ajout de fonctionnalités au besoin
- Code simple et maintenable
- Respect strict des standards

---

## [0.0.3] - 2025-11-18 [DEPRECATED]

### 🔧 Corrigé
- Image Docker : `stalwartlabs/mail-server` → `stalwartlabs/stalwart`
- Tag : `v0.10.7` → `latest`

### ⚠️ Problèmes
- Structure trop complexe
- Sur-ingénierie
- Non conforme aux guidelines
- Trop de fichiers de documentation

---

## [0.0.2] - 2025-11-18 [DEPRECATED]

### 🔧 Corrigé
- Volume mount path : `/opt/stalwart-mail/data` → `/opt/stalwart`
- Variables d'environnement nettoyées
- Security context ajusté
- Probes optimisées

### ⚠️ Problèmes
- Image Docker toujours incorrecte
- Configuration trop complexe

---

## [0.0.1] - 2025-11-18 [DEPRECATED]

### ✨ Première version

### ⚠️ Problèmes
- Image Docker incorrecte
- Volume mount path incorrect
- Variables d'environnement incorrectes
- CrashLoopBackOff

---

## Légende

- ✨ Ajouté
- 🔧 Modifié
- 🗑️ Supprimé
- 📊 Métriques
- ⚠️ Problèmes
- 🎯 Notes importantes
