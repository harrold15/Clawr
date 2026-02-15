import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Mic,
  Send,
  Image as ImageIcon,
  X,
  Camera,
  Bell,
  CheckCircle2,
  Loader,
  Eye,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';
import { api } from '@/lib/api/api';

// Design tokens — dark theme
const DS = {
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
  brand: '#FFFFFF',
  brandLight: '#27272A',
  brandText: '#000000',
} as const;

interface TaskData {
  title: string;
  steps: string[];
  estimatedTime: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
  isLoading?: boolean;
  task?: TaskData;
}

const SUGGESTIONS = [
  { title: 'Handle my inbox', subtitle: 'summarize and draft replies' },
  { title: 'Research a topic', subtitle: 'and compile key findings' },
  { title: 'Schedule meetings', subtitle: 'based on my calendar' },
  { title: 'Write a document', subtitle: 'from my notes and ideas' },
];

// ─── Loading Dots ───────────────────────────────────────
function LoadingDots() {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex(prev => (prev + 1) % 3);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4, width: 30 }}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: dotIndex === i ? DS.text : DS.textTertiary,
          }}
        />
      ))}
    </View>
  );
}

// ─── Task Progress Card ─────────────────────────────────
function TaskCard({ task }: { task: TaskData }) {
  const [completedSteps, setCompletedSteps] = useState(0);
  const totalSteps = task.steps.length;
  const allStepsDone = completedSteps >= totalSteps;

  useEffect(() => {
    if (completedSteps >= totalSteps) return;
    const delay = 2000 + Math.random() * 2000;
    const timer = setTimeout(() => {
      setCompletedSteps(prev => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [completedSteps, totalSteps]);

  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const statusLabel = completedSteps === 0
    ? 'Starting task...'
    : `Working on it... ${completedSteps}/${totalSteps} steps`;

  return (
    <View style={taskStyles.card}>
      {/* Header Row - Title, Progress, Time */}
      <View style={taskStyles.headerRow}>
        <View style={taskStyles.titleSection}>
          <Zap size={14} color={DS.text} />
          <Text style={taskStyles.title}>{task.title}</Text>
        </View>
        <Text style={taskStyles.time}>{task.estimatedTime}</Text>
      </View>

      {/* Progress bar */}
      <View style={taskStyles.progressTrack}>
        <View
          style={[
            taskStyles.progressFill,
            {
              width: `${progress}%` as never,
              backgroundColor: DS.text,
            },
          ]}
        />
      </View>

      {/* Steps - Horizontal/Compact */}
      <View style={taskStyles.stepsCompact}>
        {task.steps.map((step, idx) => {
          const isDone = idx < completedSteps;
          const isActive = idx === completedSteps && !allStepsDone;

          return (
            <View key={idx} style={taskStyles.stepItemCompact}>
              <View style={taskStyles.stepIconWrapper}>
                {isDone ? (
                  <CheckCircle2 size={12} color={DS.text} />
                ) : isActive ? (
                  <Loader size={12} color={DS.textSecondary} />
                ) : (
                  <View style={taskStyles.stepDotSmall} />
                )}
              </View>
              <Text
                style={[
                  taskStyles.stepTextCompact,
                  isDone && { color: DS.text },
                  isActive && { color: DS.text },
                  !isDone && !isActive && { color: DS.textTertiary },
                ]}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Status / View Task Button */}
      {allStepsDone ? (
        <Pressable style={taskStyles.viewButton}>
          <Eye size={14} color={DS.brandText} />
          <Text style={taskStyles.viewButtonText}>Working... View Task</Text>
        </Pressable>
      ) : (
        <Text style={taskStyles.statusTextCompact}>
          {statusLabel}
        </Text>
      )}
    </View>
  );
}

// ─── Secret Commands - Generate Task Directly ──────────────
function detectSecretCommand(message: string): TaskData | null {
  const lowerMsg = message.toLowerCase();

  // Secret command keywords
  const taskCommands = [
    { keywords: ['answer all my emails', 'answer my emails', 'reply to emails'],
      title: 'Answer All Emails',
      steps: ['Check inbox for unread emails', 'Analyze email topics and context', 'Draft personalized responses', 'Format and prepare for sending'] },
    { keywords: ['organize my emails', 'sort emails', 'clean inbox'],
      title: 'Organize Inbox',
      steps: ['Scan all emails', 'Categorize by topic', 'Archive old emails', 'Flag important ones'] },
    { keywords: ['summarize my emails', 'email summary'],
      title: 'Email Summary',
      steps: ['Read all unread emails', 'Extract key information', 'Create concise summary', 'Highlight urgent items'] },
  ];

  for (const cmd of taskCommands) {
    if (cmd.keywords.some(keyword => lowerMsg.includes(keyword))) {
      return {
        title: cmd.title,
        steps: cmd.steps,
        estimatedTime: '3 min',
      };
    }
  }

  return null;
}

// ─── Parse task from AI response ────────────────────────
function parseTaskFromReply(reply: string): { task: TaskData | null; text: string } {
  // Try fenced ```task``` block first
  const taskMatch = reply.match(/```task\s*([\s\S]*?)```/);
  if (taskMatch?.[1]) {
    try {
      const parsed = JSON.parse(taskMatch[1].trim());
      if (parsed.title && Array.isArray(parsed.steps)) {
        const text = reply.replace(/```task[\s\S]*?```/, '').trim();
        return { task: parsed as TaskData, text };
      }
    } catch {
      // not valid JSON
    }
  }

  // Try fenced ```json``` block
  const jsonMatch = reply.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch?.[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed.title && Array.isArray(parsed.steps)) {
        const text = reply.replace(/```(?:json)?[\s\S]*?```/, '').trim();
        return { task: parsed as TaskData, text };
      }
    } catch {
      // not valid JSON
    }
  }

  // Try raw JSON in the response
  try {
    const rawMatch = reply.match(/\{[\s\S]*"title"[\s\S]*"steps"[\s\S]*\}/);
    if (rawMatch) {
      const parsed = JSON.parse(rawMatch[0]);
      if (parsed.title && Array.isArray(parsed.steps)) {
        const text = reply.replace(rawMatch[0], '').trim();
        return { task: parsed as TaskData, text };
      }
    }
  } catch {
    // not valid JSON
  }

  return { task: null, text: reply };
}

// ─── Chat Screen ────────────────────────────────────────
export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const chatHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId],
  );

  const handleSuggestionPress = (suggestion: (typeof SUGGESTIONS)[0]) => {
    setMessage(`${suggestion.title} ${suggestion.subtitle}`);
    inputRef.current?.focus();
  };

  const pickImage = useCallback(async () => {
    setShowAttachMenu(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    setShowAttachMenu(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      Alert.alert('Voice Input', 'Voice transcription coming soon');
    } else {
      setIsRecording(true);
      setTimeout(() => setIsRecording(false), 3000);
    }
  }, [isRecording]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 400);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!message.trim() && !selectedImage) return;

    const userText = message.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      image: selectedImage ?? undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSelectedImage(null);
    scrollToEnd();

    // Check for secret commands FIRST
    const secretTask = detectSecretCommand(userText);
    if (secretTask) {
      console.log('[Chat] Secret command detected:', secretTask.title);

      // Add loading message
      const loadingId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        {
          id: loadingId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isLoading: true,
        },
      ]);
      scrollToEnd();

      // Simulate AI thinking time before showing task
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === loadingId
              ? { ...m, isLoading: false, task: secretTask }
              : m,
          ),
        );
        scrollToEnd();
      }, 1500);
      return;
    }

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);
    scrollToEnd();

    // Call backend AI (normal flow)
    try {
      chatHistoryRef.current.push({ role: 'user', content: userText });

      const res = await api.post<{ data: { reply: string; isTask: boolean } }>(
        '/api/chat',
        {
          message: userText,
          history: chatHistoryRef.current.slice(-10),
        },
      );

      console.log('[Chat] Raw response:', JSON.stringify(res));
      const reply = res?.data?.reply ?? "Sorry, I couldn't process that. Please try again.";
      console.log('[Chat] Reply text:', reply);
      const { task, text } = parseTaskFromReply(reply);
      console.log('[Chat] Parsed task:', JSON.stringify(task));
      console.log('[Chat] Parsed text:', text);

      chatHistoryRef.current.push({ role: 'assistant', content: text || reply });

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? { ...m, content: text || (task ? '' : reply), isLoading: false, task: task ?? undefined }
            : m,
        ),
      );
    } catch (err) {
      console.log('[Chat] Error:', err);
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? { ...m, content: "Something went wrong. Please try again.", isLoading: false }
            : m,
        ),
      );
    }
    scrollToEnd();
  }, [message, selectedImage, scrollToEnd]);

  const hasContent = message.trim().length > 0 || selectedImage;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex1}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Image
            source={require('../../../../assets/images/pear-logo-small.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
          <Pressable style={styles.notificationBell}>
            <Bell size={20} color={DS.text} />
          </Pressable>
        </Animated.View>

        {/* Messages Area */}
        <ScrollView
          ref={scrollRef}
          style={styles.flex1}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              {currentAgent ? (
                <Image
                  source={getAvatarImage(currentAgent.avatarId)}
                  style={{ width: 56, height: 56, borderRadius: 28, marginBottom: 16 }}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={styles.emptyTitle}>
                {currentAgent ? `Ask ${currentAgent.name}` : 'What can I help with?'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Ask me to handle tasks, research topics, or automate your workflow
              </Text>
            </View>
          ) : (
            messages.map(msg => (
              <Animated.View
                key={msg.id}
                entering={FadeIn.duration(300)}
                style={{ marginBottom: 12 }}
              >
                {msg.role === 'user' ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.messageBubble, styles.userBubble, { maxWidth: '85%' }]}>
                      {msg.image ? (
                        <Image source={{ uri: msg.image }} style={styles.messageImage} />
                      ) : null}
                      {msg.content ? (
                        <Text style={[styles.messageText, styles.userText]}>{msg.content}</Text>
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <View>
                    {/* Agent name + avatar row */}
                    <View style={styles.assistantMessageContainer}>
                      <Image
                        source={
                          currentAgent
                            ? getAvatarImage(currentAgent.avatarId)
                            : require('../../../../assets/images/pear-logo-small.png')
                        }
                        style={styles.agentAvatar}
                        resizeMode="cover"
                      />
                      <View style={{ gap: 4, flex: 1 }}>
                        {currentAgent ? (
                          <Text style={styles.agentName}>{currentAgent.name}</Text>
                        ) : null}
                        {msg.isLoading ? (
                          <View style={[styles.messageBubble, styles.assistantBubble, { alignSelf: 'flex-start' }]}>
                            <LoadingDots />
                          </View>
                        ) : msg.content ? (
                          <View style={[styles.messageBubble, styles.assistantBubble]}>
                            <Text style={[styles.messageText, styles.assistantText]}>
                              {msg.content}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    {/* Task card - full width below the agent row */}
                    {!msg.isLoading && msg.task ? (
                      <View style={{ marginTop: 8, marginLeft: 40 }}>
                        <TaskCard task={msg.task} />
                      </View>
                    ) : null}
                  </View>
                )}
              </Animated.View>
            ))
          )}
        </ScrollView>

        {/* Bottom Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 80}
        >
          {/* Suggestions - only show when no messages */}
          {messages.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsContainer}
                style={{ flexGrow: 0 }}
              >
                {SUGGESTIONS.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* Selected Image Preview */}
          {selectedImage ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={styles.imagePreviewContainer}
            >
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <Pressable
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <X size={14} color={DS.brandText} />
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Attach Menu */}
          {showAttachMenu ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={styles.attachMenu}
            >
              <Pressable style={styles.attachOption} onPress={takePhoto}>
                <View style={styles.attachIconWrap}>
                  <Camera size={20} color={DS.textSecondary} />
                </View>
                <Text style={styles.attachText}>Camera</Text>
              </Pressable>
              <Pressable style={styles.attachOption} onPress={pickImage}>
                <View style={styles.attachIconWrap}>
                  <ImageIcon size={20} color={DS.textSecondary} />
                </View>
                <Text style={styles.attachText}>Photo Library</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Input Bar */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.inputContainer}
          >
            <Pressable
              style={[styles.addButton, showAttachMenu && styles.addButtonActive]}
              onPress={() => setShowAttachMenu(!showAttachMenu)}
            >
              <Plus
                size={20}
                color={showAttachMenu ? DS.brandText : DS.textSecondary}
                style={showAttachMenu ? { transform: [{ rotate: '45deg' }] } : undefined}
              />
            </Pressable>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Ask anything..."
                placeholderTextColor={DS.textTertiary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={4000}
                onSubmitEditing={sendMessage}
              />
              {hasContent ? (
                <Pressable onPress={sendMessage}>
                  <LinearGradient
                    colors={['#FFFFFF', '#E4E4E7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendButton}
                  >
                    <Send size={16} color={DS.brandText} />
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable onPress={toggleRecording}>
                  {isRecording ? (
                    <LinearGradient
                      colors={['#FFFFFF', '#E4E4E7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.micButton}
                    >
                      <Mic size={16} color={DS.brandText} />
                    </LinearGradient>
                  ) : (
                    <View style={styles.micButton}>
                      <Mic size={16} color={DS.textTertiary} />
                    </View>
                  )}
                </Pressable>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Task Card Styles ───────────────────────────────────
const taskStyles = StyleSheet.create({
  card: {
    backgroundColor: DS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: DS.border,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    color: DS.text,
    flex: 1,
  },
  time: {
    fontSize: 10,
    fontFamily: 'sf-pro-rounded-semibold',
    color: DS.textTertiary,
    minWidth: 40,
    textAlign: 'right',
  },
  progressTrack: {
    height: 3,
    backgroundColor: DS.border,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 1.5,
  },
  stepsContainer: {
    gap: 8,
  },
  stepsCompact: {
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 20,
  },
  stepIconWrapper: {
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: DS.textTertiary,
  },
  stepDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: DS.textTertiary,
  },
  stepText: {
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    flex: 1,
  },
  stepTextCompact: {
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DS.text,
    borderRadius: 10,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    color: DS.brandText,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
    color: DS.textTertiary,
    textAlign: 'center',
  },
  statusTextCompact: {
    fontSize: 11,
    fontFamily: 'sf-pro-rounded-semibold',
    color: DS.textTertiary,
    textAlign: 'center',
  },
});

// ─── Main Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  notificationBell: {
    padding: 8,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 28,
    fontFamily: 'sf-pro-rounded-semibold',
    fontStyle: 'italic',
    color: DS.text,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    color: DS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden' as const,
  },
  messageBubbleOuter: {
    maxWidth: '90%' as const,
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  userBubbleOuter: {
    alignSelf: 'flex-end' as const,
  },
  assistantBubbleOuter: {
    alignSelf: 'flex-start' as const,
  },
  userBubble: {
    backgroundColor: DS.text,
  },
  assistantBubble: {
    backgroundColor: DS.surfaceSecondary,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 22,
  },
  userText: {
    color: DS.brandText,
  },
  assistantText: {
    color: DS.text,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  agentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginTop: 2,
  },
  agentName: {
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: DS.textSecondary,
    marginBottom: 2,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  suggestionCard: {
    backgroundColor: DS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 160,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: DS.border,
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: DS.text,
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    color: DS.textSecondary,
  },
  imagePreviewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    left: 80,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachMenu: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  attachOption: {
    alignItems: 'center',
    gap: 6,
  },
  attachIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS.border,
  },
  attachText: {
    fontSize: 11,
    fontFamily: 'sf-pro-rounded-semibold',
    color: DS.textSecondary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS.border,
  },
  addButtonActive: {
    backgroundColor: DS.textSecondary,
    borderColor: DS.textSecondary,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: DS.surface,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 44,
    borderWidth: 1,
    borderColor: DS.border,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    color: DS.text,
    paddingVertical: 8,
    maxHeight: 120,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
