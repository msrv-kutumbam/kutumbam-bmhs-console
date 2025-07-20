import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
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
import { getFirestore, collection, query, doc, getDocs, orderBy, limit, where, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import ChatOut from './components/charts/ChatOut';
import Authentication from './components/shortComponents/Authentication';
import LoadingComponent from './components/shortComponents/LoadingComponent';
import JSPlayground from './components/Dev/JSPlayground';
import ChatComponent from './components/main/ChatComponent';
import Files from './components/Dev/Files';

function App() {
  const [overallData, setOverallData] = useState(null);
  const [possibleCollections, setpossibleCollections] = useState(["reclamationData", "vessel_data"]);
  const [loadingMessage, setLoadingProgress] = useState("Loading...");
  const [loadingProgrause, setLoadingMessage] = useState(100);
  const [colletionsData, setColletionData] = useState(() => {
    return possibleCollections.reduce((acc, collectionName) => ({ ...acc, [collectionName]: null }), {});
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [consoleUserAccess, setConsoleUserAccess] = useState(false);
  const [showHeadder, setShowHeadder] = useState(true);

  // --- New States for Chat Overview ---
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  // Initialize lastSeenChatTimestamp to null, will be set after user data is loaded
  const [lastSeenChatTimestamp, setLastSeenChatTimestamp] = useState(null);

  const db = getFirestore(app); // Initialize Firestore here once

  const fetchCollections = async (collectionName, startDateV, endDateV) => {
    try {
      const collectionRef = collection(db, collectionName);

      if (collectionName !== 'vessel_data' && collectionName !== 'reclamationData') {
        const q = query(collectionRef);
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

      const orderByField = collectionName === 'vessel_data'
        ? 'berthing_time'
        : collectionName === 'reclamationData'
          ? 'date'
          : 'date';

      let q;

      if (startDateV && endDateV) {
        const startDate = collectionName === 'vessel_data'
          ? `${startDateV}T00:00`
          : startDateV;

        const endDate = collectionName === 'vessel_data'
          ? `${endDateV}T23:59`
          : endDateV;

        q = query(
          collectionRef,
          where(orderByField, '>=', startDate),
          where(orderByField, '<=', endDate),
          orderBy(orderByField, 'asc'),
        );
      } else {
        q = query(
          collectionRef,
          orderBy(orderByField, 'desc'),
          limit(10)
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
      theme: 'light',
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
    setOverallData((prev) => ({
      ...prev,
      possibleCollections,
      colletionsData,
      errorMsg,
      userData,
      consoleUserAccess,
      showHeadder,
      settings
    }));
  }, [possibleCollections, colletionsData, errorMsg, userData, isLoading, consoleUserAccess, showHeadder, settings]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (consoleUserAccess) {
      if (userData?.for === "BMHS") {
        setpossibleCollections(["reclamationData", "vessel_data"]);
      }
      if (userData?.for === "DEV") {
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
      await delay(150);

      const token = localStorage.getItem('token');
      setLoadingProgress(20);
      setLoadingMessage('Fetching user data...');
      await delay(150);

      if (token) {
        const q = query(collection(db, 'myConsole_users'), where('token', '==', token));
        setLoadingProgress(40);
        setLoadingMessage('Validating user access...');
        await delay(150);

        try {
          const querySnapshot = await getDocs(q);
          if (querySnapshot.docs.length > 0) {
            const fetchedUserData = { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id };
            setUserData(fetchedUserData);

            setLoadingProgress(60);
            setLoadingMessage('Checking user access validation...');
            await delay(150);

            if (fetchedUserData.u_validation === true) {
              const accessLetters = fetchedUserData.access.split('');
              const curdLetters = ['C', 'R', 'U', 'D'];
              curdLetters.forEach((e) => {
                if (accessLetters.includes(e)) {
                  setConsoleUserAccess(true);
                }
              });

              setLoadingProgress(80);
              setLoadingMessage('Finalizing user session...');
              await delay(150);
              const lastVisit = new Date().toISOString();
              await setDoc(doc(db, "myConsole_users", fetchedUserData.id), { lastVisit }, { merge: true });

              // Initialize lastSeenChatTimestamp:
              // If it exists in Firestore, use it. Otherwise, set to current time
              // so messages *before* this login aren't counted as new.
              if (fetchedUserData.lastSeenChatTimestamp) {
                setLastSeenChatTimestamp(fetchedUserData.lastSeenChatTimestamp.toDate());
              } else {
                const now = new Date();
                setLastSeenChatTimestamp(now);
                // Optionally, immediately update Firestore for new users/first login
                // This will ensure the next time they log in, this value is present.
                await updateDoc(doc(db, 'myConsole_users', fetchedUserData.id), {
                  lastSeenChatTimestamp: now
                }).catch(error => console.error("Error setting initial lastSeenChatTimestamp:", error));
              }

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
  }, []); // Empty dependency array to run only once on mount

  // --- Real-time Online Users Count ---
  useEffect(() => {
    const usersRef = collection(db, 'users');
    // Query for users whose lastSeen is within the last 60 seconds
    const q = query(usersRef, where('lastSeen', '>', new Date(Date.now() - 60000)));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOnlineUsersCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching online users count:", error);
    });
    return unsubscribe;
  }, [db]); // Depend on db instance

  // --- Real-time New Messages Count ---
  useEffect(() => {
    // Only run this effect if userData and lastSeenChatTimestamp are available
    if (!userData?.id || !lastSeenChatTimestamp) {
      setNewMessagesCount(0); // Ensure it's 0 if not ready
      return;
    }

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('timestamp', '>', lastSeenChatTimestamp), // Messages sent after user last saw chat
      where('uid', '!=', userData.id) // Exclude messages sent by the current user
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNewMessagesCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching new messages count:", error);
    });

    return unsubscribe;
  }, [db, userData, lastSeenChatTimestamp]); // Depend on db, userData, and lastSeenChatTimestamp

  // Function to mark all messages as seen when entering ChatComponent
  const markAllMessagesAsSeen = useCallback(async () => {
    if (userData?.id) {
      try {
        const now = new Date();
        // Update the user's lastSeenChatTimestamp in Firestore to the current time
        await updateDoc(doc(db, 'myConsole_users', userData.id), {
          lastSeenChatTimestamp: now
        });
        setLastSeenChatTimestamp(now); // Update local state immediately
        setNewMessagesCount(0); // Reset local new messages count
      } catch (error) {
        console.error("Error marking all messages as seen:", error);
      }
    }
  }, [userData, db]);


  const ContainerFrame = () => {
    return (
      <BrowserRouter>
        <Routes>
          {/* Pass onlineUsersCount and newMessagesCount to Layout */}
          <Route path="/" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Home setShowHeadder={setShowHeadder} fetchCollections={fetchCollections} possibleCollections={possibleCollections} />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/Main" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Home userData={userData} setShowHeadder={setShowHeadder} fetchCollections={fetchCollections} possibleCollections={possibleCollections} />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/Help" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Help setShowHeadder={setShowHeadder} />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/Settings" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Settings settings={settings} handleSettingChange={handleSettingChange} />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/Notifications" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Notifications />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/Search" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<Search overallData={overallData} setShowHeadder={setShowHeadder} settings={settings} />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/c" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<C settings={settings} setShowHeadder={setShowHeadder} userData={userData} fetchCollections={fetchCollections} colletionsData={colletionsData} />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/error" element={<Error errorMsg={errorMsg} />} />
          <Route path="/Charts" element={<Layout showHeadder={showHeadder} setUserData={setUserData} userData={userData} content={<ChatOut setShowHeadder={setShowHeadder} />} settings={settings} onlineUsersCount={onlineUsersCount} newMessagesCount={newMessagesCount} />} />
          <Route path="/Js-Plasyground" element={<JSPlayground />} />
          {/* Pass markAllMessagesAsSeen to ChatComponent */}
          <Route path="/ChatComponent" element={<ChatComponent user={userData} markAllMessagesAsSeen={markAllMessagesAsSeen} />} />
          <Route path="/Files" element={<Files />} />
        </Routes>
      </BrowserRouter>
    );
  };

  return (
    isLoading === true ? <LoadingComponent loadingMessage={loadingMessage} loadingProgrause={loadingProgrause} /> : (
      userData?.u_validation === true ? <ContainerFrame /> : <Authentication setLoadingMessage={setLoadingMessage} setLoadingProgress={setLoadingProgress} setConsoleUserAccess={setConsoleUserAccess} setUserData={setUserData} />)
  );
}

export default App;
