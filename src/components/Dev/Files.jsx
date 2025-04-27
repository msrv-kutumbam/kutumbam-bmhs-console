

import React, { useState } from 'react';

function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const filesArray = Array.from(files);
    setUploadedFiles((prevFiles) => [...prevFiles, ...filesArray]);
  };

  const removeFile = (fileName) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
      <div
        className={`w-full max-w-md p-6 border-2 border-dashed rounded-lg text-center transition-colors ${
          isDragging ? 'border-black bg-gray-200' : 'border-gray-300 bg-white'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <p className="text-gray-700 mb-2">Drag and drop your site output folder here.</p>
        <p className="text-gray-700 mb-4">Or, browse to upload.</p>
        <input
          type="file"
          id="file-input"
          className="hidden"
          onChange={handleFileInput}
          multiple
        />
        <label
          htmlFor="file-input"
          className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
        >
          Browse
        </label>
      </div>
      <p className="mt-4 text-sm text-gray-500">Drag & drop. It’s online.</p>

      {/* Display uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="w-full max-w-md mt-6">
          <h2 className="text-lg font-semibold mb-4">Uploaded Files</h2>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <span className="text-gray-700 truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
 
function Files() {
  return (
    <div>
      < FileUpload/>
    </div>
  )
}

export default Files