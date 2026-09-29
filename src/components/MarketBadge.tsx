import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { getMarket, marketInitials, marketLabel } from '../data/markets';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, radius } from '../theme';

export function MarketMonogram({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[styles.mono, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.monoText, { fontSize: size * 0.38 }]}>{marketInitials(name)}</Text>
    </View>
  );
}

export function MarketBadge({
  prefix = 'Planejado para o',
  tone = 'sun',
  style,
}: {
  prefix?: string;
  tone?: 'sun' | 'white';
  style?: StyleProp<ViewStyle>;
}) {
  const profile = useAppStore((s) => s.profile);
  const market = getMarket(profile.marketId);
  const label = marketLabel(profile.marketId, profile.customMarketName);
  return (
    <View style={[styles.badge, { backgroundColor: tone === 'sun' ? colors.sun : colors.card }, style]}>
      <MarketMonogram name={label} color={market?.color ?? colors.muted} size={20} />
      <Text style={styles.text} numberOfLines={1}>
        {prefix} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  text: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, flexShrink: 1 },
  mono: { alignItems: 'center', justifyContent: 'center' },
  monoText: { fontFamily: fonts.extrabold, color: colors.onDark, letterSpacing: -0.3 },
});
