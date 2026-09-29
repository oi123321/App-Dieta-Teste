import { ArrowLeft, Heart, RotateCcw, Undo2, WandSparkles, X } from '../components/icons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Emoji } from '../components/Emoji';
import { IconButton } from '../components/IconButton';
import { useScreenSize } from '../components/PhoneFrame';
import { RecipeImage } from '../components/RecipeImage';
import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from '../components/SwipeCard';
import type { PlanEntry, Recipe } from '../data/types';
import { brl, DAY_SHORT, daysLabel, pct } from '../lib/format';
import { haptics } from '../lib/haptics';
import { buildSlots, deckOrder, newEntryId } from '../lib/planner';
import { recipeCost } from '../lib/recipes';
import type { RootScreenProps } from '../navigation/types';
import { usePlannerContext } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow, type } from '../theme';

type Move = { type: SwipeDirection; recipeId: string };

export function BuildWeekScreen({ navigation }: RootScreenProps<'BuildWeek'>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useScreenSize();
  const ctx = usePlannerContext();
  const setPlanEntries = useAppStore((s) => s.setPlanEntries);
  const [seed, setSeed] = useState(() => Date.now());
  const slots = useMemo(() => buildSlots(ctx.profile.dinners, ctx.profile.batch), [ctx.profile.dinners, ctx.profile.batch]);
  const deck = useMemo(() => deckOrder(ctx, seed), [ctx, seed]);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<Recipe[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const topCard = useRef<SwipeCardHandle>(null);

  const people = ctx.profile.people;
  const budget = ctx.profile.budget ?? 0;
  const done = picked.length >= slots.length;
  const currentSlot = slots[Math.min(picked.length, slots.length - 1)];
  const servings = people * currentSlot.length;
  const total = picked.reduce((sum, r, i) => sum + recipeCost(r, people * slots[i].length, ctx.marketIndex), 0);

  const visible = deck
    .slice(position)
    .filter((r) => !picked.includes(r))
    .slice(0, 3);

  const cardW = width - GUTTER * 2;
  const cardH = Math.max(300, Math.min(cardW * 1.22, height - insets.top - insets.bottom - 330));

  const onSwiped = (dir: SwipeDirection) => {
    const recipe = visible[0];
    if (!recipe) return;
    if (dir === 'like') {
      haptics.success();
      setPicked((p) => [...p, recipe]);
    } else {
      haptics.tap();
    }
    setMoves((m) => [...m, { type: dir, recipeId: recipe.id }]);
    setPosition((p) => p + 1);
  };

  const undo = () => {
    const last = moves[moves.length - 1];
    if (!last) return;
    haptics.tap();
    setMoves((m) => m.slice(0, -1));
    setPosition((p) => Math.max(0, p - 1));
    if (last.type === 'like') setPicked((p) => p.slice(0, -1));
  };

  const autoFill = () => {
    haptics.success();
    const pool = deck.filter((r) => !picked.includes(r));
    const next = [...picked];
    for (let i = next.length; i < slots.length; i++) {
      const pairSlot = slots[i].length > 1;
      const idx = pool.findIndex((r) => !pairSlot || r.batch);
      const choice = pool.splice(idx >= 0 ? idx : 0, 1)[0] ?? deck[i % Math.max(1, deck.length)];
      if (choice) next.push(choice);
    }
    setPicked(next);
  };

  const restart = () => {
    setSeed(Date.now());
    setPosition(0);
    setPicked([]);
    setMoves([]);
  };

  const save = () => {
    const entries: PlanEntry[] = picked.map((r, i) => ({ id: newEntryId(), recipeId: r.id, days: slots[i] }));
    setPlanEntries(entries);
    haptics.success();
    navigation.goBack();
  };

  const leave = () => {
    if (picked.length > 0 && !done) setConfirmLeave(true);
    else navigation.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <IconButton icon={ArrowLeft} label="Voltar" onPress={leave} />
        {!done ? (
          <Pressable
            onPress={autoFill}
            style={styles.autoBtn}
            accessibilityRole="button"
            accessibilityLabel="Completar automaticamente"
          >
            <WandSparkles size={15} color={colors.leafDark} strokeWidth={2.4} />
            <Text style={styles.autoText}>Completar</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.titles}>
        <Text style={styles.title} accessibilityRole="header">
          Monte sua semana
        </Text>
        <Text style={styles.subtitle}>Deslize para a direita para adicionar · esquerda para pular</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slots} style={{ flexGrow: 0 }}>
        {slots.map((days, i) => {
          const recipe = picked[i];
          const current = i === picked.length;
          return (
            <View key={days.join('-')} style={[styles.slot, current && styles.slotCurrent, recipe && styles.slotFilled]}>
              {recipe ? (
                <RecipeImage recipe={recipe} style={styles.slotImg} />
              ) : (
                <View style={[styles.slotEmpty, current && { borderColor: colors.leaf }]} />
              )}
              <Text style={[styles.slotText, current && { color: colors.forest }]}>
                {days.map((d) => DAY_SHORT[d]).join('+')}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.budgetRow}>
        <Text style={styles.budgetText}>
          {brl(total)} <Text style={styles.budgetOf}>de {brl(budget, { cents: false })}</Text>
        </Text>
        <View style={styles.budgetTrack}>
          <View
            style={[
              styles.budgetFill,
              {
                width: pct(budget ? Math.min(100, (total / budget) * 100) : 0),
                backgroundColor: total > budget ? colors.tomato : colors.leaf,
              },
            ]}
          />
        </View>
      </View>

      {done ? (
        <DoneView
          picked={picked}
          slots={slots}
          total={total}
          budget={budget}
          people={people}
          marketIndex={ctx.marketIndex}
          onSave={save}
          onRestart={restart}
          bottomInset={insets.bottom}
        />
      ) : visible.length === 0 ? (
        <View style={styles.outOfCards}>
          <Emoji name="face-savoring-food" size={72} />
          <Text style={[type.h3, { textAlign: 'center', marginTop: 12 }]}>Acabaram as sugestões</Text>
          <Text style={[type.body, { textAlign: 'center', marginTop: 6 }]}>
            Faltam {slots.length - picked.length} {slots.length - picked.length === 1 ? 'refeição' : 'refeições'}. Quer que a
            gente complete?
          </Text>
          <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 20 }}>
            <Button label="Completar automaticamente" icon={WandSparkles} onPress={autoFill} />
            <Button label="Ver as puladas de novo" variant="light" icon={RotateCcw} onPress={() => setPosition(0)} />
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.deck, { height: cardH + 26 }]}>
            {currentSlot.length > 1 ? (
              <Text style={styles.slotHint}>Para {daysLabel(currentSlot)} · cozinha 1 vez, rende 2 dias</Text>
            ) : (
              <Text style={styles.slotHint}>Para {daysLabel(currentSlot, 'long').toLowerCase()}</Text>
            )}
            {[...visible].reverse().map((recipe) => {
              const depth = visible.indexOf(recipe);
              return (
                <SwipeCard
                  key={recipe.id}
                  ref={depth === 0 ? topCard : undefined}
                  recipe={recipe}
                  depth={depth}
                  width={cardW}
                  height={cardH}
                  price={recipeCost(recipe, servings, ctx.marketIndex)}
                  servings={servings}
                  onSwiped={onSwiped}
                  onInfo={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                />
              );
            })}
          </View>
          <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.action,
                styles.actionSmall,
                moves.length === 0 && { opacity: 0.4 },
                pressed && styles.pressed,
              ]}
              onPress={undo}
              disabled={moves.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Desfazer"
            >
              <Undo2 size={22} color={colors.forest} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.action, styles.actionSkip, pressed && styles.pressed]}
              onPress={() => topCard.current?.swipe('skip')}
              accessibilityRole="button"
              accessibilityLabel="Pular receita"
            >
              <X size={30} color={colors.tomato} strokeWidth={2.6} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.action, styles.actionLike, pressed && styles.pressed]}
              onPress={() => topCard.current?.swipe('like')}
              accessibilityRole="button"
              accessibilityLabel="Adicionar receita"
            >
              <Heart size={28} color={colors.onDark} fill={colors.onDark} strokeWidth={2.4} />
            </Pressable>
          </View>
        </>
      )}

      <ConfirmDialog
        visible={confirmLeave}
        title="Sair sem salvar?"
        message="As receitas que você escolheu agora não vão para o plano."
        confirmLabel="Sair"
        destructive
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}

