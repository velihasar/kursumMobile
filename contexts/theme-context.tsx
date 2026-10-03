import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { ThemeType } from '@/constants/theme';

const THEME_KEY = '@kursum_app_theme';

interface ThemeContextType {
  theme: ThemeType;
  palette: typeof Colors.light;
  isDark: boolean;
  setTheme: (t: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  palette: Colors.dark,
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
        }
      } catch {}
    })();
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    AsyncStorage.setItem(THEME_KEY, newTheme).catch(() => {});
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const palette = theme === 'dark' ? Colors.dark : Colors.light;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, palette, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
