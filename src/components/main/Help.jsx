import React, { useEffect } from 'react'
import { useNavigate, useLocation } from "react-router-dom";

function Help({setShowHeadder}) {
  useEffect(() => {
    setShowHeadder(true);
  }, [])
  return(
    <>
    help
    </>
  )
}

export default Help