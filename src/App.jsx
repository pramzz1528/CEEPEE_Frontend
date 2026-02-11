import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from './components/Layout/Sidebar';
import RoomGallery from './components/RoomGallery';
// import BottomBar from './components/Layout/BottomBar';
import Visualizer from './components/Visualizer/Visualizer';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/Auth/LoginPage';
import './components/Layout/Layout.css';

import HomePage from './components/HomePage';


function App() {
  const [view, setView] = useState('login'); // login | splash | home | app
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setView('splash');
  };

  const handleSplashFinish = () => {
    setView('home');
  };

  const handleStartApp = () => {
    setView('gallery');
  };

  return (
    <StoreProvider>
      <div className="app-container">
        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoginPage onLogin={handleLogin} />
            </motion.div>
          )}

          {view === 'splash' && (
            <SplashScreen key="splash" onFinish={handleSplashFinish} />
          )}

          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
            >
              <HomePage onStart={handleStartApp} />
            </motion.div>
          )}

          {view === 'gallery' && (
            <div key="gallery" className="app-layout">
              <RoomGallery onSelect={() => setView('app')} />
            </div>
          )}

          {view === 'app' && (
            <div key="app" className="app-layout zoom-content">
              <Sidebar onBack={() => setView('gallery')} />
              {/* TopBar removed as per user request */}
              <main className="main-content">
                <Visualizer />
                {/* <BottomBar /> */}
              </main>
            </div>
          )}
        </AnimatePresence>
      </div>
    </StoreProvider>
  );
}

export default App;
