import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function ModalShell({
  visible,
  title,
  onClose,
  onSave,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          <View style={styles.buttons}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
            <Pressable style={styles.save} onPress={onSave}>
              <Text style={styles.saveText}>SAVE</Text>
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
  saveText: { fontFamily: fonts.condensed, fontSize: 15, color: colors.green, letterSpacing: 2 },
});