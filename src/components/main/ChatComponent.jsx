import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  where, 
  getDocs, 
  setDoc,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter
} from 'firebase/firestore';
import { 
  PaperAirplaneIcon, 
  FaceSmileIcon, 
  PaperClipIcon, 
  PhoneIcon, 
  VideoCameraIcon, 
  EllipsisVerticalIcon, 
  MagnifyingGlassIcon, 
  CheckIcon,
  PencilIcon, // For edit
  TrashIcon, // For delete
  XMarkIcon // For close modal
} from '@heroicons/react/24/outline';
import { FaThumbtack } from 'react-icons/fa'; // Importing FaThumbtack from react-icons/fa
import { db } from '../../firebase-config'; // Assuming db is correctly initialized here

const ChatComponent = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState(''); 
  const [showPinnedMessagesModal, setShowPinnedMessagesModal] = useState(false);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false); 

  // States for message loading and pagination
  const [loadingInitialMessages, setLoadingInitialMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [lastVisibleMessage, setLastVisibleMessage] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const messagesEndRef = useRef(null); // For auto-scrolling to bottom
  const messagesStartRef = useRef(null); // For scrolling to top after loading more
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const editInputRef = useRef(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '😭', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🚀', '✨', '💪', '🙌', '👏', '🤝', '🙏'];

  // --- Utility Functions ---

  // Format timestamp for display (e.g., "5m", "2h", "3d")
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date; // Difference in milliseconds

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(); // Fallback for older messages
  };

  // Format detailed timestamp for tooltips
  const formatDetailedTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  // --- User Presence and Typing Status ---

  // Effect to update current user's online status and typing status in Firestore
  useEffect(() => {
    if (!user?.id) return;

    const userDocRef = doc(db, 'users', user.id);

    // Set user online status on mount
    const setOnlineStatus = async () => {
      try {
        await setDoc(userDocRef, {
          uid: user.id,
          username: user.username || 'Guest',
          profileImageUrl: user.profileImageUrl || null,
          lastSeen: serverTimestamp(),
          isTyping: false, // Ensure typing status is false initially
        }, { merge: true }); // Use merge to avoid overwriting other user data
      } catch (error) {
        console.error("Error setting online status:", error);
      }
    };

    setOnlineStatus();

    // Update lastSeen periodically
    const interval = setInterval(async () => {
      try {
        await updateDoc(userDocRef, { lastSeen: serverTimestamp() });
      } catch (error) {
        console.error("Error updating lastSeen:", error);
      }
    }, 30000); // Every 30 seconds

    // Clean up on unmount (set offline or clear typing status)
    return () => {
      clearInterval(interval);
      // Optionally, set an 'offline' status or just let lastSeen naturally age
      // For simplicity, we just clear typing status
      if (user?.id) {
        updateDoc(userDocRef, { isTyping: false }).catch(error => console.error("Error clearing typing status on unmount:", error));
      }
    };
  }, [user]);

  // Effect to listen for online users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => {
          // Ensure 'u' and 'u.id' exist before processing
          const lastSeenDate = u.lastSeen?.toDate();
          return u && u.id && lastSeenDate && (new Date() - lastSeenDate) < 60000;
        });
      setOnlineUsers(activeUsers);
    });
    return unsubscribe;
  }, []);

  // Effect to listen for typing status of other users
  useEffect(() => {
    const q = query(collection(db, 'users'), where('isTyping', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typingUsersList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user?.id); // Exclude current user
      setTypingUsers(typingUsersList);
    });
    return unsubscribe;
  }, [user]);

  // Handle typing indicator update in Firestore
  const handleTyping = useCallback(() => {
    if (!user?.id) return;
    const userDocRef = doc(db, 'users', user.id);

    if (!isTyping) {
      setIsTyping(true);
      updateDoc(userDocRef, { isTyping: true }).catch(error => console.error("Error setting typing status:", error));
    }
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateDoc(userDocRef, { isTyping: false }).catch(error => console.error("Error clearing typing status:", error));
    }, 1500); // Clear typing status after 1.5 seconds of no input
  }, [isTyping, user]);

  // --- Message Handling (Initial Load and Load More) ---

  // Initial message load
  useEffect(() => {
    setLoadingInitialMessages(true);
    const initialQuery = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(20));
    
    const unsubscribe = onSnapshot(initialQuery, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse(); // Reverse for chronological order
      setMessages(fetchedMessages);
      setLastVisibleMessage(snapshot.docs[0] || null); // The first doc in desc order is the oldest for display
      setHasMoreMessages(snapshot.size === 20);
      setLoadingInitialMessages(false);

      // Mark messages as seen by current user
      fetchedMessages.forEach(async (msg) => {
        if (user?.id && msg.uid !== user.id && (!msg.seenBy || !msg.seenBy.includes(user.id))) {
          try {
            await updateDoc(doc(db, 'messages', msg.id), {
              seenBy: arrayUnion(user.id) // Add current user's ID to seenBy array
            });
          } catch (error) {
            console.error("Error marking message as seen:", error);
          }
        }
      });
    });
    return unsubscribe;
  }, [user]);

  // Load more messages when scrolling up
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || loadingMoreMessages || !lastVisibleMessage) return;

    setLoadingMoreMessages(true);
    try {
      const nextQuery = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisibleMessage),
        limit(20)
      );
      const snapshot = await getDocs(nextQuery);
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse(); // Reverse for chronological order

      setMessages(prevMessages => [...newMessages, ...prevMessages]); // Prepend new messages
      setLastVisibleMessage(snapshot.docs[0] || null); // Update last visible for next load
      setHasMoreMessages(snapshot.size === 20);

      // Scroll to maintain position after loading more messages
      if (messagesStartRef.current) {
        const currentScrollHeight = messagesStartRef.current.scrollHeight;
        messagesStartRef.current.scrollTop = currentScrollHeight - messagesStartRef.current.offsetHeight;
      }

    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [hasMoreMessages, loadingMoreMessages, lastVisibleMessage]);


  // Auto scroll to bottom when new messages arrive (only if not loading more)
  useEffect(() => {
    if (!loadingMoreMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMoreMessages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        timestamp: serverTimestamp(),
        uid: user?.id || 'guest',
        username: user?.username || 'Guest',
        avatar: user?.avatar || '👤',
        profileImageUrl: user?.profileImageUrl || null,
        email: user?.email || '',
        seenBy: [user?.id || 'guest'], // Initialize seenBy with sender's ID
        edited: false,
        editedAt: null,
        deleted: false,
        pinned: false,
        reactions: {},
        messageType: 'text'
      });
      
      setNewMessage('');
      setIsTyping(false);
      setShowEmojiPicker(false);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Add emoji to message input
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  // Handle message reaction
  const handleReaction = async (messageId, emoji) => {
    if (!user?.id) return; // Ensure user is available before reacting
    try {
      const messageRef = doc(db, 'messages', messageId);
      const message = messages.find(m => m.id === messageId);
      const reactions = message.reactions || {};
      
      if (reactions[emoji]) {
        if (reactions[emoji].includes(user.id)) {
          // User already reacted with this emoji, remove their reaction
          reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji]; // Remove emoji key if no one reacted with it
          }
        } else {
          // User reacted with this emoji, add their reaction
          reactions[emoji].push(user.id);
        }
      } else {
        // First reaction with this emoji
        reactions[emoji] = [user.id];
      }
      
      await updateDoc(messageRef, { reactions });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // --- Message Actions (Edit, Delete, Pin) ---

  // Start editing a message
  const startEdit = (message) => {
    setEditingMessageId(message.id);
    setEditingMessageText(message.text); 
    // Focus the input field after state update and re-render
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  // Save edited message
  const saveEdit = async (messageId) => {
    if (!editingMessageText.trim()) return;
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        text: editingMessageText,
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditingMessageId(null);
      setEditingMessageText(''); 
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText(''); 
  };

  // Delete message
  const deleteMessage = async (messageId, timestamp) => {
    const sentTime = timestamp.toDate();
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (now - sentTime <= fiveMinutes) {
      try {
        await updateDoc(doc(db, 'messages', messageId), {
          text: 'This message was deleted.',
          deleted: true,
          edited: true, // Mark as edited since content changed
          editedAt: serverTimestamp(),
          reactions: {}, // Clear reactions on deletion
          pinned: false // Unpin if deleted
        });
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    } else {
      // In a real app, you might show a modal/toast here
      console.warn("Cannot delete message older than 5 minutes.");
      alert("You can only delete messages within 5 minutes of sending."); // Using alert for demo, replace with custom UI
    }
  };

  // Toggle pin status of a message
  const togglePin = async (messageId, currentPinnedStatus) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        pinned: !currentPinnedStatus
      });
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  // --- UI Rendering Helpers ---

  // Get message status icon (seen by count)
  const getMessageStatusIcon = (msg) => {
    // Ensure user and user.id exist before proceeding
    if (!user || !user.id) {
      return null;
    }

    if (msg.uid !== user.id) return null; 

    const seenCount = msg.seenBy?.length || 0;
    // Filter out the current user from online users for a more accurate 'others seen' count
    const totalOnlineUsersExcludingSelf = onlineUsers.filter(u => u.id !== user.id).length;

    // If sender is the only one online or no one else has seen it, show single check
    if (seenCount <= 1 || totalOnlineUsersExcludingSelf === 0) {
      return <CheckIcon className="w-4 h-4 text-gray-400" />;
    } else {
      // Simulate a double checkmark using two CheckIcons for "seen by others"
      return (
        <div className="relative w-4 h-4">
          <CheckIcon className="absolute top-0 left-0 w-4 h-4 text-blue-500" />
          <CheckIcon className="absolute top-0 left-1.5 w-4 h-4 text-blue-500" />
          {seenCount > 1 && (
            <span className="absolute -top-2 left-4 text-[0.6rem] font-bold text-blue-600 dark:text-blue-300">
              {seenCount - 1}+
            </span>
          )}
        </div>
      );
    }
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(msg => 
    !searchQuery || msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get pinned messages for the modal
  const pinnedMessages = messages.filter(msg => msg.pinned);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              💬
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Team Chat</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <button 
                onClick={() => setShowOnlineUsersModal(true)} // Make online status clickable
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
        
        <div className="flex items-center space-x-2">
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
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Start Call">
            <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Start Video Call">
            <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="More Options">
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      {/* Messages Area */}
      <div ref={messagesStartRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {/* Loading indicator for initial messages */}
        {loadingInitialMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <span className="ml-2 text-gray-700 dark:text-gray-300">Loading messages...</span>
          </div>
        ) : (
          <>
            {/* Load More button */}
            {hasMoreMessages && (
              <div className="text-center py-2">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMoreMessages}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {loadingMoreMessages ? 'Loading more...' : 'Load More Messages'}
                </button>
              </div>
            )}

            {/* Display messages */}
            {filteredMessages.map((msg, index) => {
              const isCurrentUser = msg.uid === user?.id;
              const showAvatar = index === 0 || filteredMessages[index - 1].uid !== msg.uid;
              const isConsecutive = index > 0 && filteredMessages[index - 1].uid === msg.uid;
              const canEditOrDelete = isCurrentUser && !msg.deleted && 
                                      (new Date() - msg.timestamp?.toDate() <= 5 * 60 * 1000); // 5 minutes

              return (
                <div
                  key={msg.id}
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
                            className="w-full px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-gray-600 dark:text-white"
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
                        <p className="break-words whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                          {msg.edited && <span className="text-xs opacity-70 ml-2">(edited)</span>}
                          {msg.deleted && <span className="text-xs opacity-70 ml-2">(deleted)</span>}
                        </p>
                      )}
                      
                      {/* Message reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                users.includes(user?.id) // Added optional chaining here
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
                      
                      {/* Message info */}
                      <div className={`flex items-center justify-between mt-1 space-x-2 ${
                        isCurrentUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        {getMessageStatusIcon(msg)}
                      </div>
                    </div>
                    
                    {/* Message action buttons (hover) */}
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
                              onClick={() => deleteMessage(msg.id, msg.timestamp)}
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
                        {/* Quick reactions */}
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
                  
                  {isCurrentUser && user && ( // Added check for 'user' here
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
            })}
          </>
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm">
              {typingUsers.length === 1 
                ? `${typingUsers[0].username} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-10 gap-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Choose Emoji"
          >
            <FaceSmileIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Attach File">
            <PaperClipIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={messageInputRef}
              type="text"
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
              className="w-full px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            title="Send Message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pinned Messages Modal */}
      {showPinnedMessagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  <div key={msg.id} className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700">
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
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No messages pinned yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online Users Modal */}
      {showOnlineUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  // Added a check for onlineUser and onlineUser.id to prevent null errors
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
      )}
    </div>
  );
};

export default ChatComponent;
