import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from '../../firebase-config'; // Adjust the path

function Profile({ handleLogout, modal, settings, userInfo, setUserInfo }) {
    const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
    const [avatar, setAvatar] = useState(userInfo?.avatar || "👤");
    const [profileImage, setProfileImage] = useState(userInfo?.profileImageUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const sensitiveFields = ['for','role', 'lastVisit', "u_validation", "id", "role", "token", "access"];
    const [showPassword, setShowPassword] = useState(false); // State to manage password visibility

    // Initialize editFormData with default values
    const [editFormData, setEditFormData] = useState({});

    useEffect(() => {
        if (userInfo) {
            // Reset form data when userInfo changes
            const formData = Object.keys(userInfo).reduce((acc, key) => {
                if (!sensitiveFields.includes(key)) {
                    acc[key] = userInfo[key] || ""; // Use empty string if null or undefined
                }
                return acc;
            }, {});
            setEditFormData(formData);
            setAvatar(userInfo.avatar || "👤");
            setProfileImage(userInfo.profileImageUrl || null);
        }
    }, [userInfo]);

    const oppositeTheme = settings?.theme !== 'dark' ? 'dark' : 'light';

    const styles = {
        modalBackground: oppositeTheme === 'dark' ? 'bg-black bg-opacity-50' : 'bg-white bg-opacity-50',
        modalContent: oppositeTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800',
        header: oppositeTheme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700',
        button: oppositeTheme === 'dark' ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700',
        logoutButton: oppositeTheme === 'dark' ? 'border-red-500 text-red-400 hover:bg-red-900' : 'border-red-300 text-red-600 hover:bg-red-50',
        text: oppositeTheme === 'dark' ? 'text-gray-300' : 'text-gray-700',
        secondaryText: oppositeTheme === 'dark' ? 'text-gray-400' : 'text-gray-500',
        profilePictureBtn: oppositeTheme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        errorText: 'text-red-500',
        successText: 'text-green-500'
    };

    // Prepare user data for display
    const userData = userInfo ? {
        name: userInfo.username || "User",
        email: userInfo.email || "No email provided",
        role: `Access Control - ${userInfo.access || "User"}`,
        lastLogin: userInfo.lastVisit || "Never"
    } : {};

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAvatarChange = (newAvatar) => {
        setAvatar(newAvatar);
        setEditFormData(prev => ({
            ...prev,
            avatar: newAvatar
        }));
    };

    // Compress image and convert it to a base64 string
    const compressImage = (file, quality = 0.5) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set canvas dimensions
                    const maxWidth = 200; // Adjust as needed
                    const maxHeight = 200; // Adjust as needed
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw the image on the canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert the canvas to a base64 string
                    const base64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(base64);
                };

                img.onerror = (error) => reject(error);
            };

            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !userInfo?.id) return;

        try {
            setIsUploading(true);
            const compressedImage = await compressImage(file, 0.5); // Adjust quality as needed
            setProfileImage(compressedImage);
            setEditFormData(prev => ({
                ...prev,
                profileImageUrl: compressedImage
            }));
            setIsUploading(false);
        } catch (error) {
            console.error("Error compressing or uploading file:", error);
            setIsUploading(false);
            setUpdateError("Failed to process image. Please try again.");
        }
    };

    // Validate phone number (must be exactly 10 digits)
    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    };

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!userInfo?.id && !userInfo?.email) {
            setUpdateError("User ID or email is missing");
            return;
        }

        // Validate phone number
        if (editFormData.phone && !validatePhoneNumber(editFormData.phone)) {
            setUpdateError("Phone number must be exactly 10 digits.");
            return;
        }

        // Validate email
        if (editFormData.email && !validateEmail(editFormData.email)) {
            setUpdateError("Invalid email format.");
            return;
        }

        setUpdateError(null);
        setUpdateSuccess(false);
        
        try {
            // Update with new data including avatar and profile image
            const updatedData = {
                ...editFormData,
                avatar: avatar,
                profileImageUrl: profileImage
            };
            
            // Use email as document ID if it's the same
            const docId = userInfo.email || userInfo.id;
            const newDocId = updatedData.email || docId;

            // If email is updated, update the document ID
            if (newDocId !== docId) {
                // Create a new document with the updated email as the ID
                const newUserRef = doc(db, "myConsole_users", newDocId);
                await setDoc(newUserRef, updatedData);

                // Delete the old document
                const oldUserRef = doc(db, "myConsole_users", docId);
                await deleteDoc(oldUserRef);
            } else {
                // Update the existing document
                const userRef = doc(db, "myConsole_users", docId);
                await updateDoc(userRef, updatedData);
            }
            
            // Update local state
            setUserInfo({
                ...userInfo,
                ...updatedData
            });
            
            console.log("Profile updated successfully!");
            setUpdateSuccess(true);
            
            // Close the popup after a short delay to show success message
            setTimeout(() => {
                setIsEditPopupOpen(false);
                setUpdateSuccess(false);
            }, 1500);
        } catch (error) {
            console.error("Error updating profile:", error);
            setUpdateError("Failed to update profile. Please try again.");
        }
    };

    // Handle background click to prevent closing when clicking inside the modal
    const handleBackgroundClick = (e) => {
        // Only close if the click was directly on the background div
        if (e.target === e.currentTarget) {
            modal(false);
        }
    };

    // Show loading if userInfo is not yet available
    if (!userInfo) {
        return <div className="flex items-center justify-center h-full">Loading user data...</div>;
    }

    return (
        <>
            {/* Profile Modal */}
            <div 
                className={`fixed inset-0 ${styles.modalBackground} flex items-center justify-center z-50`}
                onClick={handleBackgroundClick}
            >
                <div 
                    id="profile-modal" 
                    className={`rounded-lg shadow-xl w-96 overflow-hidden ${styles.modalContent}`}
                    onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the background
                >
                    <div className={`p-4 border-b ${styles.header} flex justify-between items-center`}>
                        <h2 className="text-xl font-semibold">User Profile</h2>
                        <button 
                            onClick={() => modal(false)}
                            className={`text-gray-500 hover:text-gray-700 ${styles.text}`}
                            aria-label="Close"
                        >
                            ✖
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col items-center mb-6">
                            {/* Profile Image or Avatar Display */}
                            <div className="mb-3 relative">
                                {profileImage ? (
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
                                        <img 
                                            src={profileImage} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div 
                                        className={`w-24 h-24 ${styles.header} rounded-full flex items-center justify-center text-4xl cursor-pointer`}
                                        onClick={() => handleAvatarChange(["😊","👳‍♂️","👮‍♀️","🎅","🤶","🧓","👤","👨", "👩", "👧", "👦", "👴", "👵"][Math.floor(Math.random() * 13)])}
                                    >
                                        {avatar}
                                    </div>
                                )}
                                
                                {/* Change profile picture button */}
                                <button 
                                    className={`absolute bottom-0 right-0 p-2 rounded-full ${styles.profilePictureBtn}`}
                                    onClick={() => document.getElementById('profile-pic-upload').click()}
                                >
                                    📷
                                </button>
                                <input 
                                    type="file" 
                                    id="profile-pic-upload" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <h3 className={`text-xl font-semibold ${styles.text}`}>{userData.name}</h3>
                            <p className={styles.secondaryText}>{userData.role}</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="border-t pt-4">
                                <p className={`text-sm font-medium ${styles.secondaryText}`}>Email</p>
                                <p className={styles.text}>{userData.email}</p>
                            </div>
                            
                            <div>
                                <p className={`text-sm font-medium ${styles.secondaryText}`}>Last Login</p>
                                <p className={styles.text}>{userData.lastLogin}</p>
                            </div>
                        </div>
                        
                        <div className="mt-8 space-y-3">
                            <button 
                                className={`w-full px-4 py-2 ${styles.button} rounded-md transition-colors`}
                                onClick={() => setIsEditPopupOpen(true)}
                            >
                                Edit Profile
                            </button>
                            <button 
                                className={`w-full px-4 py-2 border ${styles.logoutButton} rounded-md transition-colors`}
                                onClick={() => {
                                    handleLogout();
                                    modal(false);
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Popup */}
            {isEditPopupOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => {
                        // Only close if clicking directly on the background
                        if (e.target === e.currentTarget) {
                            setIsEditPopupOpen(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl w-96 p-6"
                        onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the background
                    >
                        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
                        
                        {/* Error/Success messages */}
                        {updateError && (
                            <div className={`p-2 mb-4 bg-red-100 border border-red-300 rounded ${styles.errorText}`}>
                                {updateError}
                            </div>
                        )}
                        
                        {updateSuccess && (
                            <div className={`p-2 mb-4 bg-green-100 border border-green-300 rounded ${styles.successText}`}>
                                Profile updated successfully!
                            </div>
                        )}
                        
                        {/* Profile Picture/Avatar Selection */}
                        <div className="mb-6 flex flex-col items-center">
                            {profileImage ? (
                                <div className="relative mb-3">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500">
                                        <img 
                                            src={profileImage} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent event bubbling
                                            setProfileImage(null);
                                            setEditFormData(prev => ({...prev, profileImageUrl: null}));
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                        title="Remove image"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="w-20 h-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-4xl mb-3 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent event bubbling
                                        handleAvatarChange(["😊","👳‍♂️","👮‍♀️","🎅","🤶","🧓","👤","👨", "👩", "👧", "👦", "👴", "👵"][Math.floor(Math.random() * 13)])
                                    }}
                                >
                                    {avatar}
                                </div>
                            )}
                            
                            <div className="flex space-x-2">
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent event bubbling
                                        document.getElementById('edit-profile-pic').click();
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                                </button>
                                {!profileImage && (
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent event bubbling
                                            handleAvatarChange(["😊","👳‍♂️","👮‍♀️","🎅","🤶","🧓","👤","👨", "👩", "👧", "👦", "👴", "👵"][Math.floor(Math.random() * 13)]);
                                        }}
                                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
                                    >
                                        Random Avatar
                                    </button>
                                )}
                                <input 
                                    type="file" 
                                    id="edit-profile-pic" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    onClick={(e) => e.stopPropagation()} // Prevent event bubbling
                                />
                            </div>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault(); // Prevent form from submitting normally
                            e.stopPropagation(); // Prevent event bubbling
                            handleSave(e);
                        }}>
                            
                            <>
                                {Object.entries(editFormData).map(([key, value]) => { 
                                    // Skip avatar and profileImageUrl as they're handled separately
                                    if (key === 'avatar' || key === 'profileImageUrl') return null;
                            
                                    return (
                                        <div key={key} className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                        <div className="relative">
                                            <input
                                            type={key === 'password' && !showPassword ? 'password' : 'text'} // Toggle password visibility
                                            name={key}
                                            value={value || ''}
                                            onChange={handleInputChange}
                                            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
                                            disabled={sensitiveFields.includes(key)}
                                            className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                                                sensitiveFields.includes(key) ? 'bg-gray-100' : ''
                                            }`}
                                            />
                                            {key === 'password' && ( // Add toggle button for password field
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                            >
                                                {showPassword ? (
                                                <span className="text-gray-500">👁️</span> // Icon for visible password
                                                ) : (
                                                <span className="text-gray-500">👁️‍🗨️</span> // Icon for hidden password
                                                )}
                                            </button>
                                            )}
                                        </div>
                                        </div>
                                    );
                                })}
                            </>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent event bubbling
                                        setIsEditPopupOpen(false);
                                    }}
                                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Uploading...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Profile;

