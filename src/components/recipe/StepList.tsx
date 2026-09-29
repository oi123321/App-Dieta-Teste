import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '../../theme';
import { Emoji } from '../Emoji';
import { mentionedIn, type IngredientRowData } from './ingredientRows';

/** Numbered steps, each followed by the quantities of the ingredients it uses. */
export function StepList({ steps, rows }: { steps: string[]; rows: IngredientRowData[] }) {
  return (
    <View style={styles.list}>
      {steps.map((step, i) => {
        const used = mentionedIn(step, rows).slice(0, 5);
        return (
          <View key={i} style={styles.step}>
            <View style={styles.num}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.text}>{step}</Text>
              {used.length > 0 ? (
                <View
                  style={styles.chips}
                  accessibilityLabel={`Neste passo: ${used.map((u) => `${u.name}, ${u.qty}`).join('; ')}`}
                >
                  {used.map((row) => (
                    <View key={row.key} style={styles.chip}>
                      {row.icon ? <Emoji name={row.icon} size={14} /> : null}
                      <Text style={styles.chipName}>{row.name}</Text>
                      <Text style={styles.chipQty}>{row.qty}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  step: { flexDirection: 'row', gap: 12 },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.sun },
  body: { flex: 1, gap: 8 },
  text: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkSoft },
  chipQty: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.forest },
});
