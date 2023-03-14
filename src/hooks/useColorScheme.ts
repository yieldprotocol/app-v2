import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { Settings } from '../contexts/types/settings';

export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const {
    settingsState: { darkMode },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    const hasStoredDarkMode = storedDarkMode !== null;
    if (hasStoredDarkMode) {
      updateSetting(Settings.DARK_MODE, storedDarkMode === 'true');
      setColorScheme(storedDarkMode === 'true' ? 'dark' : 'light');
    } else if (typeof window !== 'undefined') {
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateSetting(Settings.DARK_MODE, systemDarkMode);
      setColorScheme(systemDarkMode ? 'dark' : 'light');

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newDarkMode = e.matches;
        updateSetting(Settings.DARK_MODE, newDarkMode);
        setColorScheme(newDarkMode ? 'dark' : 'light');
      });
    } else {
      updateSetting(Settings.DARK_MODE, false);
      setColorScheme('light');
    }
  }, []);

  useEffect(() => {
    setColorScheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return colorScheme;
};
