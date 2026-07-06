import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { colors, fonts } from '../theme';

export function CaptureScreen({
  onCaptured,
  onCancel,
}: {
  onCaptured: (photoBase64: string, photoUri: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('back');
  const ref = useRef<CameraView>(null);

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is needed to log a meal by photo.</Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>GRANT ACCESS</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.cancel} onPress={onCancel}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>
      </View>
    );
  }

  const takePhoto = async () => {
    const photo = await ref.current?.takePictureAsync({ base64: true, quality: 0.7 });
    if (photo?.base64 && photo.uri) onCaptured(photo.base64, photo.uri);
  };

  return (
    <View style={styles.root}>
      <CameraView ref={ref} style={styles.camera} facing={facing} />
      <View style={styles.controls}>
        <Pressable accessibilityLabel="Cancel" accessibilityRole="button" style={styles.cancel} onPress={onCancel}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>
        <Pressable accessibilityLabel="Take photo" accessibilityRole="button" style={styles.shutter} onPress={takePhoto} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  camera: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.bgDark },
  message: { color: colors.fg, fontFamily: fonts.body, fontSize: 15, textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, backgroundColor: colors.bgDark },
  shutter: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green },
  button: { backgroundColor: 'rgba(80,250,123,0.12)', borderWidth: 1, borderColor: 'rgba(80,250,123,0.3)', borderRadius: 8, padding: 14 },
  buttonText: { color: colors.green, fontFamily: fonts.condensed, fontSize: 15, letterSpacing: 2 },
  cancel: { padding: 14 },
  cancelText: { color: colors.muted, fontFamily: fonts.condensed, fontSize: 15, letterSpacing: 2 },
});
