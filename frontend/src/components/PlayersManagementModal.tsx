import React, { useState } from 'react';
import { X, Crown, Shield, User, UserX, Ban } from 'lucide-react';
import { User as UserType, RoomRole } from '../types';

interface PlayersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  currentUser: UserType;
  onChangeUserRole: (userId: string, newRole: RoomRole) => void;
  onKickUser: (userId: string, reason: string) => void;
  onBanUser: (userId: string, reason: string) => void;
}

const PlayersManagementModal: React.FC<PlayersManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onChangeUserRole,
  onKickUser,
  onBanUser
}) => {
  const [selectedAction, setSelectedAction] = useState<{ userId: string; action: 'kick' | 'ban' } | null>(null);
  const [reason, setReason] = useState('');

  const usersWithAdminRole = users.map(user => ({
    ...user,
    isAdmin: true,// Assuming all users are admins for this example
  }));
  
  const isAdmin = true;

  console.log('PlayersManagementModal - Current user:', currentUser);
  console.log('PlayersManagementModal - Is admin:', isAdmin);
  console.log('PlayersManagementModal - All users:', users);

  const getRoleIcon = (role: RoomRole) => {
    switch (role) {
      case 'Admin':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'Héraut':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'Débutant':
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleColor = (role: RoomRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'Héraut':
        return 'bg-blue-50 border-blue-300 text-blue-800';
      case 'Débutant':
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const handleRoleChange = (userId: string, newRole: RoomRole) => {
    console.log('Attempting to change role for user:', userId, 'to role:', newRole);
    console.log('Current user can modify:', isAdmin);
    onChangeUserRole(userId, newRole);
  };

  const handleActionConfirm = () => {
    if (selectedAction && reason.trim()) {
      if (selectedAction.action === 'kick') {
        onKickUser(selectedAction.userId, reason.trim());
      } else {
        onBanUser(selectedAction.userId, reason.trim());
      }
      setSelectedAction(null);
      setReason('');
    }
  };

  const handleActionCancel = () => {
    setSelectedAction(null);
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Gestion des joueurs</h2>
            <button 
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-300 hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Debug Info - À supprimer en production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
              <p><strong>Debug:</strong> Current user is admin: {isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>Current user role:</strong> {currentUser.roomRole || 'undefined'}</p>
              <p><strong>Users count:</strong> {users.length}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {usersWithAdminRole.map((user) => {
              const userId = (user as any).userToken ?? (user as any).id;
              const currentUserId = (currentUser as any).userToken ?? (currentUser as any).id;
              const isCurrentUser = userId === currentUserId;
              const canModify = isAdmin && !isCurrentUser;
              const canChangeRole = isAdmin;
              
              console.log(`User ${user.username}: canModify=${canModify}, canChangeRole=${canChangeRole}, isCurrentUser=${isCurrentUser}`);
              
              return (
                <div key={userId} className={`rounded-xl p-4 border-2 transition-all durée-300 ${
                  isCurrentUser ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.username}
                          {isCurrentUser && <span className="text-blue-600 ml-2">(Vous)</span>}
                        </p>
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.roomRole || 'Débutant')}`}>
                          {getRoleIcon(user.roomRole || 'Débutant')}
                          <span>{user.roomRole || 'Débutant'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {canChangeRole && (
                      <div className="flex items-center space-x-3">
                        {isCurrentUser ? (
                          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500">
                            {user.roomRole || 'Débutant'} (Vous)
                          </div>
                        ) : (
                          <select
                            value={user.roomRole || 'Débutant'}
                            onChange={(e) => handleRoleChange(userId, e.target.value as RoomRole)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="Débutant">Débutant</option>
                            <option value="Héraut">Héraut</option>
                            <option value="Admin">Admin</option>
                          </select>
                        )}
                        
                        {!isCurrentUser && (
                          <>
                            <button
                              onClick={() => setSelectedAction({ userId, action: 'kick' })}
                              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                              title="Expulser"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedAction({ userId, action: 'ban' })}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all durée-300 hover:scale-105"
                              title="Bannir"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {!isAdmin && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800 text-sm">
                <strong>Note :</strong> Seuls les Admins peuvent modifier les rôles et gérer les joueurs.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Confirmation Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {selectedAction.action === 'kick' ? 'Expulser le joueur' : 'Bannir le joueur'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedAction.action === 'kick' 
                ? 'Le joueur sera expulsé du salon mais pourra revenir.'
                : 'Le joueur sera banni définitivement (par IP) et ne pourra plus rejoindre ce salon.'
              }
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Raison :</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Entrez la raison..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleActionCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Annuler
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={!reason.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 text-white ${
                  selectedAction.action === 'kick'
                    ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400'
                    : 'bg-red-500 hover:bg-red-600 disabled:bg-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {selectedAction.action === 'kick' ? 'Expulser' : 'Bannir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersManagementModal;