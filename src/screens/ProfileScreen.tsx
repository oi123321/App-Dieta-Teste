import { ChevronRight, CookingPot, Heart, RefreshCw, Store, Trash2, Users, Wallet, type LucideIcon } from '../components/icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '../components/Brand';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { brl, plural } from '../lib/format';
import { haptics } from '../lib/haptics';
import type { TabScreenProps } from '../navigation/types';
import { useMarketInfo } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow } from '../theme';

const PREF_LABELS: Record<string, string> = {
  vegetariano: 'vegetariano',
  sem_lactose: 'sem lactose',
  sem_gluten: 'sem glúten',
  proteico: 'mais proteína',
  low_carb: 'menos carboidrato',
};

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const liked = useAppStore((s) => s.liked);
  const imported = useAppStore((s) => s.imported);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const reset = useAppStore((s) => s.reset);
  const { label: market } = useMarketInfo();
  const [confirmReset, setConfirmReset] = useState(false);

  const rows: { icon: LucideIcon; title: string; value: string; onPress: () => void }[] = [
    { icon: Store, title: 'Mercado', value: market, onPress: () => navigation.navigate('EditMarket') },
    {
      icon: Wallet,
      title: 'Orçamento semanal',
      value: profile.budget ? brl(profile.budget, { cents: false }) : 'não definido',
      onPress: () => navigation.navigate('EditBudget'),
    },
    {
      icon: Users,
      title: 'Casa e preferências',
      value: [
        plural(profile.people, 'pessoa', 'pessoas'),
        plural(profile.dinners, 'jantar', 'jantares'),
        ...profile.prefs.map((p) => PREF_LABELS[p]),
      ].join(' · '),
      onPress: () => navigation.navigate('EditHousehold'),
    },
    {
      icon: CookingPot,
      title: 'Minha cozinha',
      value: plural(profile.appliances.length, 'aparelho', 'aparelhos'),
      onPress: () => navigation.navigate('EditKitchen'),
    },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <Logo size={30} />
        <Text style={styles.heroTitle}>Seu plano semanal</Text>
        <Text style={styles.heroText}>
          {plural(profile.dinners, 'jantar', 'jantares')} para {plural(profile.people, 'pessoa', 'pessoas')}
          {profile.batch ? ', cozinhando em dobro' : ''} · até {brl(profile.budget ?? 0, { cents: false })} no {market}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{liked.length}</Text>
            <Text style={styles.statLabel}>curtidas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{imported.length}</Text>
            <Text style={styles.statLabel}>importadas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.appliances.length}</Text>
            <Text style={styles.statLabel}>aparelhos</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.section}>Ajustes</Text>
        <View style={styles.group}>
          {rows.map((row, i) => (
            <Pressable
              key={row.title}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { backgroundColor: colors.leafMist }]}
              onPress={row.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${row.title}: ${row.value}`}
            >
              <View style={styles.rowIcon}>
                <row.icon size={19} color={colors.forest} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {row.value}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Plano</Text>
        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.leafMist }]}
            onPress={() => {
              haptics.success();
              regeneratePlan();
              navigation.navigate('Plan');
            }}
            accessibilityRole="button"
          >
            <View style={styles.rowIcon}>
              <RefreshCw size={19} color={colors.forest} strokeWidth={2.2} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Gerar um novo plano</Text>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowBorder, pressed && { backgroundColor: colors.leafMist }]}
            onPress={() => navigation.navigate('Recipes')}
            accessibilityRole="button"
          >
            <View style={styles.rowIcon}>
              <Heart size={19} color={colors.forest} strokeWidth={2.2} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Ver receitas</Text>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowBorder, pressed && { backgroundColor: colors.tomatoSoft }]}
            onPress={() => setConfirmReset(true)}
            accessibilityRole="button"
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.tomatoSoft }]}>
              <Trash2 size={19} color={colors.tomato} strokeWidth={2.2} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1, color: colors.tomato }]}>Recomeçar do zero</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          salsa · versão 1.0{'\n'}Preços e calorias são estimativas.{'\n'}Ilustrações baseadas no Fluent Emoji (Microsoft, licença
          MIT).
        </Text>
      </View>

      <ConfirmDialog
        visible={confirmReset}
        title="Recomeçar do zero?"
        message="Seu plano, lista, curtidas e receitas importadas serão apagados deste aparelho."
        confirmLabel="Apagar tudo"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          reset();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  hero: {
    backgroundColor: colors.forest,
    paddingHorizontal: GUTTER,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.onDark, marginTop: 18, letterSpacing: -0.7 },
  heroText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.onDarkSoft, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: colors.sun },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onDarkSoft },
  body: { paddingHorizontal: GUTTER },
  section: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.muted,
    marginTop: 24,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  rowValue: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: 1 },
  footer: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center', marginTop: 26 },
});
