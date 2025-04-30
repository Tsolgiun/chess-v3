import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { ThemeContextType, ThemeProviderProps, ThemeColors } from '../types';
import { useAuth } from './AuthContext';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default board colors
const DEFAULT_LIGHT_SQUARE = '#ebecd0';
const DEFAULT_DARK_SQUARE = '#779556';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Initialize theme from localStorage or default to false (light mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('isDarkMode');
    return savedTheme && JSON.parse(savedTheme) ? 'dark' : 'light';
  });

  // Initialize board colors from localStorage or defaults
  const [boardColors, setBoardColorsState] = useState<{ lightSquare: string; darkSquare: string }>(() => {
    const savedBoardColors = localStorage.getItem('boardColors');
    if (savedBoardColors) {
      return JSON.parse(savedBoardColors);
    }
    return {
      lightSquare: DEFAULT_LIGHT_SQUARE,
      darkSquare: DEFAULT_DARK_SQUARE
    };
  });

  // Update board colors from user preferences when user data is loaded
  useEffect(() => {
    if (user) {
      const lightSquare = user.boardLightSquare || boardColors.lightSquare;
      const darkSquare = user.boardDarkSquare || boardColors.darkSquare;
      
      setBoardColorsState({
        lightSquare,
        darkSquare
      });
      
      // Also update localStorage
      localStorage.setItem('boardColors', JSON.stringify({
        lightSquare,
        darkSquare
      }));
    }
  }, [user]);

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(theme === 'dark'));
    // Optional: Add a data-theme attribute to the document for potential CSS selectors
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Update localStorage when board colors change
  useEffect(() => {
    localStorage.setItem('boardColors', JSON.stringify(boardColors));
  }, [boardColors]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setBoardColors = useCallback((colors: { lightSquare?: string; darkSquare?: string }) => {
    setBoardColorsState(prev => ({
      lightSquare: colors.lightSquare !== undefined ? colors.lightSquare : prev.lightSquare,
      darkSquare: colors.darkSquare !== undefined ? colors.darkSquare : prev.darkSquare
    }));
  }, []);

  const isDarkMode = theme === 'dark';

  const colors: ThemeColors = isDarkMode ? {
    primary: '#1e1e1e',
    secondary: '#2d2d2d',
    text: '#ffffff',
    border: '#404040',
    background: '#121212',
    accent: '#90caf9',
    moveHighlight: 'rgba(144, 202, 249, 0.4)',
    error: '#f44336',
    success: '#4caf50',
    highlight: '#3a3a3a'
  } : {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    text: '#000000',
    border: '#e0e0e0',
    background: '#f9f9f9',
    accent: '#1976d2',
    moveHighlight: 'rgba(25, 118, 210, 0.2)',
    error: '#d32f2f',
    success: '#388e3c',
    highlight: '#e6e6e6'
  };

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    colors,
    boardColors,
    setBoardColors
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
