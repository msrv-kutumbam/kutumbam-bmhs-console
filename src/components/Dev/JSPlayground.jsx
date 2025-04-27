import React, { useState, useEffect } from 'react';

const JSPlayground = () => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [savedScripts, setSavedScripts] = useState([]);

  // Load saved scripts from local storage on component mount
  useEffect(() => {
    const scripts = JSON.parse(localStorage.getItem('jsScripts')) || [];
    setSavedScripts(scripts);
  }, []);

  // Save script to local storage
  const saveScript = () => {
    const scripts = JSON.parse(localStorage.getItem('jsScripts')) || [];
    scripts.push(code);
    localStorage.setItem('jsScripts', JSON.stringify(scripts));
    setSavedScripts(scripts);
  };

  // Execute the JavaScript code
  const executeCode = () => {
    try {
      const result = eval(code);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Load a saved script into the editor
  const loadScript = (script) => {
    setCode(script);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-900 text-gray-100 p-4 gap-4">
      {/* Editor Section */}
      <div className="flex flex-col flex-1">
        <textarea
          className="w-full h-48 md:h-64 lg:h-[70vh] bg-gray-800 text-gray-100 p-4 rounded-lg border border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your JavaScript code here..."
        />
        <div className="mt-4 flex gap-4">
          <button
            onClick={executeCode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Run
          </button>
          <button
            onClick={saveScript}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Save
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="flex-1 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Output:</h3>
        <pre className="bg-gray-700 p-4 rounded-lg text-gray-100 font-mono whitespace-pre-wrap">
          {output}
        </pre>
      </div>

      {/* Saved Scripts Section */}
      <div className="w-full lg:w-64 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Saved Scripts:</h3>
        <ul className="space-y-2">
          {savedScripts.map((script, index) => (
            <li
              key={index}
              onClick={() => loadScript(script)}
              className="p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
            >
              Script {index + 1}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default JSPlayground;