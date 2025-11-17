# Analyse de l'Authentification Authelia dans Olares

## 📋 Vue d'Ensemble

Authelia est le système d'authentification et d'autorisation utilisé par Olares. Il fournit :
- **Authentification multi-facteurs (MFA)** : TOTP, WebAuthn
- **Single Sign-On (SSO)** : Via OpenID Connect (OIDC)
- **Contrôle d'accès** : Règles basées sur les domaines, utilisateurs, groupes
- **Gestion de session** : Cookies sécurisés avec domaines multiples

## 🏗️ Architecture

### 1. Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Authelia Frontend (beclab/login:v1.5.11)                   │
│  Namespace: user-space-{username}                            │
│  Port: 80                                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Authelia Backend (beclab/auth:0.2.40)                       │
│  Namespace: os-framework                                     │
│  Port: 9091                                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┼─────────┬─────────────┐
         ▼         ▼         ▼             ▼
    ┌────────┐ ┌──────┐ ┌────────┐   ┌─────────┐
    │ LLDAP  │ │ Nats │ │Postgres│   │  Redis  │
    │ :3890  │ │ :4222│ │ :5432  │   │ (futur) │
    └────────┘ └──────┘ └────────┘   └─────────┘
```

### 2. Flux d'Authentification

```
1. User accède à https://app.example.myterminus.com
   ↓
2. Traefik/Nginx redirige vers Authelia (/api/verify)
   ↓
3. Authelia vérifie le cookie de session (authelia_session)
   ↓
4. Si pas de session valide → Redirection vers login
   ↓
5. User entre username + password
   ↓
6. Authelia vérifie via LDAP (lldap-service.os-platform:3890)
   ↓
7. Si activé : demande TOTP (code 2FA)
   ↓
8. Authelia crée une session et retourne un cookie
   ↓
9. User est redirigé vers l'application originale
```

## 🔑 Composants Clés à Rebrander

### 1. **TOTP Issuer** (Authenticator Apps)
**Localisation** : `framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml:124`

```yaml
totp:
  issuer: terminus.os  # ← À remplacer par "getlood.com"
```

**Impact** :
- Google Authenticator, Authy afficheront "getlood.com" au lieu de "terminus.os"
- Les utilisateurs verront le bon branding dans leurs apps 2FA

### 2. **Session Cookie Name**
**Localisation** : `framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml:175`

```yaml
session:
  secret: {{ $session_secret | b64dec }}
  name: authelia_session  # ← À remplacer par "getlood_session"
  same_site: 'none'
```

**Impact** :
- Les cookies dans le navigateur s'appelleront "getlood_session"
- Important pour le debugging et l'identification

### 3. **Session Domain**
**Localisation** : `framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml:181-182`

```yaml
cookies:
  - domain: 'example.com'  # ← À remplacer par "getlood.com"
    authelia_url: https://authelia-svc.example.com/  # ← À remplacer
```

**Impact** :
- Détermine quels domaines peuvent utiliser le cookie de session
- Permet le SSO entre `*.getlood.com`

### 4. **Access Control Domains**
**Localisation** : `framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml:163-170`

```yaml
access_control:
  config_type: terminus
  default_policy: deny
  rules:
    - domain: example.myterminus.com  # ← À remplacer par "*.getlood.com"
      policy: one_factor
    - domain: 'files.example.myterminus.com'  # ← À remplacer
      policy: two_factor
```

**Impact** :
- Définit les règles d'accès pour les domaines Getlood
- Contrôle qui peut accéder à quoi

### 5. **LDAP Base DN**
**Localisation** : `framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml:144-156`

```yaml
lldap:
  url: ldap://lldap-service.os-platform:3890
  base_dn: dc=example,dc=com  # ← À remplacer par "dc=getlood,dc=com"
  additional_users_dn: ou=users
  additional_groups_dn: ou=groups
  user: cn=admin,dc=example,dc=com  # ← À remplacer
  password: adminpassword
```

**Impact** :
- Structure de l'annuaire LDAP
- Doit correspondre à la configuration de LLDAP

### 6. **OIDC Clients**
**Localisation** : `framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml:330-356`

```yaml
clients:
  - id: example  # ← À remplacer par "getlood-desktop" ou autre
    description: example
    secret: '$pbkdf2-sha512$...'
    redirect_uris:
      - https://www.example.com/auth/auth/openid_connect/callback  # ← À remplacer
