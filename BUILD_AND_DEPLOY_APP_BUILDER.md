# 🚀 Build et Déploiement - Olares App Builder

## ⚠️ Important

Le package Helm `olares-app-builder-v0.1.0.tar.gz` contient **uniquement** les manifestes Kubernetes.
Pour que l'application fonctionne, il faut **AUSSI** construire et publier l'image Docker.

---

## 📋 Prérequis

- Docker installé
- Accès à un registry Docker (Docker Hub, GitHub Container Registry, ou registry privé)
- Compte sur le registry choisi

---

## 🔨 Étape 1 : Build de l'image Docker

### Option A : Push vers Docker Hub (public)

```bash
cd /Users/user/Documents/Getlood/Olares/olares-app-builder

# Login Docker Hub
docker login

# Build l'image (remplacer 'votre-username' par votre username Docker Hub)
docker build -t votre-username/olares-app-builder:1.0.0 .

# Tag aussi en 'latest'
docker tag votre-username/olares-app-builder:1.0.0 votre-username/olares-app-builder:latest

# Push vers Docker Hub
docker push votre-username/olares-app-builder:1.0.0
docker push votre-username/olares-app-builder:latest
```

### Option B : Push vers GitHub Container Registry (GHCR)

```bash
cd /Users/user/Documents/Getlood/Olares/olares-app-builder

# Login GHCR (créer un Personal Access Token sur GitHub d'abord)
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Build l'image
docker build -t ghcr.io/votre-username/olares-app-builder:1.0.0 .

# Tag aussi en 'latest'
docker tag ghcr.io/votre-username/olares-app-builder:1.0.0 ghcr.io/votre-username/olares-app-builder:latest

# Push vers GHCR
docker push ghcr.io/votre-username/olares-app-builder:1.0.0
docker push ghcr.io/votre-username/olares-app-builder:latest
```

---

## 🔧 Étape 2 : Mettre à jour values.yaml

Une fois l'image Docker publiée, mettre à jour le `values.yaml` dans le chart :

```yaml
# olares-app-builder/values.yaml
image:
  repository: votre-username/olares-app-builder  # ← Changer ici
  pullPolicy: IfNotPresent
  tag: "1.0.0"
```

OU si vous utilisez GHCR :

```yaml
image:
  repository: ghcr.io/votre-username/olares-app-builder
  pullPolicy: IfNotPresent
  tag: "1.0.0"
```

---

## 📦 Étape 3 : Re-packager le chart

```bash
cd /Users/user/Documents/Getlood/Olares

# Nettoyer l'ancien package
rm -f olares-app-builder-v0.1.0.tar.gz

# Créer le nouveau package
mkdir -p /tmp/package/olares-app-builder
cp olares-app-builder/Chart.yaml olares-app-builder/OlaresManifest.yaml olares-app-builder/values.yaml olares-app-builder/.helmignore /tmp/package/olares-app-builder/
cp -r olares-app-builder/templates /tmp/package/olares-app-builder/

# Packager
cd /tmp/package
tar -czf /Users/user/Documents/Getlood/Olares/olares-app-builder-v0.1.0.tar.gz olares-app-builder/

# Vérifier
tar -tzf /Users/user/Documents/Getlood/Olares/olares-app-builder-v0.1.0.tar.gz
```

---

## 🚀 Étape 4 : Upload et Install dans Olares

1. Ouvrir Olares DevBox/Studio
2. Upload `olares-app-builder-v0.1.0.tar.gz`
3. Install
4. Vérifier que le pod démarre correctement

---

## 🐛 Troubleshooting

### ImagePullBackOff

Si le pod affiche `ImagePullBackOff` :

```bash
kubectl describe pod -n user-space-<username> <pod-name>
```

**Causes possibles** :
- Image Docker n'existe pas au registry
- Image est privée et Olares n'a pas les credentials
- Tag incorrect dans values.yaml

