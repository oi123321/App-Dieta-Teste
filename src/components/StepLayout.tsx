import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from './icons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, GUTTER, type } from '../theme';
import { IconButton } from './IconButton';
import { ProgressHeader } from './ProgressHeader';

export const ONBOARDING_STEPS = 5;

interface Props {
  /** Onboarding step (1-based). Omit for the "edit from profile" mode. */
  step?: number;
  editLabel?: string;
  title: ReactNode;
  subtitle?: string;
  onBack?: () => void;
  footer: ReactNode;
  children: ReactNode;
}

export function StepLayout({ step, editLabel, title, subtitle, onBack, footer, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {step ? (
          <ProgressHeader step={step} total={ONBOARDING_STEPS} onBack={onBack} />
        ) : (
          <View style={styles.editHeader}>
            <IconButton icon={ArrowLeft} label="Voltar" onPress={onBack} />
            {editLabel ? <Text style={styles.editLabel}>{editLabel}</Text> : null}
            <View style={{ width: 42 }} />
          </View>
        )}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={type.h1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]} pointerEvents="box-none">
        <LinearGradient colors={['rgba(248,244,234,0)', colors.cream]} style={styles.fade} pointerEvents="none" />
        <View style={styles.footerInner}>{footer}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: GUTTER, paddingBottom: 6 },
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  scroll: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: 18 },
  subtitle: { ...type.body, marginTop: 8 },
  body: { marginTop: 22 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.cream },
  fade: { position: 'absolute', left: 0, right: 0, top: -36, height: 36 },
  footerInner: { backgroundColor: colors.cream, paddingHorizontal: GUTTER, paddingTop: 4 },
});
