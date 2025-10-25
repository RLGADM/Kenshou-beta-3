// --------------- IMPORT
import React, { useState } from 'react';
import { Phase1Modal, Phase2Modal, Phase3Modal, VictoryModal } from '../components/PhaseModals';
import {
  Copy,
  Users,
  LogOut,
  Check,
  Play,
  Pause,
  Timer,
  Trophy,
  History,
  Target,
  ShieldX,
  Crown,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { useRoomCreatedMain, useRoomGameLogic } from '../hooks/roomcreated';
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
    startGame: startGameBase,
    pauseGame: pauseGameBase,
    handleLeaveRoom,
    handleResetGame,
    // Modal pseudo
    handleJoinRoom,
    socket,
  } = useRoomCreatedMain();

  // Hook de gestion du jeu
  const gameLogic = useRoomGameLogic(currentRoom.parameters);

  // Actions de jeu combinées
  const startGame = () => {
    startGameBase();
    gameLogic.actions.startGame();
  };

  const pauseGame = () => {
    pauseGameBase();
    gameLogic.actions.pauseGame();
  };

  const resumeGame = () => {
    startGameBase();
    gameLogic.actions.resumeGame();
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
  const isGameActive = gameLogic.gameState.isPlaying;
  const currentRound = gameLogic.gameState.currentRound;
  const currentPhase = currentRound.currentPhase;

  // Listes d'équipe et rôles
  const redTeam = currentRoom?.users?.filter((user: User) => user.team === 'red') ?? [];
  const blueTeam = currentRoom?.users?.filter((user: User) => user.team === 'blue') ?? [];
  const redSage = redTeam.find((u: User) => u.role === 'sage');
  const blueSage = blueTeam.find((u: User) => u.role === 'sage');
  const spectators = currentRoom?.users?.filter((user: User) => user.team === 'spectator') ?? [];

  // Titres et labels des phases
  const phaseTitles: Record<number, string> = {
    1: 'Choisissez votre mot',
    2: 'Choisissez vos interdits',
    3: 'Préparez votre laius !',
  };

  const phaseDisplay =
    currentPhase.status === 'waiting'
      ? 'En attente'
      : `Phase ${currentPhase.index} - ${phaseTitles[currentPhase.index] ?? ''}`;

  const userTeam = currentUser?.team ?? 'spectator';
  const userRole = currentUser?.role ?? 'spectator';

  // État du jeu pour l'équipe actuelle
  const teamWord =
    userTeam === 'red' ? currentRound.redTeamWord : userTeam === 'blue' ? currentRound.blueTeamWord : undefined;

  const isCurrentTeamTurn = userTeam === gameLogic.gameState.currentTeam;
  const isSage = userRole === 'sage';
  const isDisciple = userRole === 'disciple';

  // Fonction de vérification des contraintes d'équipe
  const checkTeamConstraints = (team: 'red' | 'blue') => {
    if (isGameActive) return false;
    if (isJoiningTeam) return false;
    if (userTeam === team) return false;
    const teamMembers = team === 'red' ? redTeam : blueTeam;
    const hasDisciple = teamMembers.some((u) => u.role === 'disciple');
    const hasSage = teamMembers.some((u) => u.role === 'sage');
    return teamMembers.length < 6 && (!hasSage || !hasDisciple);
  };

  const canJoinAsDisciple = (team: 'red' | 'blue') => {
    if (!checkTeamConstraints(team)) return false;
    return !(team === 'red' ? redTeam : blueTeam).some((u) => u.role === 'disciple');
  };

  const canJoinAsSage = (team: 'red' | 'blue') => {
    if (!checkTeamConstraints(team)) return false;
    return !(team === 'red' ? redTeam : blueTeam).some((u) => u.role === 'sage');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
      {/* En-tête avec infos et contrôles */}
      <header className="py-4 px-6 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Code et copie */}
          <div className="flex items-center space-x-4">
            <div className={chip}>
              <span className="mr-2">Code:</span>
              <span className="font-mono font-bold">{routeRoomCode}</span>
            </div>
            <button
              onClick={() => copyRoomLink()}
              className={`${btnGhost} p-2 rounded-lg flex items-center space-x-2 transition-all duration-300`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>
          </div>

          {/* Actions principales */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPlayersModal(true)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-300"
            >
              <Users className="w-4 h-4" />
              <span>Joueurs</span>
            </button>
            <button
              onClick={handleLeaveRoom}
              className="flex items-center space-x-2 bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Zone de jeu principale */}
          <div className="col-span-12 lg:col-span-8">
            <div className={panel}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Zone de jeu</h2>
                  <p className="text-white/60">{phaseDisplay}</p>
                </div>

                {/* Contrôles de jeu */}
                <div className="flex items-center space-x-4">
                  <div className="bg-slate-700/50 rounded-lg p-2 flex items-center space-x-3">
                    <Timer className="w-5 h-5 text-white/60" />
                    <div className="text-lg font-mono text-white">{formatTimer(gameLogic.timer.getCurrentTime())}</div>

                    {/* Timer bar */}
                    <div className="relative rounded bg-white/20 h-1 mt-1">
                      <div
                        className="absolute left-0 top-0 bottom-0 rounded bg-white/60 transition-all duration-300"
                        style={{
                          width: `${
                            gameLogic.timerState[`phase${currentPhase.index}`]
                              ? Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    (gameLogic.timer.getCurrentTime() /
                                      gameLogic.timerState[`phase${currentPhase.index}`]) *
                                      100
                                  )
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {permissions.canStartGame && (
                    <button
                      onClick={isGameActive ? pauseGame : startGame}
                      className={`${
                        isGameActive ? 'bg-orange-500/80 hover:bg-orange-600' : 'bg-green-500/80 hover:bg-green-600'
                      } text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300`}
                    >
                      {isGameActive ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Jouer</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Contenu de jeu */}
              <div className="grid grid-cols-2 gap-6">
                {/* Équipe rouge */}
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Équipe rouge</h3>
                  <div className="space-y-4">
                    {redTeam.map((user) => (
                      <div
                        key={user.userToken ?? user.socketId}
                        className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                            {user.role === 'sage' ? (
                              <Crown className="w-4 h-4 text-red-400" />
                            ) : (
                              <Target className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <span className="text-white">{user.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Équipe bleue */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">Équipe bleue</h3>
                  <div className="space-y-4">
                    {blueTeam.map((user) => (
                      <div
                        key={user.userToken ?? user.socketId}
                        className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            {user.role === 'sage' ? (
                              <Crown className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Target className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          <span className="text-white">{user.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zone de saisie */}
              {isDisciple && isCurrentTeamTurn && currentPhase.index === 3 && (
                <div className="mt-6">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      placeholder="Entrez votre proposition..."
                      className="flex-1 bg-slate-700/50 text-white placeholder-white/40 px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (proposal.trim()) {
                          gameLogic.actions.handleGuess(proposal.trim());
                          sendProposal(proposal.trim());
                          setProposal('');
                        }
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
                    >
                      Envoyer
                    </button>
                  </div>
                  <p className="text-white/40 text-sm mt-2">
                    {gameLogic.gameState.remainingGuesses} tentatives restantes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Barre latérale */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Score */}
            <div className={panel}>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Score</span>
              </h3>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{gameLogic.gameState.scores.red}</div>
                  <div className="text-white/60 text-sm">Rouge</div>
                </div>
                <div className="text-white/40">VS</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{gameLogic.gameState.scores.blue}</div>
                  <div className="text-white/60 text-sm">Bleu</div>
                </div>
              </div>
            </div>

            {/* Historique */}
            <div className={panel}>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Historique</span>
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto" ref={historyEndRef}>
                {gameLogic.history.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      entry.type === 'game'
                        ? 'bg-purple-500/20 text-purple-200'
                        : entry.type === 'phase'
                          ? 'bg-blue-500/20 text-blue-200'
                          : entry.type === 'team'
                            ? 'bg-green-500/20 text-green-200'
                            : entry.type === 'victory'
                              ? 'bg-yellow-500/20 text-yellow-200'
                              : 'bg-slate-700/50 text-white/60'
                    }`}
                  >
                    {entry.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modales */}
      {currentPhase.status === 'in-progress' && currentPhase.index === 1 && (
        <Phase1Modal
          word={teamWord ?? null}
          onAccept={() => {
            if (teamWord) {
              gameLogic.actions.setWord(userTeam as 'red' | 'blue', teamWord);
            }
          }}
          onReject={() => {
            /* TODO: Implement word rejection */
          }}
          onClose={() => {
            /* TODO: Implement modal close */
          }}
        />
      )}

      {currentPhase.status === 'in-progress' && currentPhase.index === 2 && (
        <Phase2Modal
          forbiddenWords={userTeam === 'red' ? currentRound.redTeamForbiddenWords : currentRound.blueTeamForbiddenWords}
          onAddWord={(word) => {
            if (userTeam === 'red' || userTeam === 'blue') {
              gameLogic.actions.addForbiddenWord(userTeam, word);
            }
          }}
          onRemoveWord={(index) => {
            if (userTeam === 'red' || userTeam === 'blue') {
              gameLogic.actions.removeForbiddenWord(userTeam, index);
            }
          }}
          maxWords={currentRoom.parameters.ParametersTeamMaxForbiddenWords}
          onClose={() => {
            /* TODO: Implement modal close */
          }}
        />
      )}

      {currentPhase.status === 'in-progress' && currentPhase.index === 3 && (
        <Phase3Modal
          wordToGuess={teamWord ?? null}
          forbiddenWords={userTeam === 'red' ? currentRound.redTeamForbiddenWords : currentRound.blueTeamForbiddenWords}
          onTrapClick={(word) => {
            /* TODO: Implement trap word click */
          }}
          onAcceptTrap={() => {
            /* TODO: Implement trap acceptance */
          }}
          onRejectTrap={() => {
            /* TODO: Implement trap rejection */
          }}
          trapWord={null} // TODO: Add trap word state
          onClose={() => {
            /* TODO: Implement modal close */
          }}
        />
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Réinitialiser la partie</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir réinitialiser la partie ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300"
              >
                Annuler
              </button>
              <button
                onClick={handleResetGame}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
