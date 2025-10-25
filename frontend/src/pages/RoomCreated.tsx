// --------------- IMPORT
import React, { useState } from 'react';
import { useRoomTeamActions } from '../hooks/roomcreated/useRoomTeamActions';
import {
  Copy,
  Users,
  LogOut,
  Check,
  Settings,
  Play,
  Pause,
  Timer,
  Trophy,
  History,
  Gamepad2,
  Target,
  ShieldX,
  Crown,
  Eye,
  PlayCircle,
  PauseCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { useRoomCreatedMain } from '../hooks/roomcreated';
import type { User } from '@/types';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// --------------- Composant RoomCreated refactorisé
function RoomCreated() {
  // intégration useParams et useState
  const { roomCode: routeRoomCode } = useParams();
  const [tempUsername, setTempUsername] = useState('');
  const navigate = useNavigate();

  // Ancien design: constantes de style (classes Tailwind)
  const panel = 'bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700';
  const panelTight = 'bg-slate-800 rounded-xl p-4 shadow-md border border-slate-700';
  const chip = 'bg-slate-700 px-4 py-2 rounded-full border border-slate-600';
  const btnGhost = 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white';

  // Hook principal qui gère toute la logique
  const {
    // Données
    currentUser,
    currentRoom,
    permissions,
    inRoom,
    // États UI
    proposal,
    copied,
    showPlayersModal,
    showResetModal,
    teamJoinError,
    isJoiningTeam,
    historyEndRef,
    // Setters
    setProposal,
    setShowPlayersModal,
    setShowResetModal,
    setCopied,
    // Utilitaires
    formatTime,
    formatTimer,
    getUserCardData,
    showError,
    // Actions
    sendProposal,
    joinTeam,
    joinSpectator,
    startGame,
    pauseGame,
    handleLeaveRoom,
    handleResetGame,
    // Modal pseudo
    handleJoinRoom,
    socket,
  } = useRoomCreatedMain();

  // Fonction locale pour copier le lien de la room
  const copyRoomLink = async () => {
    if (!routeRoomCode) {
      console.warn('Room code indisponible pour la copie');
      return;
    }

    const roomUrl = `${window.location.origin}/room/${routeRoomCode}`;

    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = roomUrl;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(roomUrl);
      } else {
        fallbackCopy();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Clipboard API a échoué, fallback utilisé:', error);
      try {
        fallbackCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Erreur lors de la copie (fallback):', fallbackError);
      }
    }
  };

  // Garde: interdit les changements UNIQUEMENT pendant une manche active (isPlaying)
  const isRoundActive = Boolean(currentRoom?.gameState?.isPlaying);
  
  const safeJoinTeam = (team: 'red' | 'blue' | 'spectator', role?: 'sage' | 'disciple' | 'spectator') => {
    if (isRoundActive) {
      showError("Changements de rôle/équipe désactivés pendant la manche en cours");
      return;
    }
    joinTeam(team, role);
  };

  const safeJoinSpectator = () => {
    if (isRoundActive || Boolean(currentRoom?.gameState?.isPlaying)) {
      showError("Changements de rôle/équipe désactivés pendant la partie");
      return;
    }
    joinSpectator();
  };

  // Protection: si pas de room ou d'utilisateur
  if (!currentRoom || !currentUser) {
    return (
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Chargement de la room...</div>
      </div>
    );
  }

  // Données dérivées pour le JSX
  const gameState = currentRoom.gameState;
  const isGameActive = Boolean(gameState?.isPlaying);
  const currentRoundState = gameState?.rounds?.[gameState.currentRound];
  const currentPhaseIndex = currentRoundState?.currentPhase ?? 0;
  const currentPhaseState = currentRoundState?.phases?.[currentPhaseIndex];
  // Listes d'équipe et rôles déjà dérivées
  // Dérivations d'équipe et rôles
  const redTeam = currentRoom?.users?.filter((user: User) => user.team === 'red') ?? [];
  const blueTeam = currentRoom?.users?.filter((user: User) => user.team === 'blue') ?? [];
  const redSage = redTeam.find((u: User) => u.role === 'sage');
  const blueSage = blueTeam.find((u: User) => u.role === 'sage');

  // Ajout: intitulé de phase et affichage combiné
  const phaseTitles: Record<number, string> = {
    1: 'Choisissez votre mot',
    2: 'Choisissez vos interdits',
    3: 'Préparez votre laius !',
  };
  const phaseDisplay =
    currentPhaseIndex === 0 ? 'En attente' : `Phase ${currentPhaseIndex} - ${phaseTitles[currentPhaseIndex] ?? ''}`;
  const userTeam = currentUser?.team ?? 'spectator';
  const phaseLabel =
    currentRoom?.gameState?.currentPhase === 1
      ? 'Phase 1'
      : currentRoom?.gameState?.currentPhase === 2
        ? 'Phase 2'
        : currentRoom?.gameState?.currentPhase === 3
          ? 'Phase 3'
          : 'En attente';
  const teamWord =
    userTeam === 'red'
      ? currentRoom?.gameState?.teams?.red?.word
      : userTeam === 'blue'
        ? currentRoom?.gameState?.teams?.blue?.word
        : undefined;
  const userRole = typeof currentUser?.role === 'string' ? currentUser.role : null;
  const canJoinRed = !isJoiningTeam && userTeam !== 'red';
  const canJoinBlue = !isJoiningTeam && userTeam !== 'blue';
  const joinLabel = userTeam ? 'Changer' : 'Rejoindre';
  const spectators = currentRoom?.users?.filter((user: User) => user.team === 'spectator') ?? [];

  // Créateur et filtres sans créateur pour le modal
  const creatorToken = currentRoom?.creatorToken;
  const creatorUser = currentRoom?.users?.find((u: any) => (u.userToken ?? u.id) === creatorToken);
  const redTeamNoCreator = redTeam.filter((u: any) => (u.userToken ?? u.id) !== creatorToken);
  const blueTeamNoCreator = blueTeam.filter((u: any) => (u.userToken ?? u.id) !== creatorToken);
  const spectatorsNoCreator = spectators.filter((u: any) => (u.userToken ?? u.id) !== creatorToken);

  const isRedDisciple = userTeam === 'red' && userRole === 'disciple';
  const isBlueDisciple = userTeam === 'blue' && userRole === 'disciple';
  //onst redSage = redTeam.find((u: User) => u.role === 'sage');
  //onst blueSage = blueTeam.find((u: User) => u.role === 'sage');

  // Modal: calcul du modal pseudo uniquement si nécessaire
  const storedUsername =
    localStorage.getItem('username') ||
    (() => {
      try {
        const raw = localStorage.getItem('lastUsername');
        return raw ? JSON.parse(raw) : '';
      } catch {
        return '';
      }
    })();
  const showUsernameModal =
    !storedUsername && !inRoom && !permissions.isAdmin && Boolean(routeRoomCode ?? currentRoom?.code);

  {
    /* Fonction de rendu d'une carte utilisateur */
  }
  const renderUserCard = (user: User) => {
    const cardData = getUserCardData(user, currentUser);
    const avatarColor = cardData.teamColor === 'red' ? 'rose' : cardData.teamColor;
    return (
      <div
        className={`${cardData.bgColor} backdrop-blur-sm rounded-xl p-4 border hover:bg-opacity-30 transition-all duration-300 ${cardData.highlight}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${avatarColor}-500 rounded-full flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-semibold">{user.username}</p>
              <p className="text-white/60 text-xs">{cardData.isCurrentUser ? 'Vous' : cardData.role}</p>
            </div>
          </div>
          {cardData.role === 'sage' && <Crown className="w-4 h-4 text-yellow-400" />}
          {cardData.role === 'disciple' && <Users className="w-4 h-4 text-green-400" />}
        </div>

      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 min-h-screen transition-all duration-1000">
      {/* Modal pseudo */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/90 rounded-2xl p-6 w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-3 text-slate-800">Entrez votre pseudo</h2>
            <p className="text-sm text-slate-600 mb-4">Vous devez définir un pseudo pour rejoindre le salon.</p>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Ex: KenshoPlayer"
              className="w-full border border-slate-300 rounded-xl px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!tempUsername.trim() || !socket || !(routeRoomCode ?? currentRoom?.code)}
              onClick={async () => {
                const code = routeRoomCode ?? currentRoom?.code ?? '';
                const name = tempUsername.trim();
                if (!socket || !name || !code) return;

                const success = await handleJoinRoom(socket, name, code);
                if (!success) {
                  toast.error('Salon supprimé ou introuvable');
                  localStorage.removeItem('roomCode');
                  localStorage.removeItem('lastRoomCode');
                  navigate('/');
                }
              }}
            >
              Rejoindre le salon
            </button>
          </div>
        </div>
      )}

      {/* Fond animé */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4h-4zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse opacity-5 pointer-events-none"></div>

      {/* Erreur de join team */}
      {teamJoinError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg">
          {teamJoinError}
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-white text-3xl font-black tracking-wider">KENSHO</h1>
              <div className={chip}>
                <span className="text-white text-sm font-semibold">
                  Salon : <span className="text-yellow-300 font-bold">{currentRoom.code}</span>
                </span>
              </div>
              <button
                onClick={copyRoomLink}
                disabled={!routeRoomCode}
                className={`${btnGhost} px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copié !' : "Copier l'URL"}</span>
              </button>
              <button
                onClick={() => setShowPlayersModal(true)}
                className={`${chip} hover:bg-white/30 transition-all duration-200 cursor-pointer hover:scale-105`}
              >
                <span className="text-white text-sm font-semibold">
                  <Users className="w-4 h-4 inline mr-1" />
                  {currentRoom.users.length} joueurs
                </span>
              </button>
            </div>

            {/* Actions à droite */}
            <div className="flex items-center space-x-4">
              {/* Boutons de contrôle de jeu */}
              {permissions.canControlGame && (
                <>
                  {/* Bouton Jouer/Pause */}
                  <button
                    onClick={isGameActive ? pauseGame : startGame}
                    className="bg-green-500/80 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                  >
                    {isGameActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isGameActive ? 'Pause' : 'Jouer'}</span>
                  </button>

                  {/* Bouton Relancer */}
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="bg-orange-500/80 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 border border-white/30 flex items-center space-x-2 hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Relancer</span>
                  </button>
                </>
              )}

              {/* Bouton Quitter - toujours en dernier */}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500/80 hover:bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Barre de statut */}
      <div className="relative z-10 px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-white/20">
            <div className="grid grid-cols-4 gap-4 items-center">
              {/* Phase de jeu */}
              <div className="col-span-1">
                <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-2 border border-blue-300/30 text-center hover:bg-blue-500/30 transition-all duration-300">
                  <h3 className="text-white font-semibold text-sm">{phaseDisplay}</h3>
                </div>
              </div>
              {/* Temps restant (affichage + barre de progression) */}
              <div className="col-span-2">
                <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-3 border border-orange-300/30 hover:bg-orange-500/30 transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <Timer className="w-5 h-5 text-orange-300 mr-2" />
                    <span className="text-white font-bold text-lg">
                      {formatTimer(currentPhaseState?.timeRemaining || 0)}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-red-500"
                        style={{
                          width: currentPhaseState?.timer
                            ? `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  (((currentPhaseState.timer ?? 0) - (currentPhaseState.timeRemaining ?? 0)) /
                                    (currentPhaseState.timer ?? 1)) *
                                    100
                                )
                              )}%`
                            : '0%',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Score */}
              <div className="col-span-1">
                <div className="bg-purple-500/20 rounded-xl p-3 border border-purple-300/30 text-center hover:bg-purple-500/30 transition-all duration-300">
                  <div className="flex items-center justify-center mb-1">
                    <Trophy className="w-5 h-5 text-purple-300 mr-2" />
                    <span className="text-purple-200 text-sm font-semibold">Score</span>
                  </div>
                  <h3 className="text-white font-bold text-base">0 - 0</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area: grille fixe 5 colonnes */}
      <main className="relative z-10 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-5 gap-6 items-start">
            {/* Colonne gauche: ÉQUIPE ROUGE uniquement */}
            <div className="col-span-1">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <div className="text-center mb-6">
                  <div className="bg-rose-700/20 backdrop-blur-sm px-6 py-3 rounded-full border border-rose-600 inline-block">
                    <h3 className="text-rose-200 font-bold text-lg tracking-wide">ÉQUIPE ROUGE</h3>
                  </div>
                </div>

                {/* Sage Rouge */}
                <div className="mb-6">
                  <div className="mb-3">
                    <h4 className="text-white/90 text-sm font-semibold flex items-center mb-2">
                      <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                      Sage
                    </h4>
                    {currentUser.team !== 'red' ? (
                       <button
                         onClick={() => safeJoinTeam('red', 'sage')}
                         disabled={isJoiningTeam || isRoundActive || isGameActive || !!redSage}
                         className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-rose-300/30 hover:border-rose-300/50 hover:scale-105 disabled:opacity-50"
                       >
                         Rejoindre
                       </button>
                     ) : currentUser.role === 'disciple' ? (
                       <button
                         onClick={() => safeJoinTeam('red', 'sage')}
                         disabled={isJoiningTeam || isRoundActive || isGameActive}
                         className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-rose-300/30 hover:border-rose-300/50 hover:scale-105 disabled:opacity-50"
                       >
                         Échanger
                       </button>
                     ) : null}
                  </div>

                  {/* Carte Sage Rouge */}
                  <div className="space-y-3">
                    {redSage ? (
                      <div>{renderUserCard(redSage)}</div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 opacity-50">
                        <div className="text-center text-white/60 text-sm py-2">Aucun sage</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Disciples Rouges */}
                <div className="mb-6">
                  <div className="mb-3">
                    <h4 className="text-white/90 text-sm font-semibold flex items-center mb-2">
                      <Users className="w-4 h-4 mr-2 text-rose-400" />
                      Disciples
                    </h4>
                    {currentUser.team !== 'red' ? (
                      <button
                        onClick={() => safeJoinTeam('red', 'disciple')}
                        disabled={isJoiningTeam || isRoundActive || isGameActive}
                        className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-rose-300/30 hover:border-rose-300/50 hover:scale-105 disabled:opacity-50"
                      >
                        Rejoindre
                      </button>
                    ) : currentUser.role === 'sage' ? (
                      <button
                        onClick={() => safeJoinTeam('red', 'disciple')}
                        disabled={isJoiningTeam || isRoundActive || isGameActive}
                        className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-rose-300/30 hover:border-rose-300/50 hover:scale-105 disabled:opacity-50"
                      >
                        Échanger
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {redTeam.filter((user) => user.role === 'disciple').length > 0 ? (
                      redTeam
                        .filter((user) => user.role === 'disciple')
                        .map((disciple) => <div key={disciple.userToken}>{renderUserCard(disciple)}</div>)
                    ) : (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 opacity-50">
                        <div className="text-center text-white/60 text-sm py-2">Aucun disciple</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne centrale: barre de saisie + grille 2 colonnes (Historique / Mot) */}
            <div className="col-span-3">
              <div className={panel}>
                {/* Barre de saisie pleine largeur */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendProposal();
                  }}
                  className="mb-4"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      placeholder="Tapez votre réponse..."
                      className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold focus:bg-white/30 transition-all duration-300"
                    />
                    <button
                      type="submit"
                      disabled={!proposal.trim()}
                      className="bg-green-500/80 backdrop-blur-sm hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                  </div>
                </form>

                {/* Grille 2 colonnes: Historique (gauche) / Mot d’équipe (droite) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Historique */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <History className="w-5 h-5 text-white/70 mr-2" />
                        <span className="text-white font-semibold">Historique</span>
                      </div>
                      <div className="text-white/60 text-sm">{phaseLabel}</div>
                    </div>
                    <div className="text-white/70 text-sm">
                      {/* Liste historique */}
                      {((currentRoom?.messages ?? []).length === 0) ? (
                        <div className="text-white/50 text-center py-2">Aucun message</div>
                      ) : (
                        <div className="space-y-2">
                          {(currentRoom?.messages ?? []).map((msg) => {
                            const isWinry = msg.username === 'Winry';
                            return (
                              <div
                                key={msg.id}
                                className={`${isWinry ? 'bg-indigo-500/10 border-indigo-300/30' : 'bg-white/5 border-white/10'} rounded-md px-3 py-2 flex items-center justify-between`}
                              >
                                <div className={`${isWinry ? 'text-indigo-100' : 'text-white/80'}`}>
                                  <span className={`${isWinry ? 'text-indigo-200/70' : 'text-white/60'} text-xs mr-2`}>{formatTime(msg.timestamp)}</span>
                                  <span className={`font-semibold mr-1 ${isWinry ? 'text-indigo-200' : ''}`}>{msg.username}</span>
                                  <span className={`${isWinry ? 'text-indigo-100 italic' : 'text-white/70'}`}>{msg.message}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={historyEndRef}></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mot de l’équipe */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Target className="w-5 h-5 text-white/70 mr-2" />
                        <span className="text-white font-semibold">Mot de votre équipe</span>
                      </div>
                    </div>
                    <div className="text-white/70 text-sm">
                      {userTeam !== 'spectator' ? (
                        <div>
                          <div className="text-white/60 mb-2 text-xs">Visible uniquement par votre équipe</div>
                          <div className="text-white font-medium">{teamWord || 'Aucun mot choisi'}</div>
                        </div>
                      ) : (
                        <div className="text-white/60">Rejoignez une équipe pour voir le mot</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite: ÉQUIPE BLEUE + SPECTATEURS */}
            <div className="col-span-1 space-y-6">
              {/* ÉQUIPE BLEUE */}
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <div className="text-center mb-6">
                  <div className="bg-blue-700/20 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-600 inline-block">
                    <h3 className="text-blue-200 font-bold text-lg tracking-wide">ÉQUIPE BLEUE</h3>
                  </div>
                </div>

                {/* Sage Bleu */}
                <div className="mb-6">
                  <div className="mb-3">
                    <h4 className="text-white/90 text-sm font-semibold flex items-center mb-2">
                      <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                      Sage
                    </h4>
                    {currentUser.team === 'blue' ? (
                       currentUser.role === 'disciple' && (
                         <button
                           onClick={() => safeJoinTeam('blue', 'sage')}
                           disabled={isJoiningTeam || isRoundActive || isGameActive}
                           className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-blue-300/30 hover:border-blue-300/50 hover:scale-105 disabled:opacity-50"
                         >
                           Échanger
                         </button>
                       )
                     ) : (
                       <button
                         onClick={() => safeJoinTeam('blue', 'sage')}
                         disabled={isJoiningTeam || isRoundActive || isGameActive || !!blueSage}
                         className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-blue-300/30 hover:border-blue-300/50 hover:scale-105 disabled:opacity-50"
                       >
                         Rejoindre
                       </button>
                     )}
                  </div>

                  {/* Carte Sage Bleu */}
                  <div className="space-y-3">
                    {blueSage ? (
                      <div>{renderUserCard(blueSage)}</div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 opacity-50">
                        <div className="text-center text-white/60 text-sm py-2">Aucun sage</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Disciples Bleus */}
                <div className="mb-6">
                  <div className="mb-3">
                    <h4 className="text-white/90 text-sm font-semibold flex items-center mb-2">
                      <Users className="w-4 h-4 mr-2 text-blue-400" />
                      Disciples
                    </h4>
                    {currentUser.team === 'blue' ? (
                       currentUser.role === 'sage' && (
                         <button
                           onClick={() => safeJoinTeam('blue', 'disciple')}
                           disabled={isJoiningTeam || isRoundActive || isGameActive}
                           className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-blue-300/30 hover:border-blue-300/50 hover:scale-105 disabled:opacity-50"
                         >
                           Échanger
                         </button>
                       )
                     ) : (
                       <button
                         onClick={() => safeJoinTeam('blue', 'disciple')}
                         disabled={isJoiningTeam || isRoundActive || isGameActive}
                         className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-blue-300/30 hover:border-blue-300/50 hover:scale-105 disabled:opacity-50"
                       >
                         Rejoindre
                       </button>
                     )}
                  </div>
                  <div className="space-y-3">
                    {blueTeam.filter((user) => user.role === 'disciple').length > 0 ? (
                      blueTeam
                        .filter((user) => user.role === 'disciple')
                        .map((disciple) => <div key={disciple.userToken}>{renderUserCard(disciple)}</div>)
                    ) : (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 opacity-50">
                        <div className="text-center text-white/60 text-sm py-2">Aucun disciple</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SPECTATEURS */}
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <div className="text-center mb-6">
                  <div className="bg-gray-700/20 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-600 inline-block">
                    <h3 className="text-gray-200 font-bold text-lg tracking-wide">OBSERVATEURS</h3>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-white/90 text-sm font-semibold flex items-center mb-2">
                    <Eye className="w-4 h-4 mr-2 text-gray-400" />
                    Observateurs
                  </h4>
                  {currentUser.team !== 'spectator' && (
                    <button
                      onClick={() => safeJoinTeam('spectator', 'spectator')}
                      disabled={isJoiningTeam}
                      className="bg-gray-500/20 hover:bg-gray-500/40 text-gray-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border border-gray-300/30 hover:border-gray-300/50 hover:scale-105 disabled:opacity-50"
                    >
                      Rejoindre
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {spectators.map((spectator) => (
                    <div key={spectator.userToken}>{renderUserCard(spectator)}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Réinitialiser la partie</h3>
            <p className="text-white/80 mb-6">
              Êtes-vous sûr de vouloir réinitialiser la partie ? Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                }}
                className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-300/30 text-white py-2 rounded-lg transition-all duration-300"
              >
                Annuler
              </button>
              <button
                onClick={handleResetGame}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-300/30 text-white py-2 rounded-lg transition-all duration-300"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players Modal */}
      {showPlayersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-2" />
                Joueurs connectés ({currentRoom.users.length + 1})
              </h3>
              <button
                onClick={() => setShowPlayersModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Créateur de la room */}
              <div>
                <h4 className="text-rose-300 font-semibold mb-3 flex items-center">
                  <Crown className="w-4 h-4 mr-2" />
                  Créateur de la room
                </h4>
                <div className="bg-rose-500/10 border border-rose-300/30 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center mr-3">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">{currentUser.username}</span>
                    <span className="text-rose-300 text-sm ml-2">(Vous)</span>
                  </div>
                </div>
              </div>

              {/* Équipe Rouge */}
              {redTeam.length > 0 && (
                <div>
                  <h4 className="text-red-300 font-semibold mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Équipe Rouge ({redTeamNoCreator.length})
                  </h4>
                  <div className="space-y-2">
                    {redTeamNoCreator.map((user) => (
                      <div key={user.userToken} className="bg-red-500/10 border border-red-300/30 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                            {user.role === 'sage' ? (
                              <Crown className="w-4 h-4 text-white" />
                            ) : (
                              <Target className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="text-white font-medium">{user.username}</span>
                          <span className="text-red-300 text-sm ml-2">
                            ({user.role === 'sage' ? 'Sage' : 'Disciple'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Équipe Bleue */}
              {blueTeam.length > 0 && (
                <div>
                  <h4 className="text-blue-300 font-semibold mb-3 flex items-center">
                    <ShieldX className="w-4 h-4 mr-2" />
                    Équipe Bleue ({blueTeamNoCreator.length})
                  </h4>
                  <div className="space-y-2">
                    {blueTeamNoCreator.map((user) => (
                      <div key={user.userToken} className="bg-blue-500/10 border border-blue-300/30 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                            {user.role === 'sage' ? (
                              <Crown className="w-4 h-4 text-white" />
                            ) : (
                              <ShieldX className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="text-white font-medium">{user.username}</span>
                          <span className="text-blue-300 text-sm ml-2">
                            ({user.role === 'sage' ? 'Sage' : 'Disciple'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observateurs */}
              {spectators.length > 0 && (
                <div>
                  <h4 className="text-gray-300 font-semibold mb-3 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Observateurs ({spectatorsNoCreator.length})
                  </h4>
                  <div className="space-y-2">
                    {spectatorsNoCreator.map((user) => (
                      <div key={user.userToken} className="bg-gray-500/10 border border-gray-300/30 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-white font-medium">{user.username}</span>
                          <span className="text-gray-300 text-sm ml-2">(Observateur)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucun autre joueur */}
              {currentRoom.users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60">Aucun autre joueur connecté</p>
                  <p className="text-white/40 text-sm mt-1">Partagez le lien de la room pour inviter des joueurs</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowPlayersModal(false)}
                className="w-full bg-slate-600/50 hover:bg-slate-600/70 text-white py-2 rounded-lg transition-all duration-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomCreated;
