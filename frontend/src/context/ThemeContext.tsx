import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { ThemeMode, getStoredTheme, setStoredTheme, applyTheme } from '../theme';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    applyTheme('light');
    return 'light';
  });

  const setTheme = useCallback((_mode: ThemeMode) => {
    applyTheme('light');
    setThemeState('light');
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme('light');
    setThemeState('light');
  }, []);

  const contextValue = useMemo(
    () => ({
      theme: 'light' as ThemeMode,
      toggleTheme,
      setTheme,
      isDark: false,
    }),
    [toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

