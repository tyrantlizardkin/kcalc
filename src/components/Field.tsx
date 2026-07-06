import React from 'react';
import { KeyboardTypeOptions, ReturnKeyTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../theme';

export function Field({
  label,
  value,
  onChange,
  keyboardType = 'default',
  returnKeyType = 'next',
  error,
  multiline = false,
  numberOfLines = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        returnKeyType={returnKeyType}
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        placeholderTextColor={colors.comment}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.5, color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.fg,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: colors.red },
  error: { color: colors.red, fontFamily: fonts.body, fontSize: 11, marginTop: 5 },
});