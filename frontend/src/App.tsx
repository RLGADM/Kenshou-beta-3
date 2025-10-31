// ---------------------- IMPORTS ----------------------
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useHydration } from './hooks/app/useHydration';
import { useReconnection } from './hooks/app/useReconnection';
import { useSocket } from './hooks/global/useSocket';

// ---------------------- COMPOSANT PRINCIPAL ----------------------
const App: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useHydration();
  useReconnection({ socket, isConnected });

  // ---------------------- ÉTATS DE CONNEXION ----------------------
  if (!socket?.connected) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#eaf4fa] text-[#37719a] px-4">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-4 border-[#37719a] opacity-30 animate-spin-slow"></span>
          <span className="w-5 h-5 bg-[#37719a] rounded-full animate-ping-custom z-10"></span>
          <span className="absolute w-3 h-3 bg-[#37719a] rounded-full animate-orbital"></span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Connexion au serveur...</h2>
        <p className="text-center text-sm max-w-xs">
          Veuillez patienter pendant que nous établissons la connexion. Cela peut prendre jusqu'à 60 secondes.
        </p>
      </div>
    );
  }
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d6eaf6] via-[#eaf4fa] to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
          <div className="mb-6 relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#37719a] opacity-30 animate-spin-slow"></div>
            <div className="w-4 h-4 bg-[#37719a] rounded-full animate-ping-custom z-10"></div>
            <div className="absolute w-2 h-2 bg-[#37719a] rounded-full animate-orbital"></div>
          </div>

          <h2 className="text-2xl font-bold text-[#37719a] mb-3">Connexion échouée</h2>
          <p className="text-[#37719a]/80 mb-6">
            Impossible de se connecter au serveur. Le serveur est peut-être en maintenance.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#37719a] to-[#2d5f83] text-white rounded-xl font-semibold hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ---------------------- RENDU PRINCIPAL ----------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white flex flex-col">
      {/* Notifications globales */}
      <Toaster position="top-center" />

      {/* 🔹 HEADER GLOBAL */}
      <header className="w-full border-b border-slate-700 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* 🔸 LOGO ANIMÉ */}
          <div className="group flex items-center space-x-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            {/* Lettre K avec effet de lumière */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
              <span className="text-slate-900 font-extrabold text-lg tracking-tight z-10">K</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
            </div>

            {/* Texte Kensho avec effet fondu */}
            <h1 className="text-xl font-semibold tracking-wide text-white transition-all duration-300 group-hover:text-cyan-300">
              Kensho
            </h1>
          </div>

          {/* 🔸 BOUTONS DE NAVIGATION */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-sm transition-all"
            >
              🏠 Accueil
            </button>
            <button
              onClick={() => navigate('/room/demo')}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow transition-all"
            >
              🔄 Rejoindre
            </button>
          </div>
        </div>
      </header>

      {/* 🔹 CONTENU DES PAGES */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default App;
