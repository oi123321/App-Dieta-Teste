import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { haptics } from '../lib/haptics';
import { colors, shadow } from '../theme';

interface Props {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
}

const THUMB = 32;

export function BudgetSlider({ value, min, max, step, onChange, label }: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startRef = useRef(0);
  const lastRef = useRef(value);
  const propsRef = useRef({ min, max, step, onChange });
  propsRef.current = { min, max, step, onChange };

  const toValue = (x: number) => {
    const { min: lo, max: hi, step: st } = propsRef.current;
    const usable = Math.max(1, widthRef.current - THUMB);
    const ratio = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
    return Math.round((lo + ratio * (hi - lo)) / st) * st;
  };

  const emit = (next: number) => {
    if (next !== lastRef.current) {
      lastRef.current = next;
      if (next % (propsRef.current.step * 5) === 0) haptics.select();
      propsRef.current.onChange(next);
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          startRef.current = evt.nativeEvent.locationX;
          emit(toValue(evt.nativeEvent.locationX));
        },
        onPanResponderMove: (_evt, gesture) => emit(toValue(startRef.current + gesture.dx)),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  lastRef.current = value;
  const ratio = (Math.min(max, Math.max(min, value)) - min) / (max - min);
  const usable = Math.max(0, width - THUMB);
  const left = ratio * usable;

  return (
    <View
      style={styles.hit}
      onLayout={(e: LayoutChangeEvent) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const delta = e.nativeEvent.actionName === 'increment' ? step * 5 : -step * 5;
        onChange(Math.min(max, Math.max(min, value + delta)));
      }}
      {...responder.panHandlers}
    >
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: left + THUMB / 2 }]} />
      </View>
      <View style={[styles.thumb, { left }]} pointerEvents="none">
        <View style={styles.thumbDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: 'center' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.creamDeep, overflow: 'hidden', marginHorizontal: 2 },
  fill: { height: '100%', backgroundColor: colors.leaf, borderRadius: 5 },
  thumb: {
    position: 'absolute',
    top: (44 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2),
  },
  thumbDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.forest },
});
