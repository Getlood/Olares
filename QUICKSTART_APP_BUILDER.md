# ⚡ Quick Start - Olares App Builder

## 🎯 Ce qu'il faut faire

Le chart Helm est prêt ✅
**MAIS** il faut d'abord publier l'image Docker de l'application !

---

## 📦 Étapes rapides (5 minutes)

### 1️⃣ Build et push de l'image Docker

```bash
# Se placer dans le projet
cd /Users/user/Documents/Getlood/Olares/olares-app-builder

# Login Docker Hub (remplacer avec votre username)
docker login

# Build l'image (⚠️ REMPLACER 'votre-username' !)
docker build -t votre-username/olares-app-builder:1.0.0 .

# Push l'image
docker push votre-username/olares-app-builder:1.0.0
```

### 2️⃣ Mettre à jour values.yaml

```bash
# Éditer values.yaml
nano olares-app-builder/values.yaml

# Changer cette ligne :
image:
  repository: YOUR_DOCKERHUB_USERNAME/olares-app-builder
# En :
image:
  repository: votre-username/olares-app-builder  # Votre vrai username
```

### 3️⃣ Re-packager le chart

```bash
cd /Users/user/Documents/Getlood/Olares

# Nettoyer
rm -rf /tmp/package olares-app-builder-v0.1.0.tar.gz

# Copier les fichiers
mkdir -p /tmp/package/olares-app-builder
cp olares-app-builder/{Chart.yaml,OlaresManifest.yaml,values.yaml,.helmignore} /tmp/package/olares-app-builder/
cp -r olares-app-builder/templates /tmp/package/olares-app-builder/

# Packager
cd /tmp/package
tar -czf /Users/user/Documents/Getlood/Olares/olares-app-builder-v0.1.0.tar.gz olares-app-builder/
```

### 4️⃣ Upload dans Olares

1. Ouvrir Olares DevBox
2. Upload `olares-app-builder-v0.1.0.tar.gz`
3. Install
4. Ouvrir depuis le Desktop

---

## ✅ Résultat attendu

- Pod démarre (status: Running)
- Interface web accessible
- Dashboard avec templates
- Wizard fonctionnel

---

## 🐛 Si ça ne marche pas

### ImagePullBackOff

L'image Docker n'est pas trouvée :
- Vérifiez que l'image est bien push : `docker pull votre-username/olares-app-builder:1.0.0`
- Vérifiez le nom dans values.yaml

### CrashLoopBackOff

Le pod crash au démarrage :
```bash
kubectl logs -n user-space-<username> <pod-name>
```

Regardez les logs pour voir l'erreur.

---

## 📖 Documentation complète

Voir `BUILD_AND_DEPLOY_APP_BUILDER.md` pour :
- Options de registry (Docker Hub, GHCR)
- Images privées
- Multi-architecture
- Security scanning
- Troubleshooting détaillé

---

## 🎉 C'est tout !

Une fois l'image push et le chart upload, vous pourrez créer des applications custom en quelques clics !
