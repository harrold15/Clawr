import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Plus,
  Mail,
  Pause,
  Globe,
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
  MousePointerClick,
  Activity,
  ArrowUpRight,
  X,
  Bell,
  Plug,
  ChevronDown,
} from 'lucide-react-native';
import { statusColor } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';
import type { EventType, TaskEvent } from '@/lib/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Design System ─────────────────────────────────────────────
// Dark theme palette
const DS = {
  // Core
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
  // Brand — white accent on dark
  brand: '#FFFFFF',
  brandLight: '#27272A',
  brandText: '#000000',
  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

// Event Icon Map
const EVENT_ICON_MAP: Record<EventType, React.ComponentType<{ size: number; color: string }>> = {
  visited_site: Globe,
  drafted_email: Mail,
  clicked_button: MousePointerClick,
  read_file: FileText,
  wrote_file: FilePen,
  api_call: Zap,
  search: Search,
  login: LogIn,
  payment: CreditCard,
  download: Download,
  message_sent: Send,
  approval_requested: ShieldQuestion,
  task_started: Play,
  task_completed: CheckCircle,
  error: AlertTriangle,
};

// ── Animated Status Indicator ─────────────────────────────────
function StatusPulse({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacityRing = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    );
    opacityRing.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1400, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 0 }),
      ),
      -1,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacityRing.value,
  }));

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          },
          ringStyle,
        ]}
      />
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// ── Animated Progress Bar ────────────────────────────────────
function AnimatedProgressBar({ targetPercent = 33 }: { targetPercent?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      300,
      withTiming(targetPercent, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
  }, [targetPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={s.progressTrack}>
      <Animated.View style={[s.animatedProgressFill, progressStyle]}>
        <LinearGradient
          colors={['#FFFFFF', '#E4E4E7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: 3 }}
        />
      </Animated.View>
    </View>
  );
}

// ── Onboarding Bottom Sheet ────────────────────────────────────
function OnboardingBottomSheet({
  visible,
  onDismiss,
  agentName,
  agentAvatarId,
  onConnectIntegration,
}: {
  visible: boolean;
  onDismiss: () => void;
  agentName: string;
  agentAvatarId: number;
  onConnectIntegration: () => void;
}) {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const dismiss = () => {
    onDismiss();
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // Only allow dragging down
      translateY.value = Math.max(0, context.value.y + event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 80 || event.velocityY > 500) {
        // Dismiss if dragged down enough or fast swipe
        translateY.value = withTiming(300, { duration: 200 });
        runOnJS(dismiss)();
      } else {
        // Snap back
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset position when sheet becomes visible
  useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={s.sheetOverlay}
      >
        <Pressable style={s.sheetBackdrop} onPress={onDismiss} />
        <GestureDetector gesture={gesture}>
          <Animated.View
            entering={SlideInDown.duration(300).springify().damping(18)}
            style={[s.sheetContainer, sheetStyle]}
          >
            {/* Drag Handle */}
            <View style={s.sheetHandle}>
              <View style={s.sheetHandleBar} />
            </View>

            {/* Content */}
            <View style={s.sheetContent}>
              {/* Agent Badge - pill style */}
              <View style={s.sheetAgentBadge}>
                <Image
                  source={getAvatarImage(agentAvatarId)}
                  style={s.sheetAgentAvatarSmall}
                  resizeMode="cover"
                />
                <Text style={s.sheetAgentName}>{agentName}</Text>
                <Image
                  source={require('../../../../assets/images/check-verified.png')}
                  style={s.sheetCheckIcon}
                />
              </View>

              {/* Title and Subtitle */}
              <View style={s.sheetTextContainer}>
                <Text style={s.sheetTitle}>Complete your agent setup</Text>
                <Text style={s.sheetSubtitle}>Connect an integration to unlock your agent's full potential</Text>
              </View>

              {/* CTA Button */}
              <Pressable
                onPress={onConnectIntegration}
                style={({ pressed }) => [s.sheetButton, pressed && { opacity: 0.9 }]}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#E4E4E7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.sheetButtonGradient}
                >
                  <Plug size={18} color={DS.brandText} />
                  <Text style={s.sheetButtonText}>Connect Your First Integration</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

// ── Time Helper ───────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'running': return 'Working';
    case 'needs_approval': return 'Needs approval';
    case 'paused': return 'Paused';
    case 'offline': return 'Offline';
    case 'error': return 'Error';
    default: return 'Ready';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running': return DS.success;
    case 'needs_approval': return DS.warning;
    case 'error': return DS.danger;
    case 'paused': return DS.textTertiary;
    default: return DS.textTertiary;
  }
}

// ── Dashboard Screen ──────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();

  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const tasks = useAppStore((s) => s.tasks);
  const approvals = useAppStore((s) => s.approvals);

  // Onboarding bottom sheet state
  const [showOnboarding, setShowOnboarding] = useState(false);

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId],
  );

  // For new users, there won't be any tasks - show onboarding state
  const agentTasks = useMemo(
    () => (currentAgent ? tasks.filter((t) => t.agentId === currentAgent.id) : []),
    [tasks, currentAgent],
  );

  // Don't show running task for new users - they need to set up first
  const runningTask = null; // Always show onboarding state for now

  const pendingApprovals = useMemo(
    () =>
      currentAgent
        ? approvals.filter((a) => a.agentId === currentAgent.id && a.status === 'pending')
        : [],
    [approvals, currentAgent],
  );

  // Show onboarding sheet after a delay
  useEffect(() => {
    if (currentAgent) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500); // 1.5 second delay
      return () => clearTimeout(timer);
    }
  }, [currentAgent]);

  const handleConnectIntegration = () => {
    setShowOnboarding(false);
    router.push('/integrations' as never);
  };

  if (!currentAgent) {
    return (
      <View style={s.container}>
        <SafeAreaView edges={['top']} style={s.flex1}>
          <View style={s.emptyCenter}>
            <Text style={{ color: DS.textTertiary, fontSize: 16 }}>No agents yet</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const sColor = getStatusColor(currentAgent.status);

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.flex1}>
        {/* ── Brand Bar ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(0)} style={s.brandBar}>
          <Image
            source={require('../../../../assets/images/pear-logo-small.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/notifications' as never)}
            style={s.notificationBell}
          >
            <Bell size={20} color={DS.text} />
          </Pressable>
        </Animated.View>

        <ScrollView
          style={s.flex1}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Agent Card ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(60)}>
            <View style={s.agentCard}>
              {/* Avatar */}
              <View style={s.agentAvatarRow}>
                <View style={s.agentAvatar}>
                  <Image
                    source={getAvatarImage(currentAgent.avatarId)}
                    style={s.agentAvatarGradient}
                    resizeMode="cover"
                  />
                </View>
                <View style={s.agentInfo}>
                  <View style={s.agentNameRow}>
                    <Text style={s.agentName}>{currentAgent.name}</Text>
                    <Image
                      source={require('../../../../assets/images/check-verified.png')}
                      style={s.checkIcon}
                    />
                  </View>
                  <View style={s.statusRow}>
                    {currentAgent.status === 'running' ? (
                      <StatusPulse color={sColor} />
                    ) : (
                      <View style={[s.statusDot, { backgroundColor: sColor }]} />
                    )}
                    <Text style={[s.statusLabel, { color: sColor }]}>
                      {getStatusLabel(currentAgent.status)}
                    </Text>
                    <Text style={s.dotSeparator}>·</Text>
                    <Text style={s.agentMeta}>
                      {currentAgent.type === 'cloud' ? 'Cloud' : currentAgent.deviceName ?? 'Local'}
                    </Text>
                  </View>
              </View>
              </View>

              {/* Onboarding Progress for new users */}
              <View style={s.taskProgress}>
                <View style={s.taskProgressHeader}>
                  <Text style={s.taskProgressTitle} numberOfLines={1}>
                    Set up your AI Agent
                  </Text>
                  <Text style={s.taskProgressPercent}>33%</Text>
                </View>
                <AnimatedProgressBar targetPercent={33} />
              </View>

              {/* Quick Stats - Setup Milestones */}
              <View style={s.agentStats}>
                <View style={s.agentStat}>
                  <Text style={s.agentStatValue}>1</Text>
                  <Text style={s.agentStatLabel}>Agents</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.agentStat}>
                  <Text style={s.agentStatValue}>0</Text>
                  <Text style={s.agentStatLabel}>Integrations</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.agentStat}>
                  <Text style={s.agentStatValue}>0</Text>
                  <Text style={s.agentStatLabel}>Automations</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── New Task Button ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(120)}>
            <Pressable
              onPress={() => router.push('/task-composer' as never)}
              style={({ pressed }) => [s.newTaskButton, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#E4E4E7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.newTaskGradient}
              >
                <Text style={s.newTaskText}>New Task</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Pending Approvals ── */}
          {pendingApprovals.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(500).delay(180)}>
              <Pressable
                onPress={() => {
                  const first = pendingApprovals[0];
                  if (first) router.push(`/approval?approvalId=${first.id}` as never);
                }}
                style={s.approvalCard}
              >
                <Image
                  source={require('../../../../assets/images/approval-bg.png')}
                  style={s.approvalBg}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => {
                    // Do nothing - just close the card
                  }}
                  style={s.approvalClose}
                >
                  <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
                <View style={s.approvalContent}>
                  <Text style={s.approvalTitle}>New to Clawr?</Text>
                  <Text style={s.approvalSubtext}>Learn how it works in 2 mins.</Text>
                </View>
                <Image
                  source={require('../../../../assets/images/lobster-pear.png')}
                  style={s.approvalLobster}
                  resizeMode="contain"
                />
              </Pressable>
            </Animated.View>
          ) : null}

          {/* ── Quick Actions ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(240)}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.actionsRow}
              style={{ flexGrow: 0, marginBottom: 24 }}
            >
              <Pressable
                style={s.actionChip}
                onPress={() => router.push('/task-composer' as never)}
              >
                <Mail size={15} color={DS.textSecondary} />
                <Text style={s.actionChipText}>Handle Inbox</Text>
              </Pressable>
              <Pressable style={s.actionChip}>
                <Search size={15} color={DS.textSecondary} />
                <Text style={s.actionChipText}>Research</Text>
              </Pressable>
              <Pressable style={s.actionChip}>
                <FileText size={15} color={DS.textSecondary} />
                <Text style={s.actionChipText}>Summarize</Text>
              </Pressable>
              <Pressable style={s.actionChip}>
                <Pause size={15} color={DS.textSecondary} />
                <Text style={s.actionChipText}>Pause Agent</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>

          {/* ── Connections ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Connections</Text>
            </View>
            <View style={s.connectionsCard}>
              {/* Twitter */}
              <Pressable style={s.connectionRow}>
                <Image
                  source={require('../../../../assets/images/twitter-logo.png')}
                  style={s.connectionIcon}
                />
                <View style={s.connectionContent}>
                  <Text style={s.connectionTitle}>Connect Twitter</Text>
                </View>
                <ChevronRight size={16} color={DS.textTertiary} />
              </Pressable>

              {/* Gmail */}
              <Pressable style={[s.connectionRow, s.connectionRowBorder]}>
                <Image
                  source={require('../../../../assets/images/gmail-logo.png')}
                  style={s.connectionIcon}
                />
                <View style={s.connectionContent}>
                  <Text style={s.connectionTitle}>Connect Gmail</Text>
                </View>
                <ChevronRight size={16} color={DS.textTertiary} />
              </Pressable>

              {/* Discord */}
              <Pressable style={[s.connectionRow, s.connectionRowBorder]}>
                <Image
                  source={require('../../../../assets/images/discord-logo.png')}
                  style={s.connectionIcon}
                />
                <View style={s.connectionContent}>
                  <Text style={s.connectionTitle}>Connect Discord</Text>
                </View>
                <ChevronRight size={16} color={DS.textTertiary} />
              </Pressable>
            </View>
          </Animated.View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Onboarding Bottom Sheet */}
      <OnboardingBottomSheet
        visible={showOnboarding}
        onDismiss={() => setShowOnboarding(false)}
        agentName={currentAgent.name}
        agentAvatarId={currentAgent.avatarId ?? 1}
        onConnectIntegration={handleConnectIntegration}
      />
    </View>
  );
}

