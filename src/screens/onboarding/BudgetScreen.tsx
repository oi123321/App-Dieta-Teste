import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BudgetSlider } from '../../components/BudgetSlider';
import { Button } from '../../components/Button';
import { Emoji } from '../../components/Emoji';
import { StepLayout } from '../../components/StepLayout';
import type { EmojiName } from '../../data/emoji';
import { RECIPES } from '../../data/recipes';
import { brl } from '../../lib/format';
import { haptics } from '../../lib/haptics';
import { recipeCost } from '../../lib/recipes';
import type { RootScreenProps } from '../../navigation/types';
import { useMarketInfo } from '../../store/selectors';
import { suggestedBudget, useAppStore } from '../../store/useAppStore';
import { colors, fonts, radius, shadow } from '../../theme';

const MIN = 50;
const MAX = 1000;
const STEP = 10;
const QUICK = [150, 250, 350, 500];

function clamp(value: number) {
  return Math.min(MAX, Math.max(MIN, Math.round(value / STEP) * STEP));
}

export function BudgetScreen({ navigation }: RootScreenProps<'Budget' | 'EditBudget'>) {
  const onboarded = useAppStore((s) => s.onboarded);
  const profile = useAppStore((s) => s.profile);
  const setBudget = useAppStore((s) => s.setBudget);
  const { index, label: marketName } = useMarketInfo();
  const [budget, setLocal] = useState(profile.budget ?? suggestedBudget(profile.people));
  const [draft, setDraft] = useState<string | null>(null);

  // Typical dinner cost per person at this market, from the built-in recipes.
  const estimate = useMemo(() => {
    const perServing = RECIPES.map((r) => recipeCost(r, 1, index)).sort((a, b) => a - b);
    const avg = perServing.reduce((a, b) => a + b, 0) / perServing.length;
    const cheapest = perServing.slice(0, Math.ceil(perServing.length * 0.4));
    const cheap = cheapest.reduce((a, b) => a + b, 0) / cheapest.length;
    const meals = profile.people * profile.dinners;
    return { typical: avg * meals, minimum: cheap * meals, perDinner: avg * profile.people };
  }, [index, profile.people, profile.dinners]);

  const insight: { emoji: EmojiName; title: string; text: string; tone: 'ok' | 'tight' | 'low' } =
    budget >= estimate.typical + 20
      ? {
          emoji: 'check-mark-button',
          tone: 'ok',
          title: 'Cabe com folga',
          text: `Suas ${profile.dinners} refeições devem custar cerca de ${brl(estimate.typical, { cents: false })}. Sobram ≈ ${brl(
            budget - estimate.typical,
            { cents: false },
          )} para o café da manhã, os lanches e o que mais faltar.`,
        }
      : budget >= estimate.minimum
        ? {
            emoji: 'coin',
            tone: 'tight',
            title: 'Dá pra fazer',
            text: `Vamos priorizar receitas mais econômicas para suas ${profile.dinners} refeições caberem em ${brl(budget, { cents: false })}.`,
          }
        : {
            emoji: 'warning',
            tone: 'low',
            title: 'Orçamento apertado',
            text: `Refeições para ${profile.people} ${profile.people === 1 ? 'pessoa' : 'pessoas'} no ${marketName} saem por pelo menos ≈ ${brl(
              estimate.minimum,
              { cents: false },
            )}. Vamos montar o plano mais econômico possível.`,
          };

  const resolveDraft = () => {
    if (draft === null) return budget;
    const parsed = parseInt(draft.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? budget : clamp(parsed);
  };

  const commitDraft = () => {
    setLocal(resolveDraft());
    setDraft(null);
  };

  const save = () => {
    const final = resolveDraft();
    setLocal(final);
    setDraft(null);
    setBudget(final);
    if (onboarded) navigation.goBack();
    else navigation.navigate('Kitchen');
  };

  return (
    <StepLayout
      step={onboarded ? undefined : 4}
      editLabel="Orçamento"
      onBack={() => navigation.goBack()}
      title="quanto você gasta por semana no mercado?"
      subtitle="Vamos montar um cardápio que cabe no seu bolso."
      footer={<Button label={onboarded ? 'Salvar' : 'Continuar'} onPress={save} />}
    >
      <View style={styles.amountCard}>
        <Text style={styles.overline}>SEU ORÇAMENTO SEMANAL</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>R$</Text>
          <TextInput
            value={draft ?? String(budget)}
            onFocus={() => setDraft(String(budget))}
            onChangeText={(t) => setDraft(t.replace(/\D/g, '').slice(0, 4))}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={4}
            style={styles.amount}
            selectTextOnFocus
            accessibilityLabel="Orçamento semanal em reais"
          />
        </View>
        <Text style={styles.perDay}>≈ {brl(budget / 7)} por dia</Text>
        <View style={styles.sliderWrap}>
          <BudgetSlider
            value={budget}
            min={MIN}
            max={MAX}
            step={STEP}
            onChange={(v) => {
              setDraft(null);
              setLocal(v);
            }}
            label="Orçamento semanal"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{brl(MIN, { cents: false })}</Text>
            <Text style={styles.sliderLabel}>{brl(MAX, { cents: false })}</Text>
          </View>
        </View>
        <View style={styles.quickRow}>
          {QUICK.map((q) => {
            const active = q === budget;
            return (
              <Pressable
                key={q}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  haptics.select();
                  setDraft(null);
                  setLocal(q);
                }}
                style={[styles.quick, active && styles.quickActive]}
              >
                <Text style={[styles.quickText, active && styles.quickTextActive]}>{brl(q, { cents: false })}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[styles.insight, insight.tone === 'low' && styles.insightLow, insight.tone === 'tight' && styles.insightTight]}
      >
        <Emoji name={insight.emoji} size={28} />
        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightText}>{insight.text}</Text>
        </View>
      </View>

      <Text style={styles.note}>
        Uma refeição para {profile.people} {profile.people === 1 ? 'pessoa' : 'pessoas'} no {marketName} custa em média{' '}
        {brl(estimate.perDinner)}. Você pode mudar o orçamento quando quiser no seu perfil.
      </Text>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  amountCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 20, ...shadow(1) },
  overline: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.3, color: colors.muted },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  currency: { fontFamily: fonts.display, fontSize: 26, color: colors.leafDark, marginTop: 12, marginRight: 6 },
  amount: {
    fontFamily: fonts.display,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2.5,
    color: colors.ink,
    padding: 0,
    minWidth: 120,
    flex: 1,
  },
  perDay: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.inkSoft, marginTop: -2 },
  sliderWrap: { marginTop: 16 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sliderLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  quick: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActive: { backgroundColor: colors.forest },
  quickText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.ink },
  quickTextActive: { color: colors.sun },
  insight: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.leafSoft,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 16,
  },
  insightTight: { backgroundColor: colors.sunSoft },
  insightLow: { backgroundColor: colors.tomatoSoft },
  insightTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  insightText: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 19, color: colors.inkSoft, marginTop: 3 },
  note: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 16 },
});
