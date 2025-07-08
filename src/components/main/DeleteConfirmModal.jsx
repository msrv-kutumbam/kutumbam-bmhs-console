import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteConfirmModal = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm flex flex-col p-6">
        <div className="flex flex-col items-center text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Confirm Deletion</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-full bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

