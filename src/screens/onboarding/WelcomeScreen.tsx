import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from '../../components/icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '../../components/Brand';
import { Button } from '../../components/Button';
import { Emoji } from '../../components/Emoji';
import { useScreenSize } from '../../components/PhoneFrame';
import { COVERS } from '../../data/covers';
import type { EmojiName } from '../../data/emoji';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, GUTTER, radius, shadow, type } from '../../theme';

const FEATURES: { emoji: EmojiName; text: string }[] = [
  { emoji: 'money-bag', text: 'Cardápio que cabe no seu orçamento' },
  { emoji: 'shopping-cart', text: 'Lista por corredor do seu mercado' },
  { emoji: 'speech-balloon', text: 'Receitas da comunidade e do TikTok' },
];

export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  const insets = useSafeAreaInsets();
  const { height } = useScreenSize();
  const compact = height < 760;
  const cardW = compact ? 150 : 172;
  const cardH = cardW * 1.28;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <Logo size={30} />
          <View style={styles.topPill}>
            <View style={styles.dot} />
            <Text style={styles.topPillText}>PLANO SEMANAL</Text>
          </View>
        </View>

        <View style={[styles.hero, { height: cardH + (compact ? 40 : 64) }]}>
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.layer}>
            <View
              style={[
                styles.card,
                { width: cardW, height: cardH, transform: [{ translateX: -cardW * 0.46 }, { rotate: '-11deg' }] },
              ]}
            >
              <Image source={COVERS['moqueca']} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.layer}>
            <View
              style={[
                styles.card,
                { width: cardW, height: cardH, transform: [{ translateX: cardW * 0.46 }, { rotate: '10deg' }] },
              ]}
            >
              <Image source={COVERS['frango-curry']} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(350).duration(650)} style={styles.layer}>
            <View style={[styles.card, styles.cardFront, { width: cardW + 16, height: cardH + 16 }]}>
              <Image source={COVERS['frango-airfryer']} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(10,25,15,0.78)']} style={styles.cardShade} />
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>+R$ 16,40</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                Frango na air fryer com legumes
              </Text>
            </View>
          </Animated.View>
          <Animated.View
            entering={FadeInUp.delay(700).duration(500)}
            style={[styles.sticker, { left: 6, top: compact ? 8 : 18 }]}
          >
            <Emoji name="check-mark-button" size={18} />
            <Text style={styles.stickerText}>Lista pronta</Text>
          </Animated.View>
          <Animated.View
            entering={FadeInUp.delay(850).duration(500)}
            style={[styles.sticker, { right: 4, bottom: compact ? 4 : 14 }]}
          >
            <Emoji name="money-bag" size={18} />
            <Text style={styles.stickerText}>R$ 148 de R$ 250</Text>
          </Animated.View>
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={[type.h1, compact && { fontSize: 29, lineHeight: 32 }]} accessibilityRole="header">
          a semana inteira de jantares, <Text style={{ color: colors.leaf }}>resolvida em segundos</Text>
        </Text>
        <Text style={styles.sub}>Escolha seu mercado, diga quanto gasta e receba um cardápio com a lista de compras pronta.</Text>
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Emoji name={f.emoji} size={20} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <Button label="Começar" icon={ArrowRight} onPress={() => navigation.navigate('CreateProfile')} />
        <Text style={styles.caption}>Leva cerca de 1 minuto</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.forest },
  top: { flex: 1, paddingHorizontal: GUTTER },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.leaf },
  topPillText: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.2, color: colors.onDark },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.creamDeep,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    ...shadow(3),
  },
  cardFront: { justifyContent: 'flex-end' },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  cardTitle: { fontFamily: fonts.display, fontSize: 17, lineHeight: 19, color: colors.onDark, padding: 12, letterSpacing: -0.4 },
  pricePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  priceText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.forest },
  sticker: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    ...shadow(2),
  },
  stickerText: { fontFamily: fonts.extrabold, fontSize: 12.5, color: colors.ink },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: GUTTER,
    paddingTop: 26,
  },
  sub: { ...type.body, marginTop: 10 },
  features: { marginTop: 16, marginBottom: 20, gap: 10 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink, flex: 1 },
  caption: { ...type.small, textAlign: 'center', marginTop: 10, color: colors.muted },
});
