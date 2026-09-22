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
  const themeRef = React.useRef(theme);
  themeRef.current = theme;

  const setTheme = useCallback((mode: ThemeMode) => {
    themeRef.current = mode;
    applyTheme(mode);
    setStoredTheme(mode);
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = themeRef.current === 'dark' ? 'light' : 'dark';
    themeRef.current = next;
    applyTheme(next);
    setStoredTheme(next);
    setThemeState(next);
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

