# 🧪 Instructions de test - Stalwart v0.0.2

## 📦 Fichier à uploader

```
/Users/user/Documents/Getlood/Olares/stalwart-v0.0.2.tar.gz
```

## 🗑️ Étape 1 : Désinstaller la v0.0.1

1. Ouvrir **Olares Market** ou **DevBox/Studio**
2. Trouver l'application **Stalwart Mail Server**
3. Cliquer sur **Uninstall** ou **Désinstaller**
4. **Attendre** que la désinstallation soit complète

### Vérification (optionnel)

Si vous avez accès SSH :

```bash
# Vérifier que le pod est supprimé
kubectl get pods -n user-space-poudlardo | grep stalwart
# Ne devrait rien retourner

# Vérifier que le PVC existe toujours (si vous voulez garder les données)
kubectl get pvc -n user-space-poudlardo | grep stalwart
```

## 📤 Étape 2 : Uploader la v0.0.2

1. Ouvrir **DevBox/Studio** dans Olares Desktop
2. Cliquer sur **Import Chart** ou **Upload Custom Application**
3. Sélectionner le fichier : `stalwart-v0.0.2.tar.gz`
4. Attendre la validation ✅

**Note** : La validation devrait réussir sans erreur (appid et noms sont corrects).

## 🚀 Étape 3 : Installer l'application

1. Une fois l'upload réussi, cliquer sur **Install**
2. **Observer** le processus d'installation
3. **Attendre** que le statut passe de "Installing" à "Running"

### ⏱️ Temps attendu

- **Initialisation** : ~30-60 secondes
- **Premier démarrage** : Stalwart crée sa base de données
- **Probes readiness** : 30 secondes avant "Ready"
- **Total** : ~1-2 minutes

## 🔍 Étape 4 : Vérifier le statut

### Via l'interface Olares

Dans **Olares Market** ou **Desktop** :
- ✅ L'icône Stalwart devrait être visible
- ✅ Le statut devrait être "Running" (vert)
- ❌ Plus de "CrashLoopBackOff"

### Via SSH (si disponible)

```bash
# 1. Vérifier le pod
kubectl get pods -n user-space-poudlardo | grep stalwart
# Devrait afficher : stalwart-xxx   1/1   Running   0   2m

# 2. Voir les logs
kubectl logs -n user-space-poudlardo <pod-name> -c stalwart
# Devrait montrer l'initialisation de Stalwart

# 3. Vérifier les événements
kubectl get events -n user-space-poudlardo --sort-by='.lastTimestamp' | grep stalwart | tail -20
# Ne devrait pas montrer d'erreurs
```

## ✅ Étape 5 : Tester l'accès

1. Cliquer sur l'icône **Stalwart Mail** dans le Desktop Olares
2. Une nouvelle fenêtre/iframe devrait s'ouvrir
3. Vous devriez voir l'**interface web de Stalwart**
4. **Se connecter** avec :
   - **Username** : `admin`
   - **Password** : `changeme` (ou celui configuré dans values.yaml)

## 🎯 Critères de succès

| Critère | Attendu | Comment vérifier |
|---------|---------|------------------|
| Upload chart | ✅ Validation réussie | Pas d'erreur 400 |
| Installation | ✅ Complète | Statut "Running" |
| Pod status | ✅ Running (1/1) | `kubectl get pods` |
| Logs | ✅ Pas d'erreur | `kubectl logs` |
| Interface web | ✅ Accessible | Clic sur icône Desktop |
| Login | ✅ Connexion possible | Credentials admin |

## 🐛 Si le problème persiste

### Symptôme : CrashLoopBackOff continue

```bash
# Récupérer les logs du crash
kubectl logs -n user-space-poudlardo <pod-name> -c stalwart --previous

# Décrire le pod pour voir les erreurs
kubectl describe pod -n user-space-poudlardo <pod-name>

# Vérifier les events
kubectl get events -n user-space-poudlardo --field-selector involvedObject.name=<pod-name>
```

**Puis** : Envoyez-moi ces logs, je pourrai diagnostiquer le problème exact.

### Symptôme : Pod reste en "Pending"

```bash
# Vérifier les ressources
kubectl describe pod -n user-space-poudlardo <pod-name>
# Regarder la section "Events" pour voir pourquoi il ne démarre pas
```

### Symptôme : Interface web inaccessible (mais pod Running)

```bash
# Vérifier les services
kubectl get svc -n user-space-poudlardo | grep stalwart

# Tester la connectivité interne
kubectl exec -n user-space-poudlardo <pod-name> -c stalwart -- curl localhost:8080
```

## 📊 Logs attendus (normal)

Lorsque tout fonctionne, les logs devraient ressembler à :

```
[INFO] Stalwart Mail Server starting...
[INFO] Initializing database at /opt/stalwart...
[INFO] Creating default configuration...
[INFO] Generating admin password...
[INFO] Starting HTTP server on port 8080...
[INFO] Starting SMTP server on port 25...
[INFO] Starting IMAP server on port 143...
[INFO] Server is ready
```

## 📊 Logs d'erreur (à éviter)

Si vous voyez ces erreurs, partagez-les :

```
[ERROR] Failed to open database...
[ERROR] Permission denied...
[ERROR] Invalid configuration...
[FATAL] Cannot bind to port...
```

## 🎉 Succès !

Si tout fonctionne :
1. ✅ Le pod est Running
2. ✅ L'interface web est accessible
3. ✅ Vous pouvez vous connecter
4. ✅ Pas de CrashLoopBackOff

**Prochaines étapes** :
- Changer le mot de passe admin
- Configurer votre domaine mail
- Créer des comptes email
- Configurer les DNS (MX, SPF, DKIM, DMARC)

---

**Bonne chance pour le test ! Tenez-moi au courant du résultat.** 🚀
