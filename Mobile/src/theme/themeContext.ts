/**
 * Contexto centralizado de temas
 * Soluciona: Vars Hardcodeadas y Prop Drilling
 */
import { createContext, useContext } from 'react';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  label: string;
  border: string;
  primary: string;
  gold: string;
  error: string;
}

export const LIGHT_THEME: ThemeColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1E293B',
  label: '#64748B',
  border: '#E2E8F0',
  primary: '#00284D',
  gold: '#C5A059',
  error: '#DC2626',
};

export const DARK_THEME: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F1F5F9',
  label: '#94A3B8',
  border: '#334155',
  primary: '#00284D',
  gold: '#C5A059',
  error: '#DC2626',
};

interface ThemeContextType {
  colors: ThemeColors;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext debe usarse dentro de un ThemeProvider');
  }
  return context;
};
