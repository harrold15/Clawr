import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import {
  Home,
  Search,
  Compass,
  Bell,
  User,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE = '#FFFFFF';
const INACTIVE = '#71717A';
const INDICATOR_COLOR = '#FFFFFF';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const unreadCount = useAppStore(
    (s) => s.notifications.filter((n) => !n.read).length
  );

  const tabBarHeight = 52 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 12,
          paddingHorizontal: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={styles.iconWrapper}>
              {focused ? <View style={styles.indicator} /> : null}
              <Home
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
                fill={focused ? color : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={styles.iconWrapper}>
              {focused ? <View style={styles.indicator} /> : null}
              <Search
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={styles.iconWrapper}>
              {focused ? <View style={styles.indicator} /> : null}
              <Compass
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
                fill={focused ? color : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={styles.iconWrapper}>
              {focused ? <View style={styles.indicator} /> : null}
              <Bell
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
                fill={focused ? color : 'none'}
              />
            </View>
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={styles.iconWrapper}>
              {focused ? <View style={styles.indicator} /> : null}
              <User
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
                fill={focused ? color : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: -10,
    width: 20,
    height: 2.5,
    backgroundColor: INDICATOR_COLOR,
    borderRadius: 1.25,
  },
});
