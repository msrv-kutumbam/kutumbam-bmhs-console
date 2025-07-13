import React, { useState } from 'react';
import {
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { FaThumbtack } from 'react-icons/fa';
import MoreOptionsDropdown from './MoreOptionsDropdown';

const ChatHeader = ({
  onlineUsers,
  typingUsers,
  setShowOnlineUsersModal,
  setShowPinnedMessagesModal,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  notificationPermission,
  toggleNotificationPermission,
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  return (
    <div className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm text-sm sm:text-base">
      {/* Top Row */}
      <div className="flex items-center justify-between flex-wrap gap-y-2">
        {/* Left: Avatar + Chat Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              💬
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="truncate">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
              Team Chat
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <button
                onClick={() => setShowOnlineUsersModal(true)}
                className="hover:underline focus:outline-none"
                title="View Online Members"
              >
                <span>{onlineUsers.length} Online</span>
              </button>
              {typingUsers.length > 0 && (
                <span className="text-blue-500 animate-pulse ml-2 truncate">
                  • {typingUsers[0].username} is typing...
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPinnedMessagesModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View Pinned Messages"
          >
            <FaThumbtack className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Search Messages"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="More Options"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Render MoreOptionsDropdown directly without a relative wrapper */}
          {showMoreOptions && (
            <MoreOptionsDropdown
              setShowMoreOptions={setShowMoreOptions}
              notificationPermission={notificationPermission}
              toggleNotificationPermission={toggleNotificationPermission}
            />
          )}
        </div>
      </div>

      {/* Search Box */}
      {showSearch && (
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
