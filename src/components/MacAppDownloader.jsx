import React, { useState, useMemo, useCallback } from 'react';
import { Search, Download, Package, Sun, Moon } from 'lucide-react';

const allApps = [
  { id: 'chrome', name: 'Google Chrome', brewCask: 'google-chrome', categories: ['web-dev', 'android-dev', 'design'] },
  { id: 'firefox', name: 'Mozilla Firefox', brewCask: 'firefox', categories: ['web-dev'] },
  { id: 'vscode', name: 'Visual Studio Code', brewCask: 'visual-studio-code', categories: ['web-dev', 'android-dev'] },
  { id: 'sublime-text', name: 'Sublime Text', brewCask: 'sublime-text', categories: ['web-dev'] },
  { id: 'postman', name: 'Postman', brewCask: 'postman', categories: ['web-dev', 'android-dev'] },
  { id: 'nodejs', name: 'Node.js', brewCask: 'node', categories: ['web-dev'] },
  { id: 'docker', name: 'Docker', brewCask: 'docker', categories: ['web-dev', 'android-dev'] },
  { id: 'android-studio', name: 'Android Studio', brewCask: 'android-studio', categories: ['android-dev'] },
  { id: 'android-sdk', name: 'Android SDK', brewCask: 'android-sdk', categories: ['android-dev'] },
  { id: 'java', name: 'Java SDK', brewCask: 'java', categories: ['android-dev'] },
  { id: 'sketch', name: 'Sketch', brewCask: 'sketch', categories: ['design'] },
  { id: 'figma', name: 'Figma', brewCask: 'figma', categories: ['design'] },
  { id: 'adobe-creative-cloud', name: 'Adobe Creative Cloud', brewCask: 'adobe-creative-cloud', categories: ['design'] },
  { id: 'gimp', name: 'GIMP', brewCask: 'gimp', categories: ['design'] },
  { id: 'blender', name: 'Blender', brewCask: 'blender', categories: ['design'] },
];

const starterPacks = {
  'web-dev': { name: 'Web Development', color: 'bg-blue-500' },
  'android-dev': { name: 'Android Development', color: 'bg-green-500' },
  'design': { name: 'Design', color: 'bg-purple-500' },
};

const MacAppDownloader = () => {
  const [selectedApps, setSelectedApps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customApps, setCustomApps] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [activeStarterPacks, setActiveStarterPacks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const allAppsWithCustom = useMemo(() => [...allApps, ...customApps], [customApps]);


  const filteredApps = useMemo(() => {
    return allAppsWithCustom.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeStarterPacks.length === 0 || app.categories.some(cat => activeStarterPacks.includes(cat)))
    );
  }, [allAppsWithCustom, searchTerm, activeStarterPacks]);

  const handleAppToggle = useCallback((app) => {
    setSelectedApps(prev =>
      prev.some(a => a.id === app.id) ? prev.filter(a => a.id !== app.id) : [...prev, app]
    );
  }, []);

  const handleStarterPackToggle = useCallback((category) => {
    setActiveStarterPacks(prev =>
      prev.includes(category) ? prev.filter(cat => cat !== category) : [...prev, category]
    );
  }, []);

  const checkHomebrewCask = useCallback(async (caskName) => {
    setIsChecking(true);
    setError('');
    try {
      const response = await fetch(`https://formulae.brew.sh/api/cask/${caskName}.json`);
      if (!response.ok) {
        throw new Error('Cask not found');
      }
      const data = await response.json();
      return { exists: true, name: data.name };
    } catch (error) {
      console.error('Error checking cask:', error);
      setError(`The cask "${caskName}" does not exist in Homebrew.`);
      return { exists: false };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleCustomAppAdd = useCallback(async () => {
    if (searchTerm.trim() === '') return;

    const caskName = searchTerm.toLowerCase().replace(/\s+/g, '-');

    if (allAppsWithCustom.some(app => app.brewCask === caskName)) {
      setError('This app is already in the list.');
      return;
    }

    const result = await checkHomebrewCask(caskName);
    if (result.exists) {
      const newApp = {
        id: caskName,
        name: result.name || searchTerm,
        brewCask: caskName,
        categories: []
      };
      setCustomApps(prev => [...prev, newApp]);
      setSelectedApps(prev => [...prev, newApp]);
      setSearchTerm('');
    }
  }, [searchTerm, allAppsWithCustom, checkHomebrewCask]);

  const generateBrewScript = useCallback(() => {
    const installScript = selectedApps.map(app => `brew install --cask ${app.brewCask}`).join('\n');
    return `
#!/bin/bash

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew is not installed. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "Homebrew is already installed."
fi

# Ensure Homebrew is in the PATH
eval "$(/opt/homebrew/bin/brew shellenv)"

# Update Homebrew
echo "Updating Homebrew..."
brew update

# Install selected apps
echo "Installing selected applications..."
${installScript}

echo "All selected apps have been installed."`;
  }, [selectedApps]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100'}`}>
      {/* Left Column: Search and App Selection */}
      <div className={`w-1/2 p-6 overflow-y-auto ${darkMode ? 'bg-gray-800' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mac App Downloader</h2>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-200 text-gray-900'}`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Starter Packs</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(starterPacks).map(([key, { name, color }]) => (
              <button
                key={key}
                onClick={() => handleStarterPackToggle(key)}
                className={`${color} ${activeStarterPacks.includes(key) ? 'opacity-100' : 'opacity-50'} text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search apps or add custom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-3 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleCustomAppAdd}
            disabled={isChecking || searchTerm.trim() === ''}
            className={`mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out ${darkMode ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {isChecking ? 'Checking...' : 'Add Custom App'}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        <div className="space-y-2">
          {filteredApps.map(app => (
            <div key={app.id} className={`flex items-center p-3 rounded-lg shadow-sm hover:shadow-md transition duration-300 ease-in-out ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'}`}>
              <input
                type="checkbox"
                id={app.id}
                checked={selectedApps.some(a => a.id === app.id)}
                onChange={() => handleAppToggle(app)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={app.id} className={`ml-3 block text-sm font-medium cursor-pointer ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {app.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Generated Script */}
      <div className={`w-1/2 p-6 shadow-lg overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-2xl font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Package className="mr-2" size={24} />
          Generated Brew Script
        </h3>
        <pre className={`p-4 rounded-lg overflow-x-auto text-sm ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
          {generateBrewScript()}
        </pre>
        <button
          className={`mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
        >
          <Download className="mr-2" size={20} />
          Download Script
        </button>
      </div>
    </div>
  );
};

export default MacAppDownloader;