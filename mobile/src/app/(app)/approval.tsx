import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  ShieldQuestion,
  CreditCard,
  Mail,
  Globe,
  FileText,
  MessageSquare,
  Calendar,
  Monitor,
  Check,
  X,
  ShieldCheck,
  ShieldOff,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';
import type { PermissionCategory } from '@/lib/types';

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
  warning: '#D97706',
  danger: '#DC2626',
  gradient: ['#2563EB', '#1D4ED8'] as const,
};

// ---- Category Config ----
const CATEGORY_CONFIG: Record<
  PermissionCategory,
  { icon: React.ComponentType<{ size: number; color: string }>; label: string }
> = {
  payments: { icon: CreditCard, label: 'Payment' },
  email: { icon: Mail, label: 'Email' },
  browser: { icon: Globe, label: 'Browser' },
  files: { icon: FileText, label: 'Files' },
  messages: { icon: MessageSquare, label: 'Messages' },
  calendar: { icon: Calendar, label: 'Calendar' },
  system: { icon: Monitor, label: 'System' },
};

// ---- Time Ago Helper ----
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

// ---- Confirmation Overlay ----
function ConfirmationOverlay({ approved }: { approved: boolean }) {
  return (
    <View style={styles.overlayContainer}>
      <Animated.View entering={ZoomIn.duration(400).springify()} style={styles.overlayCircle}>
        <View style={styles.overlayIconBg}>
          {approved ? (
            <Check size={48} color={DS.text} strokeWidth={3} />
          ) : (
            <X size={48} color={DS.danger} strokeWidth={3} />
          )}
        </View>
      </Animated.View>
      <Animated.Text
        entering={FadeInDown.delay(200).duration(300)}
        style={[
          styles.overlayText,
          { color: approved ? DS.text : DS.danger },
        ]}
      >
        {approved ? 'Approved' : 'Denied'}
      </Animated.Text>
    </View>
  );
}

