// src/contexts/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

// Theme definitions
const themes = {
  light: {
    id: 'light',
    backgroundColor: '#ffffff',
    backgroundSecondary: '#f4f6f8',
    textColor: '#333333',
    textSecondary: '#666666',
    primaryColor: '#4a90e2',
    secondaryColor: '#50e3c2',
    accentColor: '#ff6b6b',
    borderColor: '#e0e0e0',
    buttonText: '#ffffff',
    timelineBackground: '#e9ecef',
    timelineItemBackground: '#d1d8e0',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    navBackground: '#ffffff',
    navColor: '#333333',
    tooltipBackground: '#333333',
    tooltipColor: '#ffffff',
    modalBackground: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    sliderBackground: '#e0e0e0',
    sliderFill: '#4a90e2'
  },
  dark: {
    id: 'dark',
    backgroundColor: '#1e1e1e',
    backgroundSecondary: '#252525',
    textColor: '#e0e0e0',
    textSecondary: '#b0b0b0',
    primaryColor: '#4a90e2',
    secondaryColor: '#50e3c2',
    accentColor: '#ff6b6b',
    borderColor: '#333333',
    buttonText: '#ffffff',
    timelineBackground: '#2a2a2a',
    timelineItemBackground: '#3a3a3a',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    navBackground: '#252525',
    navColor: '#e0e0e0',
    tooltipBackground: '#4a4a4a',
    tooltipColor: '#ffffff',
    modalBackground: '#2a2a2a',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    sliderBackground: '#3a3a3a',
    sliderFill: '#4a90e2'
  }
};

// Create context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children, initialTheme = 'dark' }) => {
  const [theme, setTheme] = useState(themes[initialTheme] || themes.dark);
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => 
      prevTheme.id === 'light' ? themes.dark : themes.light
    );
  };
  
  // Set a specific theme
  const setThemeMode = (mode) => {
    if (themes[mode]) {
      setTheme(themes[mode]);
    }
  };
  
  // Apply theme to document when it changes
  useEffect(() => {
    document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
    document.documentElement.style.setProperty('--background-secondary', theme.backgroundSecondary);
    document.documentElement.style.setProperty('--text-color', theme.textColor);
    document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    document.documentElement.style.setProperty('--border-color', theme.borderColor);
    document.documentElement.style.setProperty('--button-text', theme.buttonText);
    document.documentElement.style.setProperty('--timeline-background', theme.timelineBackground);
    document.documentElement.style.setProperty('--timeline-item-background', theme.timelineItemBackground);
    document.documentElement.style.setProperty('--shadow-color', theme.shadowColor);
    document.documentElement.style.setProperty('--nav-background', theme.navBackground);
    document.documentElement.style.setProperty('--nav-color', theme.navColor);
    document.documentElement.style.setProperty('--tooltip-background', theme.tooltipBackground);
    document.documentElement.style.setProperty('--tooltip-color', theme.tooltipColor);
    document.documentElement.style.setProperty('--modal-background', theme.modalBackground);
    document.documentElement.style.setProperty('--modal-overlay', theme.modalOverlay);
    document.documentElement.style.setProperty('--slider-background', theme.sliderBackground);
    document.documentElement.style.setProperty('--slider-fill', theme.sliderFill);
    
    // Set body class for theme
    document.body.className = theme.id === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 