import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Globe,
  Mail,
  MousePointerClick,
  FileText,
  FilePen,
  Zap,
  Search,
  LogIn,
  CreditCard,
  Download,
  Send,
  ShieldQuestion,
  Play,
  CheckCircle,
  AlertTriangle,
  Pause,
  Square,
  RotateCcw,
  Clock,
  ShieldCheck,
  Activity,
} from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/cn';
import type { TaskEvent, TaskStatus } from '@/lib/types';

// ─── Icon Map ────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Globe,
  Mail,
  MousePointerClick,
  FileText,
  FilePen,
  Zap,
  Search,
  LogIn,
  CreditCard,
  Download,
  Send,
  ShieldQuestion,
  Play,
  CheckCircle,
  AlertTriangle,
};

const EVENT_ICON_NAMES: Record<string, string> = {
  visited_site: 'Globe',
  drafted_email: 'Mail',
  clicked_button: 'MousePointerClick',
  read_file: 'FileText',
  wrote_file: 'FilePen',
  api_call: 'Zap',
  search: 'Search',
  login: 'LogIn',
  payment: 'CreditCard',
  download: 'Download',
  message_sent: 'Send',
  approval_requested: 'ShieldQuestion',
  task_started: 'Play',
  task_completed: 'CheckCircle',
  error: 'AlertTriangle',
};

const EVENT_DOT_COLORS: Record<string, string> = {
  visited_site: colors.blue,
  drafted_email: colors.purple,
  clicked_button: colors.cyan,
  read_file: colors.textSecondary,
  wrote_file: colors.orange,
  api_call: colors.cyan,
  search: colors.blue,
  login: colors.brand,
  payment: colors.orange,
  download: colors.blue,
  message_sent: colors.brand,
  approval_requested: colors.statusApproval,
  task_started: colors.brand,
  task_completed: colors.brand,
  error: colors.statusError,
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  queued: { color: colors.blue, label: 'Queued' },
  running: { color: colors.brand, label: 'Running' },
  paused: { color: colors.statusPaused, label: 'Paused' },
  completed: { color: colors.brand, label: 'Completed' },
  failed: { color: colors.statusError, label: 'Failed' },
  cancelled: { color: colors.textMuted, label: 'Cancelled' },
};

// ─── Helpers ────────────────────────────────────────────────
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatDuration(startIso: string, endIso?: string): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = end - start;
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
}

// ─── Pulsing Dot ────────────────────────────────────────────
function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: colors.bg,
          zIndex: 1,
          marginTop: 18,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Progress Ring ──────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          entering={FadeIn.duration(600)}
          style={[
            styles.progressFill,
            { width: `${Math.min(progress, 100)}%` as never },
          ]}
        />
      </View>
      <Text className="text-[#E63946] text-[24px] font-bold" style={{ marginLeft: 16 }}>
        {progress}%
      </Text>
    </View>
  );
}

