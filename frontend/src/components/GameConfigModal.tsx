import React, { useState } from 'react';
import { X, Settings, Clock, Users, Trophy, BookOpen, Sparkles } from 'lucide-react';
import { GameParameters } from '@/types';
import { getDefaultParameters } from '@/utils/defaultParameters';

// --- PROPS ---
interface GameConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (gameMode: 'standard' | 'custom', parameters: GameParameters) => void;
}
// --- HEADER ---

const ModalHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 flex items-center justify-center">
        <img src="/assets/logo.png" alt="Kensho Logo" className="w-full h-full object-contain rounded-2xl shadow-lg" />
      </div>
      <div>
        <h1
          className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
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

// --- MODE SELECTOR ---
const ModeSelector: React.FC<{ gameMode: 'standard' | 'custom'; onStandard: () => void; onCustom: () => void }> = ({
  gameMode,
  onStandard,
  onCustom,
}) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Choisissez le type de partie</h2>
    <div className="grid grid-cols-2 gap-6">
      <button
        onClick={onStandard}
        className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
          gameMode === 'standard'
            ? 'border-blue-500 bg-blue-50 shadow-lg'
            : 'border-gray-200 bg-white hover:border-blue-300'
        }`}
      >
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Partie Standard</h3>
          <p className="text-gray-600">Paramètres recommandés pour une partie équilibrée</p>
        </div>
      </button>
      <button
        onClick={onCustom}
        className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
          gameMode === 'custom'
            ? 'border-purple-500 bg-purple-50 shadow-lg'
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
      >
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-purple-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Partie Personnalisée</h3>
          <p className="text-gray-600">Configurez tous les paramètres selon vos préférences</p>
        </div>
      </button>
    </div>
  </div>
);

// --- CUSTOM PARAMETERS ---
const CustomParameters: React.FC<{
  parameters: GameParameters;
  onParamChange: (key: keyof GameParameters, value: unknown) => void;
  onWordsListChange: (category: keyof GameParameters['ParametersWordsListSelection'], checked: boolean) => void;
}> = ({ parameters, onParamChange, onWordsListChange }) => (
  <div className="space-y-8">
    {/* Gestion du temps */}
    <fieldset className="border-2 border-gray-200 rounded-2xl p-6">
      <legend className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold flex items-center space-x-2">
        <Clock className="w-5 h-5" />
        <span>Gestion du temps</span>
      </legend>
      <div className="grid md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Temps Première Phase</label>
          <select
            value={parameters.ParametersTimeFirst}
            onChange={(e) => onParamChange('ParametersTimeFirst', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {[15, 20, 30, 40, 50, 60].map((num) => (
              <option key={num} value={num}>
                {num} secondes
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Temps Deuxième Phase</label>
          <select
            value={parameters.ParametersTimeSecond}
            onChange={(e) => onParamChange('ParametersTimeSecond', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {[60, 90, 120].map((num) => (
              <option key={num} value={num}>
                {num} secondes
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Temps Troisième Phase</label>
          <select
            value={parameters.ParametersTimeThird}
            onChange={(e) => onParamChange('ParametersTimeThird', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {[60, 90, 120, 150, 180].map((num) => (
              <option key={num} value={num}>
                {num} secondes
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
    {/* Gestion des équipes */}
    <fieldset className="border-2 border-gray-200 rounded-2xl p-6">
      <legend className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-2">
        <Users className="w-5 h-5" />
        <span>Gestion des équipes</span>
      </legend>
      <div className="grid md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Nombre de reroll</label>
          <select
            value={parameters.ParametersTeamReroll}
            onChange={(e) => onParamChange('ParametersTeamReroll', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Mots interdits</label>
          <select
            value={parameters.ParametersTeamMaxForbiddenWords}
            onChange={(e) => onParamChange('ParametersTeamMaxForbiddenWords', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[5, 6, 7, 8].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Propositions</label>
          <select
            value={parameters.ParametersTeamMaxPropositions}
            onChange={(e) => onParamChange('ParametersTeamMaxPropositions', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[3, 4, 5, 6, 7].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num} points
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Règle d'attribution de point</label>
          <select
            value={parameters.ParametersPointsRules}
            onChange={(e) => onParamChange('ParametersPointsRules', e.target.value as 'no-tie' | 'tie')}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
      <div className="space-y-4 mt-4">
        <label className="flex items-center space-x-3">
          <input type="checkbox" checked={true} disabled className="w-5 h-5 accent-green-600 rounded" />
          <span className="text-gray-700 font-medium">Mots très courants (Obligatoire)</span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={parameters.ParametersWordsListSelection.lessCommon}
            onChange={(e) => onWordsListChange('lessCommon', e.target.checked)}
            className="w-5 h-5 accent-green-600 rounded"
          />
          <span className="text-gray-700 font-medium">Mots moins courants</span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={parameters.ParametersWordsListSelection.rarelyCommon}
            onChange={(e) => onWordsListChange('rarelyCommon', e.target.checked)}
            className="w-5 h-5 accent-green-600 rounded"
          />
          <span className="text-gray-700 font-medium">Mots rarement courants</span>
        </label>
      </div>
    </fieldset>
  </div>
);

// --- STANDARD SUMMARY ---
const StandardSummary: React.FC = () => (
  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
    <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center space-x-2">
      <Sparkles className="w-6 h-6" />
      <span>Paramètres de la partie standard</span>
    </h3>
    <div className="grid md:grid-cols-2 gap-6 text-sm">
      <div>
        <h4 className="font-semibold text-blue-700 mb-2">Temps des phases</h4>
        <ul className="space-y-1 text-blue-600">
          <li>• Phase 1 : 20 secondes</li>
          <li>• Phase 2 : 90 secondes</li>
          <li>• Phase 3 : 120 secondes</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-blue-700 mb-2">Équipes</h4>
        <ul className="space-y-1 text-blue-600">
          <li>• Rerolls : 2</li>
          <li>• Mots interdits : 6</li>
          <li>• Propositions : 5</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-blue-700 mb-2">Points</h4>
        <ul className="space-y-1 text-blue-600">
          <li>• Score max : 3 points</li>
          <li>• Pas de point en égalité</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-blue-700 mb-2">Mots</h4>
        <ul className="space-y-1 text-blue-600">
          <li>• Mots très courants ✓</li>
          <li>• Mots moins courants ✓</li>
          <li>• Mots rarement courants ✗</li>
        </ul>
      </div>
    </div>
  </div>
);

// --- ACTION BUTTONS ---
const ActionButtons: React.FC<{ onClose: () => void; onConfirm: () => void; canConfirm: boolean }> = ({
  onClose,
  onConfirm,
  canConfirm,
}) => (
  <div className="flex justify-center space-x-4 mt-8">
    <button
      onClick={onClose}
      className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
    >
      Annuler
    </button>
    <button
      onClick={onConfirm}
      disabled={!canConfirm}
      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
    >
      Confirmer et créer le salon
    </button>
  </div>
);

// --- MODAL PRINCIPAL ---
const GameConfigModal: React.FC<GameConfigModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [gameMode, setGameMode] = useState<'standard' | 'custom'>('standard');
  const [parameters, setParameters] = useState<GameParameters>(getDefaultParameters());
  // récupération des params de base
  const handleStandardMode = () => {
    setGameMode('standard');
    setParameters(getDefaultParameters()); // réinitialise aux valeurs standard
  };
  // récupration des params custom
  const handleCustomMode = () => setGameMode('custom');

  const handleParameterChange = (key: keyof GameParameters, value: unknown) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

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
    if (gameMode !== null) {
      onConfirm(gameMode, parameters);
      onClose();
    }
  };

  const canConfirm =
    gameMode !== null &&
    (gameMode === 'standard' ||
      (gameMode === 'custom' &&
        (parameters.ParametersWordsListSelection.veryCommon ||
          parameters.ParametersWordsListSelection.lessCommon ||
          parameters.ParametersWordsListSelection.rarelyCommon)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-8">
          <ModalHeader onClose={onClose} />
          <ModeSelector gameMode={gameMode} onStandard={handleStandardMode} onCustom={handleCustomMode} />
          {gameMode === 'custom' && (
            <CustomParameters
              parameters={parameters}
              onParamChange={handleParameterChange}
              onWordsListChange={handleWordsListChange}
            />
          )}  
          {gameMode === 'standard' && <StandardSummary />}
          <ActionButtons onClose={onClose} onConfirm={handleConfirm} canConfirm={canConfirm} />
        </div>
      </div>
    </div>
  );
};

export default GameConfigModal;
