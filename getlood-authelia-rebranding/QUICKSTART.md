# 🚀 Quickstart - Déploiement Getlood Authelia

Guide de démarrage rapide pour déployer le rebranding Getlood sur votre cluster Olares.

## ⚡ Déploiement Automatique (Recommandé)

### Prérequis

- Cluster Olares installé et fonctionnel
- `kubectl` configuré et connecté à votre cluster
- Accès au namespace `os-framework`

### Déploiement en 1 Commande

```bash
cd getlood-authelia-rebranding/scripts
./deploy-getlood-rebranding.sh
```

Le script effectue automatiquement :
1. ✅ Génération des certificats SSL
2. ✅ Récupération des secrets Authelia existants
3. ✅ Configuration avec les secrets et certificats
4. ✅ Application des ConfigMaps Kubernetes
5. ✅ Application des patches Kustomize
6. ✅ Redémarrage d'Authelia
7. ✅ Vérification du déploiement

**Durée estimée** : 2-3 minutes

---

## 🔧 Déploiement Manuel (Pas à Pas)

Si vous préférez un contrôle total, suivez ces étapes :

### Étape 1 : Générer les Certificats

```bash
cd getlood-authelia-rebranding/scripts
./generate-getlood-certs.sh
```

### Étape 2 : Récupérer les Secrets

```bash
export JWT_SECRET=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.jwt_secret}' | base64 -d)
export SESSION_SECRET=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.session_secret}' | base64 -d)
export ENCRYPTION_KEY=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.encryption_key}' | base64 -d)
export HMAC_SECRET=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.hmac_secret}' | base64 -d)
export PG_PASSWORD=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.pg_password}' | base64 -d)
```

### Étape 3 : Préparer la Configuration

```bash
cd ../configs

# Créer une copie de travail
cp getlood-authelia-config.yaml getlood-authelia-config.yaml.tmp

# Remplacer les secrets
sed -i "s|__JWT_SECRET__|$JWT_SECRET|g" getlood-authelia-config.yaml.tmp
sed -i "s|__SESSION_SECRET__|$SESSION_SECRET|g" getlood-authelia-config.yaml.tmp
sed -i "s|__ENCRYPTION_KEY__|$ENCRYPTION_KEY|g" getlood-authelia-config.yaml.tmp
sed -i "s|__HMAC_SECRET__|$HMAC_SECRET|g" getlood-authelia-config.yaml.tmp
sed -i "s|__PG_PASSWORD__|$PG_PASSWORD|g" getlood-authelia-config.yaml.tmp

# Ajouter les certificats
CERT_CHAIN=$(cat ../certs/getlood-cert-chain.pem | sed 's/^/          /')
PRIVATE_KEY=$(cat ../certs/getlood-server-key.pem | sed 's/^/          /')

# Note: Les certificats doivent être insérés manuellement ou via un script plus complexe
# Voir le script deploy-getlood-rebranding.sh pour la méthode complète
```

### Étape 4 : Appliquer les ConfigMaps

```bash
kubectl apply -f getlood-authelia-config.yaml.tmp
kubectl apply -f getlood-assets-configmap.yaml
```

### Étape 5 : Appliquer Kustomize

```bash
cd ../kustomize
kubectl apply -k .
```

### Étape 6 : Redémarrer Authelia

```bash
kubectl rollout restart deployment/authelia-backend -n os-framework
kubectl rollout status deployment/authelia-backend -n os-framework
```

---

## ✅ Vérification

### 1. Vérifier les Pods

```bash
kubectl get pods -n os-framework | grep authelia
```

Vous devriez voir :
```
authelia-backend-xxxxx   1/1     Running   0          1m
```

### 2. Vérifier les Logs

```bash
kubectl logs -f deployment/authelia-backend -n os-framework
```

Cherchez :
- ✅ "Configuration parsed successfully"
- ✅ "Starting Authelia"
- ✅ Pas d'erreurs LDAP ou PostgreSQL

### 3. Vérifier les ConfigMaps

```bash
kubectl get configmap -n os-framework | grep getlood
```

Vous devriez voir :
```
getlood-authelia-assets   2      1m
getlood-authelia-config   1      1m
```

### 4. Tester l'Authentification

