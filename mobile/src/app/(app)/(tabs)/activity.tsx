import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Activity as ActivityIcon,
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
  Undo2,
} from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/cn';
import type { TaskEvent, EventType } from '@/lib/types';

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

type FilterType = 'all' | 'actions' | 'approvals' | 'errors';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'actions', label: 'Actions' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'errors', label: 'Errors' },
];

const APPROVAL_TYPES: EventType[] = ['approval_requested'];
const ERROR_TYPES: EventType[] = ['error'];
const ACTION_TYPES: EventType[] = [
  'visited_site', 'drafted_email', 'clicked_button', 'read_file',
  'wrote_file', 'api_call', 'search', 'login', 'payment',
  'download', 'message_sent', 'task_started', 'task_completed',
];

// ─── Relative Time Helper ────────────────────────────────────
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
}

// ─── Event Card Component ────────────────────────────────────
function EventCard({ event, index, isLast }: { event: TaskEvent; index: number; isLast: boolean }) {
  const iconName = EVENT_ICON_NAMES[event.type] ?? 'Zap';
  const IconComponent = ICON_MAP[iconName] ?? Zap;
  const dotColor = EVENT_DOT_COLORS[event.type] ?? colors.textMuted;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400).springify()}
      style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: isLast ? 0 : 4 }}
    >
      {/* Timeline column */}
      <View className="items-center" style={{ width: 32 }}>
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
        }}
      >
        <View className="flex-row items-center" style={{ marginBottom: 8 }}>
          <IconComponent size={16} color={colors.textSecondary} />
          <View className="flex-1 ml-3">
            <Text className="text-[#FFFFFF] text-[14px] font-semibold" numberOfLines={1}>
              {event.title}
            </Text>
          </View>
          <Text className="text-[#71717A] text-[11px]">
            {formatRelativeTime(event.timestamp)}
          </Text>
        </View>

        <Text className="text-[#A1A1AA] text-[13px] leading-[18px]" numberOfLines={2}>
          {event.description}
        </Text>

        {event.undoable ? (
          <Pressable
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              paddingHorizontal: 0,
              paddingVertical: 5,
            }}
          >
            <Undo2 size={12} color={colors.textSecondary} />
            <Text className="text-[#A1A1AA] text-[12px] font-medium ml-1">Undo</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function ActivityScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const tasks = useAppStore((s) => s.tasks);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);

  // Flatten all events from tasks for the selected agent, sort descending
  const allEvents = useMemo(() => {
    const agentTasks = selectedAgentId
      ? tasks.filter((t) => t.agentId === selectedAgentId)
      : tasks;

    const events: TaskEvent[] = [];
    for (const task of agentTasks) {
      for (const event of task.events) {
        events.push(event);
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return events;
  }, [tasks, selectedAgentId]);

  // Apply filter
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return allEvents;
    if (activeFilter === 'approvals') return allEvents.filter((e) => APPROVAL_TYPES.includes(e.type));
    if (activeFilter === 'errors') return allEvents.filter((e) => ERROR_TYPES.includes(e.type));
    return allEvents.filter((e) => ACTION_TYPES.includes(e.type));
  }, [allEvents, activeFilter]);

  const handleFilterPress = useCallback((key: FilterType) => {
    setActiveFilter(key);
  }, []);

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-4 pt-2 pb-3">
          <Text className="text-[#FFFFFF] text-[28px] font-bold">Activity</Text>
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => handleFilterPress(filter.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? colors.brand : colors.bgElevated,
                }}
              >
                <Text
                  className={cn(
                    'text-[13px] font-semibold',
                    isActive ? 'text-white' : 'text-[#A1A1AA]'
                  )}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Timeline content */}
        {filteredEvents.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 items-center justify-center"
            style={{ gap: 12 }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: colors.bgElevated,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIcon size={28} color={colors.textMuted} />
            </View>
            <Text className="text-[#71717A] text-[16px] font-medium">No activity yet</Text>
            <Text className="text-[#71717A] text-[13px]">
              Events will appear here as your agent works
            </Text>
          </Animated.View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          >
            {filteredEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                isLast={index === filteredEvents.length - 1}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
