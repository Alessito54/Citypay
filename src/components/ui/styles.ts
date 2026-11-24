import { C, RADIUS } from '@/constants/colors';

/** Flat, square elevation shared by cards and bars. */
export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;

/** Base surface for any card or grouped list. */
export const surface = {
  backgroundColor: C.white,
  borderRadius: RADIUS,
  borderWidth: 1,
  borderColor: C.border,
} as const;