function DoneView({
  picked,
  slots,
  total,
  budget,
  people,
  marketIndex,
  onSave,
  onRestart,
  bottomInset,
}: {
  picked: Recipe[];
  slots: number[][];
  total: number;
  budget: number;
  people: number;
  marketIndex: number;
  onSave: () => void;
  onRestart: () => void;
  bottomInset: number;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.doneHead}>
          <Emoji name="party-popper" size={56} />
          <View style={{ flex: 1 }}>
            <Text style={type.h2}>semana completa!</Text>
            <Text style={type.small}>
              {total <= budget
                ? `Cabe no orçamento: sobram ${brl(budget - total)}.`
                : `Passou ${brl(total - budget)} do orçamento.`}
            </Text>
          </View>
        </View>
        {picked.map((recipe, i) => (
          <View key={recipe.id + i} style={styles.doneRow}>
            <Text style={styles.doneDay}>{slots[i].map((d) => DAY_SHORT[d]).join('\n')}</Text>
            <RecipeImage recipe={recipe} style={styles.doneImg} />
            <Text style={styles.doneTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
            <Text style={styles.donePrice}>{brl(recipeCost(recipe, people * slots[i].length, marketIndex))}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: GUTTER, paddingBottom: bottomInset + 14, gap: 10 }}>
        <Button label="Salvar meu plano" onPress={onSave} />
        <Button label="Recomeçar" variant="light" icon={RotateCcw} onPress={onRestart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER },
  autoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
    ...shadow(1),
  },
  autoText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.leafDark },
  titles: { paddingHorizontal: GUTTER, marginTop: 12 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.forest, letterSpacing: -0.9 },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, marginTop: 2 },
  slots: { paddingHorizontal: GUTTER, gap: 8, paddingTop: 14, paddingBottom: 4 },
  slot: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 58,
  },
  slotCurrent: { borderColor: colors.leaf },
  slotFilled: { backgroundColor: colors.leafMist },
  slotImg: { width: 30, height: 30, borderRadius: 15 },
  slotEmpty: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line },
  slotText: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: GUTTER, marginTop: 10 },
  budgetText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.forest },
  budgetOf: { fontFamily: fonts.semibold, color: colors.muted },
  budgetTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 3 },
  deck: { marginTop: 10, marginHorizontal: GUTTER, alignItems: 'center', justifyContent: 'flex-end' },
  slotHint: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, paddingTop: 18 },
  action: { alignItems: 'center', justifyContent: 'center', ...shadow(2) },
  actionSmall: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card },
  actionSkip: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.card,
    borderWidth: 2.5,
    borderColor: colors.tomato,
  },
  actionLike: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.leaf },
  pressed: { transform: [{ scale: 0.92 }] },
  outOfCards: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: GUTTER + 10 },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 14 },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 8,
  },
  doneDay: { width: 34, fontFamily: fonts.extrabold, fontSize: 12.5, color: colors.leafDark, textAlign: 'center' },
  doneImg: { width: 48, height: 48, borderRadius: 12 },
  doneTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  donePrice: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.ink },
});
