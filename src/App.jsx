import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/main/Home';
import Help from './components/main/Help';
import Settings from './components/main/Settings';
import Notifications from './components/main/Notifications';
import Search from './components/main/Search';
import C from './components/C';
import { app } from './firebase-config';
import Error from './components/shortComponents/Error';
import { getFirestore, collection, query, doc, getDocs, orderBy, limit, where, setDoc } from 'firebase/firestore';
import ChatOut from './components/charts/ChatOut';
import Authentication from './components/shortComponents/Authentication';
import LoadingComponent from './components/shortComponents/LoadingComponent'; // Ensure this is defined
import JSPlayground from './components/Dev/JSPlayground';
import ChatComponent from './components/main/ChatComponent';
import Files from './components/Dev/Files';

function App() {
  const [overallData, setOverallData] = useState(null)
  const [possibleCollections, setpossibleCollections ] = useState([ "reclamationData", "vessel_data"  ]);
  const [loadingMessage, setLoadingProgress] = useState("Loading...");
  const [loadingProgrause, setLoadingMessage] = useState(100)
  const [colletionsData, setColletionData] = useState(() => {
    return possibleCollections.reduce((acc, collectionName) => ({ ...acc, [collectionName]: null }), {});
  }); 
  const [errorMsg, setErrorMsg] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [consoleUserAccess, setConsoleUserAccess ] = useState(false);
  const [showHeadder, setShowHeadder] = useState( true );
 
  const fetchCollections = async (collectionName, startDateV, endDateV) => {
    try {
        const db = getFirestore(app);
        const collectionRef = collection(db, collectionName);

        // If collectionName is "myConsole_users" or "users", fetch all data without filters
        // if (collectionName === 'myConsole_users' || collectionName === "users") {
        //     const q = query(collectionRef);
        //     const querySnapshot = await getDocs(q);
        //     const data = querySnapshot.docs.map((doc) => ({
        //         id: doc.id,
        //         ...doc.data(),
        //     }));

        //     setColletionData((prevData) => ({
        //         ...prevData,
        //         [collectionName]: data,
        //     }));

        //     return data;
        // }

        // If collectionName is NOT "vessel_data" or "reclamationData", fetch all data without filters
        if (collectionName !== 'vessel_data' && collectionName !== 'reclamationData') {
          const q = query(collectionRef); console.log( "if ")
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
          }));

          setColletionData((prevData) => ({
              ...prevData,
              [collectionName]: data,
          }));

          return data;
        }

        // Determine the field to order by based on the collection name
        const orderByField = collectionName === 'vessel_data'
            ? 'berthing_time'
            : collectionName === 'reclamationData'
                ? 'date'
                : 'date';

        let q;

        // Apply date range filter if startDateV and endDateV are provided
        if (startDateV && endDateV) {
            const startDate = collectionName === 'vessel_data'
                ? `${startDateV}T00:00` // Include the entire start day
                : startDateV;

            const endDate = collectionName === 'vessel_data'
                ? `${endDateV}T23:59` // Include the entire end day
                : endDateV;

            q = query(
                collectionRef,
                where(orderByField, '>=', startDate),
                where(orderByField, '<=', endDate),
                orderBy(orderByField, 'asc'),
                // limit(10) // Adjust the limit as needed
            );
        } else {
            // If no date range is provided, fetch the latest 10 entries
            q = query(
                collectionRef,
                orderBy(orderByField, 'desc'),
                limit(10) // Adjust the limit as needed
            );
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        setColletionData((prevData) => ({
            ...prevData,
            [collectionName]: data,
        }));

        return data;
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        setErrorMsg(`Failed to fetch ${collectionName}: ${error.message}`);
        return [];
    }
  };


  const [settings, setSettings] = useState(() => {
    const storedSettings = localStorage.getItem('userSettings');
    return storedSettings ? JSON.parse(storedSettings) : {
      theme: 'light', // 'dark',
      fontSize: 'medium',
      notificationsEnabled: true,
      language: 'en',
      privacyMode: false,
      soundEnabled: true,
      accentColor: '#6366f1',
    };
  });

  const handleSettingChange = (name, value) => {
    setSettings((prevSettings) => ({ ...prevSettings, [name]: value }));
  }; 

  useEffect(() => {
    setOverallData((prev) => ({ ...prev,  
      possibleCollections, 
      colletionsData, 
      errorMsg, 
      userData,  
      consoleUserAccess, 
      showHeadder, 
      settings 
    }));
  }, [possibleCollections, colletionsData, errorMsg, userData, isLoading, consoleUserAccess, showHeadder, settings])
    
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);  

  useEffect( () => {
    if (consoleUserAccess) { 
      if (userData?.for === "BMHS") {
        // Only allow "reclamationData" and "vessel_data" for BMHS users
        setpossibleCollections(["reclamationData", "vessel_data"]);
      }
      if (userData?.for === "DEV") {
        // Only allow "reclamationData" and "vessel_data" for DEV users
        setpossibleCollections(["reclamationData", "vessel_data", "users", "myConsole_users", "del_reclamationData", "del_vessel_data"]);
      }
    } else {
      setpossibleCollections([]);
    }
  }, [consoleUserAccess, userData]);

  // Check if the user is already logged in
  useEffect(() => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const checkUserLoginStatus = async () => {
      setLoadingProgress(10);
      setLoadingMessage('Checking user login status...');
      await delay( 150); // Wait for 1 second

      const token = localStorage.getItem('token');
      setLoadingProgress(20);
      setLoadingMessage('Fetching user data...');
      await delay( 150); // Wait for 1 second

      if (token) {
        const db = getFirestore(app);
        const q = query(collection(db, 'myConsole_users'), where('token', '==', token));
        setLoadingProgress(40);
        setLoadingMessage('Validating user access...');
        await delay( 150); // Wait for 1 second

        try {
          const querySnapshot = await getDocs(q);
          if (querySnapshot.docs.length > 0) {
            const userData = { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id };
            // userData.password = null;
            
            setLoadingProgress(60);
            setLoadingMessage('Checking user access validation...');
            await delay( 150); // Wait for 1 second

            if (userData.u_validation === true ) {
              setUserData(userData); 
              const accessLetters = userData.access.split('');
              const curdLetters = ['C', 'R', 'U', 'D'];
              curdLetters.forEach((e) => {
                if (accessLetters.includes(e)) {
                  setConsoleUserAccess(true); 
                } 
              });

              setLoadingProgress(80);
              setLoadingMessage('Finalizing user session...');
              await delay( 150); // Wait for 1 second
              const lastVisit = new Date().toISOString()//.replace('T', ' ').replace('Z', '')
              await setDoc(doc(db, "myConsole_users", userData.id), { lastVisit }, { merge: true });

              setLoadingProgress(100);
              setLoadingMessage('User logged in successfully!');
              setIsLoading(false);
            } else {
              setErrorMsg('Your account is not verified. Please contact the authenticator for verification.');
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error checking user token:', error);
          setIsLoading(false);
        }
      } else {
        setLoadingProgress(0);
        setLoadingMessage('No user logged in.');
        setIsLoading(false);
      }
    };

    checkUserLoginStatus();  

  }, []);

  const ContainerFrame = () => {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Home setShowHeadder={setShowHeadder} fetchCollections={fetchCollections} possibleCollections={possibleCollections} />} settings={settings} />} />
          <Route path="/Main" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Home userData={userData} setShowHeadder={setShowHeadder} fetchCollections={fetchCollections} possibleCollections={possibleCollections} />} settings={settings} />} />
          <Route path="/Help" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Help setShowHeadder={setShowHeadder} />} settings={settings} />} />
          <Route path="/Settings" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Settings settings={settings} handleSettingChange={handleSettingChange} />} settings={settings} />} />
          <Route path="/Notifications" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Notifications />} settings={settings} />} />
          <Route path="/Search" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Search overallData={overallData} setShowHeadder={setShowHeadder} settings={settings} />} settings={settings} />} />
          <Route path="/c" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<C settings={settings} setShowHeadder={setShowHeadder} userData={userData} fetchCollections={fetchCollections} colletionsData={colletionsData} />} settings={settings} />} />
          <Route path="/error" element={<Error errorMsg={errorMsg} />} />
          <Route path="/Charts" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<ChatOut setShowHeadder={setShowHeadder} />} settings={settings} />} />
          <Route path="/Js-Plasyground" element={<JSPlayground />} />
          <Route path="/ChatComponent" element={<ChatComponent />} />
          <Route path="/Files" element={<Files />} />
        </Routes>
      </BrowserRouter>
    );
  }; 

  // LoadingComponent , ContainerFrame , Authentication
  return (
    isLoading === true ? <ContainerFrame loadingMessage={loadingMessage} loadingProgrause={loadingProgrause} /> : (
    userData?.u_validation === true ? <ContainerFrame/> : <Authentication setLoadingMessage={setLoadingMessage} setLoadingProgress={setLoadingProgress} setConsoleUserAccess={setConsoleUserAccess} setUserData={setUserData} /> )
  );
 
}

export default App;