// ─── Event Timeline Item ────────────────────────────────────
function TimelineEvent({
  event,
  index,
  isLast,
  isLatest,
}: {
  event: TaskEvent;
  index: number;
  isLast: boolean;
  isLatest: boolean;
}) {
  const iconName = EVENT_ICON_NAMES[event.type] ?? 'Zap';
  const IconComponent = ICON_MAP[iconName] ?? Zap;
  const dotColor = EVENT_DOT_COLORS[event.type] ?? colors.textMuted;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(350).springify()}
      style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: isLast ? 0 : 4 }}
    >
      {/* Timeline column */}
      <View className="items-center" style={{ width: 32 }}>
        {isLatest ? (
          <PulsingDot color={dotColor} />
        ) : (
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: dotColor,
              borderWidth: 2,
              borderColor: colors.bg,
              zIndex: 1,
              marginTop: 18,
            }}
          />
        )}
        {!isLast ? (
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: colors.border,
              marginTop: 2,
            }}
          />
        ) : null}
      </View>

      {/* Card */}
      <View
        className="flex-1 rounded-2xl"
        style={{
          backgroundColor: colors.bgCard,
          marginLeft: 8,
          marginBottom: 8,
          padding: 14,
          borderWidth: isLatest ? 1 : 0,
          borderColor: isLatest ? `${dotColor}40` : 'transparent',
        }}
      >
        <View className="flex-row items-center" style={{ marginBottom: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${dotColor}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent size={16} color={dotColor} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-[#FFFFFF] text-[14px] font-semibold" numberOfLines={1}>
              {event.title}
            </Text>
          </View>
          <Text className="text-[#71717A] text-[11px]">
            {formatRelativeTime(event.timestamp)}
          </Text>
        </View>

        <Text className="text-[#A1A1AA] text-[13px] leading-[18px]" numberOfLines={3}>
          {event.description}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ────────────────────────────────────────────
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const updateTask = useAppStore((s) => s.updateTask);
  const agents = useAppStore((s) => s.agents);

  const task = useMemo(() => tasks.find((t) => t.id === id) ?? null, [tasks, id]);
  const agent = useMemo(
    () => (task ? agents.find((a) => a.id === task.agentId) ?? null : null),
    [agents, task]
  );

  // Sort events descending (latest first)
  const sortedEvents = useMemo(() => {
    if (!task) return [];
    return [...task.events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [task]);

  const statusConfig = task ? STATUS_CONFIG[task.status] ?? { color: colors.textMuted, label: task.status } : null;
  const isRunning = task?.status === 'running';
  const isPaused = task?.status === 'paused';
  const isCompleted = task?.status === 'completed';
  const isFailed = task?.status === 'failed';

  const handlePause = useCallback(() => {
    if (task) updateTask(task.id, { status: 'paused' });
  }, [task, updateTask]);

  const handleResume = useCallback(() => {
    if (task) updateTask(task.id, { status: 'running' });
  }, [task, updateTask]);

  const handleCancel = useCallback(() => {
    if (task) updateTask(task.id, { status: 'cancelled' });
  }, [task, updateTask]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!task) {
    return (
      <View className="flex-1 bg-black">
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View className="flex-row items-center px-4 pt-2 pb-3">
            <Pressable onPress={handleGoBack} style={styles.backButton}>
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text className="text-[#FFFFFF] text-[18px] font-semibold ml-3">Task Not Found</Text>
          </View>
          <View className="flex-1 items-center justify-center" style={{ gap: 12 }}>
            <AlertTriangle size={40} color={colors.textMuted} />
            <Text className="text-[#71717A] text-[16px]">This task doesn't exist</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const approvalCount = task.events.filter((e) => e.type === 'approval_requested').length;

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header with back button */}
        <Animated.View
          entering={FadeInUp.duration(350)}
          className="flex-row items-center px-4 pt-2 pb-3"
        >
          <Pressable onPress={handleGoBack} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <View className="flex-1 ml-3">
            <Text className="text-[#A1A1AA] text-[12px]">
              {agent?.name ?? 'Agent'}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Title + Status Section */}
          <Animated.View
            entering={FadeInDown.delay(50).duration(400)}
            style={{ paddingHorizontal: 16, marginBottom: 20 }}
          >
            <Text className="text-[#FFFFFF] text-[24px] font-bold" style={{ marginBottom: 12 }}>
              {task.title}
            </Text>

            <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
              {/* Status badge */}
              {statusConfig ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: `${statusConfig.color}18`,
                    gap: 5,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: statusConfig.color,
                    }}
                  />
                  <Text
                    className="text-[12px] font-semibold"
                    style={{ color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </Text>
                </View>
              ) : null}

              {/* Mode badge */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: task.mode === 'autopilot' ? `${colors.cyan}18` : `${colors.orange}18`,
                  gap: 5,
                }}
              >
                {task.mode === 'autopilot' ? (
                  <Zap size={11} color={colors.cyan} />
                ) : (
                  <ShieldCheck size={11} color={colors.orange} />
                )}
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: task.mode === 'autopilot' ? colors.cyan : colors.orange }}
                >
                  {task.mode === 'autopilot' ? 'Autopilot' : 'Ask First'}
                </Text>
              </View>

              {/* Created time */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: colors.bgElevated,
                  gap: 5,
                }}
              >
                <Clock size={11} color={colors.textSecondary} />
                <Text className="text-[#A1A1AA] text-[12px] font-medium">
                  {formatRelativeTime(task.createdAt)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Progress Section (if running or paused) */}
          {(isRunning || isPaused) ? (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.progressSection}
            >
              <ProgressBar progress={task.progress} />

              {/* Action Buttons */}
              <View className="flex-row" style={{ gap: 10, marginTop: 16 }}>
                {isRunning ? (
                  <>
                    <Pressable
                      onPress={handlePause}
                      style={({ pressed }) => [
                        styles.actionButton,
                        {
                          backgroundColor: pressed ? `${colors.orange}30` : `${colors.orange}18`,
                          flex: 1,
                        },
                      ]}
                    >
                      <Pause size={16} color={colors.orange} />
                      <Text className="text-[14px] font-semibold ml-2" style={{ color: colors.orange }}>
                        Pause
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCancel}
                      style={({ pressed }) => [
                        styles.actionButton,
                        {
                          backgroundColor: pressed ? `${colors.red}30` : `${colors.red}18`,
                          flex: 1,
                        },
                      ]}
                    >
                      <Square size={16} color={colors.red} />
                      <Text className="text-[14px] font-semibold ml-2" style={{ color: colors.red }}>
                        Cancel
                      </Text>
                    </Pressable>
                  </>
                ) : null}

                {isPaused ? (
                  <>
                    <Pressable
                      onPress={handleResume}
                      style={({ pressed }) => [
                        styles.actionButton,
                        {
                          backgroundColor: pressed ? colors.brandDim : colors.brand,
                          flex: 1,
                        },
                      ]}
                    >
                      <Play size={16} color={colors.textInverse} />
                      <Text className="text-[14px] font-semibold ml-2" style={{ color: colors.textInverse }}>
                        Resume
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCancel}
                      style={({ pressed }) => [
                        styles.actionButton,
                        {
                          backgroundColor: pressed ? `${colors.red}30` : `${colors.red}18`,
                          flex: 1,
                        },
                      ]}
                    >
                      <Square size={16} color={colors.red} />
                      <Text className="text-[14px] font-semibold ml-2" style={{ color: colors.red }}>
                        Cancel
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </Animated.View>
          ) : null}

          {/* Completed Summary Card */}
          {isCompleted ? (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.completedCard}
            >
              <View className="flex-row items-center" style={{ marginBottom: 14, gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: `${colors.brand}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={18} color={colors.brand} />
                </View>
                <Text className="text-[#FFFFFF] text-[16px] font-bold">Task Completed</Text>
              </View>

              <View style={{ gap: 10 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[#A1A1AA] text-[13px]">Duration</Text>
                  <Text className="text-[#FFFFFF] text-[13px] font-semibold">
                    {formatDuration(task.createdAt, task.completedAt)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[#A1A1AA] text-[13px]">Events</Text>
                  <Text className="text-[#FFFFFF] text-[13px] font-semibold">
                    {task.events.length}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[#A1A1AA] text-[13px]">Approvals needed</Text>
                  <Text className="text-[#FFFFFF] text-[13px] font-semibold">
                    {approvalCount}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Failed Card */}
          {isFailed ? (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={[styles.completedCard, { borderColor: `${colors.red}30` }]}
            >
              <View className="flex-row items-center" style={{ marginBottom: 14, gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: `${colors.red}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={18} color={colors.red} />
                </View>
                <Text className="text-[#FFFFFF] text-[16px] font-bold">Task Failed</Text>
              </View>
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: pressed ? `${colors.red}30` : `${colors.red}18`,
                  gap: 6,
                })}
              >
                <RotateCcw size={14} color={colors.red} />
                <Text className="text-[14px] font-semibold" style={{ color: colors.red }}>
                  Retry Task
                </Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Event Timeline */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <View className="flex-row items-center px-4" style={{ marginBottom: 12, marginTop: 8 }}>
              <Activity size={16} color={colors.textSecondary} />
              <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase ml-2">
                Event Timeline
              </Text>
              <View className="flex-1" />
              <Text className="text-[#71717A] text-[12px]">
                {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : null}
              </Text>
            </View>
          </Animated.View>

          {sortedEvents.length === 0 ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              className="items-center justify-center"
              style={{ paddingVertical: 40, gap: 12 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: colors.bgElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={24} color={colors.textMuted} />
              </View>
              <Text className="text-[#71717A] text-[14px]">No events recorded</Text>
            </Animated.View>
          ) : (
            sortedEvents.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                index={index}
                isLast={index === sortedEvents.length - 1}
                isLatest={index === 0 && isRunning}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.brand}20`,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  completedCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.brand}20`,
  },
});
