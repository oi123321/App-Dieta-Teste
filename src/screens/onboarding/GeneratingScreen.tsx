import { StatusBar } from 'expo-status-bar';
import { Check } from '../../components/icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SprigMark } from '../../components/Brand';
import { applianceName } from '../../data/appliances';
import { brl } from '../../lib/format';
import { haptics } from '../../lib/haptics';
import type { RootScreenProps } from '../../navigation/types';
import { useMarketInfo } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { colors, fonts, GUTTER } from '../../theme';

const STEP_MS = 850;

export function GeneratingScreen(_props: RootScreenProps<'Generating'>) {
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const { label: market } = useMarketInfo();
  const [done, setDone] = useState(0);

  const appliances = profile.appliances.slice(0, 2).map((a) => applianceName(a).toLowerCase());
  const steps = [
    `Conferindo os preços no ${market}`,
    `Escolhendo receitas para ${appliances.join(' e ') || 'sua cozinha'}`,
    `Encaixando no orçamento de ${brl(profile.budget ?? 0, { cents: false })}`,
    'Organizando a lista por corredor',
  ];

  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.12, { duration: 600 }), withTiming(1, { duration: 600 })), -1);
    spin.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1);
  }, [pulse, spin]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  useEffect(() => {
    if (done < steps.length) {
      const t = setTimeout(() => {
        haptics.select();
        setDone((d) => d + 1);
      }, STEP_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      haptics.success();
      completeOnboarding();
    }, 450);
    return () => clearTimeout(t);
  }, [done, steps.length, completeOnboarding]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={pulseStyle}>
            <SprigMark size={64} color={colors.leaf} />
          </Animated.View>
        </View>
        <Text style={styles.title}>montando sua semana…</Text>
        <Text style={styles.sub}>
          {profile.dinners} refeições para {profile.people} {profile.people === 1 ? 'pessoa' : 'pessoas'}
        </Text>
      </View>
      <View style={styles.list}>
        {steps.map((label, i) => {
          const state = i < done ? 'done' : i === done ? 'active' : 'todo';
          return (
            <Animated.View key={label} entering={FadeIn.delay(i * 120)} style={styles.item}>
              <View style={[styles.check, state === 'done' && styles.checkDone, state === 'active' && styles.checkActive]}>
                {state === 'done' ? <Check size={14} color={colors.forest} strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.itemText, state === 'todo' && { opacity: 0.45 }]}>{label}</Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.forest, paddingHorizontal: GUTTER, justifyContent: 'space-between' },
  center: { alignItems: 'center', marginTop: 40 },
  logoWrap: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopColor: colors.sun,
  },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.onDark, marginTop: 28, letterSpacing: -0.8 },
  sub: { fontFamily: fonts.semibold, fontSize: 15, color: colors.onDarkSoft, marginTop: 6 },
  list: { gap: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 22, padding: 18 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { borderColor: colors.sun },
  checkDone: { backgroundColor: colors.leaf, borderColor: colors.leaf },
  itemText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.onDark, flex: 1 },
});
