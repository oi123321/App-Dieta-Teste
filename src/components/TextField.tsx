import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, fonts, noOutline, radius } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Shown under the field when there is no error. */
  hint?: ReactNode;
  error?: string | null;
  /** Fixed text before the value, like "@". */
  prefix?: string;
  /** Element on the right edge (status icon, button…). */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TextField({ label, hint, error, prefix, right, style, multiline, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, multiline && styles.boxMulti, focused && styles.boxFocused, Boolean(error) && styles.boxError]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          {...input}
          multiline={multiline}
          accessibilityLabel={input.accessibilityLabel ?? label}
          placeholderTextColor={colors.muted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMulti, noOutline]}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  boxMulti: { alignItems: 'flex-start', paddingVertical: 4 },
  boxFocused: { borderColor: colors.leaf },
  boxError: { borderColor: colors.tomato },
  prefix: { fontFamily: fonts.bold, fontSize: 15, color: colors.muted, marginRight: 2 },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, paddingVertical: 12, minWidth: 0 },
  inputMulti: { minHeight: 84, lineHeight: 21, textAlignVertical: 'top' },
  hint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 6 },
  error: { fontFamily: fonts.semibold, fontSize: 12.5, lineHeight: 17, color: colors.tomato, marginTop: 6 },
});
