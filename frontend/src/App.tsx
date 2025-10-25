// --------------- IMPORT

// Import Framwork
import React, { useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Import tsx
import Home from './pages/Home';
import RoomCreated from './pages/RoomCreated.tsx';
// Import ts et hooks
import {
  useHydration,
  useRoomEvents,
  useServerReset,
  useSocketInitializer,
  useGenerateToken,
  useReconnection,
} from '@/hooks';
import { SocketContext } from '@/components';
import KeepAlive from './components/KeepAlive';
// --------------- Déclaration des consts

//const serveur
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.PROD ? 'https://kenshou-beta-3.onrender.com' : 'http://localhost:3000');
//<<import logoUrl from './assets/logo.png';

// Déclaration du main
const App: React.FC = () => {
  // const locales
  const hasRejoinAttempted = useRef(false);

  // const hooks
  const { socket, socketIsConnected, setInRoom, handleJoinRoom } = useRoomEvents();

  // --------------- Début du Code
  // serverReset pour le frontend car toutes données backend supprimmé via reboot
  useServerReset(socket);

  //hydratation via hooks
  useHydration();

  //log sur socket
  useSocketInitializer(socket);

  // création token utilisateur
  useGenerateToken();

  //reconnect si F5
  useReconnection({
    socket,
    isConnected: socketIsConnected,
    hasRejoinAttempted,
    handleJoinRoom,
    setInRoom,
  });

  // --------------- Début du JSX

  // Détection du mode Démo
  // if (isDemoMode) return <DemoMode />;

  // Message si connexion en cours
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

  // Message si connexion KO
  if (!socketIsConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d6eaf6] via-[#eaf4fa] to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
          {/* Cercle animé */}
          <div className="mb-6 relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#37719a] opacity-30 animate-spin-slow"></div>
            <div className="w-4 h-4 bg-[#37719a] rounded-full animate-ping-custom z-10"></div>
            <div className="absolute w-2 h-2 bg-[#37719a] rounded-full animate-orbital"></div>
          </div>

          <h2 className="text-2xl font-bold text-[#37719a] mb-3">Connexion échouée</h2>
          <p className="text-[#37719a]/80 mb-6">
            Impossible de se connecter au serveur. Le serveur est peut être en maintenance. :).
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

  return (
    <>
      <SocketContext.Provider value={{ socket }}>
        <Toaster position="top-center" />
        <KeepAlive serverUrl={SERVER_URL} />
        {/* rootage */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomCode" element={<RoomCreated />} />
          {/* <Route path="/demo" element={<DemoMode />} /> */}
        </Routes>
      </SocketContext.Provider>
    </>
  );
};
export default App;
