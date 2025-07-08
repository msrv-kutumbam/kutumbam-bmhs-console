import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaThumbtack } from 'react-icons/fa'; // Import for unpin icon

const PinnedMessagesModal = ({
  showPinnedMessagesModal,
  setShowPinnedMessagesModal,
  pinnedMessages,
  formatDetailedTimestamp,
  togglePin // New prop: function to toggle pin status
}) => {
  if (!showPinnedMessagesModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Pinned Messages</h3>
          <button
            onClick={() => setShowPinnedMessagesModal(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pinnedMessages.length > 0 ? (
            pinnedMessages.map(msg => (
              <div key={msg.id} className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 relative">
                <div className="flex items-center space-x-2 mb-1">
                  <img
                    src={msg.profileImageUrl || `https://ui-avatars.com/api/?name=${msg.username}&background=random`}
                    alt={msg.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{msg.username}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDetailedTimestamp(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 break-words whitespace-pre-wrap">
                  {msg.text}
                </p>
                {msg.edited && <span className="text-xs opacity-70 ml-2 text-gray-500 dark:text-gray-400">(edited)</span>}
                {msg.deleted && <span className="text-xs opacity-70 ml-2 text-red-400">(deleted)</span>}

                {/* Unpin Button */}
                <button
                  onClick={() => togglePin(msg.id, msg.pinned)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-colors"
                  title="Unpin Message"
                >
                  <FaThumbtack className="w-4 h-4 rotate-45" /> {/* Rotate to indicate unpin */}
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No messages pinned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinnedMessagesModal;
