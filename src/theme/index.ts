import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Brand greens
  forest: '#15402A',
  forestDeep: '#0F3020',
  forestSoft: '#2A5A3D',
  leaf: '#72B843',
  leafDark: '#5A9A30',
  leafSoft: '#E4F1D6',
  leafMist: '#F0F7E8',

  // Surfaces
  cream: '#F8F4EA',
  creamDeep: '#EFE8D7',
  card: '#FFFFFF',
  line: '#E7E0CF',
  lineSoft: '#F0EBDF',

  // Text
  ink: '#16291D',
  inkSoft: '#4E6355',
  muted: '#8A978D',
  onDark: '#FFFFFF',
  onDarkSoft: '#BFD6C4',

  // Accents
  sun: '#FFD45C',
  sunSoft: '#FFF0C2',
  sunDeep: '#E9B92E',
  tomato: '#E4553F',
  tomatoSoft: '#FCE4DE',
  blush: '#F9D7D0',
  sky: '#DCEBF5',

  overlay: 'rgba(12, 28, 18, 0.55)',
} as const;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/** Horizontal gutter used by every screen. */
export const GUTTER = 20;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40, letterSpacing: -1.2, color: colors.ink },
  h1: { fontFamily: fonts.display, fontSize: 32, lineHeight: 35, letterSpacing: -1, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 25, lineHeight: 29, letterSpacing: -0.6, color: colors.ink },
  h3: { fontFamily: fonts.displayBold, fontSize: 19, lineHeight: 23, letterSpacing: -0.3, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  smallStrong: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17, color: colors.ink },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
} satisfies Record<string, TextStyle>;

export function shadow(level: 1 | 2 | 3 = 1): ViewStyle {
  const presets = {
    1: { opacity: 0.06, radius: 10, y: 3, elevation: 2 },
    2: { opacity: 0.1, radius: 18, y: 8, elevation: 5 },
    3: { opacity: 0.18, radius: 28, y: 14, elevation: 10 },
  }[level];
  if (Platform.OS === 'android') return { elevation: presets.elevation };
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${presets.y}px ${presets.radius}px rgba(29, 53, 36, ${presets.opacity})` };
  }
  return {
    shadowColor: '#1D3524',
    shadowOpacity: presets.opacity,
    shadowRadius: presets.radius,
    shadowOffset: { width: 0, height: presets.y },
  };
}
