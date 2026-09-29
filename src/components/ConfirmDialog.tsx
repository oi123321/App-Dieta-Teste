import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, GUTTER, radius, shadow } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app confirmation (works the same on iOS, Android and the web preview). */
export function ConfirmDialog({ visible, title, message, confirmLabel, destructive, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Fechar">
        <Pressable style={styles.card} onPress={() => {}} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: destructive ? colors.tomato : colors.forest }]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 28, 18, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GUTTER + 8,
  },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: radius.xl, padding: 22, ...shadow(3) },
  title: { fontFamily: fonts.display, fontSize: 21, color: colors.ink, letterSpacing: -0.4 },
  message: { fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 20, color: colors.inkSoft, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.cream },
  cancelText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  confirmText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.onDark },
});
