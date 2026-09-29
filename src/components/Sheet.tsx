import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, GUTTER } from '../theme';
import { useFrameRect } from './PhoneFrame';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet over the current screen (kept inside the phone frame on the web preview). */
export function Sheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const frame = useFrameRect();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.area, frame ? { ...frame, borderRadius: 40 } : styles.fill]}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { paddingBottom: (frame ? 0 : insets.bottom) + 18 }]}>
            <View style={styles.handle} />
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12, 28, 18, 0.45)' },
  area: { position: 'absolute', justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { left: 0, right: 0, top: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 14 },
});
