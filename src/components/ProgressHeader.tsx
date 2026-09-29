import { ArrowLeft } from './icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '../theme';
import { IconButton } from './IconButton';

export function ProgressHeader({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  const progress = useSharedValue(Math.max(0, (step - 1) / total));
  useEffect(() => {
    progress.value = withTiming(step / total, { duration: 450 });
  }, [step, total, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={styles.row}>
      {onBack ? <IconButton icon={ArrowLeft} label="Voltar" onPress={onBack} /> : <View style={{ width: 42 }} />}
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: step }}
        accessibilityLabel={`Etapa ${step} de ${total}`}
      >
        <Animated.View style={[styles.fill, fill]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  track: { flex: 1, height: 8, borderRadius: 8, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: colors.leaf },
});
