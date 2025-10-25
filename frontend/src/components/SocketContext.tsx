import { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';

export const SocketContext = createContext<{ socket: Socket | null }>({ socket: null });

export const useSocketContext = () => useContext(SocketContext);
