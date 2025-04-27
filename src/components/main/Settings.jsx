import React, { useState, useEffect } from 'react';

function Settings({settings,handleSettingChange}) {
  

  return (
    <div
      className={`p-8 min-h-screen ${
        settings.theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'
      } font-sans leading-relaxed transition-colors duration-300`}
    >
      <h2
        className={`text-3xl font-bold mb-8 text-[${settings.accentColor}] transition-colors duration-300`}
      >
        Settings
      </h2>

      {/* Theme Section */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Theme:</label>
            <select
              className={`w-full p-3 rounded-md border ${
                settings.theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-300'
              } focus:ring-2 focus:ring-${settings.accentColor} transition-colors duration-300`}
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">Font Size:</label>
            <select
              className={`w-full p-3 rounded-md border ${
                settings.theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-300'
              } focus:ring-2 focus:ring-${settings.accentColor} transition-colors duration-300`}
              value={settings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications & Privacy Section */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Notifications & Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              className={`mr-3 w-5 h-5 rounded-md border ${
                settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
              } ${settings.notificationsEnabled ? `bg-[${settings.accentColor}]` : 'bg-transparent'} appearance-none checked:bg-[${settings.accentColor}] focus:ring-2 focus:ring-${settings.accentColor} transition-colors duration-300`}
              checked={settings.notificationsEnabled}
              onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
            />
            <label className="font-medium">Enable Notifications</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              className={`mr-3 w-5 h-5 rounded-md border ${
                settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
              } ${settings.privacyMode ? `bg-[${settings.accentColor}]` : 'bg-transparent'} appearance-none checked:bg-[${settings.accentColor}] focus:ring-2 focus:ring-${settings.accentColor} transition-colors duration-300`}
              checked={settings.privacyMode}
              onChange={(e) => handleSettingChange('privacyMode', e.target.checked)}
            />
            <label className="font-medium">Enable Privacy Mode</label>
          </div>
        </div>
      </section>

      {/* Language & Sound Section */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Language & Sound</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Language:</label>
            <select
              className={`w-full p-3 rounded-md border ${
                settings.theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-300'
              } focus:ring-2 focus:ring-${settings.accentColor} transition-colors duration-300`}
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              className={`mr-3 w-5 h-5 rounded-md border ${
                settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
              } ${settings.soundEnabled ? `bg-[${settings.accentColor}]` : 'bg-transparent'} appearance-none checked:bg-[${settings.accentColor}] focus:ring-2 focus:ring-${settings.accentColor} transition-colors duration-300`}
              checked={settings.soundEnabled}
              onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
            />
            <label className="font-medium">Enable Sound</label>
          </div>
        </div>
      </section>

      {/* Accent Color Section */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Customization</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Accent Color:</label>
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => handleSettingChange('accentColor', e.target.value)}
              className="w-12 h-12 p-0 rounded-md border border-gray-300 cursor-pointer transition-colors duration-300"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Settings;