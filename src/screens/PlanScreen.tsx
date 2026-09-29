import { ArrowRight, Info, ListChecks, Shuffle, SquarePen, TriangleAlert } from '../components/icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { DayCard } from '../components/DayCard';
import { Emoji } from '../components/Emoji';
import { IconButton } from '../components/IconButton';
import { MarketBadge } from '../components/MarketBadge';
import { brl, pct, plural } from '../lib/format';
import { haptics } from '../lib/haptics';
import type { TabScreenProps } from '../navigation/types';
import { useMarketInfo, usePlanCost, useRecipeLookup } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow, type } from '../theme';

export function PlanScreen({ navigation }: TabScreenProps<'Plan'>) {
  const insets = useSafeAreaInsets();
  const plan = useAppStore((s) => s.plan);
  const profile = useAppStore((s) => s.profile);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const fitPlanToBudget = useAppStore((s) => s.fitPlanToBudget);
  const cost = usePlanCost();
  const { find } = useRecipeLookup();
  const { index, label: market } = useMarketInfo();
  const [showInfo, setShowInfo] = useState(false);

  const budget = profile.budget ?? 0;
  const over = budget > 0 && cost > budget + 0.01;
  const ratio = budget > 0 ? Math.min(1, cost / budget) : 0;
  const entries = plan?.entries ?? [];
  const dinners = entries.reduce((n, e) => n + e.days.length, 0);

  if (entries.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 40 }]}>
        <Emoji name="fork-and-knife-with-plate" size={96} />
        <Text style={[type.h2, { textAlign: 'center', marginTop: 18 }]}>sua semana ainda está vazia</Text>
        <Text style={[type.body, { textAlign: 'center', marginTop: 8 }]}>
          Monte deslizando as receitas ou deixe a gente escolher tudo pra você.
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 24 }}>
          <Button label="Montar deslizando" onPress={() => navigation.navigate('BuildWeek')} />
          <Button label="Gerar automaticamente" variant="light" onPress={regeneratePlan} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: GUTTER, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={type.overline}>Sua semana está pronta</Text>
          <View style={styles.titleRow}>
            <Text style={styles.hero} accessibilityRole="header">
              bom apetite!
            </Text>
            <Emoji name="party-popper" size={40} />
          </View>
        </View>
        <IconButton
          icon={Shuffle}
          label="Gerar outro plano"
          tone="white"
          onPress={() => {
            haptics.success();
            regeneratePlan();
          }}
        />
      </View>
      <MarketBadge style={{ marginTop: 8 }} />

      <View style={styles.cardsRow}>
        <View style={styles.costCard}>
          <Pressable
            style={styles.costLabelRow}
            onPress={() => setShowInfo((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Como calculamos o custo"
            hitSlop={8}
          >
            <Text style={styles.costLabel}>CUSTO APROX.</Text>
            <Info size={14} color={colors.muted} />
          </Pressable>
          <Text style={styles.cost} numberOfLines={1}>
            {brl(cost)}
          </Text>
          <Text style={styles.costOf}>de {brl(budget, { cents: false })} no orçamento</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: pct(ratio * 100), backgroundColor: over ? colors.tomato : colors.leaf }]} />
          </View>
          <Text style={[styles.costHint, over && { color: colors.tomato }]}>
            {over ? `${brl(cost - budget)} acima` : `sobram ${brl(budget - cost)}`}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.listCard, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={() => navigation.navigate('List')}
          accessibilityRole="button"
          accessibilityLabel="Ver lista de compras"
        >
          <ListChecks size={26} color={colors.forest} strokeWidth={2.2} />
          <View>
            <Text style={styles.listOverline}>TOQUE PARA VER</Text>
            <Text style={styles.listTitle}>Lista de compras</Text>
          </View>
        </Pressable>
      </View>

      {showInfo ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Estimativa com preços médios do {market} para {plural(profile.people, 'pessoa', 'pessoas')}, contando só o que cada
            receita usa. O valor no caixa pode variar com embalagens e promoções.
          </Text>
        </View>
      ) : null}

      {over ? (
        <View style={styles.overBox}>
          <TriangleAlert size={20} color={colors.tomato} />
          <Text style={styles.overText}>Seu plano passou do orçamento.</Text>
          <Pressable
            style={styles.overBtn}
            onPress={() => {
              haptics.success();
              fitPlanToBudget();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.overBtnText}>Ajustar</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <View>
          <Text style={styles.sectionTitle}>Refeições da semana</Text>
          <Text style={styles.sectionSub}>
            {plural(dinners, 'refeição', 'refeições')} · você cozinha {entries.length}×
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('BuildWeek')}
          accessibilityRole="button"
        >
          <SquarePen size={16} color={colors.leafDark} strokeWidth={2.4} />
          <Text style={styles.editText}>Editar plano</Text>
        </Pressable>
      </View>

      {entries.map((entry) => {
        const recipe = find(entry.recipeId);
        if (!recipe) return null;
        return (
          <DayCard
            key={entry.id}
            entry={entry}
            recipe={recipe}
            people={profile.people}
            marketIndex={index}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
            onSwap={() => navigation.navigate('Swap', { entryId: entry.id })}
          />
        );
      })}

      <Pressable
        style={({ pressed }) => [styles.promo, pressed && { transform: [{ scale: 0.99 }] }]}
        onPress={() => navigation.navigate('Import')}
        accessibilityRole="button"
        accessibilityLabel="Importar receita do TikTok ou Instagram"
      >
        <View style={{ flex: 1 }}>
          <View style={styles.newPill}>
            <Text style={styles.newText}>NOVO</Text>
          </View>
          <Text style={styles.promoTitle}>Viu uma receita no TikTok ou Instagram?</Text>
          <Text style={styles.promoText}>Cole o link e ela entra no seu plano.</Text>
        </View>
        <View style={styles.promoArrow}>
          <ArrowRight size={20} color={colors.forest} strokeWidth={2.6} />
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  empty: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', paddingHorizontal: GUTTER },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, letterSpacing: -1.4, color: colors.forest },
  cardsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  costCard: { flex: 1.15, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, ...shadow(1) },
  costLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  costLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, color: colors.muted },
  cost: { fontFamily: fonts.display, fontSize: 25, color: colors.forest, marginTop: 6, letterSpacing: -0.6 },
  costOf: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, marginTop: 1 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.lineSoft, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', borderRadius: 4 },
  costHint: { fontFamily: fonts.semibold, fontSize: 12, color: colors.leafDark, marginTop: 6 },
  listCard: {
    flex: 1,
    backgroundColor: colors.sun,
    borderRadius: radius.lg,
    padding: 14,
    justifyContent: 'space-between',
    ...shadow(1),
  },
  listOverline: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1.1, color: 'rgba(22,41,29,0.6)', marginTop: 10 },
  listTitle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 21, color: colors.forest, letterSpacing: -0.4 },
  infoBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginTop: 10 },
  infoText: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: colors.inkSoft },
  overBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.tomatoSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  overText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  overBtn: { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  overBtnText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.tomato },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  sectionSub: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...shadow(1),
  },
  editText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.leafDark },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 8,
  },
  newPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sun,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  newText: { fontFamily: fonts.extrabold, fontSize: 10.5, letterSpacing: 1, color: colors.forest },
  promoTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 21,
    color: colors.onDark,
    marginTop: 8,
    letterSpacing: -0.3,
  },
  promoText: { fontFamily: fonts.medium, fontSize: 13, color: colors.onDarkSoft, marginTop: 4 },
  promoArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
