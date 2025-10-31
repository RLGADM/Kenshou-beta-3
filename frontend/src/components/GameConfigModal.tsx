// --------------------------------------------------
// ⚙️ GameConfigModal — Kensho
// --------------------------------------------------
// Modal de configuration avant la création d'une partie.
// Gère deux modes : "standard" et "custom".
// --------------------------------------------------

import React, { useState } from 'react';
import { X, Settings, Clock, Users, Trophy, BookOpen, Sparkles } from 'lucide-react';
import type { GameParameters } from '@/types/game';
import { getDefaultParameters } from '@/utils/defaultParameters';

// --------------------------------------------------
// 🔹 Props
// --------------------------------------------------
interface GameConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (gameMode: 'standard' | 'custom', parameters: GameParameters) => void;
}

// --------------------------------------------------
// 🔸 Sous-composant : Header
// --------------------------------------------------
const ModalHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center space-x-4">
      <img src="/assets/logo.png" alt="Kensho Logo" className="w-16 h-16 object-contain rounded-2xl shadow-lg" />
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-[Montserrat]">
          KENSHO
        </h1>
        <p className="text-gray-600 font-medium">Configuration de la partie</p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-300 hover:scale-105"
    >
      <X className="w-6 h-6" />
    </button>
  </div>
);

