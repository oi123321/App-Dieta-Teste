import { createContext, useContext, type ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors } from '../theme';

const FrameContext = createContext<{ width: number; height: number } | null>(null);

const FRAME_W = 402;
const FRAME_MAX_H = 874;

/**
 * The app is phone-only. On the web preview it is shown inside a phone-sized
 * frame when the browser is wider than a phone; on devices it renders as-is.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const window = useWindowDimensions();
  if (Platform.OS !== 'web' || window.width <= 520) {
    return <FrameContext.Provider value={null}>{children}</FrameContext.Provider>;
  }
  const height = Math.min(FRAME_MAX_H, window.height - 40);
  return (
    <View style={styles.backdrop}>
      <View style={[styles.frame, { width: FRAME_W, height }]}>
        <FrameContext.Provider value={{ width: FRAME_W - 16, height: height - 16 }}>{children}</FrameContext.Provider>
      </View>
    </View>
  );
}

/** Size of the app viewport (the phone frame on wide web screens). */
export function useScreenSize() {
  const frame = useContext(FrameContext);
  const window = useWindowDimensions();
  return frame ?? { width: window.width, height: window.height };
}

/**
 * Where the phone frame sits in the browser window, or null on devices.
 * Modals cover the whole window, so they use this to stay inside the phone.
 */
export function useFrameRect() {
  const frame = useContext(FrameContext);
  const window = useWindowDimensions();
  if (!frame) return null;
  return {
    left: (window.width - frame.width) / 2,
    top: (window.height - frame.height) / 2,
    width: frame.width,
    height: frame.height,
  };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12281C',
  },
  frame: {
    borderRadius: 48,
    borderWidth: 8,
    borderColor: '#060A08',
    overflow: 'hidden',
    backgroundColor: colors.cream,
  },
});
