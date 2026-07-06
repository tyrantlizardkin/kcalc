import React from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../theme';

export function Field({
  label,
  value,
  onChange,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={colors.comment}
      />
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
});