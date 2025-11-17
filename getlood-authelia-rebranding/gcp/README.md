# Getlood Authelia - Déploiement sur Google Cloud Platform (GCP)

Ce guide explique comment déployer Getlood Authelia sur Google Cloud Platform en utilisant Google Kubernetes Engine (GKE) et Google Container Registry (GCR).

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Architecture](#architecture)
- [Déploiement Manuel](#déploiement-manuel)
- [Déploiement Automatisé (Cloud Build)](#déploiement-automatisé-cloud-build)
- [Test Local avec Docker Compose](#test-local-avec-docker-compose)
- [Configuration](#configuration)
- [Monitoring et Logs](#monitoring-et-logs)
- [Dépannage](#dépannage)

---

## 🚀 Prérequis

### Outils Locaux

```bash
# Installer gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Installer kubectl
gcloud components install kubectl

# Installer Docker
# Voir: https://docs.docker.com/get-docker/
```

### Services GCP

1. **Projet GCP** avec facturation activée
2. **APIs activées** :
   ```bash
   gcloud services enable \
     container.googleapis.com \
     containerregistry.googleapis.com \
     cloudbuild.googleapis.com \
     secretmanager.googleapis.com \
     compute.googleapis.com
   ```

3. **Cluster GKE** (création ci-dessous)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐         ┌──────────────────────┐      │
│  │ Cloud Build │────────▶│ Container Registry   │      │
│  │  (CI/CD)    │         │  (GCR)               │      │
│  └─────────────┘         └──────────┬───────────┘      │
│                                      │                   │
│  ┌──────────────────────────────────▼────────────────┐ │
│  │  Google Kubernetes Engine (GKE)                   │ │
│  │                                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │   Ingress    │  │ Load Balancer│             │ │
│  │  │ (HTTPS/TLS)  │  │   (L7)       │             │ │
│  │  └──────┬───────┘  └──────┬───────┘             │ │
│  │         │                  │                      │ │
│  │  ┌──────▼──────────────────▼─────┐               │ │
│  │  │  Getlood Authelia Pods (3x)   │               │ │
│  │  │  - HPA (3-10 replicas)        │               │ │
│  │  │  - PDB (min 2 available)      │               │ │
│  │  └────────┬───────────────────────┘               │ │
│  │           │                                        │ │
│  │  ┌────────▼────────┐  ┌──────────────┐           │ │
│  │  │ Redis (Session) │  │ PostgreSQL   │           │ │
│  │  │ (Cloud Memstore)│  │ (Cloud SQL)  │           │ │
│  │  └─────────────────┘  └──────────────┘           │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────┐  ┌──────────────────┐          │
│  │ Secret Manager     │  │ Cloud Logging    │          │
│  │ (Credentials)      │  │ & Monitoring     │          │
│  └────────────────────┘  └──────────────────┘          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 🔧 Déploiement Manuel

### Étape 1 : Configuration du Projet GCP

```bash
# Définir le projet
export GCP_PROJECT="votre-projet-id"
gcloud config set project $GCP_PROJECT

# Définir la région/zone
export GCP_REGION="us-central1"
export GCP_ZONE="us-central1-a"
gcloud config set compute/zone $GCP_ZONE
```

### Étape 2 : Créer le Cluster GKE

```bash
# Créer un cluster GKE
gcloud container clusters create getlood-cluster \
  --zone=$GCP_ZONE \
  --num-nodes=3 \
  --machine-type=e2-standard-2 \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=10 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias \
  --network=default \
  --subnetwork=default \
  --enable-stackdriver-kubernetes \
  --addons=HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver

# Obtenir les credentials
gcloud container clusters get-credentials getlood-cluster --zone=$GCP_ZONE
```

### Étape 3 : Créer les Secrets dans Secret Manager

```bash
# Créer les secrets
gcloud secrets create authelia-jwt-secret \
  --data-file=<(openssl rand -base64 32)

gcloud secrets create authelia-session-secret \
  --data-file=<(openssl rand -base64 32)

gcloud secrets create authelia-encryption-key \
  --data-file=<(openssl rand -base64 32)

gcloud secrets create authelia-hmac-secret \
  --data-file=<(openssl rand -base64 64)

gcloud secrets create authelia-pg-password \
  --data-file=<(openssl rand -base64 32)

gcloud secrets create authelia-ldap-password \
  --data-file=<(echo -n "adminpassword")

# Donner accès au service account GKE
PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT --format='value(projectNumber)')
GSA_NAME="service-$PROJECT_NUMBER@container-engine-robot.iam.gserviceaccount.com"

for secret in authelia-jwt-secret authelia-session-secret authelia-encryption-key authelia-hmac-secret authelia-pg-password authelia-ldap-password; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$GSA_NAME" \
    --role="roles/secretmanager.secretAccessor"
done
```

### Étape 4 : Build et Push l'Image

```bash
cd getlood-authelia-rebranding/gcp/scripts
./build-and-push.sh
```

Ou manuellement :

```bash
# Configurer Docker pour GCR
gcloud auth configure-docker

# Build l'image
docker build -t gcr.io/$GCP_PROJECT/getlood-authelia:latest \
  -f docker/Dockerfile .

# Push vers GCR
docker push gcr.io/$GCP_PROJECT/getlood-authelia:latest
```

### Étape 5 : Déployer sur GKE

```bash
cd getlood-authelia-rebranding/gcp/scripts
./deploy-to-gke.sh
```

Ou manuellement :

```bash
# Créer le namespace
kubectl create namespace auth-system

# Appliquer les manifestes
kubectl apply -f gcp/k8s/ -n auth-system

# Vérifier le déploiement
kubectl rollout status deployment/getlood-authelia -n auth-system
```

---

## 🤖 Déploiement Automatisé (Cloud Build)

### Configuration Initiale

1. **Connecter votre repository Git** à Cloud Build :
   ```bash
   # Via la console GCP ou:
   gcloud alpha builds connections create github \
     --region=$GCP_REGION \
     YOUR_CONNECTION_NAME
   ```

2. **Créer un trigger Cloud Build** :
   ```bash
   gcloud builds triggers create github \
     --name=getlood-authelia-deploy \
     --repo-name=Olares \
     --repo-owner=Getlood \
     --branch-pattern=^main$ \
     --build-config=getlood-authelia-rebranding/gcp/cloudbuild.yaml
   ```

### Déploiement en 1 Commande

```bash
# Soumettre un build manuel
gcloud builds submit \
  --config=getlood-authelia-rebranding/gcp/cloudbuild.yaml \
  --substitutions=_IMAGE_TAG=v1.0.0
```

### Pipeline CI/CD Automatique

Une fois le trigger configuré :

1. **Push sur la branche `main`** déclenche automatiquement :
   - Génération des certificats SSL
   - Build de l'image Docker
   - Scan de vulnérabilités
   - Tests de configuration
   - Push vers GCR
   - Déploiement sur GKE
   - Vérification de santé

2. **Voir les builds** :
   ```bash
   gcloud builds list --limit=10
   ```

3. **Voir les logs** :
   ```bash
   gcloud builds log BUILD_ID
   ```

---

## 🐳 Test Local avec Docker Compose

Pour tester localement avant de déployer sur GCP :

### Étape 1 : Créer les Secrets Locaux

```bash
cd getlood-authelia-rebranding/docker
mkdir -p secrets

# Générer des secrets pour le dev local
openssl rand -base64 32 > secrets/jwt_secret
openssl rand -base64 32 > secrets/session_secret
openssl rand -base64 32 > secrets/encryption_key
openssl rand -base64 64 > secrets/hmac_secret
echo -n "authelia_password" > secrets/pg_password
```

### Étape 2 : Lancer l'Environment

```bash
docker-compose up -d
```

### Étape 3 : Accéder aux Services

- **Authelia** : http://localhost:9091
- **LLDAP Admin** : http://localhost:17170
- **MailCatcher** : http://localhost:1080 (pour les emails de test)
- **PostgreSQL** : localhost:5432
- **Redis** : localhost:6379

### Étape 4 : Tester

```bash
# Health check
curl http://localhost:9091/api/health

# Test LDAP connection
curl -X POST http://localhost:9091/api/firstfactor \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "adminpassword"}'
```

### Étape 5 : Arrêter

```bash
docker-compose down
# Ou pour tout supprimer (y compris les volumes):
docker-compose down -v
```

---

## ⚙️ Configuration

### Variables d'Environment Importantes

| Variable | Description | Default |
|----------|-------------|---------|
| `GCP_PROJECT` | ID du projet GCP | - |
| `GKE_CLUSTER` | Nom du cluster GKE | getlood-cluster |
| `GKE_ZONE` | Zone GCP | us-central1-a |
| `NAMESPACE` | Namespace Kubernetes | auth-system |
| `IMAGE_TAG` | Tag de l'image Docker | latest |

### Personnalisation du Déploiement

Éditer `gcp/k8s/deployment.yaml` pour ajuster :
- Nombre de replicas
- Ressources CPU/Memory
- Variables d'environment

### Mise à l'Échelle

```bash
# Manuelle
kubectl scale deployment getlood-authelia -n auth-system --replicas=5

# Automatique (HPA déjà configuré)
# Scale entre 3 et 10 replicas basé sur CPU (70%) et Memory (80%)
kubectl get hpa -n auth-system
```

---

## 📊 Monitoring et Logs

### Logs Kubernetes

```bash
# Logs en temps réel
kubectl logs -f deployment/getlood-authelia -n auth-system

# Logs des 100 dernières lignes
kubectl logs deployment/getlood-authelia -n auth-system --tail=100

# Logs d'un pod spécifique
kubectl logs POD_NAME -n auth-system
```

### Cloud Logging

```bash
# Voir les logs dans Cloud Logging
gcloud logging read "resource.type=k8s_container AND resource.labels.namespace_name=auth-system" \
  --limit=50 \
  --format=json
```

### Metrics (Cloud Monitoring)

Les métriques suivantes sont disponibles dans Cloud Monitoring :
- CPU et Memory utilization
- Requêtes HTTP par seconde
- Latence des requêtes
- Taux d'erreur
- Health check status

### Dashboards

Créer un dashboard personnalisé dans Cloud Monitoring :
1. Console GCP → Monitoring → Dashboards
2. Create Dashboard
3. Ajouter des charts pour :
   - Pod CPU/Memory
   - HTTP request rate
   - Error rate
   - Latency percentiles (p50, p95, p99)

---

## 🐛 Dépannage

### Problème : Pods ne démarrent pas

```bash
# Vérifier les événements
kubectl describe pod POD_NAME -n auth-system

# Vérifier les logs
kubectl logs POD_NAME -n auth-system
```

**Solutions communes** :
- Vérifier que les secrets existent : `kubectl get secrets -n auth-system`
- Vérifier que l'image est accessible : `kubectl get events -n auth-system`

### Problème : Erreur 503 sur l'Ingress

```bash
# Vérifier le service
kubectl get svc getlood-authelia-svc -n auth-system

# Vérifier les endpoints
kubectl get endpoints getlood-authelia-svc -n auth-system

# Vérifier le backend health
kubectl describe ingress getlood-authelia-ingress -n auth-system
```

### Problème : Erreur LDAP Connection

```bash
# Tester la connectivité LDAP
kubectl run ldapsearch-test --image=osixia/openldap:latest --rm -i --restart=Never \
  -n auth-system -- ldapsearch -x -H ldap://lldap-service:3890 -b "dc=getlood,dc=com"
```

### Problème : Cloud Build Échoue

```bash
# Voir les logs détaillés du build
gcloud builds log BUILD_ID --stream

# Vérifier les permissions du service account
gcloud projects get-iam-policy $GCP_PROJECT \
  --flatten="bindings[].members" \
  --filter="bindings.members:cloudbuild"
```

### Rollback d'un Déploiement

```bash
# Voir l'historique des déploiements
kubectl rollout history deployment/getlood-authelia -n auth-system

# Rollback vers la version précédente
kubectl rollout undo deployment/getlood-authelia -n auth-system

# Rollback vers une version spécifique
kubectl rollout undo deployment/getlood-authelia -n auth-system --to-revision=2
```

---

## 📚 Ressources

- [Documentation Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine/docs)
- [Documentation Cloud Build](https://cloud.google.com/build/docs)
- [Documentation Container Registry](https://cloud.google.com/container-registry/docs)
- [Documentation Authelia](https://www.authelia.com/configuration/prologue/introduction/)
- [Best Practices GKE](https://cloud.google.com/kubernetes-engine/docs/best-practices)

---

## 💰 Estimation des Coûts

Coûts mensuels approximatifs (région us-central1) :

| Service | Configuration | Coût Mensuel |
|---------|--------------|--------------|
| GKE Cluster | 3 nodes e2-standard-2 | ~$150 |
| Cloud SQL (PostgreSQL) | db-f1-micro | ~$15 |
| Cloud Memorystore (Redis) | 1GB Basic | ~$30 |
| Load Balancer | Standard | ~$20 |
| Container Registry | 10GB stockage | ~$1 |
| **Total** | | **~$216/mois** |

**Note** : Utilisez le [Calculateur de prix GCP](https://cloud.google.com/products/calculator) pour une estimation précise.

---

**Créé par** : Getlood Team
**Date** : 2025-11-17
**Version** : 1.0
