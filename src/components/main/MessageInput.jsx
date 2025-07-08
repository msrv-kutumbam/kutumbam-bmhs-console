import React, { useEffect } from 'react';
import { PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const MessageInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  handleTyping,
  messageInputRef,
  showEmojiPicker,
  setShowEmojiPicker
}) => {

  // Effect to auto-resize textarea
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto'; // Reset height
      messageInputRef.current.style.height = messageInputRef.current.scrollHeight + 'px'; // Set to scroll height
    }
  }, [newMessage, messageInputRef]); // Re-run when newMessage changes

  return (
    <div className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-end space-x-2 sm:space-x-3">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors self-end"
          title="Choose Emoji"
        >
          <FaceSmileIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
        </button>

        <button className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors self-end" title="Attach File">
          <PaperClipIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={messageInputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1} // Start with 1 row
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base resize-none overflow-hidden max-h-32" // Added resize-none, overflow-hidden, max-h-32
            style={{ minHeight: '42px' }} // Ensure a minimum height similar to original input
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg self-end"
          title="Send Message"
        >
          <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
