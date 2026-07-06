import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function Placeholder({ label }: { label: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.muted, fontFamily: fonts.condensedBlack, fontSize: 32, letterSpacing: 2 },
});