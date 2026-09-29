import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '../lib/haptics';
import { colors, shadow } from '../theme';

type Tone = 'soft' | 'white' | 'dark' | 'forest';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  soft: { bg: colors.leafSoft, fg: colors.leafDark },
  white: { bg: colors.card, fg: colors.forest },
  dark: { bg: 'rgba(15, 30, 20, 0.42)', fg: colors.onDark },
  forest: { bg: colors.forest, fg: colors.onDark },
};

interface Props {
  icon: LucideIcon;
  onPress?: () => void;
  label: string;
  tone?: Tone;
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
}

export function IconButton({ icon: Icon, onPress, label, tone = 'soft', size = 42, style, iconColor }: Props) {
  const t = TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg },
        tone === 'white' && shadow(1),
        pressed && { transform: [{ scale: 0.94 }] },
        style,
      ]}
    >
      <Icon size={size * 0.46} color={iconColor ?? t.fg} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
