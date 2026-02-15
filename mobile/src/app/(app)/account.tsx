import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  User,
  Zap,
  Crown,
  Users,
  ChevronRight,
  CreditCard,
  Receipt,
  Settings,
  WifiOff,
  Unplug,
  RefreshCw,
  FileDown,
  Clock,
  Target,
  HardDrive,
  Check,
  Star,
} from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useAppStore } from '@/lib/store';

// ─── Animated Usage Bar ──────────────────────────────────────
function AnimatedUsageBar({
  label,
  used,
  limit,
  unit,
  color = colors.brand,
  delay = 0,
  icon: IconComponent,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
  color?: string;
  delay?: number;
  icon: React.ComponentType<{ size: number; color: string }>;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isHigh = percentage > 80;
  const barColor = isHigh ? colors.orange : color;
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withDelay(
      delay,
      withTiming(percentage, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [percentage, delay]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%` as unknown as number,
    backgroundColor: barColor,
  }));

  const formatValue = (v: number): string => {
    if (v % 1 !== 0) return v.toFixed(1);
    return v.toString();
  };

  return (
    <View style={styles.usageItem}>
      <View style={styles.usageHeader}>
        <View style={styles.usageLabelRow}>
          <View style={[styles.usageIconWrap, { backgroundColor: `${barColor}18` }]}>
            <IconComponent size={14} color={barColor} />
          </View>
          <Text className="text-[#FFFFFF] text-[14px] font-semibold">
            {label}
          </Text>
        </View>
        <View style={styles.usageValueRow}>
          <Text className="text-[#FFFFFF] text-[14px] font-bold">
            {formatValue(used)}
          </Text>
          <Text className="text-[#71717A] text-[14px]">
            {' / '}
            {formatValue(limit)}{unit ? ` ${unit}` : null}
          </Text>
        </View>
      </View>
      <View style={styles.usageBarTrack}>
        <Animated.View style={[styles.usageBarFill, barStyle]} />
      </View>
      <Text className="text-[#71717A] text-[11px] mt-1">
        {Math.round(percentage)}% used
      </Text>
    </View>
  );
}

// ─── Section Card ────────────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

// ─── Settings Row ────────────────────────────────────────────
function SettingsRow({
  icon: IconComponent,
  iconColor = colors.textSecondary,
  label,
  subtitle,
  onPress,
  isLast = false,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsRow, !isLast && styles.rowBorder]}
    >
      <View style={styles.settingsRowLeft}>
        <View style={[styles.settingsIconWrap, { backgroundColor: `${iconColor}18` }]}>
          <IconComponent size={16} color={iconColor} />
        </View>
        <View style={styles.settingsTextWrap}>
          <Text className="text-[#FFFFFF] text-[15px] font-medium">
            {label}
          </Text>
          {subtitle ? (
            <Text className="text-[#A1A1AA] text-[12px]">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

// ─── Help Item ───────────────────────────────────────────────
function HelpItem({
  icon: IconComponent,
  iconColor = colors.textSecondary,
  title,
  description,
  actionLabel,
  onPress,
  isLast = false,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.helpRow, !isLast && styles.rowBorder]}
    >
      <View style={[styles.helpIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <IconComponent size={18} color={iconColor} />
      </View>
      <View style={styles.helpTextWrap}>
        <Text className="text-[#FFFFFF] text-[14px] font-semibold">
          {title}
        </Text>
        <Text className="text-[#A1A1AA] text-[12px]">
          {description}
        </Text>
      </View>
      {actionLabel ? (
        <View style={styles.helpActionBadge}>
          <Text className="text-[#E63946] text-[11px] font-bold">
            {actionLabel}
          </Text>
        </View>
      ) : (
        <ChevronRight size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

// ─── Feature Check ───────────────────────────────────────────
function FeatureCheck({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Check size={14} color={colors.brand} />
      <Text className="text-[#FFFFFF] text-[13px] ml-2">
        {text}
      </Text>
    </View>
  );
}

// ─── Account Screen ──────────────────────────────────────────
export default function AccountScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);

  const planConfig = useMemo(() => {
    if (!profile) return { label: 'Free', icon: Star, color: colors.textSecondary };
    switch (profile.plan) {
      case 'pro':
        return { label: 'Pro', icon: Crown, color: colors.brand };
      case 'team':
        return { label: 'Team', icon: Users, color: colors.blue };
      default:
        return { label: 'Free', icon: Star, color: colors.textSecondary };
    }
  }, [profile]);

  const PlanIcon = planConfig.icon;
  const isFree = !profile || profile.plan === 'free';

  const userInitial = useMemo(() => {
    if (!profile?.name) return '?';
    return profile.name.charAt(0).toUpperCase();
  }, [profile]);

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Account',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginRight: 8 }}>
              <ArrowLeft size={22} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Profile Section ──────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(0)}>
          <View style={styles.profileSection}>
            <View style={styles.avatarLarge}>
              <Text className="text-[#E63946] text-[32px] font-bold">
                {userInitial}
              </Text>
            </View>
            <Text className="text-[#FFFFFF] text-[22px] font-bold mt-3">
              {profile?.name ?? 'Guest User'}
            </Text>
            <Text className="text-[#A1A1AA] text-[14px] mt-1">
              {profile?.email ?? 'Not signed in'}
            </Text>
            <View style={[styles.planBadge, { backgroundColor: `${planConfig.color}18` }]}>
              <PlanIcon size={14} color={planConfig.color} />
              <Text
                className="text-[14px] font-bold ml-1.5"
                style={{ color: planConfig.color }}
              >
                {planConfig.label} Plan
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Upgrade CTA (Free plan) ──────── */}
        {isFree ? (
          <Animated.View entering={FadeInDown.duration(350).delay(60)}>
            <Pressable style={styles.upgradeCard}>
              <View style={styles.upgradeTop}>
                <View style={styles.upgradeIconWrap}>
                  <Zap size={20} color={colors.textInverse} />
                </View>
                <View style={styles.upgradeTextWrap}>
                  <Text className="text-[#FFFFFF] text-[18px] font-bold">
                    Upgrade to Pro
                  </Text>
                  <Text className="text-[#A1A1AA] text-[13px] mt-0.5">
                    Unlock the full power of your agents
                  </Text>
                </View>
                <View style={styles.priceTag}>
                  <Text className="text-[#E63946] text-[20px] font-bold">
                    $9
                  </Text>
                  <Text className="text-[#A1A1AA] text-[12px]">
                    /mo
                  </Text>
                </View>
              </View>
              <View style={styles.upgradeDivider} />
              <View style={styles.featureList}>
                <FeatureCheck text="100 agent hours per month" />
                <FeatureCheck text="500 task runs" />
                <FeatureCheck text="5 GB secure storage" />
                <FeatureCheck text="Priority agent execution" />
              </View>
              <View style={styles.upgradeBtn}>
                <Text className="text-white text-[15px] font-bold">
                  Upgrade Now
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        ) : null}

        {/* ─── Plan Card (paid plans) ───────── */}
        {!isFree ? (
          <Animated.View entering={FadeInDown.duration(350).delay(60)}>
            <View style={styles.currentPlanCard}>
              <View style={styles.currentPlanHeader}>
                <View style={[styles.currentPlanIconWrap, { backgroundColor: `${planConfig.color}18` }]}>
                  <PlanIcon size={20} color={planConfig.color} />
                </View>
                <View style={styles.currentPlanInfo}>
                  <Text className="text-[#FFFFFF] text-[17px] font-bold">
                    {planConfig.label} Plan
                  </Text>
                  <Text className="text-[#A1A1AA] text-[13px]">
                    Active subscription
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text className="text-[#E63946] text-[12px] font-semibold">
                    Active
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* ─── Usage Section ─────────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(140)}>
          <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1 mt-5">
            This Month's Usage
          </Text>
          <SectionCard>
            <View style={styles.usageContainer}>
              <AnimatedUsageBar
                label="Agent Hours"
                used={profile?.agentHoursUsed ?? 0}
                limit={profile?.agentHoursLimit ?? 10}
                unit="hrs"
                icon={Clock}
                delay={200}
              />
              <View style={styles.usageDivider} />
              <AnimatedUsageBar
                label="Task Runs"
                used={profile?.runsUsed ?? 0}
                limit={profile?.runsLimit ?? 50}
                unit=""
                icon={Target}
                delay={400}
              />
              <View style={styles.usageDivider} />
              <AnimatedUsageBar
                label="Storage"
                used={profile?.storageUsedMb ?? 0}
                limit={profile?.storageLimitMb ?? 500}
                unit="MB"
                icon={HardDrive}
                color={colors.blue}
                delay={600}
              />
            </View>
          </SectionCard>
        </Animated.View>

        {/* ─── Billing Section ───────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(220)}>
          <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1 mt-6">
            Billing
          </Text>
          <SectionCard>
            <SettingsRow
              icon={CreditCard}
              iconColor={colors.purple}
              label="Payment Method"
              subtitle="No card on file"
              onPress={() => {}}
            />
            <SettingsRow
              icon={Receipt}
              iconColor={colors.orange}
              label="Billing History"
              subtitle="View past invoices"
              onPress={() => {}}
            />
            <SettingsRow
              icon={Settings}
              iconColor={colors.brand}
              label="Manage Subscription"
              subtitle="Change or cancel your plan"
              onPress={() => {}}
              isLast
            />
          </SectionCard>
        </Animated.View>

        {/* ─── Help & Troubleshooting ────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(300)}>
          <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1 mt-6">
            Help & Troubleshooting
          </Text>
          <SectionCard>
            <HelpItem
              icon={WifiOff}
              iconColor={colors.red}
              title="Agent offline"
              description="Check connection status and restart your agent"
              onPress={() => {}}
            />
            <HelpItem
              icon={Unplug}
              iconColor={colors.orange}
              title="Local node disconnected"
              description="Verify your local machine is running the agent daemon"
              onPress={() => {}}
            />
            <HelpItem
              icon={RefreshCw}
              iconColor={colors.blue}
              title="Re-pair device"
              description="Generate a new pairing code for your local agent"
              actionLabel="Pair"
              onPress={() => {}}
            />
            <HelpItem
              icon={FileDown}
              iconColor={colors.purple}
              title="Export logs"
              description="Download agent activity logs for debugging"
              actionLabel="Export"
              onPress={() => {}}
              isLast
            />
          </SectionCard>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.brand,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 12,
  },

  // Upgrade CTA
  upgradeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.brand}30`,
  },
  upgradeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  upgradeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTextWrap: {
    flex: 1,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  upgradeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  featureList: {
    padding: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeBtn: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },

  // Current Plan Card
  currentPlanCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentPlanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanInfo: {
    flex: 1,
    gap: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: `${colors.brand}15`,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
  },

  // Usage
  usageContainer: {
    padding: 16,
  },
  usageItem: {
    gap: 4,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usageIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  usageBarTrack: {
    height: 8,
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  usageBarFill: {
    height: 8,
    borderRadius: 4,
  },
  usageDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  // Billing rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTextWrap: {
    flex: 1,
    gap: 2,
  },

  // Help rows
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  helpIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTextWrap: {
    flex: 1,
    gap: 2,
  },
  helpActionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: `${colors.brand}18`,
  },
});