// ── Event Row ─────────────────────────────────────────────────
function EventRow({ event, isLast }: { event: TaskEvent; isLast: boolean }) {
  const IconComponent = EVENT_ICON_MAP[event.type] ?? Zap;

  return (
    <View style={[s.eventRow, !isLast && s.eventRowBorder]}>
      <View style={s.eventIcon}>
        <IconComponent size={14} color={DS.textTertiary} />
      </View>
      <View style={s.eventContent}>
        <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={s.eventTime}>{timeAgo(event.timestamp)}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  flex1: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Brand Bar
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  notificationBell: {
    padding: 8,
  },
  brandText: {
    fontSize: 26,
    fontFamily: 'sf-pro-rounded-semibold',
    fontStyle: 'italic',
    color: DS.text,
    letterSpacing: -0.5,
  },

  // Agent Card — the hero element
  agentCard: {
    backgroundColor: DS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    // Subtle elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  agentAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  agentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
  },
  agentAvatarGradient: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
  agentInfo: {
    flex: 1,
    gap: 4,
  },
  agentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agentName: {
    color: DS.text,
    fontSize: 20,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  checkIcon: {
    width: 20,
    height: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },
  dotSeparator: {
    color: DS.textTertiary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  agentMeta: {
    color: DS.textTertiary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
  },

  // Task Progress
  taskProgress: {
    marginBottom: 20,
    gap: 8,
  },
  taskProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskProgressTitle: {
    color: DS.text,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  taskProgressPercent: {
    color: DS.brand,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: DS.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  animatedProgressFill: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },

  // Idle State
  idleState: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  idleText: {
    color: DS.textTertiary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
  },

  // Agent Stats
  agentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: DS.border,
  },
  agentStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  agentStatValue: {
    color: DS.text,
    fontSize: 20,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  agentStatLabel: {
    color: DS.textTertiary,
    fontSize: 11,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: DS.border,
  },

  // New Task Button
  newTaskButton: {
    marginBottom: 20,
    borderRadius: 50,
    overflow: 'hidden',
  },
  newTaskGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 50,
    paddingHorizontal: 32,
  },
  newTaskText: {
    color: DS.brandText,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },

  // Approval Card
  approvalCard: {
    position: 'relative',
    height: 80,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  approvalBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  approvalContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '60%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 2,
  },
  approvalTitle: {
    color: DS.text,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },
  approvalSubtext: {
    color: DS.textSecondary,
    fontSize: 11,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  approvalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  approvalLobster: {
    position: 'absolute',
    right: 25,
    top: -10,
    width: 110,
    height: 120,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  seeAllText: {
    color: DS.brand,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },

  // Quick Actions
  actionsRow: {
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS.border,
  },
  actionChipText: {
    color: DS.text,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Activity Card
  activityCard: {
    backgroundColor: DS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  eventRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DS.border,
  },
  eventIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: {
    color: DS.text,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    color: DS.textTertiary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
  },

  // Connections
  connectionsCard: {
    backgroundColor: DS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  connectionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: DS.border,
  },
  connectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  connectionContent: {
    flex: 1,
  },
  connectionTitle: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetContainer: {
    backgroundColor: DS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: DS.border,
    borderRadius: 2,
  },
  sheetContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  sheetAgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sheetAgentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  sheetAgentInfo: {
    flex: 1,
    gap: 4,
  },
  sheetAgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: DS.surfaceSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  sheetAgentAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sheetAgentName: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },
  sheetCheckIcon: {
    width: 18,
    height: 18,
  },
  sheetTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: DS.text,
    fontSize: 20,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: DS.textSecondary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 20,
    textAlign: 'center',
  },
  sheetButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sheetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  sheetButtonText: {
    color: DS.brandText,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
  sheetDismissHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sheetDismissText: {
    color: DS.textTertiary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
  },
});
