import React, { useState, useMemo, useCallback } from 'react';

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
    'web-dev': { name: 'Web Development', color: 'bg-blue-500 hover:bg-blue-600' },
    'android-dev': { name: 'Android Development', color: 'bg-green-500 hover:bg-green-600' },
    'design': { name: 'Design', color: 'bg-purple-500 hover:bg-purple-600' },
  };

const MacAppDownloader = () => {
  const [selectedApps, setSelectedApps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customApps, setCustomApps] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  const allAppsWithCustom = useMemo(() => [...allApps, ...customApps], [customApps]);

  const filteredApps = useMemo(() => {
    return allAppsWithCustom.filter(app => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allAppsWithCustom, searchTerm]);

  const handleAppToggle = useCallback((app) => {
    setSelectedApps(prev =>
      prev.some(a => a.id === app.id) ? prev.filter(a => a.id !== app.id) : [...prev, app]
    );
  }, []);

  const handleStarterPackSelect = useCallback((category) => {
    const packApps = allApps.filter(app => app.categories.includes(category));
    setSelectedApps(prev => {
      const newSelection = [...prev];
      packApps.forEach(app => {
        if (!newSelection.some(a => a.id === app.id)) {
          newSelection.push(app);
        }
      });
      return newSelection;
    });
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


  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-100 to-gray-200 shadow-md rounded-lg overflow-hidden p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Mac App Downloader</h2>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Starter Packs:</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(starterPacks).map(([key, { name, color }]) => (
            <button
              key={key}
              onClick={() => handleStarterPackSelect(key)}
              className={`${color} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search apps or add custom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleCustomAppAdd}
          disabled={isChecking || searchTerm.trim() === ''}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
        >
          {isChecking ? 'Checking...' : 'Add Custom App'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      
      <div className="h-60 overflow-y-auto border rounded p-4 mb-6 bg-white shadow">
        {filteredApps.map(app => (
          <div key={app.id} className="flex items-center mb-2 hover:bg-gray-100 p-2 rounded transition duration-300 ease-in-out">
            <input
              type="checkbox"
              id={app.id}
              checked={selectedApps.some(a => a.id === app.id)}
              onChange={() => handleAppToggle(app)}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={app.id} className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
              {app.name}
            </label>
          </div>
        ))}
      </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Generated Brew Script:</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
          {generateBrewScript()}
        </pre>
      </div>
    
    </div>
  );
};

export default MacAppDownloader;
