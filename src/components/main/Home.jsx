import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import ChatBoxCard from './ChatBoxCard'; // Import the new component

// Added new props: onlineUsersCount, newMessagesCount
function Home( {userData, setShowHeadder, possibleCollections, fetchCollections, onlineUsersCount, newMessagesCount} ) {
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
      <div className='p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {possibleCollections.map((item) => (
          <div
            key={item}
            className="rounded-lg shadow p-6 cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300 ease-in-out"
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

        {/* Render ChatBoxCard conditionally inside the grid */}
        {userData?.for === "BMHS" && (
          <ChatBoxCard
            userData={userData}
            onlineUsersCount={onlineUsersCount}
            newMessagesCount={newMessagesCount}
          />
        )}

        {/* Other components (data and charts, search data) */}
        {/* You can also extract these into separate components for better organization if they grow */}
        { (<>
          <div
            className="rounded-lg shadow p-6 cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300 ease-in-out"
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
            className="rounded-lg shadow p-6 cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300 ease-in-out"
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

export default Home;
