import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { ThemeMode, getStoredTheme, setStoredTheme, applyTheme } from '../theme';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const initial = getStoredTheme();
    applyTheme(initial);
    return initial;
  });

  const setTheme = useCallback((mode: ThemeMode) => {
    // 1. Instant synchronous DOM update - zero latency, zero frame lag
    applyTheme(mode);
    setStoredTheme(mode);
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      // Instant synchronous DOM update
      applyTheme(next);
      setStoredTheme(next);
      return next;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      isDark: theme === 'dark',
    }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

