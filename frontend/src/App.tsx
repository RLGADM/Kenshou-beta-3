// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import RoomCreated from "@/pages/RoomCreated";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomCode" element={<RoomCreated />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default App;
