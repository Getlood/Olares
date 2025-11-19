# Getlood Authelia Rebranding

Ce projet permet de rebrander Authelia pour utiliser l'identité **Getlood** au lieu d'**Olares.com**, sans modifier le code source d'Olares.

## 🎯 Objectif

Personnaliser l'authentification Authelia pour que les utilisateurs voient "Getlood" partout :
- Dans les applications 2FA (Google Authenticator, Authy)
- Dans les cookies de session
- Dans l'interface de connexion
- Dans les domaines d'accès

## 📦 Contenu

```
getlood-authelia-rebranding/
├── configs/
│   ├── getlood-authelia-config.yaml      # Configuration Authelia personnalisée
│   └── getlood-assets-configmap.yaml     # Assets (CSS, logo)
├── scripts/
│   └── generate-getlood-certs.sh         # Génération des certificats SSL
├── assets/
│   ├── getlood-theme.css                 # Thème CSS Getlood
│   └── getlood-logo.svg                  # Logo Getlood
├── kustomize/
│   ├── kustomization.yaml                # Configuration Kustomize
│   └── patch-authelia-deployment.yaml    # Patch du déploiement
└── README.md                             # Ce fichier
```

## 🚀 Installation

### Prérequis

- Un cluster Olares fonctionnel
- `kubectl` configuré
- Accès au namespace `os-framework`

### Étape 1 : Générer les Certificats SSL

```bash
cd getlood-authelia-rebranding/scripts
./generate-getlood-certs.sh
```

Cela génère :
- `getlood-ca-cert.pem` : Certificat de l'autorité de certification
- `getlood-server-cert.pem` : Certificat du serveur
- `getlood-server-key.pem` : Clé privée du serveur
- `getlood-cert-chain.pem` : Chaîne de certificats complète

### Étape 2 : Récupérer les Secrets Existants

```bash
# Récupérer les secrets existants d'Authelia
JWT_SECRET=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.jwt_secret}' | base64 -d)
SESSION_SECRET=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.session_secret}' | base64 -d)
ENCRYPTION_KEY=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.encryption_key}' | base64 -d)
HMAC_SECRET=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.hmac_secret}' | base64 -d)
PG_PASSWORD=$(kubectl get secret authelia-secrets -n os-framework -o jsonpath='{.data.pg_password}' | base64 -d)

echo "✓ Secrets récupérés avec succès"
```

### Étape 3 : Mettre à Jour la Configuration

```bash
cd ../configs

# Remplacer les placeholders dans le fichier de configuration
sed -i "s|__JWT_SECRET__|$JWT_SECRET|g" getlood-authelia-config.yaml
sed -i "s|__SESSION_SECRET__|$SESSION_SECRET|g" getlood-authelia-config.yaml
sed -i "s|__ENCRYPTION_KEY__|$ENCRYPTION_KEY|g" getlood-authelia-config.yaml
sed -i "s|__HMAC_SECRET__|$HMAC_SECRET|g" getlood-authelia-config.yaml
sed -i "s|__PG_PASSWORD__|$PG_PASSWORD|g" getlood-authelia-config.yaml

# Ajouter les certificats (avec indentation correcte pour YAML)
CERT_CHAIN=$(cat ../scripts/certs/getlood-cert-chain.pem | sed 's/^/          /')
PRIVATE_KEY=$(cat ../scripts/certs/getlood-server-key.pem | sed 's/^/          /')

sed -i "s|__ISSUER_CERT_CHAIN__|$CERT_CHAIN|g" getlood-authelia-config.yaml
sed -i "s|__ISSUER_PRIVATE_KEY__|$PRIVATE_KEY|g" getlood-authelia-config.yaml

echo "✓ Configuration mise à jour avec succès"
```

### Étape 4 : Appliquer les ConfigMaps

```bash
kubectl apply -f getlood-authelia-config.yaml
kubectl apply -f getlood-assets-configmap.yaml

echo "✓ ConfigMaps créés avec succès"
```

### Étape 5 : Appliquer le Patch Kustomize

```bash
cd ../kustomize
kubectl apply -k .

echo "✓ Patch Kustomize appliqué avec succès"
```

### Étape 6 : Redémarrer Authelia

```bash
kubectl rollout restart deployment/authelia-backend -n os-framework
kubectl rollout status deployment/authelia-backend -n os-framework

echo "✓ Authelia redémarré avec succès"
```

### Étape 7 : Vérifier le Déploiement

```bash
# Vérifier que le pod est en cours d'exécution
kubectl get pods -n os-framework | grep authelia

# Vérifier les logs
kubectl logs -f deployment/authelia-backend -n os-framework

# Vérifier la configuration
kubectl get configmap getlood-authelia-config -n os-framework -o yaml
```

## ✅ Vérification

### Test 1 : TOTP Issuer

1. Créer un nouvel utilisateur dans Olares
2. Activer l'authentification à deux facteurs (2FA)
3. Scanner le QR code avec Google Authenticator
4. Vérifier que l'issuer affiche **"getlood.com"** au lieu de "terminus.os"

### Test 2 : Session Cookies

