import React from 'react';

const LoadingComponent = ({ loadingProgress = 100, loadingMessage = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin border-t-blue-500"></div>
        
        {/* Loading Text */}
        <div className="text-xl font-semibold text-gray-700">{loadingMessage}</div>
        
        {/* Optional: Progress Bar */}
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingComponent;