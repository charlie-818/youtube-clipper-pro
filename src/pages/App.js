// src/App.js - Main React Application Component

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Dashboard from './Dashboard';
import Editor from './Editor';
import Settings from './pages/Settings';
import ProjectLibrary from './pages/ProjectLibrary';
import AssetLibrary from './pages/AssetLibrary';
import LoadingIndicator from './components/LoadingIndicator';

// Import contexts
import { ThemeProvider } from '../context/ThemeContext';
import { ProjectProvider } from './contexts/ProjectContext';

// Import services
import { ipcRenderer } from 'electron';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme === 'dark' ? '#1E1E1E' : '#f5f5f5'};
  color: ${props => props.theme === 'dark' ? '#E0E0E0' : '#333'};
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  overflow: auto;
  padding: 20px;
`;

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 5,
    defaultExportFormat: 'mp4',
    defaultResolution: '1080p',
    hardwareAcceleration: true,
    customShortcuts: {}
  });
  
  // Load user preferences on startup
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        if (window.api && window.api.getPreferences) {
          const prefs = await window.api.getPreferences();
          setPreferences(prefs);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        toast.error('Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Set up global loading indicator
  useEffect(() => {
    const handleStartLoading = () => setIsLoading(true);
    const handleStopLoading = () => setIsLoading(false);
    
    window.addEventListener('start-loading', handleStartLoading);
    window.addEventListener('stop-loading', handleStopLoading);
    
    return () => {
      window.removeEventListener('start-loading', handleStartLoading);
      window.removeEventListener('stop-loading', handleStopLoading);
    };
  }, []);
  
  // Set up IPC listeners for background processes
  useEffect(() => {
    const handleExportProgress = (event, progress) => {
      console.log(`Export progress: ${progress}%`);
      // Update UI with progress information
    };
    
    ipcRenderer.on('export-progress', handleExportProgress);
    
    return () => {
      ipcRenderer.removeListener('export-progress', handleExportProgress);
    };
  }, []);
  
  const savePreferences = async (newPreferences) => {
    try {
      if (window.api && window.api.savePreferences) {
        await window.api.savePreferences(newPreferences);
        setPreferences(newPreferences);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="loading">
        <h2>YouTube Clipper Pro</h2>
        <p>Loading application...</p>
      </div>
    );
  }
  
  return (
    <ThemeProvider theme={preferences.theme} setTheme={(theme) => savePreferences({...preferences, theme})}>
      <ProjectProvider>
        <AppContainer theme={preferences.theme}>
          <Navbar />
          <ContentContainer>
            <Sidebar />
            <MainContent>
              <Router>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/editor/:projectId" element={<Editor />} />
                  <Route path="/editor" element={<Editor />} />
                  <Route path="/projects" element={<ProjectLibrary />} />
                  <Route path="/assets" element={<AssetLibrary />} />
                  <Route path="/settings" element={<Settings preferences={preferences} setPreferences={setPreferences} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </MainContent>
          </ContentContainer>
          <ToastContainer position="bottom-right" />
        </AppContainer>
      </ProjectProvider>
    </ThemeProvider>
  );
};

export default App;