```

**Impact** :
- Applications qui utilisent Authelia pour l'authentification
- Desktop app, mobile app, web apps tierces

### 7. **SSL Certificates**
**Localisation** : `framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml:207-317`

```yaml
identity_providers:
  oidc:
    issuer_certificate_chain: |
      -----BEGIN CERTIFICATE-----
      # Certificat pour example.com ← À remplacer par getlood.com
      -----END CERTIFICATE-----
    issuer_private_key: |
      -----BEGIN RSA PRIVATE KEY-----
      # Clé privée pour example.com ← À remplacer
      -----END RSA PRIVATE KEY-----
```

**Impact** :
- Signature des tokens JWT OIDC
- Validation des certificats par les clients

## 🗄️ Dépendances Externes

### 1. **LLDAP (Lightweight LDAP)**
- **Service** : `lldap-service.os-platform:3890`
- **Base DN** : `dc=example,dc=com` → `dc=getlood,dc=com`
- **Rôle** : Stockage des utilisateurs et groupes
- **Note** : Doit également être rebrandé si géré par Olares

### 2. **PostgreSQL**
- **Service** : `citus-headless.os-platform:5432`
- **Database** : `os_framework_authelia`
- **User** : `authelia_os_framework`
- **Rôle** : Stockage des sessions, tentatives de connexion, configurations OIDC

### 3. **NATS (Message Queue)**
- **Service** : `nats.os-platform:4222`
- **User** : `os-authelia`
- **Subjects** : `os.notification`, `os.users`, `os.groups`
- **Rôle** : Communication événementielle (notifications, changements utilisateurs)

### 4. **Redis (Optionnel)**
- **Statut** : Pas encore utilisé dans la config actuelle
- **Rôle potentiel** : Cache de sessions pour améliorer les performances

## 🔐 Secrets Kubernetes

**Secret** : `authelia-secrets` dans namespace `os-framework`

```yaml
data:
  jwt_secret: <base64>       # Signature des tokens JWT
  session_secret: <base64>   # Chiffrement des sessions
  hmac_secret: <base64>      # Signature HMAC pour OIDC
  encryption_key: <base64>   # Chiffrement des données en DB
  redis_password: <base64>   # (futur)
  pg_password: <base64>      # Mot de passe PostgreSQL
  nats_password: <base64>    # Mot de passe NATS
```

**Important** : Ces secrets doivent être **préservés** lors du rebranding pour ne pas perdre les sessions existantes.

## 📊 Flux de Données

### Authentification

```
User Login
  ↓
Frontend (beclab/login) → Backend (beclab/auth)
  ↓
LDAP Check → lldap-service.os-platform:3890
  ↓
TOTP Verify (si activé) → Storage PostgreSQL
  ↓
Session Create → PostgreSQL + Cookie
  ↓
Event Publish → NATS (os.users)
  ↓
Redirect to App
```

### Vérification de Session

```
App Request
  ↓
Traefik/Nginx → Authelia /api/verify
  ↓
Cookie Check → authelia_session
  ↓
Session Validate → PostgreSQL
  ↓
Policy Check → access_control rules
  ↓
200 OK (authorized) OR 302 Redirect (unauthorized)
```

## 🎯 Points de Rebranding

### Niveau 1 : Configuration (CRITIQUE)
- ✅ `totp.issuer` : terminus.os → getlood.com
- ✅ `session.name` : authelia_session → getlood_session
- ✅ `session.cookies.domain` : example.com → getlood.com
- ✅ `access_control.rules.domain` : *.myterminus.com → *.getlood.com
- ✅ `lldap.base_dn` : dc=example,dc=com → dc=getlood,dc=com
- ✅ `oidc.clients.id` : example → getlood-desktop
- ✅ `oidc.clients.redirect_uris` : example.com → getlood.com
- ✅ `oidc.issuer_certificate_chain` : Certificats getlood.com
- ✅ `oidc.issuer_private_key` : Clé privée getlood.com

### Niveau 2 : Assets Frontend (IMPORTANT)
- ⚠️ Logo dans `beclab/login:v1.5.11` (image Docker)
- ⚠️ CSS/Thème dans `beclab/login:v1.5.11`
- ⚠️ Textes/Traductions dans l'interface

**Note** : Si l'image Docker `beclab/login` ne peut pas être modifiée, il faudra :
1. Fork l'image
2. Remplacer les assets
3. Publier une nouvelle image `getlood/login:v1.0.0`
4. Mettre à jour le Deployment

### Niveau 3 : Documentation (OPTIONNEL)
- 📝 README.md
- 📝 Commentaires de code
- 📝 Noms de variables

## 🛠️ Stratégie de Rebranding

### Option 1 : Kustomize Overlay (RECOMMANDÉE)

**Avantages** :
- ✅ Ne modifie pas le code source d'Olares
- ✅ Facile à mettre à jour quand Olares évolue
- ✅ Garde les modifications séparées

**Structure** :
```
getlood-authelia-rebranding/
├── configs/
│   ├── getlood-authelia-config.yaml      # ConfigMap avec config rebrandée
│   └── getlood-assets-configmap.yaml     # Assets (CSS, logo)
├── scripts/
│   └── generate-getlood-certs.sh         # Génération certificats
├── kustomize/
│   └── kustomization.yaml                # Patch pour appliquer le rebranding
└── README.md
```

**Déploiement** :
```bash
# Appliquer le patch Kustomize
kubectl apply -k getlood-authelia-rebranding/kustomize/

