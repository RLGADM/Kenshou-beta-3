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
// Dans le composant RoomCreated (déclaration des styles classiques)
// Dans RoomCreated(), déclare les styles classiques pour cohérence
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
    // initialisation des consts

    // Setters
    setProposal,
    setShowPlayersModal,
    setShowResetModal,

    // Utilitaires
    formatTime,
    formatTimer,
    getUserCardData,

    // Actions
    copyRoomLink,
    sendProposal,
    joinTeam,
    joinSpectator,
    startGame,
    pauseGame,
    handleLeaveRoom,
    handleResetGame,
    // Nouveaux pour modal pseudo
    handleJoinRoom,
    socket,
  } = useRoomCreatedMain();

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
  const redTeam = currentRoom?.users?.filter((user: User) => user.team === 'red') ?? [];
  const blueTeam = currentRoom?.users?.filter((user: User) => user.team === 'blue') ?? [];
  const spectators = currentRoom?.users?.filter((user: User) => user.team === 'spectator') ?? [];
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
  // vérification si modal nécessaire
  const showUsernameModal =
    !storedUsername && !inRoom && !permissions.isAdmin && Boolean(routeRoomCode ?? currentRoom?.code);

  // pré calcul
  const redSage = redTeam.find((u: User) => u.role === 'sage');
  const blueSage = blueTeam.find((u) => u.role === 'sage');
  // Fonction de rendu d'une carte utilisateur
  const renderUserCard = (user: User) => {
    const cardData = getUserCardData(user, currentUser);
    return (
      <div
        className={`${cardData.bgColor} backdrop-blur-sm rounded-xl p-4 border hover:bg-opacity-30 transition-all durée-300 ${cardData.highlight}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 bg-${cardData.teamColor}-500 rounded-full flex items-center justify-center shadow-lg`}
            >
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

  // Déterminer l’affichage du modal pseudo

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 min-h-screen transition-all duration-1000">
      {/* Modal pseudo (navigation privée / pas de username) */}
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
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4h-4zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse opacity-5 pointer-events-none"></div>
      {/* Error Toast */}
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
              <h1
                className="text-white text-3xl font-black tracking-wider"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                KENSHO
              </h1>
              <div className={chip}>
                <span className="text-white text-sm font-semibold">
                  Salon : <span className="text-yellow-300 font-bold">{currentRoom.code}</span>
                </span>
              </div>
              <button
                onClick={copyRoomLink}
                disabled={!currentRoom.code}
                className={`${btnGhost} px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copié !' : "Copier l'URL"}</span>
              </button>
              <div className={chip}>
                <span className="text-white text-sm font-semibold">
                  <Users className="w-4 h-4 inline mr-1" />
                  {currentRoom.users.length} joueurs
                </span>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-4">
              {permissions.canControlGame && (
                <button
                  onClick={() => setShowResetModal(true)}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 border border-white/30 flex items-center space-x-2 hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Relancer la partie</span>
                </button>
              )}
              {permissions.isAdmin && (
                <button
                  onClick={() => setShowPlayersModal(true)}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 border border-white/30 flex items-center space-x-2 hover:scale-105"
                >
                  <Users className="w-4 h-4" />
                  <span>Joueurs</span>
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Status Bar */}
      {/* Barre de statut: remplace les wrappers par le style classique */}
      {gameState && (
        <div className="relative z-10 px-6 mb-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
              <div className="grid grid-cols-4 gap-4 items-center">
                {/* Phase de jeu */}
                {/* Colonne gauche et droite — remplacer sm:col-span-* par col-span-* pour la grille fixe */}
                <div className="col-span-1">
                  <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 border border-blue-300/30 text-center hover:bg-blue-500/30 transition-all duration-300">
                    <div className="flex items-center justify-center mb-2">
                      <button
                        onClick={isGameActive ? pauseGame : startGame}
                        disabled={!permissions.canControlGame}
                        className="text-blue-300 hover:text-white transition-colors flex items-center justify-center mr-2"
                      >
                        {isGameActive ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                      </button>
                      <span className="text-blue-200 text-sm font-semibold">Phase</span>
                    </div>
                    {/* Dans la section "Phase de jeu" */}
                    <h3 className="text-white font-bold text-sm">
                      {currentPhaseIndex === 0 ? 'En attente' : `Phase ${currentPhaseIndex}`}
                    </h3>
                  </div>
                </div>
                {/* Temps restant */}
                <div className="col-span-2">
                  <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-3 border border-orange-300/30 hover:bg-orange-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Timer className="w-5 h-5 text-orange-300 mr-2" />
                        <span className="text-orange-200 text-sm font-semibold">Temps</span>
                      </div>
                      {/* Dans la section "Temps restant" */}
                      <h3 className="text-white font-bold text-xl">
                        {formatTimer(currentPhaseState?.timeRemaining || 0)}
                      </h3>
                    </div>
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-red-500"
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
                  <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 border border-purple-300/30 text-center hover:bg-purple-500/30 transition-all duration-300">
                    <div className="flex items-center justify-center mb-1">
                      <Trophy className="w-5 h-5 text-purple-300 mr-2" />
                      <span className="text-purple-200 text-sm font-semibold">Score</span>
                    </div>
                    <h3 className="text-white font-bold text-lg">
                      {redTeam.length} - {blueTeam.length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main Game Area: grille fixe 5 colonnes, Rouge gauche / Centre / Bleue droite */}
      <main className="relative z-10 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-5 gap-6 items-start">
            {/* Colonne gauche: ÉQUIPE ROUGE */}
            <div className="col-span-1">
              <div className={panel}>
                <div className="text-center mb-6">
                  <div className="bg-red-700/20 backdrop-blur-sm px-6 py-3 rounded-full border border-red-600 inline-block">
                    <h3 className="text-red-200 font-bold text-lg tracking-wide">ÉQUIPE ROUGE</h3>
                  </div>
                </div>

                {/* Sage */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white/90 text-sm font-semibold flex items-center">
                      <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                      Sage
                    </h4>
                    {(!currentUser.team || currentUser.team === 'spectator') && (
                      <button
                        onClick={() => joinTeam('red', 'sage')}
                        disabled={isJoiningTeam}
                        className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-200 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border border-yellow-300/30 hover:border-yellow-300/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJoiningTeam ? 'En cours...' : 'Rejoindre'}
                      </button>
                    )}
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    {redSage ? (
                      renderUserCard(redSage)
                    ) : (
                      <div className="text-center text-white/60 text-sm py-4">Aucun Sage assigné</div>
                    )}
                  </div>
                </div>

                {/* Disciples */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white/90 text-sm font-semibold flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-400" />
                      Disciples
                    </h4>
                    {(!currentUser.team || currentUser.team === 'spectator') && (
                      <button
                        onClick={() => joinTeam('red', 'disciple')}
                        disabled={isJoiningTeam}
                        className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border border-blue-300/30 hover:border-blue-300/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJoiningTeam ? 'En cours...' : 'Rejoindre'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {redTeam.filter((user) => user.role === 'disciple').length === 0 ? (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 opacity-50">
                        <div className="text-center text-white/60 text-sm py-2">Aucun disciple</div>
                      </div>
                    ) : (
                      redTeam
                        .filter((user) => user.role === 'disciple')
                        .map((disciple) => (
                          <div key={(disciple as any).userToken ?? (disciple as any).id}>{renderUserCard(disciple)}</div>
                        ))
                    )}
                  </div>
                </div>
              </div>
              {/* Center Columns: Game Area */}
              {/* Champ de saisie au-dessus de la zone de jeu */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendProposal();
                }}
                className="mb-6"
              >
                <div className={panelTight}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      placeholder="Tapez votre réponse..."
                      className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      type="submit"
                      disabled={!proposal.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Zone de jeu */}
              <div className={panel}>
                {/* Proposal Input */}
                <div className="max-w-[520px] mx-auto mb-6">
                  <div className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white font-semibold transition-all duration-300 mb-4">
                    <div className="flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {formatTimer(currentPhaseState?.timeRemaining || 0)}
                      </span>
                    </div>
                    <div className="relative mt-3">
                      <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-red-500"
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendProposal();
                    }}
                    className="mb-6"
                  >
                    <div className={panelTight}>
                      <div className="flex items-center space-x-3">
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
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Historique */}
                  <div className={`${panel} mt-6`}>
                    {/* Proposal Input */}
                    <div className="max-w-[520px] mx-auto mb-6">
                      <div className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white font-semibold transition-all duration-300 mb-4">
                        <div className="flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {formatTimer(currentPhaseState?.timeRemaining || 0)}
                          </span>
                        </div>
                        <div className="relative mt-3">
                          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-red-500"
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

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendProposal();
                        }}
                        className="mb-6"
                      >
                        <div className={panelTight}>
                          <div className="flex items-center space-x-3">
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
                              <Check className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Right Column: Équipe Bleue + Spectateurs */}
                      <div className="col-span-1">
                        {/* Équipe Bleue */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                          <div className="text-center mb-6">
                            <div className="bg-blue-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-300/30 inline-block hover:bg-blue-500/30 transition-all duration-300">
                              <h3 className="text-blue-200 font-bold text-lg tracking-wide">ÉQUIPE BLEUE</h3>
                            </div>
                          </div>

                          {/* Sage */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white/90 text-sm font-semibold flex items-center">
                                <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                                Sage
                              </h4>
                              {(!currentUser.team || currentUser.team === 'spectator') && (
                                <button
                                  onClick={() => joinTeam('blue', 'sage')}
                                  disabled={isJoiningTeam}
                                  className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-200 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border border-yellow-300/30 hover:border-yellow-300/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isJoiningTeam ? 'En cours...' : 'Rejoindre'}
                                </button>
                              )}
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                              {blueSage ? (
                                renderUserCard(blueSage)
                              ) : (
                                <div className="text-center text-white/60 text-sm py-4">Aucun Sage assigné</div>
                              )}
                            </div>
                          </div>

                          {/* Disciples */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white/90 text-sm font-semibold flex items-center">
                                <Users className="w-4 h-4 mr-2 text-blue-400" />
                                Disciples
                              </h4>
                              {(!currentUser.team || currentUser.team === 'spectator') && (
                                <button
                                  onClick={() => joinTeam('blue', 'disciple')}
                                  disabled={isJoiningTeam}
                                  className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border border-blue-300/30 hover:border-blue-300/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isJoiningTeam ? 'En cours...' : 'Rejoindre'}
                                </button>
                              )}
                            </div>
                            <div className="space-y-3">
                              {blueTeam
                                .filter((user) => user.role === 'disciple')
                                .map((disciple) => (
                                  <div key={(disciple as any).userToken ?? (disciple as any).id}>
                                    {renderUserCard(disciple)}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Spectateurs */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                          <div className="text-center mb-6">
                            <div className="bg-gray-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-300/30 inline-block hover:bg-gray-500/30 transition-all duration-300">
                              <h3 className="text-gray-200 font-bold text-lg tracking-wide">SPECTATEURS</h3>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white/90 text-sm font-semibold flex items-center">
                              <Eye className="w-4 h-4 mr-2 text-gray-400" />
                              Observateurs
                            </h4>
                            {/* Bouton toujours visible, simplement désactivé si déjà spectateur */}
                            <button
                              onClick={joinSpectator}
                              disabled={isJoiningTeam || currentUser.team === 'spectator'}
                              className="bg-gray-500/20 hover:bg-gray-500/40 text-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border border-gray-300/30 hover:border-gray-300/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isJoiningTeam ? 'En cours...' : 'Rejoindre'}
                            </button>
                          </div>

                          <div className="space-y-3">
                            {spectators.length === 0 ? (
                              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 opacity-50">
                                <div className="text-center text-white/60 text-sm py-2">Aucun spectateur</div>
                              </div>
                            ) : (
                              spectators.map((spectator) => (
                                <div key={(spectator as any).userToken ?? (spectator as any).id}>
                                  {renderUserCard(spectator)}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                onClick={() => setShowResetModal(false)}
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
    </div>
  );
}
export default RoomCreated;
