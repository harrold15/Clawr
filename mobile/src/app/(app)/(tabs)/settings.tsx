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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  CreditCard,
  Plug,
  HelpCircle,
  LogOut,
  Cloud,
  Monitor,
  Bell,
  Wallet,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';

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
  danger: '#EF4444',
} as const;

// ─── Progress Bar ──────────────────────────────────────────
function UsageBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isHigh = percentage > 80;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: DS.text, fontSize: 14, fontWeight: '600', fontFamily: 'sf-pro-rounded-semibold' }}>
          {label}
        </Text>
        <Text style={{ color: DS.textSecondary, fontSize: 12, fontFamily: 'sf-pro-rounded-semibold' }}>
          {used}{unit} / {limit}{unit}
        </Text>
      </View>
      <View style={styles.usageBarTrack}>
        <View
          style={[
            styles.usageBarFill,
            {
              width: `${percentage}%` as never,
              backgroundColor: isHigh ? DS.danger : DS.brand,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Settings Row ──────────────────────────────────────────
function SettingsRow({
  icon: IconComponent,
  iconColor = DS.textTertiary,
  label,
  labelColor = DS.text,
  onPress,
  isLast = false,
  rightElement,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor?: string;
  label: string;
  labelColor?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsRow, !isLast && styles.settingsRowBorder]}
    >
      <View style={styles.settingsRowLeft}>
        <IconComponent size={18} color={iconColor} />
        <Text style={{ color: labelColor, fontSize: 16, fontWeight: '600', fontFamily: 'sf-pro-rounded-semibold' }}>
          {label}
        </Text>
      </View>
      {rightElement ?? <ChevronRight size={18} color={DS.textTertiary} />}
    </Pressable>
  );
}

// ─── Section Card ──────────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      {children}
    </View>
  );
}

// ─── Settings Screen ───────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const profile = useAppStore((s) => s.profile);
  const reset = useAppStore((s) => s.reset);

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId]
  );

  const planLabel = useMemo(() => {
    if (!profile) return 'Free';
    switch (profile.plan) {
      case 'pro':
        return 'Pro';
      case 'team':
        return 'Team';
      default:
        return 'Free';
    }
  }, [profile]);

  const handleSignOut = () => {
    reset();
  };

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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Agent Section ─────────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(60)}>
            <Text style={styles.sectionLabel}>
              Agent
            </Text>
            <SectionCard>
              {currentAgent ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
                  <Image
                    source={getAvatarImage(currentAgent.avatarId)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: DS.text, fontSize: 17, fontWeight: '700', fontFamily: 'sf-pro-rounded-semibold' }}>
                        {currentAgent.name}
                      </Text>
                      <Image
                        source={require('../../../../assets/images/blue-check.png')}
                        style={{ width: 20, height: 20 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {currentAgent.type === 'cloud' ? (
                          <Cloud size={10} color={DS.textSecondary} />
                        ) : (
                          <Monitor size={10} color={DS.textSecondary} />
                        )}
                        <Text style={{ color: DS.textSecondary, fontSize: 12, fontWeight: '600', marginLeft: 4, fontFamily: 'sf-pro-rounded-semibold' }}>
                          {currentAgent.type === 'cloud' ? 'Cloud' : 'Local'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}
              {currentAgent ? (
                <View style={styles.settingsRowBorder} />
              ) : null}
              <SettingsRow
                icon={SettingsIcon}
                label="Agent Settings"
                onPress={() => router.push('/agent-settings' as never)}
              />
              <SettingsRow
                icon={Plug}
                label="Integrations"
                onPress={() => router.push('/integrations' as never)}
              />
              <SettingsRow
                icon={Wallet}
                label="Wallet"
                onPress={() => router.push('/wallet' as never)}
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── Permissions Section ────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(120)}>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              Permissions
            </Text>
            <SectionCard>
              <SettingsRow
                icon={ShieldCheck}
                label="Permissions & Policies"
                onPress={() => router.push('/permissions' as never)}
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── Account Section ───────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(180)}>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              Account
            </Text>
            <SectionCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
                <Image
                  source={require('../../../../assets/images/profiles/user.png')}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                  }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: DS.text, fontSize: 17, fontWeight: '700', fontFamily: 'sf-pro-rounded-semibold' }}>
                    {profile?.name ?? 'Guest'}
                  </Text>
                  <Text style={{ color: DS.textSecondary, fontSize: 13, fontFamily: 'sf-pro-rounded-semibold' }}>
                    {profile?.email ?? 'Not signed in'}
                  </Text>
                </View>
                {planLabel === 'Pro' ? (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                  >
                    <Text style={{ color: '#000', fontSize: 13, fontWeight: '700', fontFamily: 'sf-pro-rounded-semibold' }}>
                      {planLabel}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={{ color: DS.textSecondary, fontSize: 13, fontWeight: '600', fontFamily: 'sf-pro-rounded-semibold' }}>
                    {planLabel}
                  </Text>
                )}
              </View>

              <View style={styles.settingsRowBorder} />

              <SettingsRow
                icon={CreditCard}
                label="Account & Billing"
                onPress={() => router.push('/account' as never)}
                isLast
              />
            </SectionCard>

            {/* Usage bars */}
            {profile ? (
              <View
                style={styles.usageCard}
              >
                <UsageBar
                  label="Agent Hours"
                  used={profile.agentHoursUsed}
                  limit={profile.agentHoursLimit}
                  unit="h"
                />
                <UsageBar
                  label="Runs"
                  used={profile.runsUsed}
                  limit={profile.runsLimit}
                  unit=""
                />
                <UsageBar
                  label="Storage"
                  used={profile.storageUsedMb}
                  limit={profile.storageLimitMb}
                  unit="MB"
                />
              </View>
            ) : null}
          </Animated.View>

          {/* ─── General Section ───────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(260)}>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              General
            </Text>
            <SectionCard>
              <SettingsRow
                icon={HelpCircle}
                label="Help & Troubleshooting"
                onPress={() => {}}
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── Danger Zone ───────────────────── */}
          <Animated.View entering={FadeInDown.duration(350).delay(340)}>
            <Text style={[styles.sectionLabel, { marginTop: 24, color: DS.danger }]}>
              Danger Zone
            </Text>
            <SectionCard>
              <Pressable
                onPress={handleSignOut}
                style={styles.settingsRow}
              >
                <View style={styles.settingsRowLeft}>
                  <LogOut size={18} color={DS.danger} />
                  <Text style={{ color: DS.danger, fontSize: 16, fontWeight: '600', fontFamily: 'sf-pro-rounded-semibold' }}>
                    Sign Out
                  </Text>
                </View>
              </Pressable>
            </SectionCard>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionLabel: {
    color: DS.textTertiary,
    fontSize: 11,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: DS.surfaceSecondary,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: DS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: DS.border,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  usageBarTrack: {
    height: 6,
    backgroundColor: DS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: 6,
    borderRadius: 3,
  },
  usageCard: {
    backgroundColor: DS.surfaceSecondary,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    gap: 18,
    borderWidth: 0.5,
    borderColor: DS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
