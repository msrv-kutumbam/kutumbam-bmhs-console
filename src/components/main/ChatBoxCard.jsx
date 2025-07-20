import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'; // For icons

function ChatBoxCard({ onlineUsersCount = 0, newMessagesCount = 0, userData }) {
  const navigate = useNavigate();

  // Determine if the card should be shown based on userData?.for
  // This check is also in Home.jsx, but good to have here for component reusability
  if (userData?.for !== "BMHS") {
    return null; // Don't render the component if not for BMHS
  }

  return (
    <div
      className="rounded-lg shadow p-6 cursor-pointer
                 bg-gray-700 text-white border border-gray-600
                 hover:bg-gray-600 transition duration-300 ease-in-out
                 relative overflow-hidden" // Added relative and overflow for notification badge
      onClick={() => {
        try {
          navigate(`/ChatComponent`);
        } catch (error) {
          console.error('Error navigating to chat:', error);
        }
      }}
    >
      <h3 className="text-lg font-semibold mb-2 text-blue-300">
        Introducing team chat box.
      </h3>

      <div className="flex items-center space-x-4 mt-4 text-gray-300">
        {/* Online Users */}
        <div className="flex items-center space-x-1">
          <UsersIcon className="h-5 w-5" />
          <span className="text-sm">
            {onlineUsersCount === 0
              ? 'No one online'
              : onlineUsersCount === 1
              ? '1 member online'
              : `${onlineUsersCount} members online`}
          </span>
        </div>

        {/* New Messages Notification Badge */}
        {newMessagesCount > 0 && (
          <div className="flex items-center space-x-1 text-red-400 font-bold animate-pulse">
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span className="text-sm">
              {newMessagesCount} new message{newMessagesCount > 1 ? 's' : ''}!
            </span>
          </div>
        )}
      </div>

      {/* Optional: Small "New" tag in the corner for first-time introduction */}
      {/* You might want to control this based on a flag in your app state (e.g., hasSeenChatIntro) */}
      <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
        New!
      </div>
    </div>
  );
}

export default ChatBoxCard;
