import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function OfflineBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>OFFLINE — manual and SFL logging still work. AI features are unavailable.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(255,184,108,0.12)', borderWidth: 1, borderColor: 'rgba(255,184,108,0.3)', borderRadius: 8, padding: 10, marginBottom: 12 },
  text: { color: colors.orange, fontFamily: fonts.body, fontSize: 12 },
});
