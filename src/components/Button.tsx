import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '../lib/haptics';
import { colors, fonts, radius, shadow } from '../theme';

type Variant = 'primary' | 'leaf' | 'light' | 'ghost';

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.forest, fg: colors.sun },
  leaf: { bg: colors.leaf, fg: colors.onDark },
  light: { bg: colors.card, fg: colors.forest, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.forest },
};

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled,
  loading,
  size = 'lg',
  style,
  accessibilityHint,
}: Props) {
  const v = VARIANTS[variant];
  const height = size === 'lg' ? 56 : 44;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { height, backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? 1 : 0 },
        variant === 'primary' || variant === 'leaf' ? shadow(2) : null,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === 'lg' ? 20 : 17} color={v.fg} strokeWidth={2.4} /> : null}
          <Text style={[styles.label, { color: v.fg, fontSize: size === 'lg' ? 17 : 15 }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.extrabold, letterSpacing: -0.2 },
  disabled: { opacity: 0.4 },
});
