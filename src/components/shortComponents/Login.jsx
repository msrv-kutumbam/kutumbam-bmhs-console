import React, { useState } from 'react';
import { getFirestore, collection, query, getDocs, doc, setDoc, where } from 'firebase/firestore';
import { app } from '../../firebase-config';
import Popup from './Popup';

const Login = ({ setLoadingMessage, setLoadingProgress, setUserData, handleComponentChange, setConsoleUserAccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [logLabel, setLogLabel] = useState('Login');
  const [logHeader, setLogHeader] = useState('Login');
  const [gotoMainPopup, setGotoMainPopup] = useState(false);
  const [loginData, setLoginData] = useState(null);
  const [token, setToken] = useState(null)
  const db = getFirestore(app);

  const generateToken = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}:<>?';
    const tokenLength = 16;
    let token = '';
    for (let i = 0; i < tokenLength; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  };

  const handleUserAccess = (userData) => {
    const accessLetters = userData.access.split('');
    const curdLetters = ['C', 'R', 'U', 'D'];
    const hasAccess = curdLetters.some(e => accessLetters.includes(e)); 
    setConsoleUserAccess(hasAccess);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLogLabel("Connecting to server...");
    
    try {
      const q = query(
        collection(db, "myConsole_users"),
        where("username", "==", username),
        where("password", "==", password)
      );
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid username or password');
      }

      setLogLabel("Verifying user...");
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      setLoginData( userData );

      if (userData?.u_validation === false ) {
        setLogHeader("User validation failed, Contact Admin");
        return;
      } 
      const token = generateToken();
      setToken( token );
      await setDoc(doc(db, "myConsole_users", userDoc.id), { token }, { merge: true });
      
      setLogLabel("Successfully verified.");
      setGotoMainPopup(true);
 

    } catch (error) {
      console.error("Error during login:", error);
      setLogLabel(error.message || "An error occurred. Please try again.");
    }
  };

  const onUserConfirmGotoMain = () => {
    const userData = loginData ; 
    handleUserAccess(userData);
    setUserData({ username, ...userData, token });
    setGotoMainPopup(true); 
    // console.log( token )
    localStorage.setItem('token', token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{logHeader}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {logLabel}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => handleComponentChange('forgotPassword')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot Password?
            </button>
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleComponentChange('createAccount')}
                className="text-blue-600 hover:text-blue-700"
              >
                Create one
              </button>
            </p>
          </div>
        </form>
      </div>

      {gotoMainPopup && (
        <Popup 
          isOpen={gotoMainPopup}
          message={"Login successful! Click confirm to redirectv?"}
          onConfirm={ onUserConfirmGotoMain }
          onCancel={() => setGotoMainPopup(false) }
        />
      )}
    </div>
  );
};

export default Login;