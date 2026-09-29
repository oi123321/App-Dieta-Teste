import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { EmojiName } from '../data/emoji';
import type { TagId } from '../data/types';
import { TAG_META } from '../lib/recipes';
import { fonts, radius } from '../theme';
import { Emoji } from './Emoji';

const TAG_EMOJI: Record<TagId, EmojiName> = {
  rapido: 'high-voltage',
  leve: 'balance-scale',
  proteico: 'flexed-biceps',
  conforto: 'steaming-bowl',
  vegetariano: 'leafy-green',
  economico: 'coin',
  marmita: 'bento-box',
};

export function TagChip({
  tag,
  variant = 'soft',
  compact,
}: {
  tag: TagId;
  variant?: 'soft' | 'white';
  /** Short label that can shrink, for tight rows. */
  compact?: boolean;
}) {
  const meta = TAG_META[tag];
  const white = variant === 'white';
  return (
    <View style={[styles.chip, { backgroundColor: white ? 'rgba(255,255,255,0.94)' : meta.bg }, compact && styles.shrink]}>
      <Emoji name={TAG_EMOJI[tag]} size={14} />
      <Text style={[styles.text, { color: white ? '#1D2A21' : meta.fg }, compact && styles.shrink]} numberOfLines={1}>
        {compact ? meta.short : meta.label}
      </Text>
    </View>
  );
}

export function TagRow({
  tags,
  max = 3,
  variant,
  style,
}: {
  tags: TagId[];
  max?: number;
  variant?: 'soft' | 'white';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      {tags.slice(0, max).map((t) => (
        <TagChip key={t} tag={t} variant={variant} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: { fontFamily: fonts.bold, fontSize: 12 },
  shrink: { flexShrink: 1, minWidth: 0 },
});
