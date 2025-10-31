// --------------------------------------------------
// 🧩 RoomCreated — Page principale d'une salle de jeu Kensho
// --------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Copy, LogOut, Users, Play, Pause, Timer, Trophy, History, Target, Crown } from 'lucide-react';

// --------------------------------------------------
// 📦 Imports internes (hooks, utils, types)
// --------------------------------------------------
import { copyRoomLink } from '@/hooks/copyLink';
import { useRoomCreatedMain } from '@/hooks/roomcreated/useRoomCreatedMain';
import { useRoomGameLogic } from '@/hooks/room/useRoomGameLogic';
import { useRoomEvents } from '@/hooks/app/useRoomEvents';
import { useRoomUIStates } from '@/hooks/roomcreated/useRoomUIStates';
import { getDefaultParameters } from '@/utils/defaultParameters';
import type { User } from '@/types';

// --------------------------------------------------
// 📦 Modals
// --------------------------------------------------
import PlayersModal from '@/components/modals/PlayersModal';

// --------------------------------------------------
// 🔹 Composant principal
// --------------------------------------------------
const RoomCreated: React.FC = () => {
  const { roomCode: routeRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();

  // --- Hooks principaux
  const { inRoom, currentRoom } = useRoomEvents();
  const { currentUser, permissions, proposal, setProposal, setCopied, sendProposal, handleLeaveRoom } =
    useRoomCreatedMain();

  const { setShowResetModal } = useRoomUIStates();

  // --- Sécurité : rediriger si pas de room
  useEffect(() => {
    if (!inRoom || !currentRoom) {
      navigate('/');
    }
  }, [inRoom, currentRoom, navigate]);

  // --- Fallback paramètres
  const gameParameters = currentRoom?.gameParameters ?? getDefaultParameters();

  // --- Logique de jeu
  const gameLogic = useRoomGameLogic(gameParameters);
  const { gameState } = gameLogic;

  // --- États UI
  const [showPlayersModal, setShowPlayersModal] = useState(false);

  // --- Chargement
  if (!currentRoom || !currentUser) {
    return (
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Chargement de la room...</div>
      </div>
    );
  }

  // --------------------------------------------------
  // 🔹 Données dérivées
  // --------------------------------------------------
  const isGameActive = gameState.isPlaying;
  const currentRound = gameState.currentRound;
  const currentPhase = currentRound.currentPhase;

  const userRole = currentUser.role ?? 'spectator';
  const isDisciple = userRole === 'disciple';
  const isCurrentTeamTurn = true; // placeholder (à relier plus tard à la logique d’équipe)

  const redTeam = currentRoom.users?.filter((u: User) => u.team === 'red') ?? [];
  const blueTeam = currentRoom.users?.filter((u: User) => u.team === 'blue') ?? [];

  const phaseTitles: Record<number, string> = {
    1: 'Choisissez votre mot',
    2: 'Choisissez vos interdits',
    3: 'Préparez votre laïus !',
  };

  const phaseDisplay =
    currentPhase.status === 'En attente'
      ? 'En attente...'
      : `Phase ${currentPhase.index} - ${phaseTitles[currentPhase.index] ?? ''}`;

  // --------------------------------------------------
  // 🔹 Actions principales
  // --------------------------------------------------
  const startGame = useCallback(() => gameLogic.actions.startGame(), [gameLogic]);
  const pauseGame = useCallback(() => gameLogic.actions.pauseGame(), [gameLogic]);

  const handleProposalSend = () => {
    if (!proposal.trim()) return;
    gameLogic.actions.handleGuess(proposal.trim());
    sendProposal(proposal.trim());
    setProposal('');
  };

  const handleCopyLink = () => {
    copyRoomLink(currentRoom.code);
    setCopied(true);
    toast.success('Lien de la salle copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  // --------------------------------------------------
  // 🎨 Rendu principal
  // --------------------------------------------------
  const panel = 'bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
      {/* HEADER */}
      <header className="py-4 px-6 border-b border-slate-700 bg-[#2b3441] shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* --- GAUCHE --- */}
          <div className="flex items-center space-x-4">
            {/* Logo Kensho */}
            <div className="flex items-center space-x-2">
              <img src="/logo_kensho.png" alt="Kensho Logo" className="h-8 w-auto" />
              <h1 className="text-white text-xl font-bold tracking-wide">KENSHO</h1>
            </div>

            {/* Code salon */}
            <div className="flex items-center space-x-2 bg-slate-700/40 border border-slate-500 text-white rounded-full px-4 py-2">
              <span>Salon :</span>
              <span className="text-yellow-400 font-bold">{routeRoomCode ?? currentRoom.code}</span>
            </div>

            {/* Copier URL */}
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-2 bg-slate-700/40 border border-slate-500 text-white rounded-full px-4 py-2 hover:bg-slate-600/60 transition-all duration-200"
            >
              <Copy className="w-4 h-4" />
              <span>Copier l'URL</span>
            </button>

            {/* Joueurs */}
            <button
              onClick={() => setShowPlayersModal(true)}
              className="flex items-center space-x-2 bg-slate-700/40 border border-slate-500 text-white rounded-full px-4 py-2 hover:bg-slate-600/60 transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              <span>{currentRoom.users?.length ?? 0} joueurs</span>
            </button>
          </div>

          {/* --- DROITE --- */}
          <div className="flex items-center space-x-3">
            {permissions.canStartGame && (
              <>
                <button
                  onClick={isGameActive ? pauseGame : startGame}
                  className="flex items-center space-x-2 bg-slate-700/40 border border-slate-500 text-white rounded-full px-4 py-2 hover:bg-slate-600/60 transition-all duration-200"
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

                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center space-x-2 bg-slate-700/40 border border-slate-500 text-white rounded-full px-4 py-2 hover:bg-slate-600/60 transition-all duration-200"
                >
                  <Timer className="w-4 h-4" />
                  <span>Réinitialiser</span>
                </button>
              </>
            )}

            <button
              onClick={handleLeaveRoom}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className={panel}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Zone de jeu</h2>
                  <p className="text-white/60">{phaseDisplay}</p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-2 flex items-center space-x-3">
                  <Timer className="w-5 h-5 text-white/60" />
                  <div className="text-lg font-mono text-white">
                    {gameLogic.timer.getCurrentTime().toString().padStart(2, '0')}s
                  </div>
                </div>
              </div>

              {/* ÉQUIPES */}
              <div className="grid grid-cols-2 gap-6">
                <TeamBlock title="Équipe rouge" team="red" users={redTeam} />
                <TeamBlock title="Équipe bleue" team="blue" users={blueTeam} />
              </div>

              {/* Saisie disciple */}
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
                      onClick={handleProposalSend}
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

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <ScorePanel panel={panel} gameLogic={gameLogic} />
            <HistoryPanel panel={panel} gameLogic={gameLogic} />
          </div>
        </div>
      </main>

      {/* MODALE JOUEURS */}
      <PlayersModal
        show={showPlayersModal}
        onClose={() => setShowPlayersModal(false)}
        users={currentRoom?.users ?? []}
      />
    </div>
  );
};

// --------------------------------------------------
// 🔹 Sous-composants internes
// --------------------------------------------------
const TeamBlock = ({ title, team, users }: { title: string; team: 'red' | 'blue'; users: User[] }) => (
  <div>
    <h3 className={`text-lg font-semibold ${team === 'red' ? 'text-red-400' : 'text-blue-400'} mb-4`}>{title}</h3>
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.userToken ?? user.socketId ?? user.id}
          className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 ${
                team === 'red' ? 'bg-red-500/20' : 'bg-blue-500/20'
              } rounded-full flex items-center justify-center`}
            >
              {user.role === 'sage' ? (
                <Crown className={`w-4 h-4 ${team === 'red' ? 'text-red-400' : 'text-blue-400'}`} />
              ) : (
                <Target className={`w-4 h-4 ${team === 'red' ? 'text-red-400' : 'text-blue-400'}`} />
              )}
            </div>
            <span className="text-white">{user.username}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ScorePanel = ({ panel, gameLogic }: any) => (
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
);

const HistoryPanel = ({ panel, gameLogic }: any) => (
  <div className={panel}>
    <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
      <History className="w-5 h-5" />
      <span>Historique</span>
    </h3>
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {gameLogic.history.map((entry: any, index: number) => (
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
);

export default RoomCreated;
