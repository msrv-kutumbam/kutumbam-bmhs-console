import React, { useEffect, useState } from 'react'; 
import { useNavigate } from "react-router-dom";
import BackButton from './shortComponents/BackButton';
import Profil from './shortComponents/Profil'; 

const Layout = ({ content, settings, userData, setUserData, showHeadder }) => {
  const navigate = useNavigate();
  const [displayContent, setDisplayContent] = useState(content);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const storedValue = localStorage.getItem('isSidebarOpen');
    return storedValue === 'true';
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const menuItems = [
    { icon: '🏠', label: 'Main' },
    { icon: '🗑️', label: 'Delete', action: () => setIsDeleteModalOpen(true) },
    { icon: '💬', label: 'ChatComponent' },    
    { icon: '🔍', label: 'Search' },
    { icon: '⚙️', label: 'Settings' },
    // userData?.for === "DEV" ?  { icon: '🗂️', label: 'Files' } : null ,
    // userData?.for === "DEV" ?  { icon: '⚠️', label: 'Error' } : null ,
    // userData?.for === "DEV" ?  { icon: '🎭', label: 'Js-Plasyground' } : null ,
    userData?.for === "DEV" ?  { icon: '📊', label: 'Charts' } : null ,
    // userData?.for === "DEV" ?  { icon: '🔔', label: 'Notifications' } : null ,
  ];

  const [profileImage, setProfileImage] = useState( userData?.profileImageUrl || null )
  const [avatar, setAvatar] = useState( "👤")
  const [serchInput, setSerchInput] = useState("")

  function filterCollections(data, searchKeyword) {
    function filterData(data, searchKeyword) {
        if (Array.isArray(data)) {
            const filteredArray = data
                .map(item => filterData(item, searchKeyword))
                .filter(item => item !== undefined);
            return filteredArray.length > 0 ? filteredArray : undefined;
        } else if (typeof data === 'object' && data !== null) {
            let hasMatch = false;
            const filteredObject = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const filteredValue = filterData(data[key], searchKeyword);
                    if (filteredValue !== undefined) {
                        filteredObject[key] = filteredValue;
                        hasMatch = true;
                    }
                }
            }
            return hasMatch ? { ...data, ...filteredObject } : undefined;
        } else {
            if (String(data).toLowerCase().includes(searchKeyword.toLowerCase())) {
                return data;
            }
            return undefined;
        }
    }
    const filteredData = filterData(data, searchKeyword);
    return filteredData !== undefined ? filteredData : {};
  }

  const searchEngine = (p) => { 
    const data = content.props;
    const target = p.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    setSerchInput(target);
    const result = filterCollections(data, target);
    setDisplayContent((prevDisplayContent) => ({
      ...prevDisplayContent,
      props: result,
    }));
  };

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.clear();
    setUserData({})
    setIsLogoutModalOpen(false);
  };

  const handleDeleteAll = () => {
    localStorage.clear();
    setIsDeleteModalOpen(false);
  };

  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  const Sidebar = () => (
    <div 
      style={{ overflowX: "auto" }}
      className={`flex md:flex-col ${isSidebarOpen ? 'md:w-64' : 'md:w-20'} transition-all duration-300 ${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
    >
      <div className={`h-16 flex items-center justify-between px-4 md:w-full`}>
        {isSidebarOpen && <h1 className="font-bold text-xl hidden md:block">Dashboard</h1>}
        <button onClick={() => {
          setIsSidebarOpen(!isSidebarOpen);
          localStorage.setItem('isSidebarOpen', !isSidebarOpen);
        }} className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
          {isSidebarOpen ? '◀️' : '▶️'}
        </button>
      </div> 

      <nav className="flex-1 md:pt-4 flex md:flex-col">
        {menuItems.filter(Boolean).map((item, index) => (
          <button
            key={index}
            className={`flex items-center px-4 py-3 hover:bg-gray-100 ${isSidebarOpen ? 'md:justify-start' : 'md:justify-center'} flex-1 md:flex-none ${settings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={() => item.action ? item.action() : navigate(`/${item.label}`)}
          >
            <span className="text-xl">{item.icon}</span>
            {isSidebarOpen && <span className="ml-3 hidden md:inline">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 hidden md:block">
        <button onClick={() => setIsLogoutModalOpen(true)} className={`w-full flex items-center hover:bg-gray-100 p-2 rounded ${isSidebarOpen ? 'justify-start' : 'justify-center'} logout-trigger ${settings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <span className={`w-[35px] h-[35px] rounded-md flex items-center justify-center ${userData?.profileImageUrl ? '' : 'bg-sky-400'}`}>
            {userData?.profileImageUrl ? (
              <img src={userData.profileImageUrl} alt="Profile" className="w-full h-full object-cover rounded-full border-2" />
            ) : (
              avatar
            )}
          </span>
          {isSidebarOpen && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );

  const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
    const isDarkTheme = settings.theme === 'dark';
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 ${isDarkTheme ? 'bg-black bg-opacity-80' : 'bg-white bg-opacity-80'}`}>
        <div className={`rounded-lg shadow-xl w-96 overflow-hidden ${isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <div className={`p-4 ${isDarkTheme ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-xl font-semibold ${isDarkTheme ? 'text-red-400' : 'text-red-700'}`}>{title}</h2>
          </div>
          <div className={`p-6 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            <p className="mb-4">{message}</p>
            <div className="flex justify-end space-x-3">
              <button onClick={onCancel} className={`px-4 py-2 rounded-md transition-colors ${isDarkTheme ? 'border border-gray-600 hover:bg-gray-700 text-gray-300' : 'border border-gray-300 hover:bg-gray-50 text-gray-800'}`}>
                Cancel
              </button>
              <button onClick={onConfirm} className={`px-4 py-2 rounded-md transition-colors ${isDarkTheme ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen ${settings.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <aside className="hidden md:block">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        { showHeadder &&  <header className={`h-16 gap-1 flex items-center justify-between px-4 py-3 ${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center w-full">
            <BackButton/> 
            <input value={serchInput} type="search" placeholder="Search..." className={`${settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-800'} w-full py-2 border rounded-lg focus:outline-none focus:border-blue-900`} onChange={searchEngine} />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsProfileModalOpen(true)} style={{ width: userData?.profileImageUrl ? "56px" : "36px", height: userData?.profileImageUrl ? "56px" : "36px", borderRadius: "0.5em", display: "flex", justifyContent: "center", textAlign: "center", verticalAlign: "middle" }} className="p-2">
              {profileImage ? (
                <div className="w-full h-full rounded-full overflow-hidden border-4">
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`rounded-full flex items-center justify-center text-2xl cursor-pointer`} >{avatar}</div>
              )}
            </button>
          </div>
        </header> } 

        <main className="flex-1 overflow-auto p-0 min-h-0">
          <div className="w-full">
            {displayContent}
          </div>
        </main>

        <div className="md:hidden border-t">
          <Sidebar />
        </div>
      </div>

      {isLogoutModalOpen && <ConfirmationModal title="Confirm Logout" message="Are you sure you want to logout from your account?" onConfirm={handleLogout} onCancel={() => setIsLogoutModalOpen(false)} />}
      {isDeleteModalOpen && <ConfirmationModal title="Clear All Data" message="Are you sure you want to delete all saved data (localStorage)?" onConfirm={handleDeleteAll} onCancel={() => setIsDeleteModalOpen(false)} />}
      {isProfileModalOpen && <Profil setAvatar={setAvatar} avatar={avatar} handleLogout={handleLogout} userInfo={userData} modal={setIsProfileModalOpen} settings={settings} setUserInfo={setUserData} />}
    </div>
  );
};

export default Layout;
