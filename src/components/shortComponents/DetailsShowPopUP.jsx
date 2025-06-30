import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Printer, Share2, Ship, Train, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'; // Re-added Ship and Train icons
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper to convert HH:mm duration string to minutes (copied from AddItemDialog)
const durationToMinutes = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  const parts = duration.split(':');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }
  return 0;
};

// Helper to convert minutes to HH:mm duration string (copied from AddItemDialog)
const minutesToDuration = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const DetailsShowPopUP = ({ dataArray, initialIndex, isLoading = false, error = null, onClose, collectionType }) => {
  const popupRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const data = dataArray[currentIndex]; // Current data item being displayed

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

  // Update currentIndex if initialIndex changes (e.g., when a new item is double-clicked)
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prevIndex => Math.max(0, prevIndex - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prevIndex => Math.min(dataArray.length - 1, prevIndex + 1));
  }, [dataArray.length]);

  // Modified handle printing
  const handlePrint = () => {
    if (!popupRef.current) return;

    const printContent = popupRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    printWindow.document.write(`<html><head><title>Print Report ${data.rakeNo}</title>`);
    // Copy styles from the current document to the new window for proper rendering
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(node => {
      printWindow.document.write(node.outerHTML);
    });
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="print-only-container">'); // Add a container for print-specific styles if needed
    printWindow.document.write(printContent);
    printWindow.document.write('</div></body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    // No need to close after print if it's a new tab, user can close it.
    // printWindow.onafterprint = function () {
    //   printWindow.close();
    // };
  };

  // Handle export as PDF
  const handleExportPDF = async () => {
    if (!popupRef.current) return;
    
    try {
      const canvas = await html2canvas(popupRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${collectionType}-report-${new Date().toISOString()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  // Function to format the data object into a readable string
  const formatDataForSharing = (obj, indent = 0) => {
    let result = '';
    const indentStr = ' '.repeat(indent * 2); // 2 spaces per indent level

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Convert camelCase to "Camel Case"

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result += `${indentStr}${formattedKey}:\n${formatDataForSharing(value, indent + 1)}`;
        } else if (Array.isArray(value)) {
          result += `${indentStr}${formattedKey}: [\n`;
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              result += `${' '.repeat((indent + 1) * 2)}- ${formatDataForSharing(item, indent + 2)}\n`;
            } else {
              result += `${' '.repeat((indent + 1) * 2)}- ${item}\n`;
            }
          });
          result += `${indentStr}]\n`;
        } else {
          result += `${indentStr}${formattedKey}: ${value}\n`;
        }
      }
    }
    return result;
  };

  // Handle sharing
  const handleShare = async () => {
    try {
      const formattedText = formatDataForSharing(data);
      const shareData = {
        title: `${collectionType === 'reclamationData' ? 'Rake Loading' : collectionType === 'vessel_data' ? 'Vessel Operation' : 'Details'} Report`,
        text: formattedText, // Use the formatted text here
        url: window.location.href
      };
      
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support sharing
        // Using document.execCommand('copy') as navigator.clipboard.writeText() might not work in iframes
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = formattedText; // Use the formatted text here
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        // Using a custom message box instead of alert()
        console.log('Report details copied to clipboard!'); // Log for demonstration
        // You would typically show a custom modal/snackbar here
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
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
    return String(pathString).split(',').map(part => part.trim()).join(', ');
  };

  // Format date time for vessel
  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  // Format delay duration
  const formatDelayDuration = (delay) => {
    if (!delay.from || !delay.to) return 'N/A';
    
    try {
      const from = new Date(delay.from);
      const to = new Date(delay.to);
      const diffMs = to - from;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} minutes`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
      }
    } catch (e) {
      return 'N/A';
    }
  };

  // Render Delays Section
  const renderDelays = (delays) => {
    const totalDelayMinutes = delays.reduce((sum, delay) => sum + durationToMinutes(delay.duration), 0);
    const totalDelaysCount = delays.length;

    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
          <Clock className="mr-2" size={20} />
          Delays
          <span className="ml-4 text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            Count: {totalDelaysCount}
          </span>
          <span className="ml-2 text-sm font-medium text-red-700 bg-red-100 px-3 py-1 rounded-full">
            Total: {minutesToDuration(totalDelayMinutes)}
          </span>
        </h3>
        
        {totalDelaysCount === 0 ? (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 font-medium">No delays recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {delays.map((delay, index) => (
              <div key={index} className="border-l-4 border-yellow-500 pl-3 py-1">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Reason:</span>
                  <span className="text-gray-800">{delay.reason || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Period:</span>
                  <span className="text-gray-800">
                    {delay.from ? formatDateTime(delay.from) : 'N/A'} - 
                    {delay.to ? formatDateTime(delay.to) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="text-gray-800 font-semibold">
                    {delay.total || formatDelayDuration(delay)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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

  // Guard clause for missing data or empty dataArray
  if (!data || dataArray.length === 0) {
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

  // Render Rake Report sections
  const renderRakeReportSections = () => (
    <>
      {/* General Info Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-blue-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Operational Information</h3>
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
          <h3 className="text-lg font-semibold text-green-800 mb-4">Responsible Persons</h3>
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
      
      {/* Delays Section */}
      {renderDelays(data.delays)}
      
      {/* Remarks */}
      <div className="bg-red-50 p-5 rounded-lg mt-6">
        <h3 className="text-lg font-semibold text-red-800 mb-3">Remarks</h3>
        <p className="text-gray-800 whitespace-pre-wrap">{data.remarks}</p>
      </div>
      
      {/* Loading Details Section */}
      <div className="mt-6">
        {/* <div className="print:mt-4 print:mb-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Loading Details</h3>
        </div> */}
        
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
      </div>
      
      {/* Time Analysis Section - Removed Timeline Visualization */}
      <div className="mt-6">
        {/* <div className="print:mt-4 print:mb-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Analysis</h3>
        </div> */}
        
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
      </div>
    </>
  );

  // Render Vessel Report sections
  const renderVesselReportSections = () => (
    <>
      {/* General Info Section */}
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
              <span className="text-gray-800">{formatDateTime(data.berthing_time)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Completion Time:</span>
              <span className="text-gray-800">{formatDateTime(data.completion_time)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Clearance Time:</span>
              <span className="text-gray-800">{formatDateTime(data.clearance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Total Time:</span>
              <span className="text-gray-800 font-semibold">{data.total_time}</span>
            </div> 
          </div>
        </div>
      </div>
      
      {/* Delays Section */}
      {renderDelays(data.delays)}
      
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
      
      {/* Operation Details Section */}
      <div className="mt-6">
        <div className="print:mt-4 print:mb-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Operation Details</h3>
        </div>
        
        <div className="bg-amber-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-4">Timeline</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Conveyor Start:</span>
              <span className="text-gray-800">{formatDateTime(data.conv_start)}</span>
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

  // Determine which report sections to render
  const renderReportContent = () => {
    if (collectionType === 'reclamationData') {
      return renderRakeReportSections();
    } else if (collectionType === 'vessel_data') {
      return renderVesselReportSections();
    } else {
      return renderNormalReport();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white print:p-0">
      <div 
        ref={popupRef}
        // Added print:overflow-visible and print:max-h-full for full content printing
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:max-w-full print:max-h-full print:shadow-none"
      >
        {/* Header */}
        <div className="border-b border-gray-200 print:hidden">
          <div className="px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <div className="flex items-center">
              {collectionType === 'vessel_data' && <Ship className="mr-2 text-blue-600" size={24} />}
              {collectionType === 'reclamationData' && <Train className="mr-2 text-blue-600" size={24} />}
              <h2 className="text-xl font-bold text-gray-800">
                {collectionType === 'reclamationData' ? 'Rake Loading Report' : 
                 collectionType === 'vessel_data' ? 'Vessel Operation Report' : 
                 'Details Report'}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              {/* Navigation Buttons */}
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Report"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === dataArray.length - 1}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Report"
              >
                <ChevronRight size={20} />
              </button>

              <button 
                onClick={handleShare}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                title="Share Report"
              >
                <Share2 size={20} />
              </button>
              <button 
                onClick={handlePrint}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                title="Print Report"
              > 
                <Printer size={20} />
              </button>
              {/* Removed Download button */}
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 print:overflow-visible"> {/* Added print:overflow-visible */}
          {/* Print Header */}
          <div className="hidden print:block p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-center">
              {collectionType === 'reclamationData' ? 'Rake Loading Report' : 
               collectionType === 'vessel_data' ? 'Vessel Operation Report' : 
               'Details Report'}
            </h1>
            <div className="flex justify-between mt-4">
              <div>
                {collectionType === 'reclamationData' && (
                  <>
                    <p className="font-bold">Rake No: {data.rakeNo}</p>
                    <p>Date: {data.date}</p>
                  </>
                )}
                {collectionType === 'vessel_data' && (
                  <>
                    <p className="font-bold">Vessel: {data.Vessel_name}</p>
                    <p>Berthing Time: {formatDateTime(data.berthing_time)}</p>
                  </>
                )}
              </div>
              <div>
                <p>Generated on: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Report Content - now renders all sections based on collectionType */}
          {renderReportContent()}
        </div>
        
        {/* Print Footer */}
        <div className="hidden print:block p-4 text-center text-gray-500 text-sm border-t border-gray-200">
          <p>© {new Date().getFullYear()} - Operations Management System</p>
          <p className="text-xs mt-1">Page {window.location.href}</p>
        </div>
      </div>
    </div> 
  );
};

export default DetailsShowPopUP;
