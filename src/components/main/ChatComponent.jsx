import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase'; // Ensure this points to your Firebase config
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const ChatComponent = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      timestamp: serverTimestamp(),
      uid: user?.uid || 'guest',
      displayName: user?.displayName || 'Guest',
      photoURL: user?.photoURL || null
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`max-w-md px-4 py-2 rounded-xl shadow-md ${msg.uid === user?.uid ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'} w-fit`}
          >
            <p className="text-sm font-semibold">{msg.displayName}</p>
            <p>{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t flex items-center px-4 py-3 bg-white dark:bg-gray-900">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none dark:bg-gray-800 dark:text-white"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="ml-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;