```bash
curl -I https://auth.getlood.com/api/verify
```

Vérifier que le cookie s'appelle **"getlood_session"** au lieu de "authelia_session".

### Test 3 : Interface de Connexion

1. Ouvrir `https://auth.getlood.com` dans un navigateur
2. Vérifier que le logo Getlood s'affiche
3. Vérifier que le thème utilise les couleurs Getlood (#0066FF, #00CC99)
4. Vérifier que le footer affiche "Powered by Getlood"

### Test 4 : Access Control

```bash
curl -H "X-Original-URL: https://app.getlood.com" \
  https://auth.getlood.com/api/verify
```

Vérifier que les règles d'accès s'appliquent correctement aux domaines `*.getlood.com`.

## 🔄 Mise à Jour

Lorsque Olares met à jour Authelia :

1. **Pull les changements** d'Olares :
   ```bash
   cd /path/to/Olares
   git pull origin main
   ```

2. **Réappliquer le patch Kustomize** :
   ```bash
   cd /path/to/Olares/getlood-authelia-rebranding/kustomize
   kubectl apply -k .
   ```

3. **Redémarrer Authelia** :
   ```bash
   kubectl rollout restart deployment/authelia-backend -n os-framework
   ```

Le patch Kustomize garantit que vos personnalisations Getlood sont préservées.

## 🗑️ Désinstallation

Pour revenir à la configuration Olares par défaut :

```bash
# Supprimer les ConfigMaps Getlood
kubectl delete configmap getlood-authelia-config -n os-framework
kubectl delete configmap getlood-authelia-assets -n os-framework

# Réappliquer la configuration Olares originale
kubectl apply -f /path/to/Olares/framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml

# Redémarrer Authelia
kubectl rollout restart deployment/authelia-backend -n os-framework
```

## 📊 Modifications Apportées

| Élément | Avant (Olares) | Après (Getlood) |
|---|---|---|
| **TOTP Issuer** | terminus.os | getlood.com |
| **Session Cookie Name** | authelia_session | getlood_session |
| **Session Domain** | example.com | getlood.com |
| **Access Control Domain** | *.myterminus.com | *.getlood.com |
| **LDAP Base DN** | dc=example,dc=com | dc=getlood,dc=com |
| **OIDC Client ID** | example | getlood-desktop |
| **SSL Certificates** | example.com | getlood.com |
| **Theme CSS** | Olares colors | Getlood colors (#0066FF, #00CC99) |
| **Logo** | Olares logo | Getlood logo |
| **Footer** | Powered by Olares | Powered by Getlood |

## 🐛 Dépannage

### Problème : Pod Authelia ne démarre pas

```bash
# Vérifier les logs
kubectl logs deployment/authelia-backend -n os-framework

# Vérifier les événements
kubectl describe pod -l app=authelia-backend -n os-framework
```

### Problème : Configuration non appliquée

```bash
# Vérifier que le ConfigMap existe
kubectl get configmap getlood-authelia-config -n os-framework

# Vérifier le contenu
kubectl get configmap getlood-authelia-config -n os-framework -o yaml
```

### Problème : Certificats invalides

```bash
# Vérifier les certificats générés
cd scripts
openssl x509 -in certs/getlood-server-cert.pem -text -noout

# Régénérer les certificats
./generate-getlood-certs.sh
```

### Problème : LDAP Connection Failed

Si vous voyez des erreurs de connexion LDAP, vérifiez que LLDAP utilise le même base DN :

```bash
# Vérifier la configuration LLDAP
kubectl get configmap lldap-config -n os-platform -o yaml

# Le base_dn doit être: dc=getlood,dc=com
```

## 🔐 Sécurité

### Secrets

Les secrets suivants sont utilisés :
- `jwt_secret` : Signature des tokens JWT
- `session_secret` : Chiffrement des sessions
- `hmac_secret` : Signature HMAC pour OIDC
- `encryption_key` : Chiffrement des données en DB
- `pg_password` : Mot de passe PostgreSQL

**Important** : Ne jamais commiter les secrets dans Git !

### Certificats

Les certificats SSL générés sont utilisés uniquement pour signer les tokens OIDC. Ils ne remplacent pas les certificats TLS/HTTPS de votre domaine.

## 📖 Documentation

- [Analyse du Rebranding](../AUTHELIA_REBRANDING_ANALYSIS.md) - Documentation complète de l'architecture Authelia
- [Documentation Authelia](https://www.authelia.com/configuration/prologue/introduction/)
- [Documentation Kustomize](https://kustomize.io/)
- [Documentation LLDAP](https://github.com/lldap/lldap)

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commiter les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Apache 2.0 - Voir [LICENSE](../LICENSE).

## 🆘 Support

Pour obtenir de l'aide :
1. Consulter la [documentation d'analyse](../AUTHELIA_REBRANDING_ANALYSIS.md)
2. Vérifier les logs Kubernetes
3. Ouvrir une issue sur GitHub

---

**Auteur** : Getlood Team
**Date** : 2025-11-17
**Version** : 1.0
**Statut** : Production Ready