1. **Test TOTP** :
   - Activez 2FA pour un utilisateur
   - Scannez le QR code avec Google Authenticator
   - Vérifiez que l'issuer affiche **"getlood.com"**

2. **Test Cookie** :
   ```bash
   curl -I https://auth.votredomaine.getlood.com/api/verify
   ```
   - Cherchez le cookie `getlood_session` au lieu de `authelia_session`

3. **Test Interface** :
   - Ouvrez https://auth.votredomaine.getlood.com
   - Vérifiez le logo Getlood
   - Vérifiez les couleurs (#0066FF, #00CC99)

---

## 🔄 Rollback (Restauration)

Si vous rencontrez des problèmes et souhaitez revenir à Olares :

```bash
cd getlood-authelia-rebranding/scripts
./rollback-to-olares.sh
```

Le script :
1. ✅ Supprime les ConfigMaps Getlood
2. ✅ Restaure la configuration Olares depuis les backups
3. ✅ Redémarre Authelia
4. ✅ Vérifie le bon fonctionnement

---

## 🐛 Dépannage Rapide

### Problème : Pod ne démarre pas

```bash
# Voir les erreurs
kubectl describe pod -l app=authelia-backend -n os-framework

# Vérifier les logs
kubectl logs deployment/authelia-backend -n os-framework
```

### Problème : Erreur de certificat

```bash
# Régénérer les certificats
cd scripts
./generate-getlood-certs.sh

# Redéployer
./deploy-getlood-rebranding.sh
```

### Problème : Erreur LDAP "base_dn"

Si vous voyez `LDAP error: invalid base_dn`, vérifiez que LLDAP utilise `dc=getlood,dc=com` :

```bash
# Vérifier la config LLDAP
kubectl get configmap lldap-config -n os-platform -o yaml | grep base_dn
```

Si le base_dn est différent, modifiez `configs/getlood-authelia-config.yaml` pour correspondre.

### Problème : Sessions invalides

Après le déploiement, toutes les sessions existantes seront invalidées car le nom du cookie change de `authelia_session` à `getlood_session`. C'est normal - les utilisateurs devront se reconnecter.

---

## 📊 Statut du Déploiement

Pour surveiller le déploiement :

```bash
# Statut général
kubectl get all -n os-framework | grep authelia

# Événements récents
kubectl get events -n os-framework --sort-by='.lastTimestamp' | grep authelia

# Surveiller les logs en temps réel
kubectl logs -f deployment/authelia-backend -n os-framework
```

---

## 🔐 Sécurité

### Secrets Utilisés

Les secrets suivants sont récupérés depuis `authelia-secrets` :
- `jwt_secret` - Signature JWT
- `session_secret` - Chiffrement sessions
- `hmac_secret` - Signature OIDC
- `encryption_key` - Chiffrement DB
- `pg_password` - PostgreSQL

**Important** : Ces secrets ne sont jamais stockés en clair dans les fichiers de configuration versionnés.

### Certificats SSL

Les certificats générés sont utilisés **uniquement** pour signer les tokens OIDC. Ils ne remplacent pas vos certificats TLS/HTTPS.

**Localisation** : `getlood-authelia-rebranding/certs/`

**Attention** : Ne jamais commiter le dossier `certs/` dans Git (déjà dans .gitignore).

---

## 📚 Documentation Complète

- **README.md** - Guide complet avec tous les détails
- **AUTHELIA_REBRANDING_ANALYSIS.md** - Analyse technique de l'architecture
- **Scripts** :
  - `deploy-getlood-rebranding.sh` - Déploiement automatique
  - `rollback-to-olares.sh` - Restauration Olares
  - `generate-getlood-certs.sh` - Génération certificats

---

## 🆘 Support

En cas de problème :

1. Consultez les logs : `kubectl logs deployment/authelia-backend -n os-framework`
2. Vérifiez la documentation complète : [README.md](README.md)
3. Vérifiez l'analyse technique : [AUTHELIA_REBRANDING_ANALYSIS.md](../AUTHELIA_REBRANDING_ANALYSIS.md)
4. Utilisez le rollback si nécessaire : `./rollback-to-olares.sh`

---

**Bonne chance avec votre déploiement Getlood ! 🚀**
