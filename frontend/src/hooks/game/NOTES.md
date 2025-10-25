Nouvelle structure de fichier et hooks...

- Créer le hook useGameState dans hooks/game/useGameState.ts
- Créer le hook useGameTimer dans hooks/game/useGameTimer.ts
- Créer le hook useGameHistory dans hooks/game/useGameHistory.ts

Cela permettrait une meilleure séparation des responsabilités :

- useGameState : gestion de l'état du jeu (score, tour, phases, mots, etc.)
- useGameTimer : gestion du temps de jeu
- useGameHistory : gestion de l'historique des actions

La nouvelle implémentation regroupera ces hooks dans useRoomGameLogic.
