import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const OnlineUsersModal = ({
  showOnlineUsersModal,
  setShowOnlineUsersModal,
  onlineUsers
}) => {
  if (!showOnlineUsersModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Online Members ({onlineUsers.length})</h3>
          <button
            onClick={() => setShowOnlineUsersModal(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {onlineUsers.length > 0 ? (
            onlineUsers.map(onlineUser => (
              onlineUser && onlineUser.id && (
                <div key={onlineUser.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <img
                    src={onlineUser.profileImageUrl || `https://ui-avatars.com/api/?name=${onlineUser.username}&background=random`}
                    alt={onlineUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{onlineUser.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {onlineUser.isTyping ? <span className="text-blue-500">Typing...</span> : 'Online'}
                    </p>
                  </div>
                </div>
              )
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No other members currently online.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersModal;
