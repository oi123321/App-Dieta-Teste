import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts } from '../theme';

export function SprigMark({ size = 24, color = colors.leaf }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M32 61 C31 49 33 37 32 25" stroke={color} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <Path d="M32 27 C23.5 21 22.5 9 32 2 C41.5 9 40.5 21 32 27 Z" fill={color} />
      <Path d="M31 38 C21.5 40 12.5 34.5 9.5 25 C20 23 28.5 28.5 31 38 Z" fill={color} />
      <Path d="M33 45 C42.5 47 51.5 41.5 54.5 32 C44 30 35.5 35.5 33 45 Z" fill={color} />
    </Svg>
  );
}

export function Logo({
  tone = 'onDark',
  size = 28,
  style,
}: {
  tone?: 'onDark' | 'onLight';
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const textColor = tone === 'onDark' ? colors.onDark : colors.forest;
  return (
    <View style={[styles.row, style]} accessibilityRole="header" accessibilityLabel="salsa">
      <SprigMark size={size * 0.95} color={colors.leaf} />
      <Text style={[styles.word, { color: textColor, fontSize: size, lineHeight: size * 1.1 }]}>salsa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  word: { fontFamily: fonts.display, letterSpacing: -1 },
});
