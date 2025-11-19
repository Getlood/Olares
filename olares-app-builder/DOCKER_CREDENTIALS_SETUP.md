# Configuration des Credentials Docker Hub

Ce guide explique comment configurer les credentials Docker Hub pour accéder à l'image privée `rachidgetlood/getlood-app-builder`.

## Option 1: Via values.yaml (Recommandé)

Lors de l'installation de l'application via Olares Market, vous pouvez fournir vos credentials Docker Hub.

### Étapes:

1. **Préparez vos credentials Docker Hub:**
   - Username: `rachidgetlood`
   - Password: Votre token d'accès Docker Hub ou mot de passe
   - Email: Votre email Docker Hub

2. **Modifiez le fichier values.yaml avant l'upload:**
   ```yaml
   imagePullSecrets:
     enabled: true
     name: dockerhub-secret
     registry: https://index.docker.io/v1/
     username: "rachidgetlood"
     password: "YOUR_DOCKERHUB_TOKEN"
     email: "your-email@example.com"
   ```

## Option 2: Créer le Secret Manuellement

Si vous préférez créer le secret manuellement dans votre cluster Olares:

### Via kubectl:

```bash
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=rachidgetlood \
  --docker-password=YOUR_DOCKERHUB_TOKEN \
  --docker-email=your-email@example.com \
  -n user-space-YOUR_USERNAME
```

**Note:** Remplacez `YOUR_USERNAME` par votre nom d'utilisateur Olares.

### Via YAML:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dockerhub-secret
  namespace: user-space-YOUR_USERNAME
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: BASE64_ENCODED_DOCKER_CONFIG
```

Pour générer le `.dockerconfigjson` encodé en base64:

```bash
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=rachidgetlood \
  --docker-password=YOUR_DOCKERHUB_TOKEN \
  --docker-email=your-email@example.com \
  --dry-run=client -o yaml
```

## Option 3: Désactiver imagePullSecrets (Si l'image est publique)

Si vous décidez de rendre l'image publique sur Docker Hub:

```yaml
imagePullSecrets:
  enabled: false
```

## Génération d'un Token Docker Hub

Pour plus de sécurité, utilisez un token d'accès plutôt qu'un mot de passe:

1. Connectez-vous à [Docker Hub](https://hub.docker.com/)
2. Allez dans **Account Settings** → **Security**
3. Cliquez sur **New Access Token**
4. Donnez un nom au token (ex: "olares-app-builder")
5. Sélectionnez les permissions: **Read-only** suffit pour pull les images
6. Copiez le token généré et utilisez-le comme password

## Vérification

Après l'installation, vérifiez que le secret est créé:

```bash
kubectl get secret dockerhub-secret -n user-space-YOUR_USERNAME
```

Vérifiez que le pod peut pull l'image:

```bash
kubectl describe pod -n user-space-YOUR_USERNAME -l app=olares-app-builder
```

Si tout fonctionne, vous devriez voir:
```
Events:
  Type    Reason     Message
  ----    ------     -------
  Normal  Pulling    Pulling image "rachidgetlood/getlood-app-builder:latest"
  Normal  Pulled     Successfully pulled image
  Normal  Created    Created container
  Normal  Started    Started container
```

## Dépannage

### Erreur "ImagePullBackOff"

Si vous voyez cette erreur:
```
Failed to pull image "rachidgetlood/getlood-app-builder:latest":
rpc error: code = Unknown desc = Error response from daemon:
pull access denied for rachidgetlood/getlood-app-builder
```

**Solutions:**
1. Vérifiez que le secret existe et contient les bonnes credentials
2. Vérifiez que le username/password sont corrects
3. Vérifiez que l'image existe sur Docker Hub
4. Vérifiez que le namespace du secret correspond au namespace du pod

### Le secret n'est pas utilisé

Vérifiez que `imagePullSecrets.enabled: true` dans values.yaml

### Tester les credentials manuellement

```bash
docker login -u rachidgetlood -p YOUR_TOKEN
docker pull rachidgetlood/getlood-app-builder:latest
```
