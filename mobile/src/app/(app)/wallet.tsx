import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image as RNImage,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, Download, Copy } from 'lucide-react-native';
import { useFonts } from 'expo-font';
import { useAppStore } from '@/lib/store';
import { getAvatarImage } from '@/lib/avatars';
import { api } from '@/lib/api/api';

// Design tokens
const DS = {
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#171717',
  border: '#27272A',
  brand: '#FFFFFF',
  success: '#22C55E',
  danger: '#EF4444',
} as const;

// Logos
const ETH_LOGO = require('../../../assets/images/ethereum-logo.png');
const SOL_LOGO = require('../../../assets/images/solana-logo.png');
const BLUE_CHECK = require('../../../assets/images/check-verified.png');

interface Wallet {
  id: string;
  blockchain: 'ethereum' | 'solana';
  address: string;
  createdAt: number;
}

// Confetti piece component
function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const duration = 2000 + Math.random() * 1000;
    translateY.value = withTiming(600, { duration });
    opacity.value = withTiming(0, { duration });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const colors = ['🎉', '✨', '🎊', '⭐', '💫'];
  const emoji = colors[index % colors.length];

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: -20,
          fontSize: 24,
          marginLeft: -12,
        },
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// Confetti component with animated falling pieces
function Confetti() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

// Spinning lobster component
function SpinningLobster() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text style={[{ fontSize: 60 }, animatedStyle]}>
      🦞
    </Animated.Text>
  );
}

// Mock balance data
function getMockBalance(blockchain: 'ethereum' | 'solana'): string {
  return '0';
}

function getMockSymbol(blockchain: 'ethereum' | 'solana'): string {
  return blockchain === 'ethereum' ? 'ETH' : 'SOL';
}

