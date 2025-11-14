import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'light'
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('json-toolkit-theme');
    return savedTheme || 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Update theme and persist to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('json-toolkit-theme', newTheme);
    // Update document class for CSS variables
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Also set body class for easier CSS targeting
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // Check for system preference on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('json-toolkit-theme');
    if (!savedTheme) {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      localStorage.setItem('json-toolkit-theme', initialTheme);
    }
  }, []);

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

