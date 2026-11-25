import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { applyThemePalette, DARK_COLORS, LIGHT_COLORS, type ColorPalette } from '@/constants/colors';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'citypay:theme-mode';

async function loadSavedMode(): Promise<ThemeMode | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? typeof window !== 'undefined'
          ? window.localStorage.getItem(STORAGE_KEY)
          : null
        : await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return null;
  } catch {
    return null;
  }
}

async function persistMode(mode: ThemeMode): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, mode);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    }
  } catch {
    // No-op
  }
}

interface ThemeContextValue {
  mode: ThemeMode;
  dark: boolean;
  colors: ColorPalette;
  setMode: (mode: ThemeMode) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  dark: false,
  colors: LIGHT_COLORS,
  setMode: () => {},
  toggleDark: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    let alive = true;
    loadSavedMode().then((saved) => {
      if (alive && saved) setModeState(saved);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = dark ? DARK_COLORS : LIGHT_COLORS;

  // Sincroniza el objeto global `C` de inmediato antes de renderizar hijos
  applyThemePalette(dark);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void persistMode(next);
  }, []);

  const toggleDark = useCallback(() => {
    setModeState((prev) => {
      const currentDark = prev === 'dark' || (prev === 'system' && systemScheme === 'dark');
      const next: ThemeMode = currentDark ? 'light' : 'dark';
      void persistMode(next);
      return next;
    });
  }, [systemScheme]);

  const value = useMemo(
    () => ({ mode, dark, colors, setMode, toggleDark }),
    [mode, dark, colors, setMode, toggleDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
