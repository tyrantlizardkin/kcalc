import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { useFonts, BarlowCondensed_400Regular, BarlowCondensed_700Bold, BarlowCondensed_900Black } from '@expo-google-fonts/barlow-condensed';
import { PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { TabBar, TabKey } from './src/components/TabBar';
import { colors } from './src/theme';
import { TodayScreen } from './src/screens/TodayScreen';
import { TrendsScreen } from './src/screens/TrendsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { ConfirmMealScreen } from './src/screens/ConfirmMealScreen';
import { ManualMealModal } from './src/screens/ManualMealModal';
import { WeightModal } from './src/screens/WeightModal';
import { SettingsModal } from './src/screens/SettingsModal';
import { ImportModal } from './src/screens/ImportModal';

export default function App() {
  const [tab, setTab] = useState<TabKey>('today');
  const [reloadKey, setReloadKey] = useState(0);
  const [mealOpen, setMealOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{ base64: string; uri: string } | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
        {tab === 'today' && captureOpen && !capturedPhoto && (
          <CaptureScreen
            onCaptured={(base64, uri) => setCapturedPhoto({ base64, uri })}
            onCancel={() => setCaptureOpen(false)}
          />
        )}
        {tab === 'today' && capturedPhoto && (
          <ConfirmMealScreen
            photoBase64={capturedPhoto.base64}
            photoUri={capturedPhoto.uri}
            onSaved={() => {
              setCapturedPhoto(null);
              setCaptureOpen(false);
              bumpReload();
            }}
            onCancel={() => {
              setCapturedPhoto(null);
              setCaptureOpen(false);
            }}
          />
        )}
        {tab === 'today' && !captureOpen && !capturedPhoto && (
          <TodayScreen
            onLogMealPhoto={() => setCaptureOpen(true)}
            onLogMealManual={() => setMealOpen(true)}
            onAddWeight={() => setWeightOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            reloadKey={reloadKey}
          />
        )}
        {tab === 'chat' && <ChatScreen />}
        {tab === 'trends' && <TrendsScreen reloadKey={reloadKey} />}
      </View>
      <TabBar active={tab} onChange={setTab} />
      <ManualMealModal visible={mealOpen} onClose={() => setMealOpen(false)} onSaved={bumpReload} />
      <WeightModal visible={weightOpen} onClose={() => setWeightOpen(false)} onSaved={bumpReload} />
      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={bumpReload} onOpenImport={() => setImportOpen(true)} />
      <ImportModal visible={importOpen} onClose={() => setImportOpen(false)} onSaved={bumpReload} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});