# Redémarrer Authelia
kubectl rollout restart deployment/authelia-backend -n os-framework
```

### Option 2 : Fork Direct (ALTERNATIVE)

**Avantages** :
- ✅ Contrôle total
- ✅ Modifications permanentes

**Inconvénients** :
- ❌ Difficile à maintenir lors des mises à jour d'Olares
- ❌ Nécessite de merger les changements upstream

## 🚨 Points d'Attention

### 1. Certificats SSL
Les certificats OIDC doivent :
- Correspondre au domaine `getlood.com`
- Avoir une chaîne de certificats valide (CA + Server)
- Utiliser une clé RSA ou ECDSA

**Génération** :
```bash
# Générer une CA
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -key ca-key.pem -out ca-cert.pem -days 3650 \
  -subj "/CN=getlood.com CA"

# Générer un certificat serveur
openssl genrsa -out server-key.pem 4096
openssl req -new -key server-key.pem -out server.csr \
  -subj "/CN=getlood.com"
openssl x509 -req -in server.csr -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem -days 3650
```

### 2. LDAP Base DN
Si vous changez `base_dn` de `dc=example,dc=com` à `dc=getlood,dc=com`, vous devez :
1. Vérifier que LLDAP utilise le même base DN
2. Migrer les utilisateurs existants si nécessaire
3. Mettre à jour toutes les références dans Olares

### 3. Sessions Existantes
Changer `session.name` invalide toutes les sessions actives :
- Les utilisateurs devront se reconnecter
- Planifier pendant une fenêtre de maintenance

### 4. OIDC Clients
Si des applications externes utilisent Authelia :
- Mettre à jour leurs configurations avec les nouveaux redirect_uris
- Mettre à jour les client_id si modifiés
- Tester chaque intégration

## 📝 Checklist de Rebranding

### Préparation
- [ ] Backup de la configuration actuelle
- [ ] Documentation des domaines actuels
- [ ] Liste des applications OIDC connectées
- [ ] Export des utilisateurs LDAP (si migration nécessaire)

### Génération des Assets
- [ ] Générer les certificats SSL Getlood
- [ ] Créer le logo Getlood (SVG)
- [ ] Créer le thème CSS Getlood
- [ ] Préparer les traductions/textes

### Configuration
- [ ] Créer `getlood-authelia-config.yaml`
- [ ] Créer `getlood-assets-configmap.yaml`
- [ ] Créer le script de génération de certificats
- [ ] Créer le `kustomization.yaml`

### Tests
- [ ] Test en environnement de dev
- [ ] Vérifier TOTP issuer dans Google Authenticator
- [ ] Vérifier les cookies dans le navigateur
- [ ] Tester le login/logout
- [ ] Tester l'accès aux applications
- [ ] Vérifier les logs Authelia

### Déploiement
- [ ] Planifier une fenêtre de maintenance
- [ ] Appliquer les ConfigMaps
- [ ] Appliquer le patch Kustomize
- [ ] Redémarrer Authelia
- [ ] Vérifier le fonctionnement
- [ ] Informer les utilisateurs

### Post-Déploiement
- [ ] Monitorer les logs
- [ ] Vérifier les métriques
- [ ] Collecter les retours utilisateurs
- [ ] Documenter les changements

## 🔗 Références

- [Authelia Documentation](https://www.authelia.com/)
- [Authelia Configuration](https://www.authelia.com/configuration/prologue/introduction/)
- [OIDC Configuration](https://www.authelia.com/configuration/identity-providers/oidc/)
- [Kustomize](https://kustomize.io/)
- [LLDAP](https://github.com/lldap/lldap)

---

**Auteur** : Claude Code
**Date** : 2025-11-17
**Version** : 1.0