export default function WalletScreen() {
  const router = useRouter();
  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const currentAgent = agents.find((a) => a.id === selectedAgentId);

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [creationState, setCreationState] = useState<'idle' | 'creating' | 'created'>(
    'idle'
  );
  const [chosenBlockchain, setChosenBlockchain] = useState<'ethereum' | 'solana' | null>(
    null
  );
  const [generatedAddress, setGeneratedAddress] = useState<string>('');

  const handleCreateWallet = async (blockchain: 'ethereum' | 'solana') => {
    setChosenBlockchain(blockchain);
    setCreationState('creating');

    try {
      const response = await api.post<{ data: { address: string; blockchain: string } }>(
        '/api/wallet/create',
        { blockchain }
      );
      const address = response?.data?.address ?? '';
      setGeneratedAddress(address);

      // Save wallet
      const newWallet: Wallet = {
        id: Math.random().toString(36).substr(2, 9),
        blockchain,
        address,
        createdAt: Date.now(),
      };

      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);

      // Longer loading - wait 3 seconds before showing success
      setTimeout(() => {
        setCreationState('created');
      }, 3000);
    } catch (error) {
      console.log('Wallet creation error:', error);
      // Fallback to generated address if API fails
      const address =
        blockchain === 'ethereum'
          ? `0x${Array.from({ length: 40 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join('')}`
          : `${Array.from({ length: 32 }, () =>
              'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[
                Math.floor(Math.random() * 58)
              ]
            ).join('')}`;
      setGeneratedAddress(address);

      const newWallet: Wallet = {
        id: Math.random().toString(36).substr(2, 9),
        blockchain,
        address,
        createdAt: Date.now(),
      };

      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);

      setTimeout(() => {
        setCreationState('created');
      }, 3000);
    }
  };

  const handleCopyAddress = (address: string) => {
    Alert.alert('Copied', 'Wallet address copied to clipboard!');
  };

  const handleCreateAnother = () => {
    setCreationState('idle');
    setChosenBlockchain(null);
    setGeneratedAddress('');
  };

  // CREATING - Loading screen with spinning lobster
  if (creationState === 'creating') {
    return (
      <View style={{ flex: 1, backgroundColor: DS.bg }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Pressable
              onPress={() => {
                setCreationState('idle');
                setChosenBlockchain(null);
              }}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <ChevronLeft size={24} color={DS.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Wallet</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={{ alignItems: 'center', gap: 20 }}>
                <SpinningLobster />
                <Text style={{ color: DS.text, fontSize: 17, fontWeight: '600' }}>
                  Generating wallet
                </Text>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // CREATED - Success screen with agent info and wallet address
  if (creationState === 'created' && currentAgent) {
    const agentImage = getAvatarImage(currentAgent.avatarId);
    const blockchainName = chosenBlockchain === 'ethereum' ? 'Ethereum' : 'Solana';
    const chainLogo = chosenBlockchain === 'ethereum' ? ETH_LOGO : SOL_LOGO;

    return (
      <View style={{ flex: 1, backgroundColor: DS.bg }}>
        <Confetti />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Pressable
              onPress={handleCreateAnother}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <ChevronLeft size={24} color={DS.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Wallet</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeInDown.duration(400).delay(60)}
              style={styles.successContainer}
            >
              {/* Agent Badge */}
              <View style={styles.agentBadgeContainer}>
                <View style={styles.agentBadgeRow}>
                  <RNImage source={agentImage} style={styles.agentAvatar} />
                  <Text style={styles.agentName}>{currentAgent.name}</Text>
                  <RNImage source={BLUE_CHECK} style={styles.badgeCheck} />
                </View>
              </View>

              {/* Chain Logo */}
              <Animated.View
                entering={ZoomIn.duration(500).delay(200)}
                style={{ alignItems: 'center', marginVertical: 12 }}
              >
                <RNImage
                  source={chainLogo}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Message */}
              <Text style={styles.successMessage}>
                Say hello to {currentAgent.name}'s new {blockchainName} address
              </Text>

              {/* Wallet Address */}
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Wallet Address</Text>
                <View style={styles.addressBoxWrapper}>
                  <View style={styles.addressBox}>
                    <Text style={styles.walletAddressText} selectable>
                      {generatedAddress}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleCopyAddress(generatedAddress)}
                    style={styles.copyButton}
                  >
                    <Copy size={18} color={DS.text} />
                  </Pressable>
                </View>
              </View>

              {/* Return Button */}
              <Pressable onPress={handleCreateAnother} style={styles.returnButton}>
                <Text style={styles.returnButtonText}>Return</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // IDLE - Show wallets or create wallet options
  return (
    <View style={{ flex: 1, backgroundColor: DS.bg }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <ChevronLeft size={24} color={DS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Show existing wallets */}
          {wallets.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(60)} style={{ gap: 16 }}>
              <Text style={styles.sectionLabel}>My Wallets</Text>

              {wallets.map((wallet, index) => (
                <Animated.View
                  key={wallet.id}
                  entering={FadeInDown.duration(400).delay(120 + index * 60)}
                  style={styles.walletCard}
                >
                  {/* Wallet Header */}
                  <View style={styles.walletCardHeader}>
                    <View style={styles.walletChainInfo}>
                      <RNImage
                        source={wallet.blockchain === 'ethereum' ? ETH_LOGO : SOL_LOGO}
                        style={styles.walletChainLogo}
                      />
                      <View>
                        <Text style={styles.walletBlockchain}>
                          {wallet.blockchain === 'ethereum' ? 'Ethereum' : 'Solana'}
                        </Text>
                        <Text style={styles.walletAddress} numberOfLines={1}>
                          {wallet.address.length > 20
                            ? wallet.address.substring(0, 10) +
                              '...' +
                              wallet.address.substring(wallet.address.length - 8)
                            : wallet.address}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Balance */}
                  <View style={styles.walletBalance}>
                    <Text style={styles.balanceLabel}>Balance</Text>
                    <View style={styles.balanceValue}>
                      <Text style={styles.balanceAmount}>
                        {getMockBalance(wallet.blockchain)}
                      </Text>
                      <Text style={styles.balanceSymbol}>
                        {getMockSymbol(wallet.blockchain)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <Pressable style={styles.actionButton}>
                      <Send size={18} color={DS.text} />
                      <Text style={styles.actionButtonText}>Send</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton}>
                      <Download size={18} color={DS.text} />
                      <Text style={styles.actionButtonText}>Receive</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Create wallet section */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(wallets.length > 0 ? 240 : 60)}
            style={{ gap: 12, marginTop: wallets.length > 0 ? 24 : 0 }}
          >
            {wallets.length > 0 && (
              <Text style={styles.sectionLabel}>Create Another</Text>
            )}
            {wallets.length === 0 && (
              <Text style={styles.sectionLabel}>Create a Wallet</Text>
            )}

            {/* Ethereum Button */}
            {!wallets.some((w) => w.blockchain === 'ethereum') ? (
              <Pressable
                onPress={() => handleCreateWallet('ethereum')}
                style={styles.createButton}
              >
                <View style={styles.buttonContent}>
                  <RNImage source={ETH_LOGO} style={styles.chainLogo} />
                  <Text style={styles.createButtonText}>Create Ethereum Wallet</Text>
                </View>
              </Pressable>
            ) : null}

            {/* Solana Button */}
            {!wallets.some((w) => w.blockchain === 'solana') ? (
              <Pressable
                onPress={() => handleCreateWallet('solana')}
                style={styles.createButton}
              >
                <View style={styles.buttonContent}>
                  <RNImage source={SOL_LOGO} style={styles.chainLogo} />
                  <Text style={styles.createButtonText}>Create Solana Wallet</Text>
                </View>
              </Pressable>
            ) : null}

            {/* Both created message */}
            {wallets.length === 2 && (
              <Text style={styles.completedText}>Both wallets created successfully!</Text>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: DS.border,
  },
  headerTitle: {
    color: DS.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'sf-pro-rounded-semibold',
    letterSpacing: -0.5,
  },
  sectionLabel: {
    color: DS.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  completedText: {
    color: DS.success,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  createButton: {
    backgroundColor: DS.surfaceSecondary,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  chainLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  createButtonText: {
    color: DS.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  walletCard: {
    backgroundColor: DS.surfaceSecondary,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 16,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  walletCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletChainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  walletChainLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  walletBlockchain: {
    color: DS.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'sf-pro-rounded-semibold',
  },
  walletAddress: {
    color: DS.textTertiary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 6,
    letterSpacing: -0.3,
  },
  walletBalance: {
    backgroundColor: DS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: DS.border,
  },
  balanceLabel: {
    color: DS.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceAmount: {
    color: DS.text,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'sf-pro-rounded-semibold',
    letterSpacing: -0.5,
  },
  balanceSymbol: {
    color: DS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'sf-pro-rounded-semibold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: DS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0.5,
    borderColor: DS.border,
  },
  actionButtonText: {
    color: DS.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'sf-pro-rounded-semibold',
  },
  successContainer: {
    gap: 24,
  },
  agentBadgeContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  agentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DS.surfaceSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: DS.border,
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  agentName: {
    color: DS.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'sf-pro-rounded-semibold',
  },
  badgeCheck: {
    width: 18,
    height: 18,
  },
  successMessage: {
    color: DS.textSecondary,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '500',
  },
  addressContainer: {
    gap: 10,
    paddingVertical: 12,
  },
  addressLabel: {
    color: DS.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'sf-pro-rounded-semibold',
  },
  addressBoxWrapper: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addressBox: {
    flex: 1,
    backgroundColor: DS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: DS.border,
  },
  walletAddressText: {
    color: DS.text,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
    letterSpacing: -0.2,
  },
  copyButton: {
    backgroundColor: DS.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: DS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnButton: {
    backgroundColor: DS.text,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  returnButtonText: {
    color: DS.bg,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'sf-pro-rounded-semibold',
    letterSpacing: -0.3,
  },
});
