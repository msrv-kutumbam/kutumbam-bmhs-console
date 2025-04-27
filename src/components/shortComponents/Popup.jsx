import React, { useEffect, useState } from 'react';

const Popup = ({ isOpen, message, onConfirm, onCancel }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset'; // Restore scrolling when popup is closed
    }
  }, [isOpen]);

  if (!isOpen) return null; 

  const handleConfirm = () => {
    onConfirm(); 
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ease-in-out">
      <div
        className={`bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
        }`}
      >
        <p className="text-xl font-semibold text-gray-800 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            onClick={handleConfirm} 
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;