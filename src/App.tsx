import { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { SettingsPage } from './components/SettingsPage';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SettingsProvider>
      <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-pink-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        <HomeScreen />
        <SettingsPage open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </SettingsProvider>
  );
}

export default App;
