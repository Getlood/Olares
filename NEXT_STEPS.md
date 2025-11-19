# 🚀 Prochaines étapes - Stalwart v0.1.0

## ✅ Ce qui est prêt

Le chart Stalwart a été complètement refait et est maintenant :

- ✓ Conforme aux guidelines Olares
- ✓ Simplifié et maintenable
- ✓ Testé et validé
- ✓ Packagé et prêt à uploader

## 📦 Fichier à uploader

```
/Users/user/Documents/Getlood/Olares/stalwart-v0.1.0.tar.gz
```

**Taille** : 4.1 KB
**Version** : 0.1.0

## 🎯 Étapes d'installation

### 1. Nettoyer les anciennes versions

Si vous avez des versions précédentes installées :

```bash
# Désinstaller l'ancienne version dans Olares Market/DevBox
# Ou via kubectl :
kubectl delete application stalwart -n user-space-<username>

# Supprimer le PVC (optionnel, pour repartir de zéro)
kubectl delete pvc stalwart-data -n user-space-<username>
```

### 2. Uploader le nouveau chart

1. Ouvrir **DevBox/Studio** dans Olares
2. Cliquer sur **Import Chart** ou **Upload Custom Application**
3. Sélectionner `stalwart-v0.1.0.tar.gz`
4. Attendre la validation ✅

### 3. Installer l'application

1. Cliquer sur **Install**
2. Observer le processus :
   - Pending → Running (devrait prendre 1-2 minutes)
3. Vérifier qu'il n'y a pas de CrashLoopBackOff

### 4. Premier accès

1. Cliquer sur l'icône **Stalwart Admin** dans le Desktop
2. Se connecter :
   - **Username** : `admin`
   - **Password** : `changeme123`
3. **IMPORTANT** : Changer immédiatement le mot de passe !

## 🔍 Vérifications

### Via l'interface Olares

- ✓ L'icône apparaît dans le Desktop
- ✓ Le statut est "Running" (vert)
- ✓ L'interface web s'ouvre sans erreur

### Via kubectl (si disponible)

```bash
# Vérifier le pod
kubectl get pods -n user-space-<username> | grep stalwart
# Devrait afficher : stalwart-xxx   1/1   Running

# Voir les logs
kubectl logs -n user-space-<username> <pod-name>
# Devrait montrer l'initialisation de Stalwart

# Vérifier le service
kubectl get svc -n user-space-<username> | grep stalwart

# Vérifier le PVC
kubectl get pvc -n user-space-<username> | grep stalwart
```

## ⚙️ Configuration post-installation

### 1. Changer le mot de passe

Dans l'interface web :
1. Aller dans Settings
2. Changer le mot de passe admin
3. Sauvegarder

### 2. Configurer le domaine mail

1. Configurer votre domaine (ex: `mail.example.com`)
2. Ajouter les enregistrements DNS :

```dns
# MX Record
example.com.           IN  MX  10 mail.example.com.

# A Record
mail.example.com.      IN  A   <VOTRE_IP>

# SPF
example.com.           IN  TXT "v=spf1 mx ~all"

# DMARC
_dmarc.example.com.    IN  TXT "v=DMARC1; p=quarantine"
```

### 3. Configurer DKIM

1. Générer une clé DKIM dans Stalwart
2. Ajouter l'enregistrement DNS fourni

## 📚 Documentation

### Fichiers de référence

- **`REWRITE_SUMMARY_v0.1.0.md`** - Détails de la réécriture
- **`CHANGELOG.md`** - Historique des versions
- **`stalwart/README.md`** - Guide utilisateur
- **`stalwart/templates/NOTES.txt`** - Instructions post-install

### Ressources externes

- Site web : https://stalw.art
- Documentation : https://stalw.art/docs
- Code source : https://github.com/stalwartlabs/stalwart
- Issues : https://github.com/stalwartlabs/stalwart/issues

## 🐛 En cas de problème

### Le pod ne démarre pas

```bash
# Voir les événements
kubectl describe pod -n user-space-<username> <pod-name>

# Voir les logs
kubectl logs -n user-space-<username> <pod-name>
```

### CrashLoopBackOff

```bash
# Logs du crash précédent
kubectl logs -n user-space-<username> <pod-name> --previous
```

### Interface web inaccessible

1. Vérifier que le pod est Running
2. Vérifier que le service existe
3. Vérifier l'entrance dans OlaresManifest

## 🎯 Fonctionnalités à tester

Une fois installé et configuré :

- [ ] Accès à l'interface web
- [ ] Changement du mot de passe
- [ ] Création d'un compte email
- [ ] Envoi d'un email de test
- [ ] Réception d'un email de test
- [ ] Configuration IMAP dans un client mail
- [ ] Redémarrage du pod (persistence des données)

## 💡 Améliorations futures possibles

Si tout fonctionne bien, on pourra ajouter plus tard :

- Configuration PostgreSQL externe
- Exposition de tous les ports mail (587, 465, 110, 995)
- Configuration anti-spam avancée
- Multiple domaines
- Backup automatique
- Monitoring et alertes

## 📝 Notes importantes

- **Mot de passe** : `changeme123` - À CHANGER IMMÉDIATEMENT !
- **Ports** : Seuls les ports essentiels sont exposés (http, smtp, imap, imaps)
- **Stockage** : 10 Gi par défaut (configurable dans values.yaml)
- **Ressources** : 256Mi-1Gi RAM, 100m-1000m CPU

---

## ✨ Résumé

1. **Upload** : `stalwart-v0.1.0.tar.gz`
2. **Install** : Via Olares Market/DevBox
3. **Access** : Via Desktop Olares
4. **Configure** : Mot de passe + domaine + DNS
5. **Test** : Envoi/réception d'emails

**Le chart est prêt ! Bonne chance ! 🚀**
