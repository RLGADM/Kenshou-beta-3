// src/components/modals/PhaseModals.tsx
// --------------------------------------------------
// 🧩 Ensemble des modales de jeu pour Kensho
// --------------------------------------------------

import React, { useCallback, useState } from 'react';
import { useGameState } from '@/hooks/game/useGameState';
import { getDefaultParameters } from '@/utils/defaultParameters';
import { GameParameters } from '@/types/game';

// Phase Wrapper pour no modal si phase = 0
export function PhaseWrapper({ children }: { children: React.ReactNode }) {
  // ⚙️ on récupère le state du jeu
  const { gameState } = useGameState({ parameters: getDefaultParameters() });

  // 🚫 Si la phase actuelle est 0 => ne rien afficher (phase d’attente)
  if (gameState?.currentRound?.currentPhase?.index === 0) {
    return null;
  }

  // ✅ sinon on rend le contenu de la phase
  return <>{children}</>;
}

// --------------------------------------------------
// 🔹 PHASE 1 — Choix du mot
// --------------------------------------------------

interface Phase1ModalProps {
  word: string | null;
  onAccept: () => void;
  onReject: () => void;
  handleCloseModal: () => void;
  customGameParameters?: GameParameters;
}

export function Phase1Modal({ word, onAccept, onReject, handleCloseModal, customGameParameters }: Phase1ModalProps) {
  const [modalVisible, setModalVisible] = useState(true);

  // Récupère les paramètres de jeu
  const gameParameters = customGameParameters || getDefaultParameters();

  // Initialise le state global de jeu
  const { gameState, setGameState } = useGameState({ parameters: gameParameters });

  // Phase acceptée
  const handleAccept = useCallback(() => {
    onAccept();
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        currentPhase: { index: 2, status: 'waiting' },
      },
    }));
  }, [onAccept, setGameState]);

  // Phase refusée
  const handleReject = useCallback(() => {
    onReject();
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        currentPhase: { index: 1, status: 'waiting' },
      },
    }));
  }, [onReject, setGameState]);

  // Rendu visuel
  if (!modalVisible) return null;

  return (
    <PhaseWrapper>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-4">Choisissez votre mot</h3>
          <p className="text-white/80 mb-6 text-center text-lg font-semibold">{word ?? 'Aucun mot choisi'}</p>

          <div className="flex justify-center space-x-4">
            <button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold"
              onClick={handleAccept}
              disabled={!word}
            >
              👍 Accepter
            </button>
            <button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold"
              onClick={handleReject}
            >
              👎 Refuser
            </button>
          </div>

          <button
            type="button"
            className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
            onClick={() => {
              setModalVisible(false);
              handleCloseModal();
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </PhaseWrapper>
  );
}

// --------------------------------------------------
// 🔹 PHASE 2 — Choix des mots interdits
// --------------------------------------------------

interface Phase2ModalProps {
  forbiddenWords: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (index: number) => void;
  maxWords: number;
  onClose: () => void;
}

export function Phase2Modal({ forbiddenWords, onAddWord, onRemoveWord, maxWords, onClose }: Phase2ModalProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim() && forbiddenWords.length < maxWords) {
      onAddWord(input.trim());
      setInput('');
    }
  };

  return (
    <PhaseWrapper>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-4">Choisissez vos mots interdits</h3>
          <div className="mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Entrez un mot interdit"
              className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold"
              onClick={handleAdd}
              disabled={!input.trim() || forbiddenWords.length >= maxWords}
            >
              Ajouter
            </button>
          </div>

          <ul className="max-h-40 overflow-y-auto text-white/80 mb-4">
            {forbiddenWords.map((word, idx) => (
              <li key={idx} className="flex justify-between items-center mb-1">
                <span>{word}</span>
                <button className="text-red-400 hover:text-red-600" onClick={() => onRemoveWord(idx)}>
                  🗑️
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </PhaseWrapper>
  );
}

// --------------------------------------------------
// 🔹 PHASE 3 — Oration / Deviner le mot
// --------------------------------------------------

interface Phase3ModalProps {
  wordToGuess: string | null;
  forbiddenWords: string[];
  onTrapClick: (word: string) => void;
  onAcceptTrap: () => void;
  onRejectTrap: () => void;
  trapWord: string | null;
  onClose: () => void;
}

export function Phase3Modal({
  wordToGuess,
  forbiddenWords,
  onTrapClick,
  onAcceptTrap,
  onRejectTrap,
  trapWord,
  onClose,
}: Phase3ModalProps) {
  if (!wordToGuess) return null;

  return (
    <PhaseWrapper>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-4">Phase d'Oration</h3>

          <p className="text-white/80 mb-2">
            Mot à deviner : <span className="font-semibold">{wordToGuess}</span>
          </p>

          <p className="text-white/80 mb-2">Mots interdits :</p>
          <ul className="mb-4">
            {forbiddenWords.map((word, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span>{word}</span>
                <button className="text-yellow-400 hover:text-yellow-600" onClick={() => onTrapClick(word)}>
                  ❗
                </button>
              </li>
            ))}
          </ul>

          {trapWord && (
            <div className="bg-red-700 p-4 rounded-xl">
              <p className="text-white mb-4">
                Le mot <strong>{trapWord}</strong> a été piégé par l’équipe adverse !
              </p>
              <div className="flex justify-between">
                <button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold"
                  onClick={onAcceptTrap}
                >
                  Accepter
                </button>
                <button
                  type="button"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-semibold"
                  onClick={onRejectTrap}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold mt-4"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </PhaseWrapper>
  );
}

// --------------------------------------------------
// 🔹 MODALE DE VICTOIRE
// --------------------------------------------------

interface VictoryModalProps {
  winningTeam: string | null;
  onClose: () => void;
}

export function VictoryModal({ winningTeam, onClose }: VictoryModalProps) {
  if (!winningTeam) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Félicitations à l'équipe {winningTeam} !</h2>
        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
