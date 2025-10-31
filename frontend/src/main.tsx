// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from '@/components/SocketContext';
import App from './App';

// Pages existantes
import Home from '@/pages/Home';
import RoomCreated from '@/pages/RoomCreated';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            {/* Accueil */}
            <Route index element={<Home />} />
            {/* Salle */}
            <Route path="room/:roomCode" element={<RoomCreated />} />
            {/* Fallback 404 */}
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  </React.StrictMode>
);
