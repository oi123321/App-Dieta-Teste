import { ArrowLeftRight, CalendarCheck, Timer, Users } from './icons';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlanEntry, Recipe, TagId } from '../data/types';
import { brl, DAY_SHORT, daysLabel, minutesLabel } from '../lib/format';
import { recipeCost, recipeTags } from '../lib/recipes';
import { colors, fonts, radius, shadow } from '../theme';
import { RecipeImage } from './RecipeImage';
import { TagChip } from './Tags';

const TAG_PRIORITY: TagId[] = ['proteico', 'rapido', 'economico', 'leve', 'vegetariano', 'conforto', 'marmita'];

interface Props {
  entry: PlanEntry;
  recipe: Recipe;
  people: number;
  marketIndex: number;
  onPress: () => void;
  onSwap: () => void;
}

export function DayCard({ entry, recipe, people, marketIndex, onPress, onSwap }: Props) {
  const servings = people * entry.days.length;
  const cost = recipeCost(recipe, servings, marketIndex);
  const tags = recipeTags(recipe);
  const tag = TAG_PRIORITY.find((t) => tags.includes(t));
  const batch = entry.days.length > 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${daysLabel(entry.days, 'long')}: ${recipe.title}, ${brl(cost)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      <View style={styles.dayCol}>
        {entry.days.map((d, i) => (
          <Fragment key={d}>
            {i > 0 ? <View style={styles.dayDivider} /> : null}
            <Text style={styles.day}>{DAY_SHORT[d]}</Text>
          </Fragment>
        ))}
      </View>
      <View style={styles.body}>
        <View style={styles.main}>
          <RecipeImage recipe={recipe} style={styles.thumb} />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={3}>
                {recipe.title}
              </Text>
              <Text style={styles.price}>{brl(cost)}</Text>
            </View>
            <View style={styles.meta}>
              <Timer size={14} color={colors.muted} strokeWidth={2.2} />
              <Text style={styles.metaText}>{minutesLabel(recipe.minutes)}</Text>
            </View>
            <View style={styles.bottomRow}>
              <View style={styles.meta}>
                <Users size={14} color={colors.muted} strokeWidth={2.2} />
                <Text style={styles.metaText}>{servings}</Text>
              </View>
              {tag ? <TagChip tag={tag} compact /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Trocar ${recipe.title}`}
                hitSlop={12}
                onPress={onSwap}
                style={({ pressed }) => [styles.swap, pressed && { backgroundColor: colors.leafSoft }]}
              >
                <ArrowLeftRight size={18} color={colors.leaf} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
        </View>
        {batch ? (
          <View style={styles.batch}>
            <CalendarCheck size={14} color={colors.forestSoft} strokeWidth={2.2} />
            <Text style={styles.batchText} numberOfLines={1}>
              Cozinhe 1 vez, jante 2 ({daysLabel(entry.days)})
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    ...shadow(1),
  },
  dayCol: {
    width: 58,
    backgroundColor: colors.leaf,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  day: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.onDark },
  dayDivider: { width: 22, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginVertical: 12 },
  body: { flex: 1 },
  main: { flexDirection: 'row', minHeight: 116 },
  thumb: { width: 88, alignSelf: 'stretch' },
  info: { flex: 1, paddingHorizontal: 12, paddingVertical: 11, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15, lineHeight: 19, color: colors.ink, letterSpacing: -0.2 },
  price: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto' },
  swap: {
    marginLeft: 'auto',
    flexShrink: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.leafMist,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  batchText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.forestSoft, flex: 1 },
});
