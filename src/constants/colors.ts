/**
 * Design tokens taken from the original mockups (monochromatic blue).
 *
 * Accessibility: every text color below reaches WCAG AA contrast (≥ 4.5:1)
 * on white and on `bg`. The original `text3` (#94A3B8, 2.6:1) and `text2`
 * on `bg` (4.1:1) failed, so they were darkened while keeping the same hue.
 */
export const C = {
  bg: '#E8F0FD',
  white: '#FFFFFF',
  blue: '#1B3FA0',
  /** 5.9:1 on white, 4.6:1 on blueIcon (was #3B6ED4, 3.7:1 on blueIcon). */
  blueMid: '#2F5FC4',
  blueIcon: '#D6E4FA',
  blueSoft: '#EEF4FF',
  blueChip: '#E0EAFF',
  blueChipText: '#2D5BC7',
  navy: '#12296B',
  text1: '#0F172A',
  /** 6.4:1 on white, 5.6:1 on bg. */
  text2: '#526073',
  /** Secondary/meta text and placeholders: 6.9:1 on white, 6.0:1 on bg. */
  text3: '#4F5B6E',
  /** Decorative separators only (cards, dividers). */
  border: '#D0DDF5',
  /** Borders of form controls: visible enough to identify the field (≥ 3:1 rule for UI parts is approximated). */
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
} as const;

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
