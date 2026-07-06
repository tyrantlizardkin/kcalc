import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function ModalShell({
  visible,
  title,
  onClose,
  onSave,
  saveDisabled = false,
  saveLabel = 'SAVE',
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          accessibilityLabel="Close modal"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          <View style={styles.buttons}>
            <Pressable accessibilityRole="button" style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saveDisabled}
              style={[styles.save, saveDisabled && styles.saveDisabled]}
              onPress={onSave}
            >
              <Text style={[styles.saveText, saveDisabled && styles.saveTextDisabled]}>{saveLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bgDark, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '80%' },
  title: { fontFamily: fonts.condensedBlack, fontSize: 22, color: colors.fg, marginBottom: 16 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancel: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center' },
  cancelText: { fontFamily: fonts.condensed, fontSize: 15, color: colors.muted, letterSpacing: 2 },
  save: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: 'rgba(80,250,123,0.12)', borderWidth: 1, borderColor: 'rgba(80,250,123,0.3)', alignItems: 'center' },
  saveDisabled: { opacity: 0.45 },
  saveText: { fontFamily: fonts.condensed, fontSize: 15, color: colors.green, letterSpacing: 2 },
  saveTextDisabled: { color: colors.muted },
});