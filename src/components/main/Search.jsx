import React, { useEffect, useState } from 'react';

function Search({ settings, setShowHeadder, overallData }) {
  useEffect(() => {
    setShowHeadder(true);
  }, []);

  const RenderData = ({ data, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (typeof data === 'object' && data !== null) {
      return (
        <div className={`ml-${depth * 5} border-l-2 ${
          settings?.theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
        } pl-2`}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`${
              settings?.theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            } font-bold focus:outline-none mb-1`}
          >
            {isOpen ? '▼' : '▶'}
          </button>
          {isOpen && (
            <div>
              {Object.keys(data).map((key) => (
                <div key={key} className="p-1">
                  <strong className={`${
                    settings?.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {key}:
                  </strong>
                  <RenderData data={data[key]} depth={depth + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (Array.isArray(data)) {
      return (
        <div className={`ml-${depth * 5} border-l-2 ${
          settings?.theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
        } pl-2`}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`${
              settings?.theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            } font-bold focus:outline-none mb-1`}
          >
            {isOpen ? '▼' : '▶'}
          </button>
          {isOpen && (
            <div>
              {data.map((item, index) => (
                <div key={index} className="p-1">
                  <strong className={`${
                    settings?.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {index}:
                  </strong>
                  <RenderData data={item} depth={depth + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <span className={`ml-${depth * 5} ${
          settings?.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {data}
        </span>
      );
    }
  };

  return (
    <div className={`p-5 font-sans min-h-screen ${
      settings?.theme === 'dark' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-gray-100 text-gray-800'
    }`}>
      <h1 className={`text-2xl font-bold mb-5 ${
        settings?.theme === 'dark' ? 'text-[#d4d4d4]' : 'text-gray-800'
      }`}>
        Overall Data
      </h1>
      <div className={`p-5 rounded-lg shadow-md ${
        settings?.theme === 'dark' ? 'bg-[#252526] text-[#d4d4d4]' : 'bg-white text-gray-800'
      }`}>
        <RenderData data={overallData} />
      </div>
    </div>
  );
}

export default Search;