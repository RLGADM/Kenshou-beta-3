// --------------------------------------------------
// 🏠 Page d'accueil Kensho
// --------------------------------------------------

import React, { useEffect, useState } from 'react';
import { Plus, LogIn, Sparkles, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GameConfigModal from '@/components/GameConfigModal';
import { useHomeHandlers } from '@/hooks/global/useHomeHandlers';
import logo from '@/assets/logo.png';
import { getDefaultParameters } from '@/utils/defaultParameters';

// --------------------------------------------------
// 🔹 Composant principal
// --------------------------------------------------
const Home: React.FC = () => {
  // --- LocalStorage : récupération du dernier pseudo
  const storedUsername = localStorage.getItem('lastUsername');
  const initialUsername = storedUsername ? JSON.parse(storedUsername) : '';

  // --- Hook centralisé
  const navigate = useNavigate();
  const {
    socketIsConnected,
    username,
    setUsername,
    inRoom,
    roomCode,
    inputRoomCode,
    setInputRoomCode,
    isCreating,
    isJoining,
    isConfigModalOpen,
    setConfigModalOpen,
    handleJoin,
    handleConfigConfirm,
    startRoom,
    error,
  } = useHomeHandlers(initialUsername);

  // --------------------------------------------------
  // 🔁 Navigation automatique si joueur déjà en salle
  // --------------------------------------------------
  useEffect(() => {
    if (inRoom && roomCode && localStorage.getItem('hasLeftRoom') !== 'false') {
      navigate(`/room/${roomCode}`);
    }
  }, [inRoom, roomCode, navigate]);

  // --------------------------------------------------
  // 🧠 Synchronisation du token / état local
  // --------------------------------------------------
  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const lastRoomCode = localStorage.getItem('lastRoomCode');
    if (userToken && !lastRoomCode) localStorage.setItem('hasLeftRoom', 'false');
  }, []);

  // --------------------------------------------------
  // 🖼️ Logo fallback
  // --------------------------------------------------
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const fallbackLogo =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#4f46e5"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="12" fill="url(#g)"/>
        <text x="50%" y="55%" font-family="Montserrat, sans-serif" font-size="34" font-weight="800" fill="#fff" text-anchor="middle">K</text>
      </svg>`
    );

  // --------------------------------------------------
  // 🎨 Rendu JSX
  // --------------------------------------------------
  return (
<div
    className="min-h-screen relative overflow-hidden"
    style={{ background: "linear-gradient(to bottom right, #00355a, #8accfd)" }}
  >
    {/* 🔹 Modal de configuration de partie */}
    <GameConfigModal
      isOpen={isConfigModalOpen}
      onClose={() => setConfigModalOpen(false)}
      onConfirm={(parameters) => handleConfigConfirm(parameters)}
    />

      {/* 🔹 Indicateur de connexion serveur */}
      <div className="absolute top-4 right-4 z-20">
        <div
          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${
            socketIsConnected
              ? 'bg-green-500/20 text-green-100 border border-green-400/30'
              : 'bg-red-500/20 text-red-100 border border-red-400/30'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${socketIsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
          ></div>
          <Wifi className="w-4 h-4" />
          <span>{socketIsConnected ? 'Serveur actif' : 'Serveur en veille'}</span>
        </div>
      </div>

      {/* 🔹 Bloc principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-white/20">
          {/* Logo et titre */}
          <div className="text-center mb-6">
            <div className="relative mb-4">
              <div className="w-20 h-20 mx-auto flex items-center justify-center">
                <img
                  src={useFallbackLogo ? fallbackLogo : logo}
                  onError={() => setUseFallbackLogo(true)}
                  alt="Kensho Logo"
                  className="w-full h-full object-contain rounded-2xl shadow-lg"
                />
              </div>
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full p-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1
              className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              KENSHO
            </h1>
            <p className="text-gray-700 text-lg font-medium mb-4">L'art de l’esquivation !</p>
          </div>

          {/* Message d’erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm font-medium mb-2">{error}</p>
            </div>
          )}

          {/* 🔹 Formulaire de création de salle */}
          <form className="space-y-4 mb-6">
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm text-black font-semibold mb-2">
                Votre pseudo
              </label>
              <input
                type="text"
                id="username"
                value={username ?? ''}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre pseudo"
                className={`text-black w-full px-4 py-4 rounded-xl border transition-all duration-200 bg-gray-50/50 font-medium focus:outline-none focus:ring-2 ${
                  error?.toLowerCase().includes('pseudo')
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                required
                maxLength={20}
                disabled={!socketIsConnected}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!username.trim()) return alert('Entrez un pseudo avant de créer une salle');
                setConfigModalOpen(true);
              }}
              disabled={!username.trim() || isCreating || !socketIsConnected}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>{isCreating ? 'Création...' : 'Créer un salon'}</span>
            </button>
          </form>

          {/* 🔹 Formulaire de connexion à une room */}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-semibold text-gray-700 mb-2">
                Code du salon
              </label>
              <input
                type="text"
                id="roomCode"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                className="text-black w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 font-mono text-center text-lg font-bold bg-gray-50/50 tracking-wider"
                maxLength={6}
                disabled={!socketIsConnected}
              />
            </div>
            <button
              type="submit"
              disabled={!username.trim() || !inputRoomCode.trim() || isJoining || !socketIsConnected}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <LogIn className="w-5 h-5" />
              <span>{isJoining ? 'Connexion...' : 'Rejoindre un salon'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
