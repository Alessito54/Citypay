export interface ColorPalette {
  bg: string;
  white: string;
  blue: string;
  blueMid: string;
  blueIcon: string;
  blueSoft: string;
  blueChip: string;
  blueChipText: string;
  navy: string;
  text1: string;
  text2: string;
  text3: string;
  border: string;
  inputBorder: string;
  divider: string;
  screen: string;
  sheetHandle: string;
  overlay: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  disabledBg: string;
  disabledText: string;
}

/**
 * Paleta clara (WCAG AA ≥ 4.5:1 en textos sobre blanco y sobre `bg`).
 */
export const LIGHT_COLORS: ColorPalette = {
  bg: '#E8F0FD',
  white: '#FFFFFF',
  blue: '#1B3FA0',
  blueMid: '#2F5FC4',
  blueIcon: '#D6E4FA',
  blueSoft: '#EEF4FF',
  blueChip: '#E0EAFF',
  blueChipText: '#2D5BC7',
  navy: '#12296B',
  text1: '#0F172A',
  text2: '#526073',
  text3: '#4F5B6E',
  border: '#D0DDF5',
  inputBorder: '#8A9BBF',
  divider: '#F1F5F9',
  screen: '#F5F7FA',
  sheetHandle: '#E8ECF2',
  overlay: 'rgba(26,26,46,0.5)',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  success: '#166534',
  successSoft: '#ECFDF3',
  disabledBg: '#E2E8F0',
  disabledText: '#4F5B6E',
};

/**
 * Paleta oscura (alto contraste azul pizarra para descanso visual nocturno).
 */
export const DARK_COLORS: ColorPalette = {
  bg: '#0B1220',
  white: '#131E33',
  blue: '#60A5FA',
  blueMid: '#93C5FD',
  blueIcon: '#1B2E4F',
  blueSoft: '#162540',
  blueChip: '#1E3356',
  blueChipText: '#93C5FD',
  navy: '#E2E8F0',
  text1: '#F1F5F9',
  text2: '#CBD5E1',
  text3: '#94A3B8',
  border: '#24344F',
  inputBorder: '#3B5278',
  divider: '#1D2B44',
  screen: '#0F172A',
  sheetHandle: '#334155',
  overlay: 'rgba(2,6,23,0.72)',
  danger: '#FCA5A5',
  dangerSoft: '#3B1419',
  success: '#86EFAC',
  successSoft: '#0F2E1E',
  disabledBg: '#1E293B',
  disabledText: '#64748B',
};

/** Paleta activa sincronizada por ThemeProvider. */
export const C: ColorPalette = { ...LIGHT_COLORS };

export function applyThemePalette(dark: boolean): void {
  Object.assign(C, dark ? DARK_COLORS : LIGHT_COLORS);
}

/**
 * Shape: the visual language is square. Every surface (cards, buttons, inputs, chips,
 * sheets, avatars, badges) uses this radius, so the look is changed in one place.
 */
export const RADIUS = 0;

/** Accent bar used instead of rounded "pill" highlights to mark the selected option. */
export const ACCENT_BAR = 4;

/** Minimum touch target (iOS HIG 44pt; Android recommends 48dp). */
export const TOUCH = 44;

export const FONT = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  displayBold: 'PlusJakartaSans_700Bold',
  displayXBold: 'PlusJakartaSans_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;
