import React, { useState } from 'react';
import {
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  XMarkIcon
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
  toggleNotificationPermission
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm text-sm sm:text-base flex-shrink-0">
        <div class="flex justify-between items-center w-full max-w-md  rounded-lg shadow-lg">
            <div className="flex items-center space-x-3 mb-2 sm:mb-0 w-full sm:w-auto">
                <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    💬
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Team Chat</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <button
                    onClick={() => setShowOnlineUsersModal(true)}
                    className="hover:underline focus:outline-none"
                    title="View Online Members"
                    >
                    <span>{onlineUsers.length} Online</span>
                    </button>
                    {typingUsers.length > 0 && (
                    <span className="text-blue-500 animate-pulse ml-2">• {typingUsers[0].username} is typing...</span>
                    )}
                </p>
                </div>
            </div>

            <div className="flex items-center space-x-2 relative">
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

                {/* More Options Button */}
                <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="More Options"
                >
                <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {/* More Options Dropdown */}
                {showMoreOptions && (
                <MoreOptionsDropdown
                    setShowMoreOptions={setShowMoreOptions}
                    notificationPermission={notificationPermission}
                    toggleNotificationPermission={toggleNotificationPermission}
                />
                )}
            </div>
        </div>

      {showSearch && (
        <div className="w-full mt-3 sm:mt-0 sm:ml-4">
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
