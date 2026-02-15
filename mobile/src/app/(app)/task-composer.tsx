import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Paperclip,
  Sparkles,
  Play,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/lib/store';
import type { TaskMode } from '@/lib/types';

// ---- Design Tokens ----
const DS = {
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
  brandText: '#FFFFFF',
  brand: '#2563EB',
  gradient: ['#2563EB', '#1D4ED8'] as const,
};

// ---- Quick Prompts ----
const QUICK_PROMPTS = [
  'Check my email',
  'Search for flights',
  'Summarize today',
  'Research [topic]',
];

// ---- Mode Card Component ----
function ModeCard({
  mode,
  selected,
  onPress,
}: {
  mode: TaskMode;
  selected: boolean;
  onPress: () => void;
}) {
  const isAskFirst = mode === 'ask_first';
  const Icon = isAskFirst ? ShieldCheck : Zap;
  const title = isAskFirst ? 'Ask First' : 'Autopilot';
  const description = isAskFirst
    ? 'Agent will ask before taking important actions'
    : 'Agent acts independently, notifies when done';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeCard,
        selected && styles.modeCardSelected,
      ]}
    >
      <Icon
        size={22}
        color={selected ? DS.text : DS.textTertiary}
      />
      <Text
        style={[
          styles.modeTitle,
          selected && { color: DS.text },
        ]}
      >
        {title}
      </Text>
      <Text style={styles.modeDescription} numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
}

