import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from "react-router-dom"; 

function Home( {userData, setShowHeadder, possibleCollections, fetchCollections} ) {
  const navigate = useNavigate();
  useEffect(() => {
    setShowHeadder(true);
  }, [])
  

  if (!possibleCollections || possibleCollections.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <span className="block sm:inline">Error: No collections available.</span>
      </div>
    )
  }

  return(
    <>

      <div className='p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6'>
        {possibleCollections.map((item) => (
          <div 
            key={item} 
            className=" rounded-lg shadow p-6 cursor-pointer" 
            onClick={() => {
              try {
                fetchCollections(item); 
                navigate(`/C?collection=${encodeURIComponent(item)}`);
              } catch (error) {
                console.error('Error navigating to collection:', error);
              }
            }}
          >
            <h3 className="text-lg font-semibold mb-2">{item}</h3> 
          </div>
        ))}

        {userData?.for === "BMHS" && (<>
          <div  
            className=" rounded-lg shadow p-6 cursor-pointer" 
            onClick={() => {
              try { 
                navigate(`/Charts`);
              } catch (error) {
                console.error('Error navigating to collection:', error);
              }
            }}
          >
            <h3 className="text-lg font-semibold mb-2">
              {"data and charts"}
            </h3> 
          </div>
          <div  
            className=" rounded-lg shadow p-6 cursor-pointer" 
            onClick={() => {
              try { 
                navigate(`/Search`);
              } catch (error) {
                console.error('Error navigating to collection:', error);
              }
            }}
          >
            <h3 className="text-lg font-semibold mb-2">
             {"search data"}
            </h3> 
          </div>
        </>)}
      </div>
    </>
    
  )
}

export default Home