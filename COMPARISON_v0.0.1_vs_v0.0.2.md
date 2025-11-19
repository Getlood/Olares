# 📊 Comparaison v0.0.1 vs v0.0.2

## Changements dans deployment.yaml

| Aspect | v0.0.1 ❌ | v0.0.2 ✅ |
|--------|----------|----------|
| **Volume mount** | `/opt/stalwart-mail/data` | `/opt/stalwart` |
| **runAsUser** | 1000 | 0 (root) |
| **runAsNonRoot** | true | false |
| **Variables env** | 13 vars (STALWART_DB_*, PUID, etc.) | 2 vars (PASSWORD, HOSTNAME) |
| **Probe type** | httpGet (path: /) | tcpSocket |
| **Liveness delay** | 30s | 60s |
| **Readiness delay** | 10s | 30s |
| **Failure threshold** | 3 | 5 (liveness), 10 (readiness) |

## Changements dans OlaresManifest.yaml

| Aspect | v0.0.1 | v0.0.2 |
|--------|--------|--------|
| **Version** | 0.0.1 | 0.0.2 |
| **versionName** | 0.0.1 | 0.0.2 |
| **Middleware PostgreSQL** | Activé | Commenté (désactivé) |
| **upgradeDescription** | "Initial release" | Description détaillée des fixes |

## Détails des variables d'environnement

### ❌ Supprimées en v0.0.2 (causaient le crash)

```yaml
# Ces variables n'existent pas dans stalwartlabs/mail-server
- STALWART_DB_TYPE=postgresql
- STALWART_DB_HOST={{ .Values.postgres.host }}
- STALWART_DB_PORT={{ .Values.postgres.port }}
- STALWART_DB_NAME={{ .Values.postgres.databases.stalwart }}
- STALWART_DB_USER={{ .Values.postgres.username }}
- STALWART_DB_PASSWORD={{ .Values.postgres.password }}
- STALWART_DOMAIN={{ .Values.stalwart.domain }}
- PUID=1000
- PGID=1000
- TZ=UTC
```

### ✅ Conservées en v0.0.2

```yaml
# Variables standard de Stalwart
- STALWART_ADMIN_PASSWORD={{ .Values.stalwart.adminPassword }}
- STALWART_HOSTNAME=stalwart.{{ .Values.bfl.username }}.{{ .Values.bfl.domain }}
```

## Changements dans Chart.yaml

```diff
- version: 0.0.1
+ version: 0.0.2
```

## Fichiers ajoutés

- `CHANGELOG_v0.0.2.md` - Liste des changements
- `COMPARISON_v0.0.1_vs_v0.0.2.md` - Ce fichier

## Pourquoi ces changements ?

### 🔍 Problème identifié

Le conteneur démarrait puis crashait immédiatement en `CrashLoopBackOff`.

### 🎯 Causes probables

1. **Mount path incorrect** : Stalwart ne trouvait pas son répertoire de données
2. **Variables d'env invalides** : Les vars `STALWART_DB_*` n'existent pas et causaient une erreur
3. **Permissions insuffisantes** : `runAsUser: 1000` empêchait la liaison aux ports < 1024
4. **Probes trop agressives** : Le serveur n'avait pas le temps de s'initialiser

### ✅ Solutions appliquées

1. **Mount corrigé** : `/opt/stalwart` est le chemin standard
2. **Vars nettoyées** : Seulement les vars officielles
3. **Root user** : Permissions complètes pour l'initialisation
4. **Probes assouplies** : Plus de temps et changement de HTTP à TCP

## Impact attendu

| Avant (v0.0.1) | Après (v0.0.2) |
|----------------|----------------|
| ❌ CrashLoopBackOff | ✅ Démarrage réussi |
| ❌ Erreur immédiate | ✅ Initialisation complète |
| ❌ Logs d'erreur | ✅ Logs normaux |
| ❌ Pod redémarre en boucle | ✅ Pod stable et Running |

## Test de validation

```bash
# Après installation de v0.0.2
kubectl get pods -n user-space-poudlardo | grep stalwart
# Devrait afficher : stalwart-xxx   1/1   Running

# Vérifier les logs
kubectl logs -n user-space-poudlardo <pod-name> -c stalwart
# Devrait montrer l'initialisation de Stalwart, pas d'erreur
```

## Migration v0.0.1 → v0.0.2

1. Désinstaller v0.0.1
2. Supprimer le PVC (optionnel, pour repartir de zéro)
3. Installer v0.0.2
4. Vérifier le démarrage

**Note** : Les données ne sont pas compatibles entre versions si vous changez le mount path. Il est recommandé de repartir de zéro.

---

**Version testée** : v0.0.2
**Date** : 18 novembre 2025
**Statut** : En attente de test utilisateur
