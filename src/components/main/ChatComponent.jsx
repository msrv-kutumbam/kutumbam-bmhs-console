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
  CheckIcon,
  ArrowUpTrayIcon, // For Load More
  ArrowDownIcon // For new message notification button
} from '@heroicons/react/24/outline';
import { db } from '../../firebase-config'; // Assuming db is correctly initialized here

// Import new sub-components
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';
import PinnedMessagesModal from './PinnedMessagesModal';
import OnlineUsersModal from './OnlineUsersModal';
import DeleteConfirmModal from './DeleteConfirmModal'; // New: Delete Confirmation Modal

// Add markAllMessagesAsSeen to props
const ChatComponent = ({ user, markAllMessagesAsSeen }) => {
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
  const [newMessagesNotification, setNewMessagesNotification] = useState(false);

  // New states for delete confirmation modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // New state for Notification permission
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null); // Ref for MessageInput's textarea
  const editInputRef = useRef(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '😭', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🚀', '✨', '💪', '🙌', '👏', '🤝', '🙏'];

  // --- Utility Functions ---

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

  const formatDetailedTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  // --- User Presence and Typing Status ---

  useEffect(() => {
    if (!user?.id) return;

    const userDocRef = doc(db, 'users', user.id);

    const setOnlineStatus = async () => {
      try {
        await setDoc(userDocRef, {
          uid: user.id,
          username: user.username || 'Guest',
          profileImageUrl: user.profileImageUrl || null,
          lastSeen: serverTimestamp(),
          isTyping: false,
        }, { merge: true });
      } catch (error) {
        console.error("Error setting online status:", error);
      }
    };

    setOnlineStatus();

    const interval = setInterval(async () => {
      try {
        await updateDoc(userDocRef, { lastSeen: serverTimestamp() });
      } catch (error) {
        console.error("Error updating lastSeen:", error);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (user?.id) {
        updateDoc(userDocRef, { isTyping: false }).catch(error => console.error("Error clearing typing status on unmount:", error));
      }
    };
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => {
          const lastSeenDate = u.lastSeen?.toDate();
          return u && u.id && lastSeenDate && (new Date() - lastSeenDate) < 60000;
        });
      setOnlineUsers(activeUsers);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isTyping', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typingUsersList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user?.id);
      setTypingUsers(typingUsersList);
    });
    return unsubscribe;
  }, [user]);

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
    }, 1500);
  }, [isTyping, user]);

  // --- Message Handling (Initial Load and Load More) ---

  // Initial message load and real-time updates
  useEffect(() => {
    // --- DEBUGGING LOG ---
    console.log("ChatComponent: Setting up messages listener. User ID:", user?.id, "DB instance:", db);
    if (!db) {
      console.error("Firestore DB instance is not available in ChatComponent!");
      setLoadingInitialMessages(false);
      return; // Prevent query if db is not ready
    }
    // --- END DEBUGGING LOG ---

    setLoadingInitialMessages(true);
    const initialQuery = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(20));

    const unsubscribe = onSnapshot(initialQuery, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();

      // Check if new messages arrived while not scrolled to bottom
      const messagesContainer = messagesStartRef.current;
      const isScrolledToBottom = messagesContainer &&
        (messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100); // 100px tolerance

      if (messages.length > 0 && fetchedMessages.length > messages.length && !isScrolledToBottom) {
        setNewMessagesNotification(true);
        // Trigger browser notification if permission is granted and it's not the current user's message
        const latestNewMessage = fetchedMessages[fetchedMessages.length - 1];
        if (notificationPermission === 'granted' && latestNewMessage.uid !== user?.id) {
          showBrowserNotification(latestNewMessage.username, latestNewMessage.text, latestNewMessage.profileImageUrl);
        }
      } else {
        setNewMessagesNotification(false);
      }

      setMessages(fetchedMessages);
      setLastVisibleMessage(snapshot.docs[snapshot.docs.length - 1] || null); // Oldest message for startAfter
      setHasMoreMessages(snapshot.size === 20);
      setLoadingInitialMessages(false);

      // Mark messages as seen when they are loaded and displayed
      fetchedMessages.forEach(async (msg) => {
        if (user?.id && msg.uid !== user.id && (!msg.seenBy || !msg.seenBy.includes(user.id))) {
          try {
            await updateDoc(doc(db, 'messages', msg.id), {
              seenBy: arrayUnion(user.id)
            });
          } catch (error) {
            console.error("Error marking message as seen:", error);
          }
        }
      });
    }, (error) => {
      console.error("Error fetching initial messages:", error);
      setLoadingInitialMessages(false);
    });
    return unsubscribe;
  }, [user, notificationPermission, db]); // Added db to dependencies

  // Load more messages when scrolling up
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || loadingMoreMessages || !lastVisibleMessage) return;

    setLoadingMoreMessages(true);
    try {
      const messagesContainer = messagesStartRef.current;
      const oldScrollHeight = messagesContainer.scrollHeight;
      const oldScrollTop = messagesContainer.scrollTop;

      const nextQuery = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisibleMessage),
        limit(20)
      );
      const snapshot = await getDocs(nextQuery);
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();

      setMessages(prevMessages => [...newMessages, ...prevMessages]);
      setLastVisibleMessage(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreMessages(snapshot.size === 20);

      requestAnimationFrame(() => {
        const newScrollHeight = messagesContainer.scrollHeight;
        messagesContainer.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
      });

    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [hasMoreMessages, loadingMoreMessages, lastVisibleMessage, db]); // Added db to dependencies

  useEffect(() => {
    const messagesContainer = messagesStartRef.current;
    if (messagesContainer) {
      const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;
      if (!loadingMoreMessages && (isScrolledToBottom || messages.length <= 20)) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMessagesNotification(false);
        // Call markAllMessagesAsSeen when scrolled to bottom or initial load
        if (markAllMessagesAsSeen) {
          markAllMessagesAsSeen();
        }
      }
    }
  }, [messages, loadingMoreMessages, markAllMessagesAsSeen]);


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
        seenBy: [user?.id || 'guest'],
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
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto'; // Reset textarea height
        messageInputRef.current?.focus();
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const handleReaction = async (messageId, emoji) => {
    if (!user?.id) return;
    try {
      const messageRef = doc(db, 'messages', messageId);
      const message = messages.find(m => m.id === messageId);
      const reactions = message.reactions || {};

      if (reactions[emoji]) {
        if (reactions[emoji].includes(user.id)) {
          reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji].push(user.id);
        }
      } else {
        reactions[emoji] = [user.id];
      }

      await updateDoc(messageRef, { reactions });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const startEdit = (message) => {
    setEditingMessageId(message.id);
    setEditingMessageText(message.text);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

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

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  // Function to trigger delete confirmation modal
  const handleDeleteClick = (messageId, timestamp) => {
    setMessageToDelete({ id: messageId, timestamp: timestamp });
    setShowDeleteConfirmModal(true);
  };

  // Actual delete logic, called from confirmation modal
  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    const { id: messageId, timestamp } = messageToDelete;
    const sentTime = timestamp.toDate();
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - sentTime <= fiveMinutes) {
      try {
        await updateDoc(doc(db, 'messages', messageId), {
          text: 'This message was deleted.',
          deleted: true,
          edited: true,
          editedAt: serverTimestamp(),
          reactions: {},
          pinned: false
        });
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    } else {
      console.warn("Cannot delete message older than 5 minutes.");
      // Using a custom modal/message box instead of alert()
      // You would replace this with a state-driven modal for user feedback
      // For now, logging to console.
      console.log("You can only delete messages within 5 minutes of sending.");
    }
    setShowDeleteConfirmModal(false);
    setMessageToDelete(null);
  };

  // Cancel delete action
  const cancelDeleteMessage = () => {
    setShowDeleteConfirmModal(false);
    setMessageToDelete(null);
  };

  const togglePin = async (messageId, currentPinnedStatus) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        pinned: !currentPinnedStatus
      });
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  const getMessageStatusIcon = (msg) => {
    if (!user || !user.id) {
      return null;
    }

    if (msg.uid !== user.id) return null;

    const seenCount = msg.seenBy?.length || 0;
    const totalOnlineUsersExcludingSelf = onlineUsers.filter(u => u.id !== user.id).length;

    if (seenCount <= 1 || totalOnlineUsersExcludingSelf === 0) {
      return <CheckIcon className="w-4 h-4 text-gray-400" />;
    } else {
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

  const filteredMessages = messages.filter(msg =>
    !searchQuery || msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedMessages = messages.filter(msg => msg.pinned);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessagesNotification(false);
    // Call markAllMessagesAsSeen when user manually scrolls to bottom
    if (markAllMessagesAsSeen) {
      markAllMessagesAsSeen();
    }
  };

  // --- Notification Logic ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  const showBrowserNotification = (sender, message, icon) => {
    if (notificationPermission === 'granted') {
      new Notification(`New message from ${sender}`, {
        body: message,
        icon: icon || `https://ui-avatars.com/api/?name=${sender}&background=random`
      });
    }
  };

  const toggleNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn("This browser does not support desktop notification");
      return;
    }

    if (notificationPermission === 'granted') {
      // Using console.log instead of alert()
      console.log("To stop notifications, please go to your browser settings and revoke permission for this site.");
      setNotificationPermission('denied'); // Set to denied locally, user must change in browser
    } else if (notificationPermission === 'denied') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } else { // 'default' or 'prompt'
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };


  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-mono text-base sm:text-sm md:text-base lg:text-base">
      {/* Header */}
      <ChatHeader
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        setShowOnlineUsersModal={setShowOnlineUsersModal}
        setShowPinnedMessagesModal={setShowPinnedMessagesModal}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        notificationPermission={notificationPermission}
        toggleNotificationPermission={toggleNotificationPermission}
      />

      {/* Messages Area */}
      <div ref={messagesStartRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {loadingInitialMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <span className="ml-2 text-gray-700 dark:text-gray-300">Loading messages...</span>
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="text-center py-2">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMoreMessages}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center mx-auto"
                  title="Load More Messages"
                >
                  {loadingMoreMessages ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <ArrowUpTrayIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}

            {filteredMessages.map((msg, index) => (
              <MessageItem
                key={msg.id}
                msg={msg}
                user={user}
                index={index}
                filteredMessages={filteredMessages}
                editingMessageId={editingMessageId}
                editingMessageText={editingMessageText}
                setEditingMessageText={setEditingMessageText}
                editInputRef={editInputRef}
                startEdit={startEdit}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                deleteMessage={handleDeleteClick}
                togglePin={togglePin}
                handleReaction={handleReaction}
                getMessageStatusIcon={getMessageStatusIcon}
              />
            ))}
          </>
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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

      {/* New Messages Notification */}
      {newMessagesNotification && (
        <div className="absolute bottom-28 right-4 z-40">
          <button
            onClick={scrollToBottom}
            className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 animate-bounce"
            title="Scroll to new messages"
          >
            <ArrowDownIcon className="w-5 h-5" />
            <span>New messages!</span>
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-[80px] sm:bottom-[90px] left-4 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-h-48 overflow-y-auto z-30">
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
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        handleTyping={handleTyping}
        messageInputRef={messageInputRef}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
      />

      {/* Modals */}
      <PinnedMessagesModal
        showPinnedMessagesModal={showPinnedMessagesModal}
        setShowPinnedMessagesModal={setShowPinnedMessagesModal}
        pinnedMessages={pinnedMessages}
        formatDetailedTimestamp={formatDetailedTimestamp}
        togglePin={togglePin}
      />

      <OnlineUsersModal
        showOnlineUsersModal={showOnlineUsersModal}
        setShowOnlineUsersModal={setShowOnlineUsersModal}
        onlineUsers={onlineUsers}
      />

      <DeleteConfirmModal
        show={showDeleteConfirmModal}
        onConfirm={confirmDeleteMessage}
        onCancel={cancelDeleteMessage}
      />
    </div>
  );
};

export default ChatComponent;
