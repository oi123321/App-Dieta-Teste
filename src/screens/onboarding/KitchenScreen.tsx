import { Sparkles } from '../../components/icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { APPLIANCE_ICONS } from '../../components/ApplianceIcon';
import { Button } from '../../components/Button';
import { KitchenScene } from '../../components/KitchenScene';
import { StepLayout } from '../../components/StepLayout';
import { APPLIANCES, hasAppliances } from '../../data/appliances';
import { RECIPES } from '../../data/recipes';
import type { ApplianceId } from '../../data/types';
import { haptics } from '../../lib/haptics';
import { fitsPrefs } from '../../lib/recipes';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { colors, fonts, radius } from '../../theme';

export function KitchenScreen({ navigation }: RootScreenProps<'Kitchen' | 'EditKitchen'>) {
  const onboarded = useAppStore((s) => s.onboarded);
  const profile = useAppStore((s) => s.profile);
  const setAppliances = useAppStore((s) => s.setAppliances);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const [selected, setSelected] = useState<ApplianceId[]>(profile.appliances);

  const toggle = (id: ApplianceId) => {
    haptics.select();
    setSelected((cur) => (cur.includes(id) ? cur.filter((a) => a !== id) : [...cur, id]));
  };

  const available = RECIPES.filter((r) => hasAppliances(r.appliances, selected) && fitsPrefs(r, profile.prefs)).length;

  const save = () => {
    setAppliances(selected);
    if (onboarded) {
      regeneratePlan();
      haptics.success();
      navigation.goBack();
    } else {
      navigation.navigate('Generating');
    }
  };

  return (
    <StepLayout
      step={onboarded ? undefined : 5}
      editLabel="Minha cozinha"
      onBack={() => navigation.goBack()}
      title="o que tem na sua cozinha?"
      subtitle="Toque só no que você tem ou quer usar."
      footer={
        <Button
          label={onboarded ? 'Salvar e refazer plano' : 'Gerar meu plano'}
          icon={onboarded ? undefined : Sparkles}
          disabled={selected.length === 0}
          onPress={save}
        />
      }
    >
      <KitchenScene selected={selected} onToggle={toggle} />

      <View style={styles.chips}>
        {APPLIANCES.map((a) => {
          const Icon = APPLIANCE_ICONS[a.id];
          const active = selected.includes(a.id);
          return (
            <Pressable
              key={a.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={a.name}
              onPress={() => toggle(a.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Icon size={16} color={active ? colors.onDark : colors.forest} strokeWidth={2.3} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {selected.length === 0 ? (
            'Selecione pelo menos um aparelho.'
          ) : (
            <>
              <Text style={styles.counterStrong}>{available} receitas</Text> funcionam com{' '}
              {selected.length === 1 ? 'esse aparelho' : `esses ${selected.length} aparelhos`}.
            </>
          )}
        </Text>
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.forest },
  chipTextActive: { color: colors.onDark },
  counter: { marginTop: 16, backgroundColor: colors.leafMist, borderRadius: radius.md, padding: 14 },
  counterText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.inkSoft },
  counterStrong: { fontFamily: fonts.extrabold, color: colors.forest },
});
