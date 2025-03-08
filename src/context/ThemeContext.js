import React, { createContext, useContext, useState } from 'react';

// Create context with default value
const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {}
});

// Theme provider component
export function ThemeProvider({ children, theme = 'dark', setTheme }) {
  const contextValue = {
    theme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 