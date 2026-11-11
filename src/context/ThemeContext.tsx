import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'tour_theme_mode_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      // Default to dark as per original pilgrimage aesthetic, but honor user preference if saved
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (mode === 'light') {
      root.classList.add('day-mode');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#f8fafc');
      }
    } else {
      root.classList.remove('day-mode');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#0f172a');
      }
    }
  };

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Compact Theme Toggle Button Component
export const ThemeToggle: React.FC<{
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'icon' | 'sidebar';
}> = ({
  className = '',
  showLabel = true,
  variant = 'button',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDay = theme === 'light';

  if (variant === 'sidebar') {
    return (
      <button
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          isDay
            ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20'
            : 'bg-slate-800/80 text-amber-400 border border-slate-700/80 hover:bg-slate-800 hover:text-amber-300'
        } ${className}`}
        title={isDay ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
      >
        <div className="flex items-center gap-2.5 truncate">
          {isDay ? (
            <Sun className="w-4 h-4 text-amber-500 animate-spin-slow flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span className="truncate">{isDay ? 'Day Mode' : 'Night Mode'}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-black/10 dark:bg-white/10">
          {isDay ? 'Light' : 'Dark'}
        </span>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-xl transition-all cursor-pointer border ${
          isDay
            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm'
            : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:text-amber-300'
        } ${className}`}
        title={isDay ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
        aria-label="Toggle theme mode"
      >
        {isDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer shadow-xs ${
        isDay
          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 hover:text-amber-800 border-amber-300'
          : 'bg-slate-800/90 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border-slate-700'
      } ${className}`}
      title={isDay ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
      aria-label="Toggle theme mode"
    >
      {isDay ? (
        <Sun className="w-3.5 h-3.5 text-amber-500" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-amber-400" />
      )}
      {showLabel && (
        <span className="hidden sm:inline font-medium">
          {isDay ? 'Day Mode' : 'Day Mode'}
        </span>
      )}
    </button>
  );
};
