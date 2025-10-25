import React from 'react';

// Modal Phase 1 - Choix du mot
interface Phase1ModalProps {
  word: string | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}
export function Phase1Modal({ word, onAccept, onReject, onClose }: Phase1ModalProps) {
  // Always render modal; if no word provided, show placeholder and disable Accept
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">Choisissez votre mot</h3>
        <p className="text-white/80 mb-6 text-center text-lg font-semibold">{word ?? 'Aucun mot choisi'}</p>
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold"
            onClick={onAccept}
            disabled={!word}
          >
            👍 Accepter
          </button>
          <button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold"
            onClick={onReject}
          >
            👎 Refuser
          </button>
        </div>
        <button
          type="button"
          className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
          onClick={onClose}
          disabled={!word}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// Modal Phase 2 - Choix des mots interdits
interface Phase2ModalProps {
  forbiddenWords: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (index: number) => void;
  maxWords: number;
  onClose: () => void;
}
export function Phase2Modal({ forbiddenWords, onAddWord, onRemoveWord, maxWords, onClose }: Phase2ModalProps) {
  const [input, setInput] = React.useState('');

  const handleAdd = () => {
    if (input.trim() && forbiddenWords.length < maxWords) {
      onAddWord(input.trim());
      setInput('');
    }
  };

  return (
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
  );
}

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
  if (!wordToGuess || !forbiddenWords) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 border border-white/20 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">Phase d'Oration</h3>
        <div className="mb-4">
          <p className="text-white/80 mb-2">
            Mot à deviner : <span className="font-semibold">{wordToGuess}</span>
          </p>
          <p className="text-white/80 mb-2">Mots interdits de votre équipe :</p>
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
        </div>
        <button
          type="button"
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// Modal Victoire
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
