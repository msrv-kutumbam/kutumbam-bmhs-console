import React, { useRef, useEffect } from 'react';
import {
  PhoneIcon,
  VideoCameraIcon,
  BellIcon,
  BellSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const MoreOptionsDropdown = ({
  setShowMoreOptions,
  notificationPermission,
  toggleNotificationPermission,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowMoreOptions]);

  return (
    <div
      ref={dropdownRef}
      className="fixed right-4 top-16 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] overflow-hidden"
    >
      <div className="py-1">
        <button
          className="flex items-center w-full px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          onClick={() => {
            console.log('Starting a call...'); // Replaced alert()
            setShowMoreOptions(false);
          }}
        >
          <PhoneIcon className="w-5 h-5 mr-2" /> Start Call
        </button>
        <button
          className="flex items-center w-full px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          onClick={() => {
            console.log('Starting a video call...'); // Replaced alert()
            setShowMoreOptions(false);
          }}
        >
          <VideoCameraIcon className="w-5 h-5 mr-2" /> Start Video Call
        </button>
        <button
          className="flex items-center w-full px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          onClick={() => {
            toggleNotificationPermission();
            setShowMoreOptions(false);
          }}
        >
          {notificationPermission === 'granted' ? (
            <>
              <BellSlashIcon className="w-5 h-5 mr-2 text-red-500" /> Stop Notifications
            </>
          ) : (
            <>
              <BellIcon className="w-5 h-5 mr-2 text-green-500" /> Allow Notifications
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MoreOptionsDropdown;
