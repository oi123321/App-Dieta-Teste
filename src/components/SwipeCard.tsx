import { LinearGradient } from 'expo-linear-gradient';
import { Info, Timer, Users } from './icons';
import { useEffect, useImperativeHandle, type Ref } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Recipe } from '../data/types';
import { brl, minutesLabel } from '../lib/format';
import { recipeTags } from '../lib/recipes';
import { colors, fonts, radius, shadow } from '../theme';
import { RecipeImage } from './RecipeImage';
import { TagRow } from './Tags';

export type SwipeDirection = 'like' | 'skip';

export interface SwipeCardHandle {
  swipe: (dir: SwipeDirection) => void;
}

interface Props {
  recipe: Recipe;
  depth: number;
  width: number;
  height: number;
  price: number;
  servings: number;
  onSwiped: (dir: SwipeDirection) => void;
  onInfo: () => void;
  ref?: Ref<SwipeCardHandle>;
}

export function SwipeCard({ recipe, depth, width, height, price, servings, onSwiped, onInfo, ref }: Props) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const d = useSharedValue(depth);
  const threshold = width * 0.3;

  useEffect(() => {
    d.value = withTiming(depth, { duration: 260 });
  }, [depth, d]);

  const fly = (dir: SwipeDirection) => {
    'worklet';
    const sign = dir === 'like' ? 1 : -1;
    x.value = withTiming(sign * width * 1.5, { duration: 280 }, (finished) => {
      if (finished) scheduleOnRN(onSwiped, dir);
    });
    y.value = withTiming(y.value + 30, { duration: 280 });
  };

  useImperativeHandle(ref, () => ({ swipe: (dir) => fly(dir) }));

  const pan = Gesture.Pan()
    .enabled(depth === 0)
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY * 0.35;
    })
    .onEnd((e) => {
      if (x.value > threshold || e.velocityX > 900) fly('like');
      else if (x.value < -threshold || e.velocityX < -900) fly('skip');
      else {
        x.value = withSpring(0, { damping: 16 });
        y.value = withSpring(0, { damping: 16 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + d.value * 10 },
      { translateY: y.value + d.value * 10 },
      { rotate: `${x.value / 22 + d.value * 3}deg` },
      { scale: 1 - d.value * 0.05 },
    ],
  }));
  const likeStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [15, threshold], [0, 1], Extrapolation.CLAMP) }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-threshold, -15], [1, 0], Extrapolation.CLAMP) }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.card, { width, height, zIndex: 10 - depth }, cardStyle]}
        pointerEvents={depth === 0 ? 'auto' : 'none'}
      >
        {/* pointerEvents none stops browsers from starting a native image drag on mouse down. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <RecipeImage recipe={recipe} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(10,22,14,0)', 'rgba(10,22,14,0.82)']} style={styles.shade} />
        </View>

        <View style={styles.pricePill}>
          <Text style={styles.priceText}>+{brl(price)}</Text>
        </View>
        {depth === 0 ? (
          <Pressable
            style={styles.info}
            onPress={onInfo}
            accessibilityRole="button"
            accessibilityLabel={`Ver receita ${recipe.title}`}
            hitSlop={8}
          >
            <Info size={18} color={colors.onDark} strokeWidth={2.4} />
          </Pressable>
        ) : null}

        <Animated.View style={[styles.stamp, styles.stampLike, likeStyle]}>
          <Text style={[styles.stampText, { color: colors.leaf }]}>ADICIONAR</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampSkip, skipStyle]}>
          <Text style={[styles.stampText, { color: colors.tomato }]}>PULAR</Text>
        </Animated.View>

        <View style={styles.bottom}>
          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Timer size={13} color={colors.onDark} strokeWidth={2.4} />
              <Text style={styles.metaText}>{minutesLabel(recipe.minutes)}</Text>
            </View>
            <View style={styles.meta}>
              <Users size={13} color={colors.onDark} strokeWidth={2.4} />
              <Text style={styles.metaText}>serve {servings}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <TagRow tags={recipeTags(recipe)} max={3} variant="white" style={{ marginTop: 10 }} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.creamDeep,
    ...shadow(2),
  },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%' },
  pricePill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...shadow(1),
  },
  priceText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.forest },
  info: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15,30,20,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    position: 'absolute',
    top: 64,
    borderWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stampLike: { left: 20, borderColor: colors.leaf, transform: [{ rotate: '-12deg' }] },
  stampSkip: { right: 20, borderColor: colors.tomato, transform: [{ rotate: '12deg' }] },
  stampText: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 1 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.onDark },
  title: { fontFamily: fonts.display, fontSize: 27, lineHeight: 30, color: colors.onDark, letterSpacing: -0.7 },
});
