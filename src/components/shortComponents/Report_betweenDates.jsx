import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas'; // Confirmed working import

const DataAnalysis = ({ data, collectionName, themeStyles, settings }) => {
    const cardRef = useRef(null); // Ref to the card element for html2canvas
    const shareButtonRef = useRef(null); // Ref to the share button itself
    const [isSharing, setIsSharing] = useState(false); // State for loading indicator during sharing

    if (!data || data.length === 0) {
        return (
            <div className="p-4 rounded-lg" style={{
                backgroundColor: themeStyles.paperBackground,
                color: themeStyles.textColor,
                fontSize: settings.fontSize === 'small' ? '14px' : settings.fontSize === 'medium' ? '16px' : '18px',
            }}>
                No data available for analysis.
            </div>
        );
    }

    // Helper to format minutes into "Xh Ym"
    const formatMinutesToHoursAndMinutes = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    // Helper to parse time string "H:M" into total minutes
    const parseTimeToMinutes = (timeStr) => {
        const [h, m] = (timeStr || "0:0").split(':').map(Number);
        return h * 60 + m;
    };

    // Helper to parse date string to Date object, handling various formats
    const parseDateToISO = (dateString) => {
        if (!dateString) return null;
        // Try to parse as YYYY-MM-DDTHH:MM (e.g., "2025-05-29T10:40")
        if (dateString.includes('T')) {
            return new Date(dateString);
        }
        // Try to parse as YYYY-MM-DD (e.g., "2025-05-28")
        return new Date(dateString + 'T00:00:00'); // Add time to ensure correct date parsing
    };

    // Helper to format a Date object to YYYY-MM-DD string based on local time
    const formatDateToYyyyMmDd = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';
        const year = dateObj.getFullYear();
        const month = ('0' + (dateObj.getMonth() + 1)).slice(-2); // Months are 0-indexed
        const day = ('0' + dateObj.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    };

    // Calculate overall start and end dates from the data
    let earliestDate = null;
    let latestDate = null;

    data.forEach(item => {
        let datesToConsider = [];

        if (collectionName === 'reclamationData') {
            if (item.date) datesToConsider.push(parseDateToISO(item.date));
            if (item.startTime) datesToConsider.push(parseDateToISO(item.startTime));
            if (item.stopTime) datesToConsider.push(parseDateToISO(item.stopTime));
            if (item.placement) datesToConsider.push(parseDateToISO(item.placement));
            if (item.clearance) datesToConsider.push(parseDateToISO(item.clearance));
        } else if (collectionName === 'vessel_data') {
            if (item.berthing_time) datesToConsider.push(parseDateToISO(item.berthing_time));
            if (item.conv_start) datesToConsider.push(parseDateToISO(item.conv_start));
            if (item.completion_time) datesToConsider.push(parseDateToISO(item.completion_time));
            if (item.clearance) datesToConsider.push(parseDateToISO(item.clearance));
        }

        datesToConsider.forEach(dateObj => {
            if (dateObj && !isNaN(dateObj.getTime())) { // Check if valid date
                if (!earliestDate || dateObj < earliestDate) {
                    earliestDate = dateObj;
                }
                if (!latestDate || dateObj > latestDate) {
                    latestDate = dateObj;
                }
            }
        });
    });

    const formattedStartDate = formatDateToYyyyMmDd(earliestDate);
    const formattedEndDate = formatDateToYyyyMmDd(latestDate);

    // Common analysis logic for both collections
    const totalRakes = data?.length || 0;
    const totalTimeMinutes = data.reduce((acc, item) => acc + parseTimeToMinutes(item.total_time || item.totalTime), 0);
    const actualTimeMinutes = data.reduce((acc, item) => acc + parseTimeToMinutes(item.actualTime), 0);

    // Reclamation-specific calculations
    const totalLoaded = data.reduce((acc, item) => acc + parseInt(item.wlLoaded || 0), 0);
    const totalPlaced = data.reduce((acc, item) => acc + parseInt(item.wlPlaced || 0), 0);
    const totalSicks = data.reduce((acc, item) => acc + parseInt(item.numberOfSick || 0), 0);
    const totalManual = data.reduce((acc, item) => acc + parseInt(item.manualLoaded || 0), 0);
    const totalTonage = data.reduce((acc, item) => acc + parseInt(item.totalTon || 0), 0);
    const totalAverageReclamation = totalLoaded > 0 ? totalTonage / totalLoaded : 0;

    // Handle share functionality
    const handleShareAsImage = async () => {
        if (!cardRef.current || !shareButtonRef.current) {
            console.error("Card or share button reference not found for image capture.");
            return;
        }

        setIsSharing(true);
        try {
            // Temporarily hide the share button before capturing
            shareButtonRef.current.style.display = 'none';

            const canvas = await html2canvas(cardRef.current, {
                useCORS: true, // Important for images loaded from other origins if any
                scale: 2, // Increase scale for better quality image
            });

            // Restore the share button's visibility after capturing
            shareButtonRef.current.style.display = 'flex'; // Assuming it's a flex item

            const image = canvas.toDataURL('image/png');

            // Open image in a new tab
            const newTab = window.open();
            if (newTab) {
                newTab.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${collectionName} Analysis Report</title>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            body {
                                width: 100vw;
                                height: 100vh;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                background-color: #f0f2f5;
                                font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                                overflow: hidden;
                                padding: 20px;
                            }
                            .container {
                                width: 100%;
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                            }
                            .image-container {
                                width: 100%;
                                height: calc(100% - 60px);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                overflow: hidden;
                            }
                            .report-image {
                                max-width: 100%;
                                max-height: 100%;
                                object-fit: contain;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            }
                            .controls {
                                height: 60px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 15px;
                                padding: 10px 0;
                            }
                            .btn {
                                padding: 10px 20px;
                                background-color: #2563eb;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.2s;
                                font-size: 14px;
                            }
                            .btn:hover {
                                background-color: #1d4ed8;
                                transform: translateY(-1px);
                            }
                            .btn-close {
                                background-color: #64748b;
                            }
                            .btn-close:hover {
                                background-color: #475569;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="image-container">
                                <img class="report-image" src="${image}" alt="${collectionName} Analysis Report">
                            </div>
                            <div class="controls">
                                <button class="btn" id="downloadBtn">Download Image</button>
                                <button class="btn btn-close" id="closeBtn">Close</button>
                            </div>
                        </div>
                        <script>
                            document.getElementById('downloadBtn').addEventListener('click', function() {
                                const img = document.querySelector('.report-image');
                                const a = document.createElement('a');
                                a.href = img.src;
                                a.download = '${collectionName}_analysis_' + new Date().toISOString().slice(0, 10) + '.png';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            });
                            document.getElementById('closeBtn').addEventListener('click', function() {
                                window.close();
                            });
                            document.addEventListener('keydown', (e) => {
                                if (e.key === 'Escape') {
                                    window.close();
                                }
                            });
                            window.addEventListener('resize', fitImage);
                            function fitImage() {
                                const img = document.querySelector('.report-image');
                                const container = document.querySelector('.image-container');
                                img.style.width = '';
                                img.style.height = '';
                                const containerRatio = container.clientWidth / container.clientHeight;
                                const imgRatio = img.naturalWidth / img.naturalHeight;
                                if (containerRatio > imgRatio) {
                                    img.style.height = '100%';
                                } else {
                                    img.style.width = '100%';
                                }
                            }
                            window.addEventListener('load', fitImage);
                        </script>
                    </body>
                    </html>
                `);
                newTab.document.close(); // Close the document stream
            } else {
                alert("Please allow pop-ups to open the image in a new tab.");
            }

        } catch (error) {
            console.error("Error generating image:", error);
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsSharing(false);
        }
    }; 

    return (
        // Main container for the card, with a clean, modern look
        <div
            ref={cardRef} // Attach ref to the element we want to capture
            className="bg-white shadow-lg rounded-xl p-6 md:p-8   border border-gray-100 relative" // Added relative for absolute positioning of share icon
            style={{
                backgroundColor: themeStyles.paperBackground,
                fontSize: settings.fontSize === 'small' ? '14px' : settings.fontSize === 'medium' ? '16px' : '18px',
                color: themeStyles.textColor, // Apply theme text color to the whole card
            }}
        >
            {/* Share Icon */}
            <button
                ref={shareButtonRef} // Attach ref to the share button
                onClick={handleShareAsImage}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center justify-center" // Added flex for spinner centering
                disabled={isSharing}
                title="Share as Image"
            >
                {isSharing ? (
                    <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                )}
            </button>

            {/* Card title */}
            <h3 className="text-2xl font-bold text-center mb-6" style={{ color: themeStyles.textColor }}>
                {collectionName === 'reclamationData' ? 'Reclamation Data Overview' : `${collectionName} Overview`}
            </h3>

            {/* Data points presented in a list-like format with clear separation */}
            <div className="space-y-4">
                {/* Start Date */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium text-lg">Start Date:</span>
                    <span className="text-lg font-semibold">{formattedStartDate}</span>
                </div>

                {/* End Date */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium text-lg">End Date:</span>
                    <span className="text-lg font-semibold">{formattedEndDate}</span>
                </div>

                {/* Each data row */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium text-lg">Total {collectionName === 'reclamationData' ? 'Rakes' : 'Entries'}:</span>
                    <span className="text-lg font-semibold">{totalRakes}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium text-lg">Total Time:</span>
                    <span className="text-lg font-semibold">{formatMinutesToHoursAndMinutes(totalTimeMinutes)}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium text-lg">Actual Time:</span>
                    <span className="text-lg font-semibold">{formatMinutesToHoursAndMinutes(actualTimeMinutes)}</span>
                </div>

                {/* Conditional rendering based on collectionName */}
                {collectionName === 'reclamationData' && (
                    <>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="font-medium text-lg">Total Loaded:</span>
                            <span className="text-lg font-semibold">{totalLoaded}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="font-medium text-lg">Total Placed:</span>
                            <span className="text-lg font-semibold">{totalPlaced}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="font-medium text-lg">Total Sicks:</span>
                            <span className="text-lg font-semibold">{totalSicks}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="font-medium text-lg">Total Manual:</span>
                            <span className="text-lg font-semibold">{totalManual}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="font-medium text-lg">Total Tonage:</span>
                            <span className="text-lg font-semibold">{totalTonage}</span>
                        </div>
                        <div className="flex justify-between items-center"> {/* No bottom border for the last item */}
                            <span className="font-medium text-lg">Total Average:</span>
                            <span className="text-lg font-semibold">{totalAverageReclamation.toFixed(1)} Ton's</span>
                        </div>
                    </>
                )}
                {collectionName === 'vessel_data' && (
                    <>
                        {/* No specific vessel_data parameters are displayed now as per previous requests */}
                    </>
                )}
            </div>
        </div>
    );
};

// Report_betweenDates component for centering and overall page layout
const Report_betweenDates = ({ themeStyles, data, collectionName, settings }) => {
    return (
        // This div acts as the body/main container, centering its content
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 md:p-8">
            {/* The DataAnalysis card is rendered inside this centered container */}
            <DataAnalysis themeStyles={themeStyles} data={data} collectionName={collectionName} settings={settings} />
        </div>
    );
};

export default Report_betweenDates;
