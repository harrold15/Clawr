import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutRight,
  Layout,
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Globe,
  FileText,
  CreditCard,
  Calendar,
  MessageSquare,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  Trash2,
  UserPlus,
  Plus,
  X,
  Cloud,
  Monitor,
} from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import type { PermissionCategory } from '@/lib/types';

// ─── Permission Config ───────────────────────────────────────
interface PermissionItem {
  key: PermissionCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const CAPABILITY_ITEMS: PermissionItem[] = [
  {
    key: 'email',
    label: 'Email',
    description: 'Read, draft, and send emails',
    icon: Mail,
  },
  {
    key: 'browser',
    label: 'Browser',
    description: 'Navigate websites and extract data',
    icon: Globe,
  },
  {
    key: 'files',
    label: 'Files',
    description: 'Read, write, and manage files',
    icon: FileText,
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Make purchases and transactions',
    icon: CreditCard,
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'View and manage calendar events',
    icon: Calendar,
  },
  {
    key: 'messages',
    label: 'Messages',
    description: 'Send and receive messages',
    icon: MessageSquare,
  },
  {
    key: 'system',
    label: 'System',
    description: 'Execute commands and scripts',
    icon: Terminal,
  },
];

interface ApprovalItem {
  key: PermissionCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  recommended?: boolean;
}

const APPROVAL_ITEMS: ApprovalItem[] = [
  {
    key: 'payments',
    label: 'Payments',
    description: 'Require approval before any purchase',
    icon: ShieldAlert,
    recommended: true,
  },
  {
    key: 'email',
    label: 'Emails to new contacts',
    description: 'Approve emails sent to unknown recipients',
    icon: UserPlus,
  },
  {
    key: 'files',
    label: 'File deletions',
    description: 'Approve before deleting any files',
    icon: Trash2,
  },
  {
    key: 'system',
    label: 'Logins',
    description: 'Approve when agent tries to sign into services',
    icon: LogIn,
  },
];

// ─── Toggle Row ──────────────────────────────────────────────
function PermissionToggleRow({
  item,
  value,
  onToggle,
  isLast,
}: {
  item: PermissionItem;
  value: boolean;
  onToggle: (v: boolean) => void;
  isLast: boolean;
}) {
  const IconComponent = item.icon;
  return (
    <View
      style={[
        styles.permissionRow,
        !isLast && styles.rowBorder,
      ]}
    >
      <View style={[styles.permIconWrap, { backgroundColor: value ? `${colors.brand}18` : `${colors.textMuted}12` }]}>
        <IconComponent size={18} color={value ? colors.brand : colors.textMuted} />
      </View>
      <View style={styles.permTextWrap}>
        <Text className="text-[#FFFFFF] text-[15px] font-semibold">
          {item.label}
        </Text>
        <Text className="text-[#A1A1AA] text-[12px]">
          {item.description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.bgInput, true: colors.brand }}
        thumbColor="#0A0A0A"
        ios_backgroundColor={colors.bgInput}
      />
    </View>
  );
}

