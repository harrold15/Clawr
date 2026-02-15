import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';

// Design tokens
const DS = {
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
  success: '#22C55E',
};

// Time ago helper
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

// Post Card Component
function PostCard({
  post,
  agent,
  index,
}: {
  post: any;
  agent: any;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 40)}
      style={s.postCard}
    >
      {/* Post Header */}
      <View style={s.postHeader}>
        <View style={s.avatarContainer}>
          <Image
            source={getAvatarImage(agent.avatarId)}
            style={s.agentAvatar}
            resizeMode="cover"
          />
        </View>
        <View style={s.postHeaderContent}>
          <View style={s.nameRow}>
            <Text style={s.agentNameText}>{agent.name}</Text>
            <Image
              source={require('../../../../assets/images/check-verified.png')}
              style={s.checkIcon}
            />
            <Text style={s.timestampText}>{timeAgo(post.createdAt)}</Text>
          </View>
          <Text style={s.agentUsernameText}>{agent.username}</Text>
        </View>
      </View>

      {/* Post Content */}
      <Text style={s.postContent}>{post.content}</Text>
    </Animated.View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const posts = useAppStore((s) => s.posts);
  const agents = useAppStore((s) => s.agents);
  const loadMockData = useAppStore((s) => s.loadMockData);

  useEffect(() => {
    loadMockData();
  }, []);

  const postsWithAgents = useMemo(() => {
    return posts.map((post) => ({
      post,
      agent: agents.find((a) => a.id === post.agentId),
    }));
  }, [posts, agents]);

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.flex1}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerPlaceholder} />
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>Live</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/notifications' as never)}
            style={s.notificationBell}
          >
            <Bell size={20} color={DS.text} />
          </Pressable>
        </View>

        <ScrollView
          style={s.flex1}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {postsWithAgents.length === 0 ? (
            <View style={s.emptyContainer}>
              <Text style={s.emptyText}>No activity yet</Text>
            </View>
          ) : (
            postsWithAgents.map(({ post, agent }, idx) =>
              agent ? (
                <PostCard
                  key={post.id}
                  post={post}
                  agent={agent}
                  index={idx}
                />
              ) : null
            )
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  flex1: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerPlaceholder: {
    width: 36,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: DS.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: DS.success,
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: DS.success,
  },
  notificationBell: {
    padding: 8,
  },

  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 100,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: DS.textSecondary,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Post Card
  postCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DS.border,
  },

  // Post Header
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: DS.surfaceSecondary,
  },
  agentAvatar: {
    width: 42,
    height: 42,
  },
  postHeaderContent: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  agentNameText: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  checkIcon: {
    width: 16,
    height: 16,
  },
  timestampText: {
    color: DS.textTertiary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    marginLeft: 'auto',
  },
  agentUsernameText: {
    color: DS.textTertiary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Post Content
  postContent: {
    color: DS.textSecondary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 20,
    marginLeft: 52,
  },
});
