import React, { useState, useEffect } from 'react';
import { BarChart3, Package, Calendar, AlertCircle } from 'lucide-react';

const VoidBayGrid = ({ VOIDreclamationData = [] }) => {
  // Function to generate data from VOIDreclamationData
  const generateDataFromReclamation = () => {
    const data = {};
    const statuses = [
      { label: 'Available', color: 'bg-green-100 text-green-800' },
      { label: 'Reserved', color: 'bg-blue-100 text-blue-800' },
      { label: 'Low Stock', color: 'bg-amber-100 text-amber-800' }
    ];

    // Ensure VOIDreclamationData is an array
    if (!Array.isArray(VOIDreclamationData)) {
      console.error("VOIDreclamationData is not an array:", VOIDreclamationData);
      return data;
    }

    // Sort VOIDreclamationData by date in descending order (newest first)
    const sortedData = [...VOIDreclamationData].sort((a, b) => {
      return new Date(b.date) - new Date(a.date); // Compare dates as Date objects
    });

    sortedData.forEach((record) => {
      if (!record.path || !Array.isArray(record.path)) {
        // console.error("Invalid record path:", record);
        return;
      }

      record.path.forEach((path) => {
        const [stockPile, bay] = path.split('-').map(Number); // Extract stockPile and bay
        if (!data[bay]) data[bay] = {};

        // Ensure typeOfMaterial is always an array
        const materials = Array.isArray(record.typeOfMaterial)
          ? record.typeOfMaterial
          : record.typeOfMaterial
          ? [record.typeOfMaterial]
          : [];

        // Determine status based on totalTon
        const status =
          record.totalTon < 2000 ? statuses[2] : stockPile === 1 ? statuses[0] : statuses[1];

        // Populate data for each bay and stockpile
        data[bay][`Stock Pile ${stockPile}`] = {
          material: materials.join(', '), // Join materials into a string
          lastUpdated: record.date, // Use date as lastUpdated
          status: status
        };
      });
    });

    return data;
  };

  // Use useEffect to log data
  useEffect(() => {
    // console.log("VOIDreclamationData", VOIDreclamationData);
    // console.log("Generated Data from Reclamation", generateDataFromReclamation());
  }, [VOIDreclamationData]);

  const bayData = generateDataFromReclamation();

  // Extract all bays and stockpiles dynamically
  const bays = Array.from(
    new Set(Object.keys(bayData).map(Number)) // Get unique bay numbers
  ).sort((a, b) => a - b);

  const stockPiles = Array.from(
    new Set(
      Object.values(bayData)
        .flatMap((bay) => Object.keys(bay))
        .map((sp) => sp.replace('Stock Pile ', '')) // Extract stockpile numbers
    )
  )
    .map(Number)
    .sort((a, b) => a - b)
    .map((sp) => `Stock Pile ${sp}`);

  const [selectedCell, setSelectedCell] = useState(null);

  const handleCellClick = (bay, stockPile) => {
    setSelectedCell({ bay, stockPile });
  };

  // Generate a cell background color based on material presence
  const getCellColor = (bay, stockPile) => {
    const hasMaterial = bayData[bay]?.[stockPile]?.material;
    if (!hasMaterial) return 'bg-gray-50 hover:bg-gray-100';
    return 'bg-blue-50 hover:bg-blue-100';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
      <div className="flex mb-8">
        {/* Y-axis labels (Bay numbers) */}
        <div className="flex flex-col mr-2">
          <div className="h-12"></div> {/* Empty cell for top-left corner */}
          {bays.map((bay) => (
            <div key={bay} className="h-12 flex items-center justify-end font-medium text-gray-600 pr-3">
              Bay {bay}
            </div>
          ))}
        </div>
        {/* Grid and X-axis */}
        <div className="flex-1">
          {/* X-axis labels (Stock Piles) */}
          <div className="flex mb-2">
            {stockPiles.map((stockPile) => (
              <div key={stockPile} className="flex-1 text-center font-medium text-gray-800 pb-2">
                {stockPile}
              </div>
            ))}
          </div>
          {/* Grid cells */}
          <div className="rounded-lg overflow-hidden shadow-md">
            {bays.map((bay) => (
              <div key={bay} className="flex">
                {stockPiles.map((stockPile) => (
                  <div
                    key={`${bay}-${stockPile}`}
                    className={`w-full h-12 border-r border-b border-gray-200 flex items-center justify-center cursor-pointer transition-all duration-200 ${getCellColor(bay, stockPile)} ${
                      selectedCell && selectedCell.bay === bay && selectedCell.stockPile === stockPile
                        ? 'ring-2 ring-blue-500 bg-blue-100'
                        : ''
                    }`}
                    onClick={() => handleCellClick(bay, stockPile)}
                  >
                    <div className="text-sm font-medium">
                      <span className="text-gray-900">B{bay}</span>
                      <span className="mx-1 text-gray-400">|</span>
                      <span className="text-blue-700">SP{stockPile.slice(-1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Selected Cell Information */}
      {selectedCell && (
        <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm transition-all duration-300 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">
              Bay {selectedCell.bay} - {selectedCell.stockPile}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${bayData[selectedCell.bay][selectedCell.stockPile].status.color}`}>
              {bayData[selectedCell.bay][selectedCell.stockPile].status.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center">
              <Package className="mr-3 text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-500">Material</p>
                <p className="font-medium text-lg">{bayData[selectedCell.bay][selectedCell.stockPile].material || 'N/A'}</p>
              </div>
            </div>
            {/* <div className="flex items-center">
              <AlertCircle className="mr-3 text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-lg">{bayData[selectedCell.bay][selectedCell.stockPile].status.label}</p>
              </div>
            </div> */}
            <div className="flex items-center">
              <Calendar className="mr-3 text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium text-lg">{bayData[selectedCell.bay][selectedCell.stockPile].lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function BayGrid({ VOIDreclamationData = [] }) {
    const [showMapChat, setShowMapChat] = useState(false);
    const toggleMapChat = () => setShowMapChat(!showMapChat);

    return (
        <div className='w-full overflow-x-auto p-6'>
            <label className="inline-flex relative items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showMapChat} 
                    onChange={toggleMapChat} 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    Identify Bay Material using reclamation data 
                </span>
            </label>
            {showMapChat && (
                <VoidBayGrid 
                    VOIDreclamationData={VOIDreclamationData}  
                />
            )}
        </div>
    );
}

export default BayGrid;