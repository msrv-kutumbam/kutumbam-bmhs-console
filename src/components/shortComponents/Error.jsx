import React from 'react';
import { useNavigate } from 'react-router-dom';

const Error = ({errorMsg}) => {
  const navigate = useNavigate();

  return (
    <div className="error-container">
      <h2>Error Occurred</h2>
      <p>Something went wrong. Please try again later.</p>
      <button onClick={() => navigate(0)}>Reload Page</button>
      <button onClick={() => navigate("/Main")}>Go to Main Page</button>
      {errorMsg}
    </div>
  );
};

export default Error;