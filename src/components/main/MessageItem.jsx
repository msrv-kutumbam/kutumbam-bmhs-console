import React from 'react';
import { PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { FaThumbtack } from 'react-icons/fa';

const MessageItem = ({
  msg,
  user,
  index,
  filteredMessages,
  editingMessageId,
  editingMessageText,
  setEditingMessageText,
  editInputRef,
  startEdit,
  saveEdit,
  cancelEdit,
  deleteMessage, // Now accepts messageId and timestamp directly
  togglePin,
  handleReaction,
  getMessageStatusIcon
}) => {
  const isCurrentUser = msg.uid === user?.id;
  const showAvatar = index === 0 || filteredMessages[index - 1].uid !== msg.uid;
  const isConsecutive = index > 0 && filteredMessages[index - 1].uid === msg.uid;
  const canEditOrDelete = isCurrentUser && !msg.deleted &&
                          (msg.timestamp && (new Date() - msg.timestamp?.toDate() <= 5 * 60 * 1000)); // 5 minutes

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
    >
      {!isCurrentUser && (
        <div className="flex-shrink-0">
          {showAvatar ? (
            <img
              src={msg.profileImageUrl || `https://ui-avatars.com/api/?name=${msg.username}&background=random`}
              alt={msg.username}
              className="w-8 h-8 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-8 h-8"></div>
          )}
        </div>
      )}

      <div className={`group max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && showAvatar && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {msg.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {msg.role && `• ${msg.role}`}
            </span>
          </div>
        )}

        <div
          className={`relative px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
            isCurrentUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
          } ${isConsecutive ? (isCurrentUser ? 'rounded-br-md' : 'rounded-bl-md') : ''}
          ${msg.pinned ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-400 dark:ring-yellow-600' : ''}
          `}
        >
          {editingMessageId === msg.id ? (
            <div className="flex flex-col">
              <input
                ref={editInputRef}
                type="text"
                value={editingMessageText}
                onChange={(e) => setEditingMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit(msg.id);
                  }
                  if (e.key === 'Escape') {
                    cancelEdit();
                  }
                }}
                className="w-full px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-gray-600 dark:text-white text-sm"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => saveEdit(msg.id)}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-xs px-3 py-1 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="break-words whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
              {msg.text}
              {msg.edited && <span className="text-xs opacity-70 ml-2">(edited)</span>}
              {msg.deleted && <span className="text-xs opacity-70 ml-2">(deleted)</span>}
            </p>
          )}

          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(msg.reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(msg.id, emoji)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                    users.includes(user?.id)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              ))}
            </div>
          )}

          <div className={`flex items-center justify-between mt-1 space-x-2 ${
            isCurrentUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-500'
          }`}>
            <span className="text-xs">
              {formatTimestamp(msg.timestamp)}
            </span>
            {getMessageStatusIcon(msg)}
          </div>
        </div>

        {!msg.deleted && (
          <div className={`flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isCurrentUser ? 'order-first' : ''}`}>
            {canEditOrDelete && (
              <>
                <button
                  onClick={() => startEdit(msg)}
                  className="w-7 h-7 rounded-full bg-white dark:bg-gray-600 shadow-md hover:scale-110 transition-transform duration-200 flex items-center justify-center text-gray-600 dark:text-gray-300"
                  title="Edit Message"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMessage(msg.id, msg.timestamp)} // Pass message ID and timestamp
                  className="w-7 h-7 rounded-full bg-white dark:bg-gray-600 shadow-md hover:scale-110 transition-transform duration-200 flex items-center justify-center text-red-500"
                  title="Delete Message"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => togglePin(msg.id, msg.pinned)}
              className={`w-7 h-7 rounded-full bg-white dark:bg-gray-600 shadow-md hover:scale-110 transition-transform duration-200 flex items-center justify-center ${msg.pinned ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
              title={msg.pinned ? "Unpin Message" : "Pin Message"}
            >
              <FaThumbtack className="w-4 h-4" />
            </button>
            {['👍', '❤️', '😂'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(msg.id, emoji)}
                className="w-7 h-7 rounded-full bg-white dark:bg-gray-600 shadow-md hover:scale-110 transition-transform duration-200 flex items-center justify-center text-sm"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {isCurrentUser && user && (
        <div className="flex-shrink-0">
          {showAvatar ? (
            <img
              src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-8 h-8"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
