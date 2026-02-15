import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  ShieldQuestion,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Bell,
  Zap,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';
import type { Notification } from '@/lib/types';
import type { Agent } from '@/lib/types';

// ─── Design Tokens ──────────────────────────────────────────
const DS = {
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
  brand: '#FFFFFF',
  approval: '#FF6B6B',
  completion: '#51CF66',
  error: '#FFA500',
  info: '#4A9EFF',
} as const;

// ─── Filter Types ──────────────────────────────────────────
type FilterType = 'all' | 'approval' | 'completion' | 'error';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'approval', label: 'Waiting' },
  { key: 'completion', label: 'Completed' },
  { key: 'error', label: 'Errors' },
];

// ─── Icon & Color Config ───────────────────────────────────
const NOTIFICATION_CONFIG: Record<
  Notification['type'],
  { icon: React.ComponentType<{ size: number; color: string }>; color: string; accentColor: string }
> = {
  approval: { icon: ShieldQuestion, color: DS.approval, accentColor: '#FF6B6B' },
  completion: { icon: CheckCircle, color: DS.completion, accentColor: '#51CF66' },
  error: { icon: AlertTriangle, color: DS.error, accentColor: '#FFA500' },
  info: { icon: Info, color: DS.info, accentColor: '#4A9EFF' },
};

// ─── Time Ago Helper ───────────────────────────────────────
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

// ─── Notification Card ─────────────────────────────────────
function NotificationCard({
  notification,
  agent,
  onPress,
}: {
  notification: Notification;
  agent?: Agent;
  onPress: () => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type] ?? NOTIFICATION_CONFIG.info;
  const { icon: IconComponent } = config;
  const isUnread = !notification.read;
  const agentName = agent?.name || 'Agent';

  // Build the title dynamically using agent name
  const displayTitle = notification.type === 'approval'
    ? `${agentName} Needs Approval`
    : notification.type === 'completion'
    ? `${agentName} - Task Completed`
    : notification.type === 'error'
    ? `${agentName} - Error`
    : `${agentName}`;

  return (
    <Pressable onPress={onPress} style={{ marginBottom: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: DS.surfaceSecondary,
          borderRadius: 16,
          padding: 14,
          gap: 12,
          borderWidth: 1,
          borderColor: DS.border,
        }}
      >
        {/* Agent Avatar */}
        {agent ? (
          <Image
            source={getAvatarImage(agent.avatarId)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              marginTop: 1,
            }}
          />
        ) : null}

        {/* Center content */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                color: DS.text,
                fontSize: 15,
                fontFamily: 'sf-pro-rounded-semibold',
                fontWeight: isUnread ? '700' : '600',
                flex: 1,
              }}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
            <Text style={{ color: DS.textTertiary, fontSize: 12, marginLeft: 8 }}>
              {timeAgo(notification.createdAt)}
            </Text>
          </View>
          <Text
            style={{
              color: DS.textSecondary,
              fontSize: 13,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>

        {/* Right side: icon */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: config.accentColor + '18',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <IconComponent size={14} color={config.accentColor} />
        </View>
      </View>
    </Pressable>
  );
}

// ─── Notifications Screen ──────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useAppStore((s) => s.notifications);
  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);

  // Always use the user's agent (first agent or selected agent)
  const userAgent = useMemo(() => {
    if (selectedAgentId) {
      return agents.find((a) => a.id === selectedAgentId) ?? agents[0];
    }
    return agents[0];
  }, [agents, selectedAgentId]);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Only show notifications for the user's agent
  const agentNotifications = useMemo(
    () => userAgent ? notifications.filter((n) => n.agentId === userAgent.id) : [],
    [notifications, userAgent]
  );

  const unreadCount = useMemo(
    () => agentNotifications.filter((n) => !n.read).length,
    [agentNotifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return agentNotifications;
    return agentNotifications.filter((n) => n.type === activeFilter);
  }, [agentNotifications, activeFilter]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markNotificationRead(notification.id);
      }
      if (notification.type === 'approval' && notification.relatedId) {
        router.push(`/approval?approvalId=${notification.relatedId}` as never);
      } else if (notification.type === 'completion' && notification.relatedId) {
        router.push(`/task-detail?id=${notification.relatedId}` as never);
      }
    },
    [markNotificationRead, router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: DS.bg }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Image
            source={require('../../../../assets/images/pear-logo-small.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
          <Pressable style={{ padding: 8 }}>
            <Bell size={20} color={DS.text} />
          </Pressable>
        </Animated.View>

        {/* Filter Pills */}
        <Animated.View entering={FadeInDown.duration(350).delay(60)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              style={{ flexGrow: 0, flex: 1 }}
            >
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;
                return (
                  <Pressable
                    key={filter.key}
                    onPress={() => setActiveFilter(filter.key)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? DS.text : DS.surface,
                      borderWidth: isActive ? 0 : 1,
                      borderColor: DS.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
                        fontWeight: '600',
                        color: isActive ? '#000000' : DS.textSecondary,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {unreadCount > 0 ? (
              <Pressable onPress={markAllNotificationsRead} style={{ marginLeft: 8 }}>
                <Text style={{ color: DS.brand, fontSize: 13, fontWeight: '600' }}>
                  Mark all read
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Notification List */}
        {filteredNotifications.length > 0 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.map((notification, idx) => (
              <Animated.View
                key={notification.id}
                entering={FadeInDown.duration(300).delay(100 + idx * 50)}
              >
                <NotificationCard
                  notification={notification}
                  agent={userAgent}
                  onPress={() => handleNotificationPress(notification)}
                />
              </Animated.View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(350).delay(120)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                backgroundColor: DS.surfaceSecondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={32} color={DS.textTertiary} />
            </View>
            <Text style={{ color: DS.text, fontSize: 18, fontWeight: '700', marginTop: 16 }}>
              All caught up!
            </Text>
            <Text style={{ color: DS.textSecondary, fontSize: 14, marginTop: 4 }}>
              {activeFilter !== 'all'
                ? 'No notifications in this category'
                : 'You have no notifications right now'}
            </Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}
