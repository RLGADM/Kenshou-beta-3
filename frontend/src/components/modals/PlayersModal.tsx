import React from 'react';
import type { User } from '@/types';

interface PlayersModalProps {
  show: boolean;
  onClose: () => void;
  users: User[];
}

const PlayersModal: React.FC<PlayersModalProps> = ({ show, onClose, users }) => {
  if (!show) return null;

  const redTeam = users.filter((u) => u.team === 'red');
  const blueTeam = users.filter((u) => u.team === 'blue');
  const spectators = users.filter((u) => u.team === 'spectator');

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-[#283141] text-white rounded-2xl p-6 w-[480px] max-w-[90vw] shadow-2xl relative">
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Joueurs connectés</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors duration-200">
            ✕
          </button>
        </div>

        {/* --- Contenu --- */}
        {users.length > 0 ? (
          <div className="space-y-6">
            {/* Équipe rouge */}
            <fieldset className="border border-red-500/30 rounded-lg p-4">
              <legend className="text-red-400 font-semibold px-2">Équipe rouge</legend>
              {redTeam.length > 0 ? (
                <ul className="space-y-2">
                  {redTeam.map((user) => (
                    <li
                      key={user.userToken}
                      className="flex justify-between items-center bg-red-500/10 px-3 py-2 rounded-md"
                    >
                      <span>{user.username}</span>
                      <span className="text-sm text-red-300">{user.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucun joueur rouge</p>
              )}
            </fieldset>

            {/* Équipe bleue */}
            <fieldset className="border border-blue-500/30 rounded-lg p-4">
              <legend className="text-blue-400 font-semibold px-2">Équipe bleue</legend>
              {blueTeam.length > 0 ? (
                <ul className="space-y-2">
                  {blueTeam.map((user) => (
                    <li
                      key={user.userToken}
                      className="flex justify-between items-center bg-blue-500/10 px-3 py-2 rounded-md"
                    >
                      <span>{user.username}</span>
                      <span className="text-sm text-blue-300">{user.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucun joueur bleu</p>
              )}
            </fieldset>

            {/* Spectateurs */}
            <fieldset className="border border-gray-500/30 rounded-lg p-4">
              <legend className="text-gray-300 font-semibold px-2">Spectateurs</legend>
              {spectators.length > 0 ? (
                <ul className="space-y-2">
                  {spectators.map((user) => (
                    <li
                      key={user.userToken}
                      className="flex justify-between items-center bg-slate-600/40 px-3 py-2 rounded-md"
                    >
                      <span>{user.username}</span>
                      <span className="text-sm text-gray-400">{user.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucun spectateur</p>
              )}
            </fieldset>
          </div>
        ) : (
          <p className="text-gray-400 italic">Aucun joueur pour le moment.</p>
        )}
      </div>
    </div>
  );
};

export default PlayersModal;
