import { useEffect, useState } from 'react';

// Génération token
export function useGenerateToken() {
  useEffect(() => {
    if (!localStorage.getItem('userToken')) {
      const token = crypto.randomUUID(); // Génère un token unique (ex: 'f1d1bca8-...')
      localStorage.setItem('userToken', token);
      localStorage.setItem('hasLeftRoom', 'false');
    }
  }, []);
}

// Retourner le token du joueur
export function useUserToken(): string {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('userToken');
    if (stored) return stored;

    const newToken = crypto.randomUUID();
    localStorage.setItem('userToken', newToken);
    return newToken;
  });

  useEffect(() => {
    const stored = localStorage.getItem('userToken');
    if (stored && stored !== token) {
      setToken(stored);
    }
  }, []);

  return token;
}
