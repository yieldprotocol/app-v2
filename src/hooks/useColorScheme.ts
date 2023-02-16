import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

/* Hook for using a color scheme provided by user autotheme or darkMode settings */
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const {
    settingsState: { autoTheme, darkMode },
  } = useContext(SettingsContext);

  useEffect(() => {
    if (autoTheme && typeof window !== 'undefined') {
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? setColorScheme('dark')
        : setColorScheme('light');

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newColorScheme = e.matches ? 'dark' : 'light';
        autoTheme && setColorScheme(newColorScheme);
      });
    } else {
      setColorScheme(darkMode ? 'dark' : 'light' || 'light');
    }
  }, [autoTheme, darkMode]);

  return colorScheme;
};
