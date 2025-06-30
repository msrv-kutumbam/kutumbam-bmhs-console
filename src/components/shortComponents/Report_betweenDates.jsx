import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

const DataAnalysis = ({ data, collectionName, themeStyles, settings }) => {
    const cardRef = useRef(null);
    const shareButtonRef = useRef(null);
    const [isSharing, setIsSharing] = useState(false);

    if (!data || data.length === 0) {
        return (
            <div className="p-8 rounded-2xl backdrop-blur-sm border border-gray-200/50 shadow-lg">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
                    <p className="text-gray-500">No data available for analysis at this time.</p>
                </div>
            </div>
        );
    }

    // Helper functions (keeping existing logic)
    const formatMinutesToHoursAndMinutes = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const parseTimeToMinutes = (timeStr) => {
        const [h, m] = (timeStr || "0:0").split(':').map(Number);
        return h * 60 + m;
    };

    const parseDateToISO = (dateString) => {
        if (!dateString) return null;
        if (dateString.includes('T')) {
            return new Date(dateString);
        }
        return new Date(dateString + 'T00:00:00');
    };

    const formatDateToYyyyMmDd = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';
        const year = dateObj.getFullYear();
        const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        const day = ('0' + dateObj.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    };

    // Calculate date ranges (keeping existing logic)
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
            if (dateObj && !isNaN(dateObj.getTime())) {
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

    // Calculations (keeping existing logic)
    const totalRakes = data?.length || 0;
    const totalTimeMinutes = data.reduce((acc, item) => acc + parseTimeToMinutes(item.total_time || item.totalTime), 0);
    const actualTimeMinutes = data.reduce((acc, item) => acc + parseTimeToMinutes(item.actualTime), 0);

    const totalLoaded = data.reduce((acc, item) => acc + parseInt(item.wlLoaded || 0), 0);
    const totalPlaced = data.reduce((acc, item) => acc + parseInt(item.wlPlaced || 0), 0);
    const totalSicks = data.reduce((acc, item) => acc + parseInt(item.numberOfSick || 0), 0);
    const totalManual = data.reduce((acc, item) => acc + parseInt(item.manualLoaded || 0), 0);
    const totalTonage = data.reduce((acc, item) => acc + parseInt(item.totalTon || 0), 0);
    const totalAverageReclamation = totalLoaded > 0 ? totalTonage / totalLoaded : 0;

    const handleShareAsImage = async () => {
        if (!cardRef.current || !shareButtonRef.current) {
            console.error("Card or share button reference not found for image capture.");
            return;
        }

        setIsSharing(true);
        try {
            shareButtonRef.current.style.display = 'none';

            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#ffffff'
            });

            shareButtonRef.current.style.display = 'flex';

            const image = canvas.toDataURL('image/png');

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
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                                height: calc(100% - 80px);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                overflow: hidden;
                            }
                            .report-image {
                                max-width: 100%;
                                max-height: 100%;
                                object-fit: contain;
                                border-radius: 16px;
                                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                            }
                            .controls {
                                height: 80px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 20px;
                                padding: 20px 0;
                            }
                            .btn {
                                padding: 12px 24px;
                                background: rgba(255, 255, 255, 0.1);
                                color: white;
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 12px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-size: 14px;
                                backdrop-filter: blur(10px);
                            }
                            .btn:hover {
                                background: rgba(255, 255, 255, 0.2);
                                transform: translateY(-2px);
                                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="image-container">
                                <img class="report-image" src="${image}" alt="${collectionName} Analysis Report">
                            </div>
                            <div class="controls">
                                <button class="btn" id="downloadBtn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; display: inline;">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    Download Image
                                </button>
                                <button class="btn" id="closeBtn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; display: inline;">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                    Close
                                </button>
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
                        </script>
                    </body>
                    </html>
                `);
                newTab.document.close();
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
        <div
            ref={cardRef}
            className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100/50 backdrop-blur-sm"
            style={{
                background: `linear-gradient(135deg, ${themeStyles.paperBackground || '#ffffff'} 0%, ${themeStyles.paperBackground || '#ffffff'}f0 100%)`,
                fontSize: settings.fontSize === 'small' ? '14px' : settings.fontSize === 'medium' ? '16px' : '18px',
                color: themeStyles.textColor || '#1f2937',
            }}
        >
            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
            </div>

            {/* Content wrapper */}
            <div className="relative z-10 p-8 md:p-10">
                {/* Share Button */}
                <button
                    ref={shareButtonRef}
                    onClick={handleShareAsImage}
                    className="absolute top-6 right-6 p-3 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center group"
                    disabled={isSharing}
                    title="Share as Image"
                >
                    {isSharing ? (
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                    )}
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                        {collectionName === 'reclamationData' ? 'Reclamation Data Overview' : `${collectionName} Overview`}
                    </h3>
                    <p className="text-gray-500 text-lg">
                        Comprehensive analysis from {formattedStartDate} to {formattedEndDate}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Date Range Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-blue-900">Date Range</h4>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium">Start:</span>
                                <span className="text-blue-900 font-semibold">{formattedStartDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium">End:</span>
                                <span className="text-blue-900 font-semibold">{formattedEndDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-green-900">Summary</h4>
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-green-700 font-medium">Total {collectionName === 'reclamationData' ? 'Rakes' : 'Entries'}:</span>
                                <span className="text-green-900 font-semibold text-xl">{totalRakes}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Stats */}
                <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-gray-800 mb-6">Detailed Analytics</h4>
                    
                    {/* Time Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-gray-700">Total Time</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">{formatMinutesToHoursAndMinutes(totalTimeMinutes)}</span>
                            </div>
                        </div>

                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-gray-700">Actual Time</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">{formatMinutesToHoursAndMinutes(actualTimeMinutes)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reclamation Specific Stats */}
                    {collectionName === 'reclamationData' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { label: 'Total Loaded', value: totalLoaded, icon: '📦', color: 'blue' },
                                { label: 'Total Placed', value: totalPlaced, icon: '🏗️', color: 'green' },
                                { label: 'Total Sicks', value: totalSicks, icon: '🚨', color: 'red' },
                                { label: 'Total Manual', value: totalManual, icon: '🤝', color: 'yellow' },
                                { label: 'Total Tonage', value: totalTonage, icon: '⚖️', color: 'indigo' },
                                { label: 'Average', value: `${totalAverageReclamation.toFixed(1)} Ton's`, icon: '📊', color: 'pink' }
                            ].map((stat, index) => (
                                <div key={index} className={`bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">{stat.icon}</span>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${stat.color}-100 text-${stat.color}-800`}>
                                            {stat.label}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Report_betweenDates = ({ themeStyles, data, collectionName, settings }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <DataAnalysis 
                    themeStyles={themeStyles} 
                    data={data}  
                    collectionName={collectionName} 
                    settings={settings}
                />
            </div>
        </div>
    );
};

export default Report_betweenDates;