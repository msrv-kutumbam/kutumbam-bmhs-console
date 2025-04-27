import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackIcon from '@mui/icons-material/ArrowBackIos';
const useRouteHistory = () => {
  const location = useLocation();
  const [history, setHistory] = useState([]); 
  useEffect(() => { 

  setHistory((prevHistory) => {
    if (prevHistory.length > 0 && prevHistory[prevHistory.length - 1] === location.pathname) {
        return prevHistory;
      } else {
        return [...prevHistory, location.pathname];
      }
  }); }, [location]);

  return { history, setHistory };
};

const BackButton = () => {
  const navigate = useNavigate();
  const { history, setHistory } = useRouteHistory(); 

  const goBack = () => {
    if (history.length > 1) {
      const previousRoute = history[history.length - 2];
      navigate(previousRoute, { replace: true }) ; // use replace here to prevent issues with browser history.
      setHistory(history.slice(0, -1));

    } 
    console.log(history)
  };

  return (
    <button className="pr-4 cursor-pointer" onClick={goBack} disabled={history.length <= 1}>
      { history.length > 1 ? <BackIcon /> : null }
    </button>
  );
};

export default BackButton;