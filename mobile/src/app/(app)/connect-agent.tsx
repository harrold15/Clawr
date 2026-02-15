import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, QrCode, Wifi, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { QRScannerModal } from '@/components/QRScannerModal';
import type { Agent } from '@/lib/types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

type PairingState = 'idle' | 'initializing' | 'scanning' | 'processing' | 'connecting' | 'connected' | 'error' | 'timeout';

interface PairingSession {
  sessionId: string;
  qrCode: string;
  expiresAt: string;
}

export default function ConnectAgentScreen() {
  const [pairingCode, setPairingCode] = useState('');
  const [pairingState, setPairingState] = useState<PairingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [pairingSession, setPairingSession] = useState<PairingSession | null>(null);
  const [timeoutCounter, setTimeoutCounter] = useState(30);

  const addAgent = useAppStore((s) => s.addAgent);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const loadMockData = useAppStore((s) => s.loadMockData);

  // Cleanup timeout when unmounting
  useEffect(() => {
    return () => {
      setShowScanner(false);
      setPairingState('idle');
      setErrorMessage(null);
    };
  }, []);

  // Handle timeout countdown
  useEffect(() => {
    if (pairingState === 'scanning' && timeoutCounter > 0) {
      const interval = setInterval(() => {
        setTimeoutCounter((prev) => {
          if (prev <= 1) {
            setPairingState('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pairingState, timeoutCounter]);

  const initializePairing = async () => {
    setPairingState('initializing');
    setErrorMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/agents/pair/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName: 'Local Computer' }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize pairing session');
      }

      const data = await response.json();
      const session: PairingSession = data.data;
      setPairingSession(session);
      setPairingState('scanning');
      setTimeoutCounter(30);
      setShowScanner(true);

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Failed to start pairing');
      setPairingState('error');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const completePairing = async (sessionId: string) => {
    setPairingState('processing');
    setErrorMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/agents/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, pairingCode: pairingCode || sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Pairing failed');
      }

      const data = await response.json();
      const agent = data.data.agent as Agent;

      // Create complete agent object
      const completeAgent: Agent = {
        ...agent,
        username: `@local_${agent.id.slice(-4)}`,
        avatarId: Math.floor(Math.random() * 14) + 1,
        status: 'idle',
        tone: 30,
        persona: 'Local system agent connected to your computer',
        goals: ['Execute local tasks', 'Manage files', 'Run scripts'],
        createdAt: new Date().toISOString(),
        totalTasks: 0,
        totalApprovals: 0,
      };

      setOnboarded(true);
      setAuthenticated(true);
      addAgent(completeAgent);
      loadMockData();

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setPairingState('connected');
      setShowScanner(false);

      // Navigate after brief delay for feedback
      setTimeout(() => {
        router.replace('/(app)/(tabs)' as any);
      }, 500);
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Failed to complete pairing');
      setPairingState('error');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleQRDetected = async (qrCode: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completePairing(qrCode);
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setPairingState('idle');
    setPairingCode('');
    setPairingSession(null);
    setShowScanner(false);
  };

  const handleManualPair = async () => {
    if (!pairingCode || pairingCode.length < 6) {
      setErrorMessage('Please enter a valid 6-character pairing code');
      return;
    }
    await completePairing(pairingCode);
  };

  const isProcessing = ['initializing', 'processing', 'connecting'].includes(pairingState);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} className="px-6 pt-4 pb-6">
          <View className="flex-row items-center" style={{ gap: spacing.md }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.bgCard,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={20} color={colors.textSecondary} />
            </Pressable>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.textPrimary,
                fontFamily: 'sf-pro-rounded-semibold',
              }}
            >
              Connect Agent
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg * 1.5, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Instructions */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500).springify()}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.borderLight,
              padding: spacing.xl,
              marginBottom: spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.textSecondary,
                marginBottom: spacing.md,
                fontFamily: 'sf-pro-rounded-semibold',
              }}
            >
              Setup Instructions
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textMuted,
                lineHeight: 20,
                fontFamily: 'Courier New',
                backgroundColor: colors.bgElevated,
                padding: spacing.md,
                borderRadius: radius.md,
                marginBottom: spacing.md,
              }}
            >
              npm install -g clawr-bridge{'\n'}clawr-bridge pair
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, fontFamily: 'sf-pro-rounded-semibold' }}>
              Then scan the QR code shown on your desktop app
            </Text>
          </Animated.View>

          {/* Error State */}
          {pairingState === 'error' || pairingState === 'timeout'
            ? (
              <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.error,
                  padding: spacing.xl,
                  marginBottom: spacing.lg,
                }}
              >
                <View className="flex-row items-start" style={{ gap: spacing.md }}>
                  <AlertCircle size={20} color={colors.error} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.error,
                        marginBottom: spacing.sm,
                        fontFamily: 'sf-pro-rounded-semibold',
                      }}
                    >
                      {pairingState === 'timeout' ? 'Connection Timeout' : 'Connection Error'}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18, fontFamily: 'sf-pro-rounded-semibold' }}>
                      {errorMessage
                        || (pairingState === 'timeout'
                          ? 'The pairing session expired. Please try again.'
                          : 'An error occurred during pairing.')}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}

          {/* Status Display */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.borderLight,
              padding: spacing.xl,
              marginBottom: spacing.lg,
              alignItems: 'center',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.bgElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.lg,
                }}
              >
                {pairingState === 'scanning' || pairingState === 'initializing' ? (
                  <ActivityIndicator size="large" color={colors.success} />
                ) : pairingState === 'connected' ? (
                  <Text style={{ fontSize: 40 }}>✓</Text>
                ) : (
                  <QrCode size={40} color={colors.textMuted} strokeWidth={1.5} />
                )}
              </View>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: spacing.sm,
                  textAlign: 'center',
                  fontFamily: 'sf-pro-rounded-semibold',
                }}
              >
                {pairingState === 'initializing'
                  ? 'Starting pairing session...'
                  : pairingState === 'scanning'
                  ? 'Ready to scan'
                  : pairingState === 'processing'
                  ? 'Processing QR code...'
                  : pairingState === 'connecting'
                  ? 'Connecting...'
                  : pairingState === 'connected'
                  ? 'Connected!'
                  : pairingState === 'timeout'
                  ? 'Session expired'
                  : pairingState === 'error'
                  ? 'Connection failed'
                  : 'Scan QR code'}
              </Text>

              {pairingState === 'scanning' && (
                <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'sf-pro-rounded-semibold' }}>
                  Timeout in {timeoutCounter}s
                </Text>
              )}
            </View>

            {/* Connection status indicator */}
            <View
              className="flex-row items-center"
              style={{
                gap: spacing.sm,
              }}
            >
              <Wifi
                size={14}
                color={
                  pairingState === 'connected'
                    ? colors.success
                    : pairingState === 'error' || pairingState === 'timeout'
                    ? colors.error
                    : colors.textMuted
                }
              />
              <Text
                style={{
                  fontSize: 13,
                  color:
                    pairingState === 'connected'
                      ? colors.success
                      : pairingState === 'error' || pairingState === 'timeout'
                      ? colors.error
                      : colors.textMuted,
                  fontFamily: 'sf-pro-rounded-semibold',
                }}
              >
                {pairingState === 'connected'
                  ? 'Connected successfully'
                  : pairingState === 'scanning'
                  ? 'Waiting for QR scan...'
                  : pairingState === 'error' || pairingState === 'timeout'
                  ? 'Connection failed'
                  : 'Standby'}
              </Text>
            </View>
          </Animated.View>

          {/* QR Scanner Button */}
          {(pairingState === 'idle' || pairingState === 'error' || pairingState === 'timeout')
            ? (
              <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                <Pressable onPress={initializePairing} disabled={isProcessing}>
                  <View
                    style={{
                      borderRadius: radius.lg,
                      paddingVertical: spacing.lg + 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.textPrimary,
                      opacity: isProcessing ? 0.6 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: '700',
                        color: colors.bg,
                        letterSpacing: 0.5,
                        fontFamily: 'sf-pro-rounded-semibold',
                      }}
                    >
                      Scan QR Code
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ) : null}

          {/* Manual Code Input */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={{ marginTop: spacing.xl }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.lg,
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  fontWeight: '500',
                  fontFamily: 'sf-pro-rounded-semibold',
                }}
              >
                Or enter code
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            <TextInput
              value={pairingCode}
              onChangeText={setPairingCode}
              placeholder="XXXXXX"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              editable={!isProcessing}
              style={{
                backgroundColor: colors.bgInput,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: pairingCode ? colors.borderFocus : colors.borderLight,
                padding: spacing.lg,
                fontSize: 20,
                fontWeight: '700',
                color: colors.textPrimary,
                textAlign: 'center',
                letterSpacing: 4,
                marginBottom: spacing.lg,
                fontFamily: 'sf-pro-rounded-semibold',
              }}
            />

            <Pressable onPress={handleManualPair} disabled={isProcessing || pairingCode.length < 6}>
              <View
                style={{
                  borderRadius: radius.lg,
                  paddingVertical: spacing.lg + 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.bgElevated,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  opacity: isProcessing || pairingCode.length < 6 ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    letterSpacing: 0.5,
                    fontFamily: 'sf-pro-rounded-semibold',
                  }}
                >
                  Pair Manually
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => {
          setShowScanner(false);
          handleRetry();
        }}
        onQRDetected={handleQRDetected}
        isLoading={pairingState === 'processing'}
        error={pairingState === 'error' ? errorMessage : null}
      />
    </View>
  );
}
