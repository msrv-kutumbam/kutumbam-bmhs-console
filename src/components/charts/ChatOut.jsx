import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../firebase-config';
import BarGraph from './BarGraph';
import BayGrid from './BayGrid';

function ChatOut() {
    const [VOIDvesselData, setVesselData] = useState([]);
    const [VOIDreclamationData, setReclamationData] = useState([]);
    const [error, setError] = useState(null); // Add error state
    const db = getFirestore(app);

    const fetchVesselData = async () => {
        try {
            const vesselDataCollectionRef = collection(db, 'vessel_data');
            const querySnapshot = await getDocs(vesselDataCollectionRef);
            const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setVesselData(data);
        } catch (err) {
            console.error('Error fetching vessel data:', err);
            setError('Failed to fetch vessel data. Please check your connection.');
        }
    };

    const fetchReclamationData = async () => {
        try {
            const reclamationDataCollectionRef = collection(db, 'reclamationData');
            const querySnapshot = await getDocs(reclamationDataCollectionRef);
            const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setReclamationData(data);
        } catch (err) {
            console.error('Error fetching reclamation data:', err);
            setError('Failed to fetch reclamation data. Please check your connection.');
        }
    };

    useEffect(() => {
        fetchVesselData();
        fetchReclamationData();
    }, []);

    return (
        <>
            {error && <div className="error-message">{error}</div>} {/* Display error message if any */}
            <BarGraph VOIDvesselData={VOIDvesselData} VOIDreclamationData={VOIDreclamationData} />
            <BayGrid VOIDvesselData={VOIDvesselData} VOIDreclamationData={VOIDreclamationData} />
        </>
    );
}

export default ChatOut;