// ---- Main Screen ----
export default function ApprovalScreen() {
  const router = useRouter();
  const { approvalId } = useLocalSearchParams<{ approvalId: string }>();
  const approvals = useAppStore((s) => s.approvals);
  const agents = useAppStore((s) => s.agents);
  const respondToApproval = useAppStore((s) => s.respondToApproval);

  const [decision, setDecision] = useState<'approved' | 'denied' | null>(null);
  const [alwaysAllow, setAlwaysAllow] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(true);

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === 'pending'),
    [approvals]
  );

  const approval = useMemo(
    () => approvals.find((a) => a.id === approvalId) ?? pendingApprovals[0] ?? null,
    [approvals, approvalId, pendingApprovals]
  );

  const agent = useMemo(
    () => (approval ? agents.find((a) => a.id === approval.agentId) ?? null : null),
    [agents, approval]
  );

  const categoryConfig = useMemo(() => {
    if (!approval) return null;
    return CATEGORY_CONFIG[approval.category] ?? CATEGORY_CONFIG.browser;
  }, [approval]);

  const detailEntries = useMemo(() => {
    if (!approval?.details) return [];
    return Object.entries(approval.details);
  }, [approval]);

  const handleApprove = useCallback(() => {
    if (!approval) return;
    setDecision('approved');
    respondToApproval(approval.id, 'approved');
  }, [approval, respondToApproval]);

  const handleDeny = useCallback(() => {
    if (!approval) return;
    setDecision('denied');
    respondToApproval(approval.id, 'denied');
  }, [approval, respondToApproval]);

  // Navigate back after decision animation
  useEffect(() => {
    if (decision) {
      const timer = setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/(tabs)' as any);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [decision, router]);

  if (!approval || !agent) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: DS.bg },
            headerTintColor: DS.text,
            headerTitle: '',
            headerBackVisible: true,
          }}
        />
        <View style={styles.emptyCenter}>
          <ShieldQuestion size={48} color={DS.textTertiary} />
          <Text style={styles.emptyText}>Approval not found</Text>
        </View>
      </View>
    );
  }

  // If decision was made, show confirmation
  if (decision) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ConfirmationOverlay approved={decision === 'approved'} />
      </View>
    );
  }

  const CategoryIcon = categoryConfig?.icon ?? Globe;
  const categoryLabel = categoryConfig?.label ?? 'Action';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: DS.bg },
          headerShadowVisible: false,
          headerTintColor: DS.text,
          headerTitle: '',
          headerRight: () => (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                }
              }}
              style={styles.closeButton}
            >
              <X size={20} color={DS.text} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.flex1}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Welcome Banner ---- */}
          {showBanner ? (
            <Animated.View
              entering={FadeInDown.duration(400).delay(0)}
              style={styles.bannerCard}
            >
              <Pressable
                onPress={() => Linking.openURL('https://x.com/clawrapp')}
                style={{ flex: 1 }}
              >
                <Image
                  source={require('../../../assets/images/approval-bg.png')}
                  style={styles.bannerBg}
                  resizeMode="cover"
                />
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>New to Clawr?</Text>
                  <Text style={styles.bannerSubtitle}>Learn how it works in 2 mins.</Text>
                </View>
                <Image
                  source={require('../../../assets/images/lobster-pear.png')}
                  style={styles.bannerLobster}
                  resizeMode="contain"
                />
              </Pressable>
              <Pressable
                onPress={() => setShowBanner(false)}
                style={styles.bannerClose}
              >
                <X size={16} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          ) : null}

          {/* ---- Approval Info ---- */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(showBanner ? 100 : 0)}
            style={styles.approvalInfo}
          >
            <Text style={styles.countText}>
              {pendingApprovals.length} actions need approval
            </Text>
            <Text style={styles.actionText}>{approval.action}</Text>
          </Animated.View>

          {/* ---- Agent Info ---- */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.agentSection}
          >
            <Image
              source={getAvatarImage(agent.avatarId)}
              style={styles.avatar}
              resizeMode="cover"
            />
            <Text style={styles.agentName}>{agent.name}</Text>
            <View style={styles.approvalBadge}>
              <ShieldQuestion size={14} color={DS.warning} />
              <Text style={styles.approvalBadgeText}>Needs your approval</Text>
            </View>
            <Text style={styles.timestampText}>{timeAgo(approval.createdAt)}</Text>
          </Animated.View>

          {/* ---- Action Card ---- */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.actionCard}
          >
            <Text style={styles.actionTitle}>{approval.action}</Text>
            <Text style={styles.actionContext}>{approval.context}</Text>
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <CategoryIcon size={14} color={DS.textSecondary} />
                <Text style={styles.categoryText}>
                  {categoryLabel}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ---- Details Card ---- */}
          {detailEntries.length > 0 ? (
            <Animated.View
              entering={FadeInDown.duration(400).delay(300)}
              style={styles.detailsCard}
            >
              <Text style={styles.detailsHeading}>Details</Text>
              {detailEntries.map(([key, value], idx) => (
                <View
                  key={key}
                  style={[
                    styles.detailRow,
                    idx < detailEntries.length - 1 && styles.detailRowBorder,
                  ]}
                >
                  <Text style={styles.detailLabel}>{key}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
            </Animated.View>
          ) : null}

          {/* Spacer to keep content above bottom buttons */}
          <View style={{ height: 180 }} />
        </ScrollView>

        {/* ---- Bottom Decision Buttons ---- */}
        <View style={styles.bottomBar}>
          {/* Approve Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)}>
            <Pressable onPress={handleApprove}>
              <LinearGradient
                colors={[...DS.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.approveButton}
              >
                <Check size={20} color={DS.brandText} strokeWidth={2.5} />
                <Text style={styles.approveButtonText}>Approve</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Deny Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(480)}>
            <Pressable
              onPress={handleDeny}
              style={({ pressed }) => [
                styles.denyButton,
                pressed && styles.denyButtonPressed,
              ]}
            >
              <X size={18} color={DS.textSecondary} strokeWidth={2.5} />
              <Text style={styles.denyButtonText}>Deny</Text>
            </Pressable>
          </Animated.View>

          {/* Always Allow Toggle */}
          <Animated.View entering={FadeInUp.duration(400).delay(560)}>
            <Pressable
              onPress={() => setAlwaysAllow((prev) => !prev)}
              style={styles.alwaysAllowRow}
            >
              {alwaysAllow ? (
                <ShieldCheck size={16} color={DS.text} />
              ) : (
                <ShieldOff size={16} color={DS.textTertiary} />
              )}
              <Text
                style={[
                  styles.alwaysAllowText,
                  alwaysAllow && { color: DS.text },
                ]}
              >
                {alwaysAllow ? 'Always allow this action' : 'Approve once'}
              </Text>
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

  // Banner
  bannerCard: {
    position: 'relative',
    height: 160,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  bannerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bannerClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bannerContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },
  bannerLobster: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 150,
    height: 170,
  },

  // Approval Info
  approvalInfo: {
    marginBottom: 24,
    gap: 4,
  },
  countText: {
    color: DS.textSecondary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },
  actionText: {
    color: DS.text,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    color: DS.textTertiary,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
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

  // Close Button
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  // Agent Section
  agentSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: DS.text,
    fontSize: 28,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
  agentName: {
    color: DS.text,
    fontSize: 22,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DS.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  approvalBadgeText: {
    color: DS.warning,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },
  timestampText: {
    color: DS.textTertiary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
  },

  // Action Card
  actionCard: {
    backgroundColor: DS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionTitle: {
    color: DS.text,
    fontSize: 20,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  actionContext: {
    color: DS.textSecondary,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 22,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DS.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DS.border,
  },
  categoryText: {
    color: DS.textSecondary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },

  // Details Card
  detailsCard: {
    backgroundColor: DS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  detailsHeading: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  detailLabel: {
    color: DS.textSecondary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  detailValue: {
    color: DS.text,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
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
    gap: 10,
  },

  // Approve Button
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 12,
  },
  approveButtonText: {
    color: DS.brandText,
    fontSize: 17,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },

  // Deny Button
  denyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DS.surfaceSecondary,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS.border,
  },
  denyButtonPressed: {
    backgroundColor: '#27272A',
  },
  denyButtonText: {
    color: DS.textSecondary,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
  },

  // Always Allow
  alwaysAllowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  alwaysAllowText: {
    color: DS.textTertiary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Confirmation Overlay
  overlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  overlayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: 24,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
  },
});
