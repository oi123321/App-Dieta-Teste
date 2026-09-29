import { Minus, Plus } from './icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptics } from '../lib/haptics';
import { colors, fonts } from '../theme';

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label: string;
  size?: 'md' | 'lg';
  format?: (value: number) => string;
}

export function Stepper({ value, min = 1, max = 12, onChange, label, size = 'md', format }: Props) {
  const big = size === 'lg';
  const btn = big ? 52 : 36;
  const change = (next: number) => {
    if (next < min || next > max) return;
    haptics.select();
    onChange(next);
  };
  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${label}`}
        onPress={() => change(value - 1)}
        disabled={value <= min}
        style={({ pressed }) => [
          styles.btn,
          { width: btn, height: btn, borderRadius: btn / 2 },
          value <= min && styles.off,
          pressed && styles.pressed,
        ]}
      >
        <Minus size={big ? 24 : 18} color={colors.forest} strokeWidth={2.6} />
      </Pressable>
      <Text style={[styles.value, big ? styles.valueBig : null]}>{format ? format(value) : value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${label}`}
        onPress={() => change(value + 1)}
        disabled={value >= max}
        style={({ pressed }) => [
          styles.btn,
          styles.btnPlus,
          { width: btn, height: btn, borderRadius: btn / 2 },
          value >= max && styles.off,
          pressed && styles.pressed,
        ]}
      >
        <Plus size={big ? 24 : 18} color={colors.onDark} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: { backgroundColor: colors.leafSoft, alignItems: 'center', justifyContent: 'center' },
  btnPlus: { backgroundColor: colors.forest },
  off: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.92 }] },
  value: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, minWidth: 28, textAlign: 'center' },
  valueBig: { fontSize: 44, minWidth: 60, letterSpacing: -1 },
});