// ─── Approval Toggle Row ─────────────────────────────────────
function ApprovalToggleRow({
  item,
  value,
  onToggle,
  isLast,
}: {
  item: ApprovalItem;
  value: boolean;
  onToggle: (v: boolean) => void;
  isLast: boolean;
}) {
  const IconComponent = item.icon;
  return (
    <View
      style={[
        styles.permissionRow,
        !isLast && styles.rowBorder,
      ]}
    >
      <View style={[styles.permIconWrap, { backgroundColor: value ? `${colors.orange}18` : `${colors.textMuted}12` }]}>
        <IconComponent size={18} color={value ? colors.orange : colors.textMuted} />
      </View>
      <View style={styles.permTextWrap}>
        <View style={styles.labelRow}>
          <Text className="text-[#FFFFFF] text-[15px] font-semibold">
            {item.label}
          </Text>
          {item.recommended ? (
            <View style={styles.recommendedBadge}>
              <ShieldCheck size={10} color={colors.orange} />
              <Text className="text-[#FFB020] text-[10px] font-bold ml-0.5">
                Recommended
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-[#A1A1AA] text-[12px]">
          {item.description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.bgInput, true: colors.orange }}
        thumbColor="#0A0A0A"
        ios_backgroundColor={colors.bgInput}
      />
    </View>
  );
}

// ─── Domain Chip ─────────────────────────────────────────────
function DomainChip({
  domain,
  onRemove,
}: {
  domain: string;
  onRemove: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInRight.duration(200)}
      exiting={FadeOutRight.duration(150)}
      layout={Layout.springify()}
      style={styles.domainChip}
    >
      <Globe size={12} color={colors.brand} />
      <Text className="text-[#FFFFFF] text-[13px] font-medium ml-1.5">
        {domain}
      </Text>
      <Pressable onPress={onRemove} style={styles.domainRemoveBtn} hitSlop={8}>
        <X size={12} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Section Card ────────────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

// ─── Permissions Screen ──────────────────────────────────────
export default function PermissionsScreen() {
  const router = useRouter();
  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const permissions = useAppStore((s) => s.permissions);
  const updatePermissions = useAppStore((s) => s.updatePermissions);

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId]
  );

  const agentPerms = useMemo(
    () =>
      currentAgent
        ? permissions[currentAgent.id] ?? {
            email: false,
            browser: true,
            files: false,
            payments: false,
            calendar: false,
            messages: false,
            system: false,
            allowedDomains: [],
            requireApprovalFor: ['payments', 'email', 'files'],
          }
        : null,
    [currentAgent, permissions]
  );

  const [domainInput, setDomainInput] = useState<string>('');
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const handleToggleCapability = useCallback(
    (key: PermissionCategory, value: boolean) => {
      if (!currentAgent) return;
      updatePermissions(currentAgent.id, { [key]: value });
      setHasChanges(true);
    },
    [currentAgent, updatePermissions]
  );

  const handleToggleApproval = useCallback(
    (key: PermissionCategory, value: boolean) => {
      if (!currentAgent || !agentPerms) return;
      const current = agentPerms.requireApprovalFor;
      const updated = value
        ? [...current, key]
        : current.filter((c) => c !== key);
      updatePermissions(currentAgent.id, { requireApprovalFor: updated });
      setHasChanges(true);
    },
    [currentAgent, agentPerms, updatePermissions]
  );

  const handleAddDomain = useCallback(() => {
    if (!currentAgent || !agentPerms || !domainInput.trim()) return;
    const trimmed = domainInput.trim().toLowerCase();
    if (agentPerms.allowedDomains.includes(trimmed)) {
      setDomainInput('');
      return;
    }
    updatePermissions(currentAgent.id, {
      allowedDomains: [...agentPerms.allowedDomains, trimmed],
    });
    setDomainInput('');
    setHasChanges(true);
  }, [currentAgent, agentPerms, domainInput, updatePermissions]);

  const handleRemoveDomain = useCallback(
    (domain: string) => {
      if (!currentAgent || !agentPerms) return;
      updatePermissions(currentAgent.id, {
        allowedDomains: agentPerms.allowedDomains.filter((d) => d !== domain),
      });
      setHasChanges(true);
    },
    [currentAgent, agentPerms, updatePermissions]
  );

  const handleSave = useCallback(() => {
    setHasChanges(false);
  }, []);

  if (!currentAgent || !agentPerms) {
    return (
      <View className="flex-1 bg-black">
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Permissions',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.textPrimary,
            headerLeft: () => (
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <ArrowLeft size={22} color={colors.textPrimary} />
              </Pressable>
            ),
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.flex1}>
          <View style={styles.emptyCenter}>
            <Text className="text-[#71717A] text-[16px]">No agent selected</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Permissions',
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Agent Info Bar ────────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(0)}>
          <View style={styles.agentInfoBar}>
            <View style={styles.agentAvatar}>
              <Text className="text-[#E63946] text-[16px] font-bold">
                {currentAgent.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.agentInfoText}>
              <Text className="text-[#FFFFFF] text-[15px] font-bold">
                {currentAgent.name}
              </Text>
              <View style={styles.agentTypeBadge}>
                {currentAgent.type === 'cloud' ? (
                  <Cloud size={10} color={colors.blue} />
                ) : (
                  <Monitor size={10} color={colors.blue} />
                )}
                <Text className="text-[#6C8EFF] text-[11px] font-semibold ml-1">
                  {currentAgent.type === 'cloud' ? 'Cloud Agent' : 'Local Agent'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ─── Capabilities ─────────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(60)}>
          <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1 mt-4">
            Capabilities
          </Text>
          <SectionCard>
            {CAPABILITY_ITEMS.map((item, idx) => (
              <PermissionToggleRow
                key={item.key}
                item={item}
                value={agentPerms[item.key] as boolean}
                onToggle={(v) => handleToggleCapability(item.key, v)}
                isLast={idx === CAPABILITY_ITEMS.length - 1}
              />
            ))}
          </SectionCard>
        </Animated.View>

        {/* ─── Require Approval ─────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(140)}>
          <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1 mt-6">
            Require Approval For
          </Text>
          <SectionCard>
            {APPROVAL_ITEMS.map((item, idx) => (
              <ApprovalToggleRow
                key={item.key}
                item={item}
                value={agentPerms.requireApprovalFor.includes(item.key)}
                onToggle={(v) => handleToggleApproval(item.key, v)}
                isLast={idx === APPROVAL_ITEMS.length - 1}
              />
            ))}
          </SectionCard>
        </Animated.View>

        {/* ─── Domain Allowlist ─────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(220)}>
          <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1 mt-6">
            Allowed Domains
          </Text>
          <SectionCard>
            <View style={styles.domainInputRow}>
              <TextInput
                style={styles.domainInput}
                value={domainInput}
                onChangeText={setDomainInput}
                placeholder="e.g. google.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={handleAddDomain}
              />
              <Pressable
                onPress={handleAddDomain}
                style={[
                  styles.addDomainBtn,
                  { opacity: domainInput.trim() ? 1 : 0.4 },
                ]}
                disabled={!domainInput.trim()}
              >
                <Plus size={18} color={colors.textInverse} />
              </Pressable>
            </View>
            {agentPerms.allowedDomains.length > 0 ? (
              <View style={styles.domainList}>
                {agentPerms.allowedDomains.map((domain) => (
                  <DomainChip
                    key={domain}
                    domain={domain}
                    onRemove={() => handleRemoveDomain(domain)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.domainEmptyWrap}>
                <Text className="text-[#71717A] text-[13px]">
                  No domain restrictions. Agent can access any site.
                </Text>
              </View>
            )}
          </SectionCard>
        </Animated.View>

        {/* ─── Save Button ──────────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(300)}>
          <Pressable
            onPress={handleSave}
            style={[
              styles.saveButton,
              { opacity: hasChanges ? 1 : 0.5 },
            ]}
            disabled={!hasChanges}
          >
            <ShieldCheck size={18} color={colors.textInverse} />
            <Text className="text-white text-[16px] font-bold ml-2">
              Save Permissions
            </Text>
          </Pressable>
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
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Agent info bar
  agentInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentInfoText: {
    flex: 1,
    gap: 3,
  },
  agentTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
  },

  // Permission Row
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  permIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTextWrap: {
    flex: 1,
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${colors.orange}15`,
  },

  // Domain Allowlist
  domainInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  domainInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  addDomainBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  domainRemoveBtn: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: `${colors.textMuted}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainEmptyWrap: {
    padding: 16,
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
  },
});