**Solutions** :
- Vérifier que l'image est bien push : `docker pull votre-username/olares-app-builder:1.0.0`
- Vérifier le nom et tag dans values.yaml
- Si image privée, créer un `imagePullSecret` dans Kubernetes

### CrashLoopBackOff

Si le pod crash au démarrage :

```bash
kubectl logs -n user-space-<username> <pod-name>
```

**Causes possibles** :
- Erreur dans le code backend/frontend
- Port déjà utilisé
- Dépendances manquantes

---

## 🔒 Pour une image privée

Si vous ne voulez pas rendre l'image publique :

### 1. Créer un Secret Kubernetes

```bash
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=votre-username \
  --docker-password=votre-password \
  --docker-email=votre-email \
  -n user-space-<username>
```

### 2. Modifier deployment.yaml

Ajouter `imagePullSecrets` :

```yaml
# templates/deployment.yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
      containers:
      - name: olares-app-builder
        ...
```

---

## ⚡ Alternative : Test local sans Docker Hub

Si vous voulez tester localement sans push :

### Build et load dans Kubernetes local

```bash
# Build l'image
docker build -t olares-app-builder:1.0.0 .

# Si vous utilisez kind/k3s/minikube
kind load docker-image olares-app-builder:1.0.0
# OU
minikube image load olares-app-builder:1.0.0

# Modifier values.yaml
image:
  repository: olares-app-builder  # Sans registry
  pullPolicy: IfNotPresent  # Important pour local
  tag: "1.0.0"
```

---

## 📝 Résumé des commandes

```bash
# 1. Build Docker
cd /Users/user/Documents/Getlood/Olares/olares-app-builder
docker build -t votre-username/olares-app-builder:1.0.0 .
docker push votre-username/olares-app-builder:1.0.0

# 2. Mettre à jour values.yaml
# Changer 'image.repository' vers votre username

# 3. Re-packager
cd /Users/user/Documents/Getlood/Olares
rm olares-app-builder-v0.1.0.tar.gz
mkdir -p /tmp/package/olares-app-builder
cp olares-app-builder/{Chart.yaml,OlaresManifest.yaml,values.yaml,.helmignore} /tmp/package/olares-app-builder/
cp -r olares-app-builder/templates /tmp/package/olares-app-builder/
cd /tmp/package
tar -czf /Users/user/Documents/Getlood/Olares/olares-app-builder-v0.1.0.tar.gz olares-app-builder/

# 4. Upload dans Olares
# Via UI
```

---

## 🎯 Checklist complète

- [ ] Code backend/frontend écrit
- [ ] Dockerfile créé
- [ ] Image Docker buildée
- [ ] Image Docker pushée vers un registry
- [ ] values.yaml mis à jour avec le bon repository
- [ ] Chart Helm packageé
- [ ] Package uploadé dans Olares
- [ ] Pod démarre correctement (Running)
- [ ] Interface web accessible
- [ ] Fonctionnalités testées

---

## 💡 Recommandations

### Pour la production

1. **Versioning** : Utiliser des tags spécifiques (1.0.0, 1.0.1) au lieu de 'latest'
2. **Registry** : Utiliser un registry privé pour plus de contrôle
3. **Multi-arch** : Build pour amd64 et arm64 :
   ```bash
   docker buildx build --platform linux/amd64,linux/arm64 -t votre-username/olares-app-builder:1.0.0 --push .
   ```
4. **Security scan** : Scanner l'image pour vulnérabilités :
   ```bash
   docker scan votre-username/olares-app-builder:1.0.0
   ```

### Pour le développement

1. Utiliser `imagePullPolicy: Always` pour forcer le pull
2. Tag avec version de dev (1.0.0-dev, 1.0.0-alpha)
3. Tester localement avant push

---

**L'application ne fonctionnera QUE si l'image Docker est disponible au registry spécifié dans values.yaml !**
