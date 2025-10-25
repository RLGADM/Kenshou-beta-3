# Guide de débogage Socket.IO Frontend/Backend

## Problèmes identifiés dans votre configuration

### 1. **Configuration CORS incomplète**
- ✅ **Corrigé**: Ajout de headers spécifiques et méthodes complètes
- ✅ **Corrigé**: Ajout de votre nouveau domaine Netlify dans les origines autorisées

### 2. **Ordre des transports**
- ❌ **Problème**: WebSocket en premier peut causer des problèmes sur Render
- ✅ **Solution**: Utiliser `['polling', 'websocket']` en production

### 3. **Gestion des événements**
- ❌ **Problème**: Les listeners peuvent ne pas être configurés avant l'émission
- ✅ **Solution**: Délai de 100ms après `roomJoined` avant d'envoyer `gameStateUpdate`

### 4. **Debug insuffisant**
- ❌ **Problème**: Pas assez de logs pour identifier les problèmes
- ✅ **Solution**: Ajout de logs complets côté serveur et client

## Comment tester la communication

### 1. **Test local d'abord**
```bash
# Terminal 1 - Serveur
npm run server

# Terminal 2 - Client
npm run dev
```

### 2. **Utiliser le fichier de test HTML**
- Ouvrir `test-socket-connection.html` dans votre navigateur
- Tester la connexion avec différents transports
- Vérifier les événements en temps réel

### 3. **Utiliser le debugger intégré**
- Le composant `SocketDebugger` est maintenant intégré
- Cliquez sur l'icône en bas à droite pour l'ouvrir
- Surveillez tous les événements entrants/sortants

## Checklist de débogage

### ✅ Côté serveur (Render)
- [ ] CORS configuré pour votre domaine Netlify
- [ ] Logs activés pour tous les événements
- [ ] `socket.onAny()` pour capturer tous les événements
- [ ] Vérification que les utilisateurs sont bien enregistrés
- [ ] GameState initialisé correctement

### ✅ Côté client (Netlify)
- [ ] URL du serveur correcte (HTTPS en production)
- [ ] Transports configurés pour la production
- [ ] Gestion des erreurs de connexion
- [ ] Listeners configurés avant les émissions
- [ ] Debug activé pour voir tous les événements

## Commandes de test utiles

### Test de connexion basique
```javascript
// Dans la console du navigateur
socket.emit('ping');
socket.emit('debugGetUsers');
```

### Test de création de salon
```javascript
socket.emit('createRoom', 'TestUser');
```

### Test de changement d'équipe
```javascript
socket.emit('joinTeam', 'red', 'disciple');
```

## Problèmes spécifiques à Render

1. **WebSocket peut être instable** → Utiliser polling en premier
2. **Timeout plus court** → Réduire les timeouts
3. **Cold start** → Le serveur peut mettre du temps à démarrer

## Problèmes spécifiques à Netlify

1. **HTTPS obligatoire** → S'assurer d'utiliser HTTPS pour le serveur
2. **CORS strict** → Bien configurer les origines autorisées

## Prochaines étapes

1. **Déployez le serveur mis à jour** sur Render
2. **Testez avec le fichier HTML** pour vérifier la connexion
3. **Utilisez le debugger intégré** dans votre app React
4. **Surveillez les logs** côté serveur pour identifier les problèmes

## Logs à surveiller

### Côté serveur
```
[SOCKET] New connection: abc123 from 1.2.3.4
[EVENT IN] abc123 -> joinTeam: ["red", "disciple"]
[TEAM] User abc123 joining team red as disciple
[TEAM] Success for TestUser
```

### Côté client
```
[CLIENT EVENT OUT] joinTeam: ["red", "disciple"]
[CLIENT EVENT IN] teamJoinSuccess: [{team: "red", role: "disciple", gameState: {...}}]
```

Si vous ne voyez pas ces logs, c'est qu'il y a un problème de communication.