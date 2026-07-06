import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { useFonts, BarlowCondensed_400Regular, BarlowCondensed_700Bold, BarlowCondensed_900Black } from '@expo-google-fonts/barlow-condensed';
import { PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { TabBar, TabKey } from './src/components/TabBar';
import { colors } from './src/theme';
import { Placeholder } from './src/screens/Placeholder';
import { TodayScreen } from './src/screens/TodayScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { ManualMealModal } from './src/screens/ManualMealModal';
import { WeightModal } from './src/screens/WeightModal';
import { SettingsModal } from './src/screens/SettingsModal';

export default function App() {
  const [tab, setTab] = useState<TabKey>('today');
  const [reloadKey, setReloadKey] = useState(0);
  const [mealOpen, setMealOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_700Bold,
    BarlowCondensed_900Black,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const bumpReload = () => setReloadKey((k) => k + 1);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {tab === 'today' && captureOpen && (
          <CaptureScreen
            onCaptured={() => setCaptureOpen(false)}
            onCancel={() => setCaptureOpen(false)}
          />
        )}
        {tab === 'today' && !captureOpen && (
          <TodayScreen
            onLogMealPhoto={() => setCaptureOpen(true)}
            onLogMealManual={() => setMealOpen(true)}
            onAddWeight={() => setWeightOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            reloadKey={reloadKey}
          />
        )}
        {tab === 'chat' && <Placeholder label="CHAT" />}
        {tab === 'trends' && <Placeholder label="TRENDS" />}
      </View>
      <TabBar active={tab} onChange={setTab} />
      <ManualMealModal visible={mealOpen} onClose={() => setMealOpen(false)} onSaved={bumpReload} />
      <WeightModal visible={weightOpen} onClose={() => setWeightOpen(false)} onSaved={bumpReload} />
      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={bumpReload} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});