// ---- Main Screen ----
export default function TaskComposerScreen() {
  const router = useRouter();
  const addTask = useAppStore((s) => s.addTask);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const agents = useAppStore((s) => s.agents);

  const [prompt, setPrompt] = useState<string>('');
  const [mode, setMode] = useState<TaskMode>('ask_first');
  const inputRef = useRef<TextInput>(null);

  const canStart = prompt.trim().length > 0;

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickPrompt = useCallback((text: string) => {
    setPrompt(text);
    inputRef.current?.focus();
  }, []);

  const handleStart = useCallback(() => {
    if (!canStart) return;

    Keyboard.dismiss();

    const agentId = selectedAgentId ?? agents[0]?.id ?? 'agent-1';
    const taskId = `task-${Date.now()}`;
    const title =
      prompt.trim().length > 50
        ? prompt.trim().slice(0, 50) + '...'
        : prompt.trim();

    addTask({
      id: taskId,
      agentId,
      title,
      prompt: prompt.trim(),
      mode,
      status: 'running',
      events: [],
      createdAt: new Date().toISOString(),
      progress: 0,
    });

    router.replace({
      pathname: '/task-detail' as never,
      params: { id: taskId },
    });
  }, [canStart, prompt, mode, selectedAgentId, agents, addTask, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: DS.bg },
          headerShadowVisible: false,
          headerTintColor: DS.text,
          headerTitle: '',
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (router.canGoBack()) {
                  router.back();
                }
              }}
              style={styles.backButton}
            >
              <ArrowLeft size={20} color={DS.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleStart}
              disabled={!canStart}
              style={[
                styles.headerStartButton,
                !canStart && styles.headerStartButtonDisabled,
              ]}
            >
              {canStart ? (
                <LinearGradient
                  colors={[...DS.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headerStartGradient}
                >
                  <Text style={styles.headerStartText}>Start</Text>
                </LinearGradient>
              ) : (
                <Text
                  style={[
                    styles.headerStartText,
                    styles.headerStartTextDisabled,
                  ]}
                >
                  Start
                </Text>
              )}
            </Pressable>
          ),
        }}
      />

      <SafeAreaView edges={['bottom']} style={styles.flex1}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---- Header ---- */}
          <Animated.View entering={FadeInDown.duration(400).delay(0)}>
            <Text style={styles.screenTitle}>New Task</Text>
          </Animated.View>

          {/* ---- Prompt Input ---- */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="What should your agent do?"
                placeholderTextColor={DS.textTertiary}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                textAlignVertical="top"
                returnKeyType="default"
              />
            </View>
          </Animated.View>

          {/* ---- Mode Selector ---- */}
          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <Text style={styles.sectionLabel}>Mode</Text>
            <View style={styles.modeRow}>
              <ModeCard
                mode="ask_first"
                selected={mode === 'ask_first'}
                onPress={() => setMode('ask_first')}
              />
              <ModeCard
                mode="autopilot"
                selected={mode === 'autopilot'}
                onPress={() => setMode('autopilot')}
              />
            </View>
          </Animated.View>

          {/* ---- Attachments ---- */}
          <Animated.View entering={FadeInDown.duration(400).delay(240)}>
            <Pressable style={styles.attachmentRow}>
              <Paperclip size={18} color={DS.textTertiary} />
              <Text style={styles.attachmentText}>Add attachments</Text>
              <Text style={styles.attachmentHint}>Coming soon</Text>
            </Pressable>
          </Animated.View>

          {/* ---- Quick Prompts ---- */}
          <Animated.View entering={FadeInDown.duration(400).delay(320)}>
            <View style={styles.suggestionsHeader}>
              <Sparkles size={14} color={DS.textSecondary} />
              <Text style={styles.sectionLabel2}>Suggestions</Text>
            </View>
            <View style={styles.pillsWrap}>
              {QUICK_PROMPTS.map((qp) => (
                <Pressable
                  key={qp}
                  onPress={() => handleQuickPrompt(qp)}
                  style={({ pressed }) => [
                    styles.pill,
                    pressed && styles.pillPressed,
                  ]}
                >
                  <Text style={styles.pillText}>{qp}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Spacer */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ---- Bottom Start Button ---- */}
        <View style={styles.bottomBar}>
          <Animated.View entering={FadeInUp.duration(400).delay(400)}>
            <Pressable
              onPress={handleStart}
              disabled={!canStart}
              style={!canStart ? styles.startButtonDisabled : undefined}
            >
              {canStart ? (
                <LinearGradient
                  colors={[...DS.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButton}
                >
                  <Play
                    size={18}
                    color={DS.brandText}
                    fill={DS.brandText}
                  />
                  <Text style={styles.startButtonText}>Start Task</Text>
                </LinearGradient>
              ) : (
                <View style={styles.startButtonDisabled}>
                  <Play
                    size={18}
                    color={DS.textTertiary}
                    fill={DS.textTertiary}
                  />
                  <Text
                    style={[styles.startButtonText, styles.startButtonTextDisabled]}
                  >
                    Start Task
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Back Button
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header Start
  headerStartButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerStartButtonDisabled: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: DS.surfaceSecondary,
    borderRadius: 12,
  },
  headerStartGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerStartText: {
    color: DS.brandText,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
  headerStartTextDisabled: {
    color: DS.textTertiary,
  },

  // Screen Title
  screenTitle: {
    color: DS.text,
    fontSize: 28,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 24,
  },

  // Input
  inputContainer: {
    backgroundColor: DS.surface,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: DS.border,
  },
  textInput: {
    color: DS.text,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 24,
    padding: 16,
    minHeight: 120,
    maxHeight: 200,
  },

  // Section Label
  sectionLabel: {
    color: DS.textSecondary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    marginBottom: 8,
  },

  // Mode Cards
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    backgroundColor: DS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: DS.border,
    gap: 8,
  },
  modeCardSelected: {
    borderColor: DS.brand,
  },
  modeTitle: {
    color: DS.textSecondary,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
  modeDescription: {
    color: DS.textTertiary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 17,
  },

  // Attachments
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: DS.border,
  },
  attachmentText: {
    color: DS.textSecondary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
    flex: 1,
  },
  attachmentHint: {
    color: DS.textTertiary,
    fontSize: 11,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Suggestions
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionLabel2: {
    color: DS.textSecondary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: DS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: DS.border,
  },
  pillPressed: {
    borderColor: DS.brand,
  },
  pillText: {
    color: DS.textSecondary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DS.bg,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: DS.border,
  },

  // Start Button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 12,
  },
  startButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 12,
    backgroundColor: DS.surfaceSecondary,
  },
  startButtonText: {
    color: DS.brandText,
    fontSize: 17,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
  startButtonTextDisabled: {
    color: DS.textTertiary,
  },
});
