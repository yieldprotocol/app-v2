import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { Settings } from '../contexts/types/settings';

export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const {
    settingsState: { autoTheme, darkMode },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    const hasStoredDarkMode = storedDarkMode !== null;
    if (hasStoredDarkMode) {
      updateSetting(Settings.DARK_MODE, storedDarkMode === 'true');
    } else if (autoTheme && typeof window !== 'undefined') {
      // set initial dark mode
      updateSetting(Settings.DARK_MODE, window.matchMedia('(prefers-color-scheme: dark)').matches);
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newDarkMode = e.matches;
        updateSetting(Settings.DARK_MODE, newDarkMode);
        autoTheme && setColorScheme(newDarkMode ? 'dark' : 'light');
      });

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newColorScheme = e.matches ? 'dark' : 'light';
        autoTheme && setColorScheme(newColorScheme);
      });
    } else {
      updateSetting(Settings.DARK_MODE, false);
    }
  }, [autoTheme]);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    const hasStoredDarkMode = storedDarkMode !== null;
    if (hasStoredDarkMode) {
      setColorScheme(storedDarkMode === 'true' ? 'dark' : 'light');
    } else {
      setColorScheme(darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

  return colorScheme;
};
