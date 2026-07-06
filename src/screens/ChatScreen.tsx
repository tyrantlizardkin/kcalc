import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getRepos } from '../db';
import { sendChatMessage } from '../api/chat';
import { addDays, todayIso } from '../lib/dates';
import { colors, fonts } from '../theme';
import { ChatMessage } from '../types';

export function ChatScreen() {
  const [date, setDate] = useState(todayIso());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isToday = date === todayIso();

  const load = useCallback(async () => {
    const repos = await getRepos();
    setMessages(await repos.chat.listByDate(date));
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    try {
      const repos = await getRepos();
      await repos.chat.add(date, 'user', text);
      const reply = await sendChatMessage(text, date, repos);
      await repos.chat.add(date, 'model', reply);
      await load();
      scrollRef.current?.scrollToEnd({ animated: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.dateNav}>
        <Pressable accessibilityLabel="Previous day" accessibilityRole="button" onPress={() => setDate((d) => addDays(d, -1))}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{date}</Text>
        <Pressable
          accessibilityLabel="Next day"
          accessibilityRole="button"
          disabled={isToday}
          onPress={() => setDate((d) => addDays(d, 1))}
        >
          <Text style={[styles.navArrow, isToday && styles.navArrowDisabled]}>›</Text>
        </Pressable>
      </View>
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}>
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
        {messages.length === 0 && <Text style={styles.empty}>No messages yet.</Text>}
      </ScrollView>
      {isToday && (
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Chat message"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Log a meal, weight, or ask a question..."
            placeholderTextColor={colors.comment}
            editable={!sending}
          />
          <Pressable accessibilityLabel="Send" accessibilityRole="button" style={styles.send} disabled={sending} onPress={send}>
            <Text style={styles.sendText}>{sending ? '...' : 'SEND'}</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 10 },
  navArrow: { color: colors.green, fontSize: 22 },
  navArrowDisabled: { color: colors.comment },
  dateLabel: { color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 13 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 8 },
  empty: { color: colors.comment, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 20 },
  bubble: { maxWidth: '85%', borderRadius: 10, padding: 10 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: 'rgba(80,250,123,0.12)' },
  bubbleModel: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  bubbleText: { color: colors.fg, fontFamily: fonts.body, fontSize: 14 },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  input: { flex: 1, backgroundColor: colors.bgDark, borderRadius: 8, paddingHorizontal: 12, color: colors.fg, fontFamily: fonts.body },
  send: { justifyContent: 'center', paddingHorizontal: 14, borderRadius: 8, backgroundColor: 'rgba(80,250,123,0.12)' },
  sendText: { color: colors.green, fontFamily: fonts.condensedBlack, letterSpacing: 1 },
});
