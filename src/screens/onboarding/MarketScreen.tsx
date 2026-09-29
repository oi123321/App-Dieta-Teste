import { Check, Search } from '../../components/icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../../components/Button';
import { MarketMonogram } from '../../components/MarketBadge';
import { StepLayout } from '../../components/StepLayout';
import { MARKET_GROUPS, MARKETS, priceTier } from '../../data/markets';
import type { Market } from '../../data/types';
import { haptics } from '../../lib/haptics';
import { normalize } from '../../lib/importer';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { colors, fonts, radius, shadow } from '../../theme';

export function MarketScreen({ navigation }: RootScreenProps<'Market' | 'EditMarket'>) {
  const onboarded = useAppStore((s) => s.onboarded);
  const profile = useAppStore((s) => s.profile);
  const setMarket = useAppStore((s) => s.setMarket);
  const [selected, setSelected] = useState<string | null>(profile.marketId);
  const [customName, setCustomName] = useState(profile.customMarketName);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = normalize(query);
    const matches = (m: Market) => !q || normalize(`${m.name} ${m.region ?? ''}`).includes(q) || m.id === 'outro';
    return MARKET_GROUPS.map((g) => ({ ...g, markets: MARKETS.filter((m) => m.kind === g.kind && matches(m)) })).filter(
      (g) => g.markets.length > 0,
    );
  }, [query]);

  const save = () => {
    if (!selected) return;
    setMarket(selected, customName.trim());
    if (onboarded) navigation.goBack();
    else navigation.navigate('Household');
  };

  return (
    <StepLayout
      step={onboarded ? undefined : 1}
      editLabel="Mercado"
      onBack={() => navigation.goBack()}
      title="onde você faz as compras?"
      subtitle="A gente estima os preços e organiza a lista de compras para o seu mercado."
      footer={<Button label={onboarded ? 'Salvar' : 'Continuar'} disabled={!selected} onPress={save} />}
    >
      <View style={styles.search}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar mercado"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar mercado"
        />
      </View>

      {groups.map((group) => (
        <View key={group.kind} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.hint ? <Text style={styles.groupHint}>{group.hint}</Text> : null}
          </View>
          <View style={styles.card}>
            {group.markets.map((market, i) => {
              const active = selected === market.id;
              return (
                <Pressable
                  key={market.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={market.name}
                  onPress={() => {
                    haptics.select();
                    setSelected(market.id);
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && styles.rowBorder,
                    active && styles.rowActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <MarketMonogram name={market.id === 'outro' ? '+' : market.name} color={market.color} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{market.name}</Text>
                    <Text style={styles.meta}>
                      {market.id === 'outro'
                        ? 'Usamos a média de preços'
                        : `${priceTier(market)}${market.region ? ` · mais comum em ${market.region}` : ' · todo o Brasil'}`}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioOn]}>
                    {active ? <Check size={14} color={colors.onDark} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {selected === 'outro' ? (
        <View style={styles.customBox}>
          <Text style={styles.customLabel}>Qual o nome do mercado? (opcional)</Text>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Ex.: Mercadinho do bairro"
            placeholderTextColor={colors.muted}
            style={styles.customInput}
            maxLength={40}
            accessibilityLabel="Nome do mercado"
          />
        </View>
      ) : null}

      <Text style={styles.note}>Os preços são estimativas baseadas em médias de mercado e podem variar por loja e região.</Text>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, height: '100%' },
  group: { marginTop: 22 },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  groupTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  groupHint: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  rowActive: { backgroundColor: colors.leafMist },
  name: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.leaf, borderColor: colors.leaf },
  customBox: { marginTop: 16 },
  customLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginBottom: 8 },
  customInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  note: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, marginTop: 18, lineHeight: 17 },
});
