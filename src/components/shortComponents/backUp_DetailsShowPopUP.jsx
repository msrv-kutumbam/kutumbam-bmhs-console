import React, { useState, useEffect } from 'react';
import { X, Printer, Download, AlertTriangle, Ship, Train } from 'lucide-react';

const DetailsShowPopUP = ({ data, isLoading = false, error = null, onClose, collectionType }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [reportType, setReportType] = useState('normal'); // 'rake', 'vessel', 'normal'
  
  // Determine report type based on collectionType
  useEffect(() => {
    if (collectionType === 'reclamationData') {
      setReportType('rake');
    } else if (collectionType === 'vessel_data') {
      setReportType('vessel');
    } else {
      setReportType('normal');
    }
  }, [collectionType]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // Handle export as CSV
  const handleExport = () => {
    if (!data) return;
    
    // Convert object to CSV
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).join(',');
    const csv = `${headers}\n${values}`;
    
    // Download as file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${reportType}-details-${data.rakeNo || data.Vessel_name || 'report'}.csv`;
    link.href = url;
    link.click();
  };

  // Format path to display as SR-X, SP-Y, BAY Z
  const formatPath = (pathString) => {
    if (!pathString) return '';
    
    const parts = pathString.split('-');
    if (parts.length < 3) return pathString;
    
    const sr = parts[0];
    const sp = parts[1];
    const bayParts = parts[2].split('&');
    const bayText = bayParts.length > 1 
      ? `BAYs ${bayParts.join(', ')}` 
      : `BAY ${bayParts[0]}`;
    
    return `SR-${sr}, SP-${sp}, ${bayText}`;
  };

  // Format vessel path
  const formatVesselPath = (pathString) => {
    if (!pathString) return '';
    return pathString.split(',').map(part => part.trim()).join(', ');
  };

  // Format date time for vessel
  const formatVesselDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Loading details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-600 flex items-center">
              <AlertTriangle className="mr-2" size={24} />
              Error
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guard clause for missing data
  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-yellow-600 flex items-center">
              <AlertTriangle className="mr-2" size={24} />
              No Data Available
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-700 mb-6">No details available to display.</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Rake Report
  const renderRakeReport = () => (
    <>
      {/* General Info Tab */}
      <div className={activeTab === 'general' ? 'block' : 'hidden print:block'}>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-blue-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Operational Basic Information</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-800">{data.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Rake No:</span>
                <span className="text-gray-800 font-semibold">{data.rakeNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Material:</span>
                <span className="text-gray-800">{data.typeOfMaterial}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Path:</span>
                <span className="text-gray-800">{formatPath(data.path)}</span>
              </div>
            </div>
          </div>
          
          {/* Personnel Information */}
          <div className="bg-green-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Resposble Persons</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Shift Responsible:</span>
                <span className="text-gray-800">{data?.ShiftIncharge || "-"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Control Room:</span>
                <span className="text-gray-800">{data?.CRoomOPerator || "-"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">SR Operator:</span>
                <span className="text-gray-800">{data.sr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">WL Operator:</span>
                <span className="text-gray-800">{data.wl}</span>
              </div> 
            </div>
          </div>
        </div>
        
        {/* Remarks */}
        <div className="bg-red-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Remarks</h3>
          <p className="text-gray-800 whitespace-pre-wrap">{data.remarks}</p>
        </div>
      </div>
      
      {/* Loading Details Tab */}
      <div className={activeTab === 'loading' ? 'block' : 'hidden print:block print:mt-6'}>
        <div className="print:mt-4 print:mb-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 print:block hidden">Loading Details</h3>
        </div>
        
        <div className="bg-amber-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-4">Loading Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Wagons Placed:</span>
              <span className="text-gray-800 font-semibold">{data.wlPlaced}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">WL Loaded:</span>
              <span className="text-gray-800">{data.wlLoaded}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Manual Loaded:</span>
              <span className="text-gray-800">{data.manualLoaded}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Sick Count:</span>
              <span className="text-gray-800">{data.numberOfSick}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Total Tonnage:</span>
              <span className="text-gray-800 font-semibold">{data.totalTon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Average Load:</span>
              <span className="text-gray-800">{data.average}</span>
            </div>
          </div>
        </div>
        
        {/* Loading Performance Visualization */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Loading Performance</h3>
          <div className="flex items-end space-x-4 h-40">
            <div className="flex flex-col items-center justify-end">
              <div className="bg-blue-500 w-16 rounded-t-md" 
                   style={{ height: `${(parseInt(data.wlPlaced) / 50) * 100}%` }}></div>
              <p className="mt-2 text-sm font-medium text-gray-600">Placed</p>
              <p className="text-gray-800">{data.wlPlaced}</p>
            </div>
            <div className="flex flex-col items-center justify-end">
              <div className="bg-green-500 w-16 rounded-t-md" 
                   style={{ height: `${(parseInt(data.wlLoaded) / 50) * 100}%` }}></div>
              <p className="mt-2 text-sm font-medium text-gray-600">WL Loaded</p>
              <p className="text-gray-800">{data.wlLoaded}</p>
            </div>
            <div className="flex flex-col items-center justify-end">
              <div className="bg-purple-500 w-16 rounded-t-md" 
                   style={{ height: `${(parseInt(data.manualLoaded) / 50) * 100}%` }}></div>
              <p className="mt-2 text-sm font-medium text-gray-600">Manual</p>
              <p className="text-gray-800">{data.manualLoaded}</p>
            </div>
            <div className="flex flex-col items-center justify-end">
              <div className="bg-amber-500 w-16 rounded-t-md" 
                   style={{ height: `${(parseInt(data.totalTon) / 2000) * 100}%` }}></div>
              <p className="mt-2 text-sm font-medium text-gray-600">Tonnage</p>
              <p className="text-gray-800">{data.totalTon}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Analysis Tab */}
      <div className={activeTab === 'time' ? 'block' : 'hidden print:block print:mt-6'}>
        <div className="print:mt-4 print:mb-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 print:block hidden">Time Analysis</h3>
        </div>
        
        <div className="bg-purple-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Time Details</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Placement:</span>
              <span className="text-gray-800">{data.placement}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Clearance:</span>
              <span className="text-gray-800">{data.clearance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Start Time:</span>
              <span className="text-gray-800">{data.startTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Stop Time:</span>
              <span className="text-gray-800">{data.stopTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Total Time:</span>
              <span className="text-gray-800 font-semibold">{data.totalTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Actual Time:</span>
              <span className="text-gray-800 font-semibold">{data.actualTime}</span>
            </div> 
          </div>
        </div>
        
        {/* Timeline Visualization */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Operation Timeline</h3>
          <div className="relative h-16 bg-gray-200 rounded-md overflow-hidden">
            {/* Convert times to positions on timeline */}
            {(() => {
              // Parse times for visualization
              const parseMilitaryTime = (time) => {
                if (!time) return 0;
                const [hours, minutes] = time.split(':').map(Number);
                return hours * 60 + minutes;
              };
              
              try {
                // Get earliest and latest times for scale
                const placementTime = parseMilitaryTime(data.placement);
                const stopTime = parseMilitaryTime(data.stopTime);
                
                // Guard against invalid time values
                if (!placementTime || !stopTime || stopTime <= placementTime) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500">Timeline data not available or invalid</p>
                    </div>
                  );
                }
                
                const timeRange = stopTime - placementTime;
                
                // Calculate positions
                const startPos = ((parseMilitaryTime(data.startTime) - placementTime) / timeRange) * 100;
                const stopPos = 100;
                const clearancePos = ((parseMilitaryTime(data.clearance) - placementTime) / timeRange) * 100;
                
                return (
                  <>
                    {/* Placement marker */}
                    <div className="absolute bottom-0 left-0 flex flex-col items-center">
                      <div className="h-16 w-1 bg-blue-600"></div>
                      <p className="text-xs mt-1 text-blue-600 font-medium">Placement<br/>{data.placement}</p>
                    </div>
                    
                    {/* Start loading marker */}
                    <div className="absolute bottom-0" style={{ left: `${startPos}%` }}>
                      <div className="h-16 w-1 bg-green-600"></div>
                      <p className="text-xs mt-1 text-green-600 font-medium">Start<br/>{data.startTime}</p>
                    </div>
                    
                    {/* Clearance marker */}
                    <div className="absolute bottom-0" style={{ left: `${clearancePos}%` }}>
                      <div className="h-16 w-1 bg-purple-600"></div>
                      <p className="text-xs mt-1 text-purple-600 font-medium">Clearance<br/>{data.clearance}</p>
                    </div>
                    
                    {/* Stop marker */}
                    <div className="absolute bottom-0 right-0 flex flex-col items-center">
                      <div className="h-16 w-1 bg-red-600"></div>
                      <p className="text-xs mt-1 text-red-600 font-medium">Stop<br/>{data.stopTime}</p>
                    </div>
                    
                    {/* Loading period */}
                    <div className="absolute h-8 top-4 bg-green-200 opacity-80" 
                        style={{ left: `${startPos}%`, width: `${stopPos - startPos}%` }}></div>
                  </>
                );
              } catch (error) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500">Error displaying timeline</p>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </>
  );

  // Render Vessel Report
  const renderVesselReport = () => (
    <>
      {/* General Info Tab */}
      <div className={activeTab === 'general' ? 'block' : 'hidden print:block'}>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-blue-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Vessel Information</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Vessel Name:</span>
                <span className="text-gray-800 font-semibold">{data.Vessel_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Material:</span>
                <span className="text-gray-800">{data.material}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Quantity:</span>
                <span className="text-gray-800">{data.quantity} tons</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Path:</span>
                <span className="text-gray-800">{formatVesselPath(data.path)}</span>
              </div>
            </div>
          </div>
          
          {/* Time Information */}
          <div className="bg-green-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Time Details</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Berthing Time:</span>
                <span className="text-gray-800">{formatVesselDateTime(data.berthing_time)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Completion Time:</span>
                <span className="text-gray-800">{formatVesselDateTime(data.completion_time)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Clearance Time:</span>
                <span className="text-gray-800">{formatVesselDateTime(data.clearance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Total Time:</span>
                <span className="text-gray-800 font-semibold">{data.total_time}</span>
              </div> 
            </div>
          </div>
        </div>
        
        {/* Personnel Information */}
        <div className="bg-purple-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Personnel</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Shift Incharge:</span>
              <span className="text-gray-800">{data.ShiftIncharge || "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Control Room Operator:</span>
              <span className="text-gray-800">{data.CRoomOPerator || "-"}</span>
            </div>
          </div>
        </div>
        
        {/* Remarks */}
        <div className="bg-red-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Remarks</h3>
          <p className="text-gray-800 whitespace-pre-wrap">{data.remarks}</p>
        </div>
      </div>
      
      {/* Operation Details Tab */}
      <div className={activeTab === 'loading' ? 'block' : 'hidden print:block print:mt-6'}>
        <div className="print:mt-4 print:mb-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 print:block hidden">Operation Details</h3>
        </div>
        
        <div className="bg-amber-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-4">Timeline</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Conveyor Start:</span>
              <span className="text-gray-800">{formatVesselDateTime(data.conv_start)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Validation Status:</span>
              <span className={`font-semibold ${data.u_validation ? 'text-green-600' : 'text-red-600'}`}>
                {data.u_validation ? 'Validated' : 'Not Validated'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render Normal Report (for other data sources)
  const renderNormalReport = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center border-b pb-2">
              <span className="font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-gray-800 break-all text-right">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Determine which report to render
  const renderReportContent = () => {
    switch(reportType) {
      case 'rake':
        return renderRakeReport();
      case 'vessel':
        return renderVesselReport();
      default:
        return renderNormalReport();
    }
  };

  // Determine tabs based on report type
  const renderTabs = () => {
    if (reportType === 'normal') return null;
    
    return (
      <div className="flex px-6 print:hidden">
        <button 
          className={`py-3 px-4 font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('general')}
        >
          General Info
        </button>
        <button 
          className={`py-3 px-4 font-medium ${activeTab === 'loading' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('loading')}
        >
          {reportType === 'rake' ? 'Loading Details' : 'Operation Details'}
        </button>
        {reportType === 'rake' && (
          <button 
            className={`py-3 px-4 font-medium ${activeTab === 'time' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('time')}
          >
            Time Analysis
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white print:p-0">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:max-w-full print:max-h-full print:shadow-none">
        {/* Header */}
        <div className="border-b border-gray-200 print:hidden">
          <div className="px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <div className="flex items-center">
              {reportType === 'vessel' && <Ship className="mr-2 text-blue-600" size={24} />}
              {reportType === 'rake' && <Train className="mr-2 text-blue-600" size={24} />}
              <h2 className="text-xl font-bold text-gray-800">
                {reportType === 'rake' ? 'Rake Loading Report' : 
                 reportType === 'vessel' ? 'Vessel Operation Report' : 
                 'Details Report'}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handlePrint}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                title="Print Report"
              >
                <Printer size={20} />
              </button>
              <button 
                onClick={handleExport}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                title="Export as CSV"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          {renderTabs()}
        </div>
        
        <div className="overflow-y-auto flex-1">
          {/* Print Header */}
          <div className="hidden print:block p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-center">
              {reportType === 'rake' ? 'Rake Loading Report' : 
               reportType === 'vessel' ? 'Vessel Operation Report' : 
               'Details Report'}
            </h1>
            <div className="flex justify-between mt-4">
              <div>
                {reportType === 'rake' && <p className="font-bold">Rake No: {data.rakeNo}</p>}
                {reportType === 'vessel' && <p className="font-bold">Vessel: {data.Vessel_name}</p>}
                <p>Date: {reportType === 'rake' ? data.date : formatVesselDateTime(data.berthing_time || data.completion_time)}</p>
              </div>
              <div>
                <p>Generated on: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Report Content */}
          {renderReportContent()}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between print:hidden">
          <div className="text-sm text-gray-500">
            Report generated on {new Date().toLocaleString()}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Close
          </button>
        </div>
        
        {/* Print Footer */}
        <div className="hidden print:block p-4 text-center text-gray-500 text-sm border-t border-gray-200">
          <p>© {new Date().getFullYear()} - Operations Management System</p>
        </div>
      </div>
    </div>
  );
};

export default DetailsShowPopUP;
 
