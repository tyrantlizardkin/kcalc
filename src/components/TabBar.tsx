import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export type TabKey = 'today' | 'chat' | 'trends';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'TODAY' },
  { key: 'chat', label: 'CHAT' },
  { key: 'trends', label: 'TRENDS' },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityLabel={`${tab.label} tab`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.label, selected && styles.active]}>{tab.label}</Text>
            <View style={[styles.dot, selected && styles.dotActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgDark,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 48, justifyContent: 'center' },
  label: { color: colors.comment, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2 },
  active: { color: colors.green },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  dotActive: { backgroundColor: colors.green },
});