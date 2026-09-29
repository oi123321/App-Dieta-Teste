import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DAY_LONG, daysLabel, onDayLabel } from '../../lib/format';
import { useRecipeLookup } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { colors, fonts, radius } from '../../theme';
import { Sheet } from '../Sheet';

interface Props {
  visible: boolean;
  title: string;
  onPick: (day: number) => void;
  onClose: () => void;
}

/** Bottom sheet to choose which dinner of the week gets a recipe. */
export function DayPickerSheet({ visible, title, onPick, onClose }: Props) {
  const plan = useAppStore((s) => s.plan);
  const { find } = useRecipeLookup();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Em qual dia?</Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.days}>
        {DAY_LONG.map((dayName, day) => {
          const entry = plan?.entries.find((e) => e.days.includes(day));
          const current = entry ? find(entry.recipeId) : undefined;
          return (
            <Pressable
              key={dayName}
              onPress={() => onPick(day)}
              style={({ pressed }) => [styles.day, pressed && { backgroundColor: colors.leafSoft }]}
              accessibilityRole="button"
              accessibilityLabel={`Colocar ${onDayLabel(day)}`}
            >
              <Text style={styles.dayName}>{dayName}</Text>
              <View style={[styles.dot, { backgroundColor: entry ? colors.sunDeep : colors.leaf }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dayState} numberOfLines={1}>
                  {entry ? `troca: ${current?.title ?? 'receita do dia'}` : 'livre'}
                </Text>
                {entry && entry.days.length > 1 ? (
                  <Text style={styles.batch}>vale para {daysLabel(entry.days)} (cozinhar em dobro)</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.inkSoft, marginTop: 2, marginBottom: 12 },
  days: { gap: 6 },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dayName: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.forest, width: 70 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dayState: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  batch: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.leafDark, marginTop: 1 },
});
