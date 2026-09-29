import { ArrowLeftRight, Timer, X } from '../components/icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../components/IconButton';
import { RecipeImage } from '../components/RecipeImage';
import { TagRow } from '../components/Tags';
import { brl, daysLabel, minutesLabel, signedBrl } from '../lib/format';
import { haptics } from '../lib/haptics';
import { servingsFor, swapOptions } from '../lib/planner';
import { recipeCost, recipeTags } from '../lib/recipes';
import type { RootScreenProps } from '../navigation/types';
import { usePlannerContext, useRecipeLookup } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow, type } from '../theme';

export function SwapScreen({ route, navigation }: RootScreenProps<'Swap'>) {
  const insets = useSafeAreaInsets();
  const plan = useAppStore((s) => s.plan);
  const replaceRecipe = useAppStore((s) => s.replaceRecipe);
  const ctx = usePlannerContext();
  const { find } = useRecipeLookup();
  const entry = plan?.entries.find((e) => e.id === route.params.entryId);
  const current = entry ? find(entry.recipeId) : undefined;

  const options = useMemo(() => (plan && entry ? swapOptions(ctx, plan, entry) : []), [ctx, plan, entry]);

  if (!entry || !current) {
    return (
      <View style={[styles.root, { padding: GUTTER }]}>
        <Text style={type.h3}>Essa refeição não está mais no plano.</Text>
      </View>
    );
  }

  const servings = servingsFor(entry, ctx.profile.people);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.overline}>{daysLabel(entry.days, 'long')}</Text>
          <Text style={type.h2} accessibilityRole="header">
            trocar receita
          </Text>
        </View>
        <IconButton icon={X} label="Fechar" tone="white" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.current}>
          <RecipeImage recipe={current} style={styles.currentImg} />
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>NO PLANO AGORA</Text>
            <Text style={styles.currentTitle} numberOfLines={2}>
              {current.title}
            </Text>
            <Text style={styles.currentMeta}>
              {brl(recipeCost(current, servings, ctx.marketIndex))} · {servings} {servings === 1 ? 'porção' : 'porções'}
            </Text>
          </View>
        </View>

        <Text style={styles.section}>Sugestões que funcionam na sua cozinha</Text>
        {options.length === 0 ? (
          <Text style={type.body}>Não há outras receitas compatíveis com a sua cozinha e preferências.</Text>
        ) : null}
        {options.map(({ recipe, delta }) => (
          <Pressable
            key={recipe.id}
            style={({ pressed }) => [styles.option, pressed && { transform: [{ scale: 0.99 }] }]}
            onPress={() => {
              haptics.success();
              replaceRecipe(entry.id, recipe.id);
              navigation.goBack();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Trocar por ${recipe.title}, ${signedBrl(delta)}`}
          >
            <RecipeImage recipe={recipe} style={styles.optionImg} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.optionTitle} numberOfLines={2}>
                {recipe.title}
              </Text>
              <View style={styles.metaRow}>
                <Timer size={13} color={colors.muted} strokeWidth={2.3} />
                <Text style={styles.meta}>{minutesLabel(recipe.minutes)}</Text>
                <View style={[styles.delta, delta <= 0 ? styles.deltaDown : styles.deltaUp]}>
                  <Text style={[styles.deltaText, { color: delta <= 0 ? colors.leafDark : colors.tomato }]}>
                    {signedBrl(delta)}
                  </Text>
                </View>
              </View>
              <TagRow tags={recipeTags(recipe)} max={2} />
            </View>
            <ArrowLeftRight size={18} color={colors.leaf} strokeWidth={2.4} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER, paddingTop: 18, paddingBottom: 14, gap: 12 },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.leafMist,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.leafSoft,
  },
  currentImg: { width: 64, height: 64, borderRadius: 14 },
  currentLabel: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1.2, color: colors.leafDark },
  currentTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink, marginTop: 2 },
  currentMeta: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  section: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink, marginTop: 22, marginBottom: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 10,
    marginBottom: 10,
    ...shadow(1),
  },
  optionImg: { width: 76, height: 76, borderRadius: 16 },
  optionTitle: { fontFamily: fonts.extrabold, fontSize: 14.5, lineHeight: 18, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.muted },
  delta: { marginLeft: 6, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  deltaDown: { backgroundColor: colors.leafSoft },
  deltaUp: { backgroundColor: colors.tomatoSoft },
  deltaText: { fontFamily: fonts.extrabold, fontSize: 12 },
});
