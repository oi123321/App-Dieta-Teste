import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { colors, fonts, radius, shadow } from '../theme';

/** Short confirmation message; `show` replaces the current one. */
export function useToast(duration = 2400): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);
  const show = useCallback(
    (text: string) => {
      clearTimeout(timer.current ?? undefined);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );
  return [message, show];
}

export function Toast({ message, style }: { message: string | null; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      {message ? (
        <Animated.View key={message} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(160)}>
          <View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Text style={styles.text}>{message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center' },
  toast: {
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxWidth: 340,
    ...shadow(2),
  },
  text: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.onDark, textAlign: 'center' },
});
