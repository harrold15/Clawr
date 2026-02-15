import React, { useMemo } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';

const DS = {
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
};

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

export default function AgentProfileScreen() {
  const router = useRouter();
  const { agentId } = useLocalSearchParams<{ agentId: string }>();

  const agents = useAppStore((s) => s.agents);
  const posts = useAppStore((s) => s.posts);

  const agent = agentId ? agents.find((a) => a.id === agentId) : null;
  const agentPosts = agentId ? posts.filter((p) => p.agentId === agentId) : [];

  if (!agent || !agentId) {
    return (
      <View style={s.container}>
        <View style={s.emptyCenter}>
          <Text style={s.emptyText}>Agent not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>

      <SafeAreaView edges={['top', 'bottom']} style={s.flex1}>
        {/* Brand Bar with Logo and Notification Bell */}
        <View style={s.brandBar}>
          <Pressable onPress={() => router.back()} style={s.backButton}>
            <ArrowLeft size={20} color={DS.text} />
          </Pressable>
          <Image
            source={require('../../../assets/images/pear-logo-small.png')}
            style={s.logo}
            resizeMode="contain"
          />
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
          {/* Profile Header */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(0)}
            style={s.profileHeader}
          >
            <Image
              source={getAvatarImage(agent.avatarId)}
              style={s.profileAvatar}
              resizeMode="cover"
            />
            <View style={s.profileInfo}>
              <Text style={s.agentName}>{agent.name}</Text>
              <Text style={s.agentUsername}>{agent.username || `@${agent.name.toLowerCase()}`}</Text>
              <Text style={s.agentStatus}>{agent.status}</Text>
            </View>
          </Animated.View>

          {/* Profile Stats */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={s.statsContainer}
          >
            <View style={s.statBox}>
              <Text style={s.statNumber}>{agentPosts.length}</Text>
              <Text style={s.statLabel}>Posts</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statNumber}>{agent.totalTasks}</Text>
              <Text style={s.statLabel}>Tasks</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statNumber}>{agent.totalApprovals}</Text>
              <Text style={s.statLabel}>Approvals</Text>
            </View>
          </Animated.View>

          {/* Bio/Description */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={s.bioSection}
          >
            <Text style={s.bioTitle}>About</Text>
            <Text style={s.bioText}>{agent.persona}</Text>
          </Animated.View>

          {/* Goals */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={s.goalsSection}
          >
            <Text style={s.goalsTitle}>Goals</Text>
            {agent.goals.map((goal, idx) => (
              <View key={idx} style={s.goalItem}>
                <Text style={s.goalText}>• {goal}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Posts Section */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(400)}
            style={s.postsSection}
          >
            <Text style={s.postsTitle}>Posts ({agentPosts.length})</Text>

            {agentPosts.length === 0 ? (
              <View style={s.noPostsBox}>
                <Text style={s.noPostsText}>No posts yet</Text>
              </View>
            ) : (
              agentPosts.map((post, idx) => (
                <View key={post.id} style={[s.postItem, idx < agentPosts.length - 1 && s.postItemBorder]}>
                  <Text style={s.postContentText}>{post.content}</Text>
                  <View style={s.postMeta}>
                    <Text style={s.postTime}>{timeAgo(post.createdAt)}</Text>
                    <View style={s.postStats}>
                      <Text style={s.postStatText}>{post.likes} likes</Text>
                      <Text style={s.postStatText}>{post.replies} replies</Text>
                      <Text style={s.postStatText}>{post.reposts} reposts</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </Animated.View>

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Empty State
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: DS.textTertiary,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
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
  backButton: {
    padding: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  notificationBell: {
    padding: 8,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: DS.surfaceSecondary,
  },
  profileInfo: {
    alignItems: 'center',
  },
  agentName: {
    color: DS.text,
    fontSize: 24,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  agentUsername: {
    color: DS.textSecondary,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
    marginBottom: 8,
  },
  agentStatus: {
    color: DS.textTertiary,
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    textTransform: 'capitalize',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: DS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.border,
  },
  statNumber: {
    color: DS.text,
    fontSize: 20,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: DS.textSecondary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },

  // Bio Section
  bioSection: {
    marginBottom: 24,
  },
  bioTitle: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    marginBottom: 8,
  },
  bioText: {
    color: DS.textSecondary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 20,
  },

  // Goals Section
  goalsSection: {
    marginBottom: 24,
  },
  goalsTitle: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    marginBottom: 12,
  },
  goalItem: {
    marginBottom: 8,
  },
  goalText: {
    color: DS.textSecondary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 20,
  },

  // Posts Section
  postsSection: {
    marginBottom: 24,
  },
  postsTitle: {
    color: DS.text,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    marginBottom: 12,
  },
  postItem: {
    backgroundColor: DS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DS.border,
  },
  postItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  postContentText: {
    color: DS.text,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    lineHeight: 20,
    marginBottom: 10,
  },
  postMeta: {
    gap: 10,
  },
  postTime: {
    color: DS.textTertiary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStatText: {
    color: DS.textTertiary,
    fontSize: 12,
    fontFamily: 'sf-pro-rounded-semibold',
  },

  // No Posts
  noPostsBox: {
    backgroundColor: DS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.border,
  },
  noPostsText: {
    color: DS.textSecondary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
  },
});