// --------------------------------------------------
// 🔸 Sous-composant : ModeSelector
// --------------------------------------------------
const ModeSelector: React.FC<{
  gameMode: 'standard' | 'custom';
  onStandard: () => void;
  onCustom: () => void;
}> = ({ gameMode, onStandard, onCustom }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Choisissez le type de partie</h2>
    <div className="grid grid-cols-2 gap-6">
      {[
        {
          mode: 'standard',
          label: 'Partie Standard',
          icon: <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />,
          color: 'blue',
          desc: 'Paramètres recommandés pour une partie équilibrée',
        },
        {
          mode: 'custom',
          label: 'Partie Personnalisée',
          icon: <Settings className="w-12 h-12 mx-auto mb-4 text-purple-500" />,
          color: 'purple',
          desc: 'Configurez tous les paramètres selon vos préférences',
        },
      ].map(({ mode, label, icon, color, desc }) => (
        <button
          key={mode}
          onClick={mode === 'standard' ? onStandard : onCustom}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
            gameMode === mode
              ? `border-${color}-500 bg-${color}-50 shadow-lg`
              : 'border-gray-200 bg-white hover:border-opacity-60'
          }`}
        >
          <div className="text-center">
            {icon}
            <h3 className="text-xl font-bold text-gray-800 mb-2">{label}</h3>
            <p className="text-gray-600">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// --------------------------------------------------
// 🔸 Sous-composant : CustomParameters
// --------------------------------------------------
const CustomParameters: React.FC<{
  parameters: GameParameters;
  onParamChange: (key: keyof GameParameters, value: unknown) => void;
  onWordsListChange: (key: keyof GameParameters['ParametersWordsListSelection'], checked: boolean) => void;
}> = ({ parameters, onParamChange, onWordsListChange }) => (
  <div className="space-y-8">
    {/* Gestion du temps */}
    <fieldset className="border-2 border-gray-200 rounded-2xl p-6">
      <legend className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold flex items-center space-x-2">
        <Clock className="w-5 h-5" />
        <span>Gestion du temps</span>
      </legend>
      <div className="grid md:grid-cols-3 gap-6 mt-4 text-black">
        {[
          { label: 'Première phase', key: 'ParametersTimeFirst', values: [15, 20, 30, 40, 50, 60] },
          { label: 'Deuxième phase', key: 'ParametersTimeSecond', values: [60, 90, 120] },
          { label: 'Troisième phase', key: 'ParametersTimeThird', values: [60, 90, 120, 150, 180] },
        ].map(({ label, key, values }) => (
          <div key={key}>
            <label className="block text-gray-700 font-semibold mb-2">{label}</label>
            <select
              value={parameters[key as keyof GameParameters] as number}
              onChange={(e) => onParamChange(key as keyof GameParameters, parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            >
              {values.map((num) => (
                <option key={num} value={num}>
                  {num} secondes
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </fieldset>

    {/* Système de points */}
    <fieldset className="border-2 border-gray-200 rounded-2xl p-6">
      <legend className="px-4 py-2 bg-purple-500 text-white rounded-xl font-bold flex items-center space-x-2">
        <Trophy className="w-5 h-5" />
        <span>Système de points</span>
      </legend>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Score Max</label>
          <select
            value={parameters.ParametersPointsMaxScore}
            onChange={(e) => onParamChange('ParametersPointsMaxScore', parseInt(e.target.value))}
            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num} points
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Règle d'attribution</label>
          <select
            value={parameters.ParametersPointsRules}
            onChange={(e) => onParamChange('ParametersPointsRules', e.target.value as 'no-tie' | 'tie')}
            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            <option value="no-tie">Pas de point en cas d'égalité</option>
            <option value="tie">Point pour chaque réussite</option>
          </select>
        </div>
      </div>
    </fieldset>

    {/* Liste des mots */}
    <fieldset className="border-2 border-gray-200 rounded-2xl p-6">
      <legend className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold flex items-center space-x-2">
        <BookOpen className="w-5 h-5" />
        <span>Liste des mots</span>
      </legend>

      {/*
    On normalise l’objet ici pour être sûr qu’il existe,
    même si le type venait d’une ancienne version (string, undefined, etc.)
  */}
      {(() => {
        const wordsSel =
          parameters.ParametersWordsListSelection && typeof parameters.ParametersWordsListSelection === 'object'
            ? parameters.ParametersWordsListSelection
            : {
                veryCommon: true,
                lessCommon: true,
                rarelyCommon: false,
              };

        return (
          <div className="space-y-4 mt-4">
            {/* Toujours coché */}
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={true} disabled className="w-5 h-5 accent-green-600 rounded" />
              <span className="text-gray-700 font-medium">Mots très courants (Obligatoire)</span>
            </label>

            {/* Mots moins courants */}
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={!!wordsSel.lessCommon}
                onChange={(e) => onWordsListChange('lessCommon', e.target.checked)}
                className="w-5 h-5 accent-green-600 rounded"
              />
              <span className="text-gray-700 font-medium">Mots moins courants</span>
            </label>

            {/* Mots rarement courants */}
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={!!wordsSel.rarelyCommon}
                onChange={(e) => onWordsListChange('rarelyCommon', e.target.checked)}
                className="w-5 h-5 accent-green-600 rounded"
              />
              <span className="text-gray-700 font-medium">Mots rarement courants</span>
            </label>
          </div>
        );
      })()}
    </fieldset>
  </div>
);

// --------------------------------------------------
// 🔸 Composant principal
// --------------------------------------------------
const GameConfigModal: React.FC<GameConfigModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [gameMode, setGameMode] = useState<'standard' | 'custom'>('standard');
  const [parameters, setParameters] = useState<GameParameters>(getDefaultParameters());

  const handleParameterChange = (key: keyof GameParameters, value: unknown) =>
    setParameters((prev) => ({ ...prev, [key]: value }));

  const handleWordsListChange = (category: keyof GameParameters['ParametersWordsListSelection'], checked: boolean) => {
    setParameters((prev) => ({
      ...prev,
      ParametersWordsListSelection: {
        ...prev.ParametersWordsListSelection,
        [category]: checked,
      },
    }));
  };

  const handleConfirm = () => {
    onConfirm(gameMode, parameters);
    onClose();
  };

  const canConfirm =
    gameMode === 'standard' ||
    (gameMode === 'custom' && Object.values(parameters.ParametersWordsListSelection).some(Boolean));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-8">
          <ModalHeader onClose={onClose} />
          <ModeSelector
            gameMode={gameMode}
            onStandard={() => {
              setGameMode('standard');
              setParameters(getDefaultParameters());
            }}
            onCustom={() => setGameMode('custom')}
          />
          {gameMode === 'custom' ? (
            <CustomParameters
              parameters={parameters}
              onParamChange={handleParameterChange}
              onWordsListChange={handleWordsListChange}
            />
          ) : (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 text-blue-700">
              <p className="font-semibold">
                Paramètres équilibrés : 20s / 90s / 120s — 2 rerolls — 6 interdits — score max 3
              </p>
            </div>
          )}
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmer et créer le salon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameConfigModal;
