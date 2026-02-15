import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import {
  ArrowLeft,
  Camera,
  X,
  Plus,
  Trash2,
  Save,
  Clock,
} from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';
import { cn } from '@/lib/cn';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Main Screen ────────────────────────────────────────────
export default function AgentSettingsScreen() {
  const router = useRouter();
  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const updateAgent = useAppStore((s) => s.updateAgent);
  const removeAgent = useAppStore((s) => s.removeAgent);
  const workingHours = useAppStore((s) => s.workingHours);
  const updateWorkingHours = useAppStore((s) => s.updateWorkingHours);

  const agent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const agentWorkingHours = useMemo(
    () =>
      selectedAgentId && workingHours[selectedAgentId]
        ? workingHours[selectedAgentId]
        : { enabled: false, start: '09:00', end: '17:00', timezone: 'America/New_York', daysActive: [1, 2, 3, 4, 5] },
    [workingHours, selectedAgentId]
  );

  // Local form state
  const [name, setName] = useState<string>(agent?.name ?? '');
  const [persona, setPersona] = useState<string>(agent?.persona ?? '');
  const [tone, setTone] = useState<number>(agent?.tone ?? 50);
  const [goals, setGoals] = useState<string[]>(agent?.goals ?? []);
  const [newGoal, setNewGoal] = useState<string>('');
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(agentWorkingHours.enabled);
  const [startTime, setStartTime] = useState<string>(agentWorkingHours.start);
  const [endTime, setEndTime] = useState<string>(agentWorkingHours.end);
  const [daysActive, setDaysActive] = useState<number[]>(agentWorkingHours.daysActive);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAddGoal = useCallback(() => {
    const trimmed = newGoal.trim();
    if (trimmed.length > 0) {
      setGoals((prev) => [...prev, trimmed]);
      setNewGoal('');
    }
  }, [newGoal]);

  const handleRemoveGoal = useCallback((index: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleToggleDay = useCallback((day: number) => {
    setDaysActive((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedAgentId) return;
    updateAgent(selectedAgentId, {
      name: name.trim() || agent?.name || 'Agent',
      persona: persona.trim(),
      tone,
      goals,
    });
    updateWorkingHours(selectedAgentId, {
      enabled: scheduleEnabled,
      start: startTime,
      end: endTime,
      daysActive,
    });
    router.back();
  }, [
    selectedAgentId,
    name,
    persona,
    tone,
    goals,
    scheduleEnabled,
    startTime,
    endTime,
    daysActive,
    updateAgent,
    updateWorkingHours,
    router,
    agent,
  ]);

  const handleDeleteAgent = useCallback(() => {
    if (!selectedAgentId) return;
    removeAgent(selectedAgentId);
    router.back();
  }, [selectedAgentId, removeAgent, router]);

  const toneLabel = tone <= 30 ? 'Formal' : tone >= 70 ? 'Casual' : 'Balanced';

  if (!agent) {
    return (
      <View className="flex-1 bg-black">
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View className="flex-row items-center px-4 pt-2 pb-3">
            <Pressable onPress={handleGoBack} style={styles.backButton}>
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text className="text-[#FFFFFF] text-[18px] font-semibold ml-3">No Agent Selected</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(350)}
          className="flex-row items-center justify-between px-4 pt-2 pb-3"
        >
          <Pressable onPress={handleGoBack} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text className="text-[#FFFFFF] text-[18px] font-semibold">Agent Settings</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Identity Section ─────────────────── */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            {/* Avatar */}
            <View className="items-center" style={{ marginTop: 8, marginBottom: 24 }}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Image
                    source={getAvatarImage(agent.avatarId)}
                    style={{ width: '100%', height: '100%', borderRadius: 40 }}
                    resizeMode="cover"
                  />
                </View>
                <Pressable style={styles.avatarEditBadge}>
                  <Camera size={14} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            {/* Name Input */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1">
                Name
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Agent name"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Persona Input */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1">
                Persona
              </Text>
              <View style={[styles.inputContainer, { minHeight: 80 }]}>
                <TextInput
                  value={persona}
                  onChangeText={setPersona}
                  placeholder="What's your agent's personality?"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  style={[styles.textInput, { minHeight: 70, paddingTop: 12 }]}
                />
              </View>
            </View>

            {/* Tone Slider */}
            <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase ml-1">
                  Tone
                </Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: colors.bgElevated,
                  }}
                >
                  <Text className="text-[#FFFFFF] text-[12px] font-semibold">{toneLabel}</Text>
                </View>
              </View>

              <View style={styles.sliderCard}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[#A1A1AA] text-[12px]">Formal</Text>
                  <Text className="text-[#A1A1AA] text-[12px]">Casual</Text>
                </View>

                {/* Custom slider track */}
                <Pressable
                  onPress={(e) => {
                    const trackWidth = e.nativeEvent.locationX;
                    const containerWidth = 300; // approximate
                    const pct = Math.max(0, Math.min(100, Math.round((trackWidth / containerWidth) * 100)));
                    setTone(pct);
                  }}
                  style={styles.sliderTrack}
                >
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${tone}%` as never },
                    ]}
                  />
                  <View
                    style={[
                      styles.sliderThumb,
                      { left: `${tone}%` as never, marginLeft: -10 },
                    ]}
                  />
                </Pressable>

                {/* Discrete step buttons */}
                <View className="flex-row items-center justify-between" style={{ marginTop: 12 }}>
                  {[0, 25, 50, 75, 100].map((val) => (
                    <Pressable
                      key={val}
                      onPress={() => setTone(val)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: tone === val ? colors.brand : colors.bgElevated,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: tone === val ? colors.textInverse : colors.textMuted,
                        }}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ─── Goals Section ────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1">
                Goals
              </Text>

              <View style={styles.sectionCard}>
                {goals.map((goal, index) => (
                  <Animated.View
                    key={`goal-${index}`}
                    entering={FadeIn.duration(300)}
                    style={[
                      styles.goalRow,
                      index < goals.length - 1 ? styles.goalRowBorder : null,
                    ]}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.brand,
                        marginTop: 6,
                        marginRight: 12,
                      }}
                    />
                    <Text className="text-[#FFFFFF] text-[14px] flex-1" style={{ lineHeight: 20 }}>
                      {goal}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveGoal(index)}
                      style={styles.goalDeleteButton}
                    >
                      <X size={14} color={colors.textMuted} />
                    </Pressable>
                  </Animated.View>
                ))}

                {/* Add goal input */}
                <View style={styles.addGoalRow}>
                  <TextInput
                    value={newGoal}
                    onChangeText={setNewGoal}
                    placeholder="Add a new goal..."
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={handleAddGoal}
                    returnKeyType="done"
                    style={styles.addGoalInput}
                  />
                  <Pressable
                    onPress={handleAddGoal}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: newGoal.trim().length > 0
                        ? (pressed ? colors.brandDim : colors.brand)
                        : colors.bgElevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Plus
                      size={16}
                      color={newGoal.trim().length > 0 ? colors.textInverse : colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ─── Schedule Section ─────────────────── */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1">
                Schedule
              </Text>

              <View style={styles.sectionCard}>
                {/* Working Hours Toggle */}
                <Pressable
                  onPress={() => setScheduleEnabled((v) => !v)}
                  style={styles.scheduleToggleRow}
                >
                  <Clock size={18} color={colors.textSecondary} />
                  <Text className="text-[#FFFFFF] text-[15px] font-medium flex-1 ml-3">
                    Working Hours
                  </Text>
                  <View
                    style={[
                      styles.toggleTrack,
                      {
                        backgroundColor: scheduleEnabled ? colors.brand : colors.bgElevated,
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.toggleThumb,
                        {
                          transform: [{ translateX: scheduleEnabled ? 18 : 2 }],
                        },
                      ]}
                    />
                  </View>
                </Pressable>

                {scheduleEnabled ? (
                  <>
                    <View style={styles.divider} />

                    {/* Time Inputs */}
                    <View className="flex-row items-center" style={{ padding: 16, gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text className="text-[#A1A1AA] text-[11px] font-semibold mb-1 ml-1">
                          Start
                        </Text>
                        <View style={styles.timeInputContainer}>
                          <TextInput
                            value={startTime}
                            onChangeText={setStartTime}
                            placeholder="09:00"
                            placeholderTextColor={colors.textMuted}
                            style={styles.timeInput}
                            keyboardType="numbers-and-punctuation"
                            maxLength={5}
                          />
                        </View>
                      </View>
                      <Text className="text-[#71717A] text-[16px] font-medium" style={{ marginTop: 16 }}>
                        to
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text className="text-[#A1A1AA] text-[11px] font-semibold mb-1 ml-1">
                          End
                        </Text>
                        <View style={styles.timeInputContainer}>
                          <TextInput
                            value={endTime}
                            onChangeText={setEndTime}
                            placeholder="17:00"
                            placeholderTextColor={colors.textMuted}
                            style={styles.timeInput}
                            keyboardType="numbers-and-punctuation"
                            maxLength={5}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Day Selector */}
                    <View style={{ padding: 16 }}>
                      <Text className="text-[#A1A1AA] text-[11px] font-semibold mb-3 ml-1">
                        Active Days
                      </Text>
                      <View className="flex-row" style={{ gap: 6 }}>
                        {DAY_LABELS.map((label, index) => {
                          const isActive = daysActive.includes(index);
                          return (
                            <Pressable
                              key={label}
                              onPress={() => handleToggleDay(index)}
                              style={{
                                flex: 1,
                                paddingVertical: 10,
                                borderRadius: 10,
                                backgroundColor: isActive ? colors.brand : colors.bgElevated,
                                alignItems: 'center',
                              }}
                            >
                              <Text
                                className={cn(
                                  'text-[12px] font-semibold',
                                  isActive ? 'text-white' : 'text-[#71717A]'
                                )}
                              >
                                {label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          </Animated.View>

          {/* ─── Danger Zone ──────────────────────── */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <Text className="text-[#A1A1AA] text-[12px] font-semibold tracking-wider uppercase mb-2 ml-1">
                Danger Zone
              </Text>

              <View style={[styles.sectionCard, { borderWidth: 1, borderColor: `${colors.red}20` }]}>
                {showDeleteConfirm ? (
                  <View style={{ padding: 16 }}>
                    <Text className="text-[#FFFFFF] text-[15px] font-semibold mb-2">
                      Are you sure?
                    </Text>
                    <Text className="text-[#A1A1AA] text-[13px] mb-4" style={{ lineHeight: 18 }}>
                      This will permanently delete {agent.name} and all associated data. This action cannot be undone.
                    </Text>
                    <View className="flex-row" style={{ gap: 10 }}>
                      <Pressable
                        onPress={() => setShowDeleteConfirm(false)}
                        style={({ pressed }) => ({
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 12,
                          backgroundColor: pressed ? colors.bgHover : colors.bgElevated,
                          alignItems: 'center',
                        })}
                      >
                        <Text className="text-[#FFFFFF] text-[14px] font-semibold">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleDeleteAgent}
                        style={({ pressed }) => ({
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 12,
                          backgroundColor: pressed ? colors.red : `${colors.red}30`,
                          alignItems: 'center',
                        })}
                      >
                        <Text className="text-[#FF4D6A] text-[14px] font-semibold">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowDeleteConfirm(true)}
                    style={styles.deleteRow}
                  >
                    <Trash2 size={18} color={colors.red} />
                    <Text className="text-[#FF4D6A] text-[15px] font-medium ml-3">
                      Delete Agent
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Floating Save Button */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          style={styles.saveButtonContainer}
        >
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: pressed ? colors.brandDim : colors.brand,
              },
            ]}
          >
            <Save size={18} color={colors.textInverse} />
            <Text className="text-white text-[16px] font-bold ml-2">Save Changes</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sliderCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgElevated,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.bg,
    top: -7,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  goalRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  goalDeleteButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  addGoalInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
  },
  scheduleToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0A0A0A',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  timeInputContainer: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeInput: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
