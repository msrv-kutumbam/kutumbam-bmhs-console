
import React, { useEffect, useState } from 'react';
import CreateAccount from './CreateAccount';
import ForgotPassword from './ForgotPassword';
import Login from './Login';
import { getFirestore, collection, query, getDocs, doc, setDoc, where } from 'firebase/firestore';
import { app } from '../../firebase-config';
// import { useNavigate } from 'react-router-dom';

function Authentication({ setLoadingMessage, setLoadingProgress, setUserData, setConsoleUserAccess }) {
  // const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Handle login, createAccount, and forgotPassword
  const handleComponentChange = (component) => {
    switch (component) {
      case 'login':
        setShowLogin(true);
        setShowCreateAccount(false);
        setShowForgotPassword(false);
        break;
      case 'createAccount':
        setShowLogin(false);
        setShowCreateAccount(true);
        setShowForgotPassword(false);
        break;
      case 'forgotPassword':
        setShowLogin(false);
        setShowCreateAccount(false);
        setShowForgotPassword(true);
        break;
      default:
        setShowLogin(true);
        setShowCreateAccount(false);
        setShowForgotPassword(false);
    }
  };

  // Generate a random token for user validation
  const generateToken = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}:<>?';
    const tokenLength = 16;
    let token = '';
    for (let i = 0; i < tokenLength; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  };

  // Check if the user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const db = getFirestore(app);
      const q = query(collection(db, 'myConsole_users'), where('token', '==', token));
      getDocs(q).then((querySnapshot) => {
        if (querySnapshot.docs.length > 0) {
          const userData = querySnapshot.docs[0].data();
          if (userData.u_validation) {
            setUserData(userData);
            const newToken = generateToken();
            localStorage.setItem('token', newToken);
            setDoc(doc(db, 'myConsole_users', querySnapshot.docs[0].id), { token: newToken }, { merge: true });
            // navigate('/Main'); // Redirect to dashboard after login
          } else {
            setError('Your account is not verified. Please contact the authenticator for verification.');
          }
        }
      });
    }
  }, [setUserData]);

  return (
    <div>
      {showLogin && <Login setLoadingMessage={setLoadingMessage} setLoadingProgress={setLoadingProgress} setConsoleUserAccess={setConsoleUserAccess} setUserData={setUserData} handleComponentChange={handleComponentChange} />}
      {showCreateAccount && <CreateAccount handleComponentChange={handleComponentChange} />}
      {showForgotPassword && <ForgotPassword handleComponentChange={handleComponentChange} />}
    </div>
  );
}

export default Authentication;