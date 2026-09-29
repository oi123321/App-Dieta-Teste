import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Post } from '../../social/types';
import { colors, fonts, radius } from '../../theme';
import { Ban, EyeOff, Flag, Trash2, UserRound, type LucideIcon } from '../icons';
import { Sheet } from '../Sheet';

const REASONS = ['Spam ou propaganda', 'Conteúdo ofensivo', 'Receita perigosa ou enganosa', 'Cópia sem crédito'];

interface Props {
  post: Post | null;
  isMine: boolean;
  onClose: () => void;
  onProfile: (post: Post) => void;
  onHide: (post: Post) => void;
  onBlock: (post: Post) => void;
  onReport: (post: Post, reason: string) => void;
  onDelete: (post: Post) => void;
}

export function PostOptionsSheet({ post, isMine, onClose, onProfile, onHide, onBlock, onReport, onDelete }: Props) {
  const [reporting, setReporting] = useState(false);
  const close = () => {
    setReporting(false);
    onClose();
  };
  const run = (fn: (post: Post) => void) => () => {
    if (!post) return;
    setReporting(false);
    fn(post);
  };

  const options: { icon: LucideIcon; label: string; onPress: () => void; danger?: boolean }[] = !post
    ? []
    : isMine
      ? [{ icon: Trash2, label: 'Excluir receita', onPress: run(onDelete), danger: true }]
      : [
          { icon: UserRound, label: `Ver perfil de @${post.author.username}`, onPress: run(onProfile) },
          { icon: EyeOff, label: 'Não mostrar esta receita', onPress: run(onHide) },
          { icon: Ban, label: `Bloquear @${post.author.username}`, onPress: run(onBlock) },
          { icon: Flag, label: 'Denunciar', onPress: () => setReporting(true), danger: true },
        ];

  return (
    <Sheet visible={Boolean(post)} onClose={close}>
      <Text style={styles.title} numberOfLines={1}>
        {reporting ? 'Qual é o problema?' : (post?.title ?? '')}
      </Text>
      <View style={styles.group}>
        {reporting
          ? REASONS.map((reason, i) => (
              <Pressable
                key={reason}
                style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && styles.pressed]}
                onPress={run((p) => onReport(p, reason))}
                accessibilityRole="button"
              >
                <Text style={styles.label}>{reason}</Text>
              </Pressable>
            ))
          : options.map((option, i) => (
              <Pressable
                key={option.label}
                style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && styles.pressed]}
                onPress={option.onPress}
                accessibilityRole="button"
              >
                <option.icon size={19} color={option.danger ? colors.tomato : colors.forest} strokeWidth={2.2} />
                <Text style={[styles.label, option.danger && { color: colors.tomato }]}>{option.label}</Text>
              </Pressable>
            ))}
      </View>
      <Pressable style={styles.cancel} onPress={reporting ? () => setReporting(false) : close} accessibilityRole="button">
        <Text style={styles.cancelText}>{reporting ? 'Voltar' : 'Cancelar'}</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, marginBottom: 12 },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  border: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  pressed: { backgroundColor: colors.leafMist },
  label: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  cancel: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  cancelText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.inkSoft },
});
