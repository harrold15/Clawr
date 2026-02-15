import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { AVATAR_COUNT, getAvatarImage, AVATAR_IMAGES } from '@/lib/avatars';
import type { Agent } from '@/lib/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Design tokens
const DS = {
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
  brandText: '#FFFFFF',
  brand: '#2563EB',
  gradient: ['#2563EB', '#1D4ED8'] as const,
};

// Confetti colors
const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
];

type CreateStep = 'loading' | 'roulette' | 'success';

// ── Confetti Piece ──────────────────────────────────────────
function ConfettiPiece({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    scale.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_H + 50, { duration: 2800 + Math.random() * 800, easing: Easing.out(Easing.quad) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(drift, { duration: 2800, easing: Easing.inOut(Easing.sin) })
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1200 + Math.random() * 600 }), -1)
    );
    opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 800 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const isCircle = Math.random() > 0.5;
  const size = 6 + Math.random() * 6;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -10,
          left: startX,
          width: size,
          height: isCircle ? size : size * 2.5,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : 2,
        },
        animStyle,
      ]}
    />
  );
}

// ── Loading Dot ──────────────────────────────────────────
function LoadingDot({ delay: d }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.ease }),
          withTiming(0.3, { duration: 400, easing: Easing.ease })
        ),
        -1
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: DS.textTertiary,
          marginHorizontal: 4,
        },
        animStyle,
      ]}
    />
  );
}

// ── Spinning Lobster Loader ──────────────────────────────────
function SpinningLoader() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={loadingStyles.container}>
      <Animated.View style={spinStyle}>
        <Text style={loadingStyles.lobsterEmoji}>🦞</Text>
      </Animated.View>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobsterEmoji: {
    fontSize: 64,
  },
});

// ── Preload all avatar assets into memory ─────
function usePreloadAvatars() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const preload = async () => {
      try {
        const sources = Object.values(AVATAR_IMAGES);
        // Use expo-asset to download and cache every avatar
        await Asset.loadAsync(sources as number[]);
        if (!cancelled) setReady(true);
      } catch {
        // Even on error, proceed after a timeout
        if (!cancelled) setReady(true);
      }
    };
    preload();
    return () => { cancelled = true; };
  }, []);

  return ready;
}

// ── Avatar Roulette (Horizontal sliding strip) ───────────────
const AVATAR_SIZE = 80;
const AVATAR_GAP = 14;
const ITEM_WIDTH = AVATAR_SIZE + AVATAR_GAP;

function buildRouletteStrip(targetId: number): { strip: number[]; targetIndex: number } {
  const strip: number[] = [];
  // 3 full shuffled passes through all avatars
  for (let r = 0; r < 3; r++) {
    const shuffled = [...Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1)].sort(() => Math.random() - 0.5);
    strip.push(...shuffled);
  }
  // Place target somewhere in the last third (not at the very end)
  // Pick a random position in the last ~10 items, but leave 3-4 after it
  const insertAt = strip.length - 3 - Math.floor(Math.random() * 5);
  strip.splice(insertAt, 0, targetId);
  return { strip, targetIndex: insertAt };
}

