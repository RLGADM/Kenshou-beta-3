import { useEffect, useState } from 'react';

interface KeepAliveProps {
  serverUrl: string;
}

const KeepAlive: React.FC<KeepAliveProps> = ({ serverUrl }) => {
  useEffect(() => {
    // Fonction pour faire un ping et loguer résultat complet
    const pingServer = async () => {
      try {
        console.log(`[KeepAlive] Pinging server at ${new Date().toISOString()}...`);
        const response = await fetch(`${serverUrl}/health`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[KeepAlive] Server ping successful:', data);
        } else {
          console.warn(`[KeepAlive] Server ping failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error('[KeepAlive] Failed to ping server:', error);
      }
    };

    // Ping initial après 30 secondes
    const initialPingTimeout = setTimeout(() => {
      pingServer();
    }, 30000);

    // Ping périodique toutes les 10 minutes
    const intervalId = setInterval(
      () => {
        pingServer();
      },
      10 * 60 * 1000
    ); // 10 minutes

    return () => {
      clearTimeout(initialPingTimeout);
      clearInterval(intervalId);
    };
  }, [serverUrl]);

  return null;
};

export default KeepAlive;

// KeepAlive.tsx précédent
// import { useEffect } from 'react';
// interface KeepAliveProps {
//   serverUrl: string;
// }

// const KeepAlive: React.FC<KeepAliveProps> = ({ serverUrl }) => {
//   useEffect(() => {
//     // Ping le serveur toutes les 10 minutes pour le maintenir actif
//     const interval = setInterval(async () => {
//       try {
//         console.log('Pinging server to keep it alive...');
//         const response = await fetch(`${serverUrl}/health`, {
//           method: 'GET',
//           headers: {
//             'Accept': 'application/json',
//           },
//         });
//         if (response.ok) {
//           const data = await response.json();
//           console.log('Server pinged successfully:', data);
//         } else {
//           console.log('Server ping failed with status:', response.status);
//         }
//       } catch (error) {
//         console.log('Failed to ping server:', error);
//       }
//     }, 10 * 60 * 1000); // 10 minutes

//     // Ping initial après 30 secondes
//     const initialPing = setTimeout(async () => {
//       try {
//         console.log('Initial server ping...');
//         const response = await fetch(`${serverUrl}/health`, {
//           method: 'GET',
//           headers: {
//             'Accept': 'application/json',
//           },
//         });
//         if (response.ok) {
//           const data = await response.json();
//           console.log('Initial server ping successful:', data);
//         }
//       } catch (error) {
//         console.log('Initial server ping failed:', error);
//       }
//     }, 30000);

//     return () => {
//       clearInterval(interval);
//       clearTimeout(initialPing);
//     };
//   }, [serverUrl]);

//   return null;
// };

// export default KeepAlive;
