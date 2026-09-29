import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, shadow } from '../../theme';
import { Emoji } from '../Emoji';
import type { IngredientRowData } from './ingredientRows';

export function IngredientList({ rows }: { rows: IngredientRowData[] }) {
  return (
    <View style={styles.group}>
      {rows.map((row, i) => (
        <View key={row.key} style={[styles.row, i > 0 && styles.border]}>
          <View style={[styles.icon, { backgroundColor: row.tint }]}>
            <Emoji name={row.icon ?? 'clipboard'} size={row.icon ? 24 : 20} />
          </View>
          <Text style={styles.name}>{row.name}</Text>
          {row.qty ? <Text style={styles.qty}>{row.qty}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  border: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  qty: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft, textAlign: 'right', maxWidth: '45%' },
});
