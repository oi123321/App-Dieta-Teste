import { Dumbbell, Leaf, MilkOff, Salad, UserRound, WheatOff, type LucideIcon } from '../../components/icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Stepper } from '../../components/Stepper';
import { StepLayout } from '../../components/StepLayout';
import type { PrefId } from '../../data/types';
import { haptics } from '../../lib/haptics';
import { buildSlots } from '../../lib/planner';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { colors, fonts, radius, shadow } from '../../theme';

const PREFS: { id: PrefId; label: string; icon: LucideIcon }[] = [
  { id: 'vegetariano', label: 'Vegetariano', icon: Leaf },
  { id: 'sem_lactose', label: 'Sem lactose', icon: MilkOff },
  { id: 'sem_gluten', label: 'Sem glúten', icon: WheatOff },
  { id: 'proteico', label: 'Mais proteína', icon: Dumbbell },
  { id: 'low_carb', label: 'Menos carboidrato', icon: Salad },
];

export function HouseholdScreen({ navigation }: RootScreenProps<'Household' | 'EditHousehold'>) {
  const onboarded = useAppStore((s) => s.onboarded);
  const profile = useAppStore((s) => s.profile);
  const setHousehold = useAppStore((s) => s.setHousehold);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const [people, setPeople] = useState(profile.people);
  const [dinners, setDinners] = useState(profile.dinners);
  const [batch, setBatch] = useState(profile.batch);
  const [prefs, setPrefs] = useState<PrefId[]>(profile.prefs);

  const sessions = buildSlots(dinners, batch).length;

  const save = () => {
    setHousehold({ people, dinners, batch, prefs });
    if (onboarded) {
      regeneratePlan();
      haptics.success();
      navigation.goBack();
    } else {
      navigation.navigate('Budget');
    }
  };

  return (
    <StepLayout
      step={onboarded ? undefined : 3}
      editLabel="Casa e preferências"
      onBack={() => navigation.goBack()}
      title="quem janta com você?"
      subtitle="Assim a gente acerta as porções e as quantidades da lista."
      footer={<Button label={onboarded ? 'Salvar e refazer plano' : 'Continuar'} onPress={save} />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pessoas</Text>
        <View style={styles.peopleRow}>
          <Stepper value={people} min={1} max={8} onChange={setPeople} label="pessoas" size="lg" />
          <View style={styles.avatars}>
            {Array.from({ length: Math.min(people, 6) }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.avatar,
                  { marginLeft: i === 0 ? 0 : -10, backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] },
                ]}
              >
                <UserRound size={16} color={colors.forest} strokeWidth={2.4} />
              </View>
            ))}
            {people > 6 ? <Text style={styles.more}>+{people - 6}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Jantares por semana</Text>
        <View style={styles.segment}>
          {[3, 4, 5, 6, 7].map((n) => {
            const active = n === dinners;
            return (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${n} jantares por semana`}
                onPress={() => {
                  haptics.select();
                  setDinners(n);
                }}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, styles.batchCard]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Cozinhar em dobro</Text>
          <Text style={styles.cardText}>
            Cozinhe uma vez e jante duas: sobra pro dia seguinte. {batch ? `Você vai cozinhar ${sessions}× na semana.` : ''}
          </Text>
        </View>
        <Switch
          value={batch}
          onValueChange={(v) => {
            haptics.select();
            setBatch(v);
          }}
          trackColor={{ true: colors.leaf, false: colors.line }}
          thumbColor={colors.card}
          {...WEB_THUMB}
          accessibilityLabel="Cozinhar em dobro"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferências</Text>
        <Text style={styles.cardText}>Opcional — escolha quantas quiser.</Text>
        <View style={styles.chips}>
          {PREFS.map(({ id, label, icon: Icon }) => {
            const active = prefs.includes(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={label}
                onPress={() => {
                  haptics.select();
                  setPrefs((p) => (active ? p.filter((x) => x !== id) : [...p, id]));
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Icon size={16} color={active ? colors.onDark : colors.forest} strokeWidth={2.3} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </StepLayout>
  );
}

// react-native-web colors the "on" thumb with its own prop.
const WEB_THUMB = { activeThumbColor: colors.card } as object;

const AVATAR_COLORS = ['#E4F1D6', '#FFF0C2', '#F9D7D0', '#DCEBF5', '#ECE5F5', '#F3E3D3'];

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow(1) },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  cardText: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 19, color: colors.inkSoft, marginTop: 4 },
  peopleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  more: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft, marginLeft: 6 },
  segment: { flexDirection: 'row', gap: 8, marginTop: 12 },
  segmentItem: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: { backgroundColor: colors.forest },
  segmentText: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  segmentTextActive: { color: colors.sun },
  batchCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.leafMist,
    borderWidth: 1,
    borderColor: colors.leafSoft,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.forest },
  chipTextActive: { color: colors.onDark },
});
