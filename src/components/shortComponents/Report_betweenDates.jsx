import React from 'react';  

const DataAnalysis = ({ data, collectionName, themeStyles, settings }) => {
    if (!data || data.length === 0) {
        return (
            <div
                className="p-4 rounded-lg"
                style={{
                    backgroundColor: themeStyles.paperBackground,
                    color: themeStyles.textColor,
                    fontSize: settings.fontSize === 'small' ? '14px' : settings.fontSize === 'medium' ? '16px' : '18px',
                }}
            >
                No data available for analysis.
            </div>
        );
    }

    // Common analysis logic for both collections
    const totalRakes = data?.length || 0 ;
    const totalQuantity = data.reduce((acc, item) => acc + parseInt(item.quantity || item.totalTon || 0), 0);

    // Calculate total time and actual time in hours and minutes
    const totalTime = data.reduce((acc, item) => {
        const [hours, minutes] = (item.total_time || item.totalTime || "0:0").split(':');
        return acc + parseInt(hours) * 60 + parseInt(minutes); // Convert to total minutes
    }, 0);
    const totalTimeHours = Math.floor(totalTime / 60);
    const totalTimeMinutes = totalTime % 60;

    const actualTime = data.reduce((acc, item) => {
        const [hours, minutes] = (item.actualTime || "0:0").split(':');
        return acc + parseInt(hours) * 60 + parseInt(minutes); // Convert to total minutes
    }, 0);
    const actualTimeHours = Math.floor(actualTime / 60);
    const actualTimeMinutes = actualTime % 60;

    // Reclamation-specific calculations
    const totalLoaded = data.reduce((acc, item) => acc + parseInt(item.wlLoaded || 0), 0);
    const totalPlaced = data.reduce((acc, item) => acc + parseInt(item.wlPlaced || 0), 0);
    const totalSicks = data.reduce((acc, item) => acc + parseInt(item.numberOfSick || 0), 0);
    const totalManual = data.reduce((acc, item) => acc + parseInt(item.manualLoaded || 0), 0);
    const totalTonage = data.reduce((acc, item) => acc + parseInt(item.totalTon || 0), 0);
    const totalAvarage = data.reduce((acc, item) => acc + parseInt(item.average || 0), 0);

    // Material analysis (for vessel_data)
    const materialCounts = data.reduce((acc, item) => {
        const material = Array.isArray(item.material || item.typeOfMaterial) ? (item.material || item.typeOfMaterial)[0] : item.material || item.typeOfMaterial;
        acc[material] = (acc[material] || 0) + 1;
        return acc;
    }, {});
    const mostCommonMaterial = Object.keys(materialCounts).reduce((a, b) => materialCounts[a] > materialCounts[b] ? a : b);

    // Vessel with longest total time (for vessel_data)
    const vesselWithLongestTime = data.reduce((a, b) => {
        const aTime = parseInt((a.total_time || "0:0").split(':')[0]) + parseInt((a.total_time || "0:0").split(':')[1]) / 60;
        const bTime = parseInt((b.total_time || "0:0").split(':')[0]) + parseInt((b.total_time || "0:0").split(':')[1]) / 60;
        return aTime > bTime ? a : b;
    });

    // Dynamic styles based on settings
    const dynamicStyles = {
        fontSize: settings.fontSize === 'small' ? '14px' : settings.fontSize === 'medium' ? '16px' : '18px',
        backgroundColor: themeStyles.paperBackground,
        color: themeStyles.textColor,
        border: themeStyles.border,
        borderRadius: themeStyles.borderRadius,
        boxShadow: themeStyles.boxShadow,
    };

    return (
        <div
            className="p-6 rounded-lg shadow-sm"
            style={dynamicStyles}
        >
            <h1 className="text-xl font-semibold mb-4" style={{ color: themeStyles.textColor }} > {collectionName} Analysis </h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Total Rakes */}
                <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: themeStyles.backgroundColor }}
                >
                    <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                        Total {collectionName}
                    </h2>
                    <p style={{ color: themeStyles.textColor }}>{totalRakes}</p>
                </div>
                {/* Total Time */}
                <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: themeStyles.backgroundColor }}
                >
                    <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                        Total Time
                    </h2>
                    <p style={{ color: themeStyles.textColor }}>
                        {totalTimeHours}h {totalTimeMinutes}m
                    </p>
                </div>
                {/* Actual Time */}
                <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: themeStyles.backgroundColor }}
                >
                    <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                        Actual Time
                    </h2>
                    <p style={{ color: themeStyles.textColor }}>
                        {actualTimeHours}h {actualTimeMinutes}m
                    </p>
                </div>
                
                {collectionName === 'reclamationData' && (
                    <>
                        {/* Total Loaded */}
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Total Loaded
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>{totalLoaded}</p>
                        </div>
                        {/* Total Placed */}
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Total Placed
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>{totalPlaced}</p>
                        </div>
                        {/* Total Sicks */}
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Total Sicks
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>{totalSicks}</p>
                        </div>
                        {/* Total Manual */}
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Total Manual
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>{totalManual}</p>
                        </div>
                        {/* Total Tonage */}
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Total Tonage
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>{totalTonage}</p>
                        </div>
                        {/* Total Avarage */}
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Total Avarage
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>
                                { totalAvarage / totalRakes } Ton's
                            </p>
                        </div>
                    </>
                )}
                {collectionName === 'vessel_data' && (
                    <>
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Most Common Material
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>{mostCommonMaterial}</p>
                        </div>
                        <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: themeStyles.backgroundColor }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: themeStyles.textColor }}>
                                Vessel with Longest Time
                            </h2>
                            <p style={{ color: themeStyles.textColor }}>
                                {vesselWithLongestTime.Vessel_name} ({vesselWithLongestTime.total_time})
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
 
const Report_betweenDates = ({ themeStyles, data, collectionName, settings }) => {
    return (
        <div className="report-container">
            <DataAnalysis themeStyles={themeStyles} data={data} collectionName={collectionName} settings={settings} />
        </div>
    );
};

export default Report_betweenDates; 