function AvatarRoulette({ targetAvatarId, onLanded }: { targetAvatarId: number; onLanded: () => void }) {
  const [{ strip, targetIndex }] = useState(() => buildRouletteStrip(targetAvatarId));
  const translateX = useSharedValue(0);
  const [landed, setLanded] = useState(false);
  const landedRef = useRef(false);

  // We want the target item centered in the viewport
  const finalOffset = -(targetIndex * ITEM_WIDTH);

  const handleLanded = useCallback(() => {
    if (!landedRef.current) {
      landedRef.current = true;
      setLanded(true);
      onLanded();
    }
  }, [onLanded]);

  useEffect(() => {
    // Animate: fast start, decelerate to final position
    translateX.value = withSequence(
      // Fast spin through ~80% of the strip
      withTiming(finalOffset * 0.8, {
        duration: 1600,
        easing: Easing.in(Easing.quad),
      }),
      // Slow deceleration to land on target
      withTiming(finalOffset, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Fire landed callback after both animations complete
    const timer = setTimeout(() => {
      handleLanded();
    }, 2850);

    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={rouletteStyles.wrapper}>
      {/* Left fade */}
      <LinearGradient
        colors={['#000000', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={rouletteStyles.fadeLeft}
        pointerEvents="none"
      />
      {/* Right fade */}
      <LinearGradient
        colors={['transparent', '#000000']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={rouletteStyles.fadeRight}
        pointerEvents="none"
      />

      {/* Center selection indicator */}
      <View style={rouletteStyles.centerIndicator} pointerEvents="none">
        <View style={[
          rouletteStyles.centerRing,
          landed && { borderColor: DS.brand },
        ]} />
      </View>

      {/* Sliding strip */}
      <Animated.View style={[rouletteStyles.strip, animStyle]}>
        {strip.map((avId, idx) => (
          <View key={`av-${idx}`} style={rouletteStyles.avatarSlot}>
            <View style={rouletteStyles.avatarFrame}>
              <Image
                source={getAvatarImage(avId)}
                style={rouletteStyles.avatarImg}
                resizeMode="cover"
              />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const rouletteStyles = StyleSheet.create({
  wrapper: {
    width: SCREEN_W,
    height: AVATAR_SIZE + 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    // Position so that item 0's center aligns with screen center
    marginLeft: SCREEN_W / 2 - ITEM_WIDTH / 2,
  },
  avatarSlot: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFrame: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: DS.surfaceSecondary,
    overflow: 'hidden',
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  centerIndicator: {
    position: 'absolute',
    left: SCREEN_W / 2 - (AVATAR_SIZE + 8) / 2,
    top: (AVATAR_SIZE + 20) / 2 - (AVATAR_SIZE + 8) / 2,
    zIndex: 5,
  },
  centerRing: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  fadeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 80,
    zIndex: 10,
  },
  fadeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 80,
    zIndex: 10,
  },
});

// ── Main Screen ──────────────────────────────────────────────
export default function CreateAgentScreen() {
  const [step, setStep] = useState<CreateStep>('loading');
  const [agentName, setAgentName] = useState('');
  const [avatarId, setAvatarId] = useState<number | null>(null);
  const [targetAvatarId] = useState(() => Math.floor(Math.random() * AVATAR_COUNT) + 1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rouletteLanded, setRouletteLanded] = useState(false);

  const addAgent = useAppStore((s) => s.addAgent);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const loadMockData = useAppStore((s) => s.loadMockData);
  const selectAgent = useAppStore((s) => s.selectAgent);
  const avatarsReady = usePreloadAvatars();

  // Step 1: Show loading until both minimum time AND images are preloaded
  useEffect(() => {
    if (!avatarsReady) return;
    // Images are ready, wait a small minimum so loading feels intentional
    const timer = setTimeout(() => {
      setStep('roulette');
    }, 800);
    return () => clearTimeout(timer);
  }, [avatarsReady]);

  const handleRouletteLanded = useCallback(() => {
    setAvatarId(targetAvatarId);
    setRouletteLanded(true);
    // Small delay then show success step
    setTimeout(() => {
      setStep('success');
    }, 600);
  }, [targetAvatarId]);

  const handleCreate = useCallback(() => {
    if (!agentName.trim() || !avatarId) return;

    const agentId = `agent-${Date.now()}`;
    const agent: Agent = {
      id: agentId,
      name: agentName.trim(),
      avatarId,
      type: 'cloud',
      template: 'assistant',
      status: 'idle',
      tone: 50,
      persona: 'Helpful and proactive personal assistant',
      goals: ['Manage tasks', 'Answer questions', 'Research topics'],
      createdAt: new Date().toISOString(),
      totalTasks: 0,
      totalApprovals: 0,
    };

    setOnboarded(true);
    setAuthenticated(true);
    addAgent(agent);
    selectAgent(agentId);
    loadMockData(agent);

    // Show confetti
    setShowConfetti(true);

    // Navigate after confetti
    setTimeout(() => {
      router.replace('/(app)/(tabs)' as any);
    }, 2000);
  }, [agentName, avatarId, addAgent, selectAgent, setOnboarded, setAuthenticated, loadMockData]);

  const canCreate = !!agentName.trim();

  // Generate confetti pieces
  const confettiPieces = React.useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 400,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      startX: Math.random() * SCREEN_W,
    }));
  }, []);

  return (
    <View style={s.container}>
      <SafeAreaView style={s.flex1}>
        {/* Loading Step - spinning lobster + dots */}
        {step === 'loading' && (
          <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={s.stepContainer}>
            <View style={s.centerContent}>
              <Animated.View entering={ZoomIn.duration(600)} style={s.loadingContent}>
                <SpinningLoader />
                <View style={s.loadingTextBlock}>
                  <Text style={s.loadingTitle}>Creating agent</Text>
                  <View style={s.dotsRow}>
                    <LoadingDot delay={0} />
                    <LoadingDot delay={200} />
                    <LoadingDot delay={400} />
                  </View>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        )}

        {/* Roulette Step - avatar slot machine */}
        {step === 'roulette' && (
          <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={s.stepContainer}>
            <View style={s.centerContent}>
              <Animated.View entering={FadeIn.duration(300)} style={s.rouletteContent}>
                <Text style={s.rouletteTitle}>Selecting your agent</Text>
                <View style={{ marginTop: 32 }}>
                  <AvatarRoulette
                    targetAvatarId={targetAvatarId}
                    onLanded={handleRouletteLanded}
                  />
                </View>
                <View style={s.dotsRow}>
                  <LoadingDot delay={0} />
                  <LoadingDot delay={200} />
                  <LoadingDot delay={400} />
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        )}

        {/* Success + Naming Step */}
        {step === 'success' && (
          <Animated.View entering={FadeIn.duration(400)} style={s.stepContainer}>
            {/* Confetti overlay */}
            {showConfetti ? (
              <View style={s.confettiContainer} pointerEvents="none">
                {confettiPieces.map((p) => (
                  <ConfettiPiece key={p.id} delay={p.delay} color={p.color} startX={p.startX} />
                ))}
              </View>
            ) : null}

            {/* Header with back */}
            <View style={s.header}>
              <Pressable onPress={() => router.back()} style={s.backButton}>
                <ChevronLeft size={20} color={DS.textSecondary} />
              </Pressable>
            </View>

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={s.successContent}>
                  <Animated.View entering={FadeInDown.duration(500).delay(0)}>
                    <View style={s.successBadge}>
                      <Check size={16} color="#22C55E" strokeWidth={3} />
                      <Text style={s.successBadgeText}>Agent Created</Text>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(500).delay(150)} style={s.avatarSection}>
                    <View style={s.avatarGlow}>
                      <View style={s.largeAvatarContainer}>
                        <Image
                          source={avatarId ? getAvatarImage(avatarId) : getAvatarImage(1)}
                          style={s.largeAvatar}
                          resizeMode="cover"
                        />
                      </View>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                    <Text style={s.promptText}>Name your agent</Text>
                    <TextInput
                      value={agentName}
                      onChangeText={setAgentName}
                      placeholder="e.g. Atlas, Nova, Jarvis..."
                      placeholderTextColor={DS.textTertiary}
                      style={[s.nameInput, agentName ? { borderColor: '#3b3b3b' } : null]}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleCreate}
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(500).delay(450)}>
                    <Pressable onPress={handleCreate} disabled={!canCreate}>
                      {canCreate ? (
                        <LinearGradient
                          colors={[...DS.gradient]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={s.createButton}
                        >
                          <Text style={s.createButtonText}>Continue</Text>
                        </LinearGradient>
                      ) : (
                        <View style={s.createButtonDisabled}>
                          <Text style={s.createButtonTextDisabled}>Continue</Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
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
  stepContainer: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTextBlock: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    color: DS.text,
    letterSpacing: -0.4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  // Roulette
  rouletteContent: {
    alignItems: 'center',
  },
  rouletteTitle: {
    fontSize: 22,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    color: DS.text,
    letterSpacing: -0.4,
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: 'none',
  },

  // Success
  successContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  successBadgeText: {
    fontSize: 14,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: '#22C55E',
  },
  avatarSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  avatarGlow: {
    padding: 4,
    borderRadius: 72,
    backgroundColor: 'rgba(37,99,235,0.15)',
  },
  largeAvatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: DS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: DS.border,
    overflow: 'hidden',
  },
  largeAvatar: {
    width: 130,
    height: 130,
  },
  promptText: {
    fontSize: 16,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: DS.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: DS.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DS.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: DS.text,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Button
  createButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.surfaceSecondary,
  },
  createButtonText: {
    fontSize: 17,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    color: DS.brandText,
  },
  createButtonTextDisabled: {
    fontSize: 17,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '700',
    color: DS.textTertiary,
  },
});
