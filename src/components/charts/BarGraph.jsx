import React, { useState, useEffect } from 'react';
import { getFirestore } from 'firebase/firestore';
import { app } from '../../firebase-config';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { BarChart } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { useResizeDetector } from 'react-resize-detector';
import { CircularProgress } from '@mui/material';

function VoidMapChat({ VOIDreclamationData = [], VOIDvesselData = [] }) {
    const [vesselData, setVesselData] = useState([]);
    const [reclamationData, setReclamationData] = useState([]);
    const [tickPlacement, setTickPlacement] = useState('middle');
    const [tickLabelPlacement, setTickLabelPlacement] = useState('middle');
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { width, ref } = useResizeDetector();
    const [showForm, setShowForm] = useState('false'); // Changed to string to match radio value

    const fetchVesselData = async () => {
        try {
            setVesselData(VOIDvesselData);
        } catch (err) {
            console.error('Error fetching vessel data:', err);
            setError('Failed to fetch vessel data. Please check your connection.');
        }
    };

    const fetchReclamationData = async () => {
        try {
            setReclamationData(VOIDreclamationData);
        } catch (err) {
            console.error('Error fetching reclamation data:', err);
            setError('Failed to fetch reclamation data. Please check your connection.');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await fetchVesselData();
            await fetchReclamationData();
            setLoading(false);
        };

        fetchData();
    }, [VOIDvesselData, VOIDreclamationData]); // Added dependencies

    useEffect(() => {
        if (vesselData.length > 0 || reclamationData.length > 0) {
            const materialStats = {};

            // Process vessel data (imports)
            vesselData.forEach(vessel => {
                const material = Array.isArray(vessel.material) ? vessel.material[0] : vessel.material;
                if (!material) return; // Skip if material is undefined

                if (!materialStats[material]) {
                    materialStats[material] = {
                        material: material,
                        imported: 0,
                        exported: 0,
                        paths: new Set(),
                        quantity: 0
                    };
                }
                materialStats[material].imported += parseInt(vessel.quantity) || 0;
                if (vessel.path) {
                    (Array.isArray(vessel.path) ? vessel.path : [vessel.path])
                        .forEach(path => materialStats[material].paths.add(path));
                }
            });

            // Process reclamation data (exports)
            reclamationData.forEach(item => {
                const material = Array.isArray(item.typeOfMaterial) 
                    ? item.typeOfMaterial[0] 
                    : item.typeOfMaterial;
                if (!material) return; // Skip if material is undefined

                if (!materialStats[material]) {
                    materialStats[material] = {
                        material: material,
                        imported: 0,
                        exported: 0,
                        paths: new Set(),
                        quantity: 0
                    };
                }
                materialStats[material].exported += parseInt(item.totalTon) || 0;
            });

            const processedData = Object.values(materialStats).map(item => ({
                material: item.material,
                quantity: item.imported - item.exported || 0,
                paths: Array.from(item.paths),
                pathString: Array.from(item.paths).join(', ')
            }));

            setChartData(processedData);
        }
    }, [vesselData, reclamationData]);

    const handleBarHover = (event, barData) => {
        if (!barData) return;
        const dataPoint = chartData[barData.dataIndex];
        if (dataPoint) {
            alert(`Material: ${dataPoint.material}\nPaths: ${dataPoint.paths.join(', ')}`);
        }
    };

    const chartSettings = {
        yAxis: [{
            label: '',
        }],
        height: 400,
        sx: {
            [`& .${axisClasses.directionY} .${axisClasses.label}`]: {
                transform: 'translateX(-10px)',
            },
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div ref={ref}>
            <Stack spacing={2} sx={{ width: '100%', p: 2 }}>
                <FormControl sx={{ 
                    display: "flex", 
                    flexDirection: "row",
                    alignItems: "center", 
                    gap: 5 
                }}>
                    <FormLabel id="show-form-radio-buttons-group-label">
                        Show More Options
                    </FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="show-form-radio-buttons-group-label"
                        name="show-form"
                        value={showForm}
                        onChange={(event) => setShowForm(event.target.value)}
                    >
                        <FormControlLabel value="true" control={<Radio />} label="Yes" />
                        <FormControlLabel value="false" control={<Radio />} label="No" />
                    </RadioGroup>
                </FormControl>

                {showForm === "true" && (
                    <div>
                        <FormControl>
                            <FormLabel id="tick-placement-radio-buttons-group-label">
                                Tick Placement
                            </FormLabel>
                            <RadioGroup
                                row
                                aria-labelledby="tick-placement-radio-buttons-group-label"
                                name="tick-placement"
                                value={tickPlacement}
                                onChange={(event) => setTickPlacement(event.target.value)}
                            >
                                <FormControlLabel value="start" control={<Radio />} label="start" />
                                <FormControlLabel value="end" control={<Radio />} label="end" />
                                <FormControlLabel value="middle" control={<Radio />} label="middle" />
                                <FormControlLabel value="extremities" control={<Radio />} label="extremities" />
                            </RadioGroup>
                        </FormControl>
                        <FormControl>
                            <FormLabel id="label-placement-radio-buttons-group-label">
                                Label Placement
                            </FormLabel>
                            <RadioGroup
                                row
                                aria-labelledby="label-placement-radio-buttons-group-label"
                                name="label-placement"
                                value={tickLabelPlacement}
                                onChange={(event) => setTickLabelPlacement(event.target.value)}
                            >
                                <FormControlLabel value="tick" control={<Radio />} label="tick" />
                                <FormControlLabel value="middle" control={<Radio />} label="middle" />
                            </RadioGroup>
                        </FormControl>
                    </div>
                )}

                {chartData.length > 0 ? (
                    <BarChart
                        dataset={chartData}
                        xAxis={[{
                            scaleType: 'band',
                            dataKey: 'material',
                            tickPlacement,
                            tickLabelPlacement
                        }]}
                        series={[{
                            dataKey: 'quantity',
                            label: 'Net Quantity',
                            valueFormatter: (value) => `${value?.toLocaleString() || 0} Mt's`
                        }]}
                        {...chartSettings}
                        width={width || 800}
                        onBarHover={handleBarHover}
                    />
                ) : (
                    <div>No data available to display.</div>
                )}
            </Stack>
        </div>
    );
}

function BarGraph({ VOIDvesselData, VOIDreclamationData }) {
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
                    Show BarGraph between material and quantity 
                </span>
            </label>
            {showMapChat && (
                <VoidMapChat 
                    VOIDreclamationData={VOIDreclamationData} 
                    VOIDvesselData={VOIDvesselData} 
                />
            )}
        </div>
    );
}
 

export default BarGraph;