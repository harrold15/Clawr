import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Mail,
  Cloud,
  Send,
  Heart,
  FileText,
  Code,
  CheckSquare,
  Zap,
  Puzzle,
  CreditCard,
  Users,
  Share2,
  Check,
} from 'lucide-react-native';

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

// Integration type
interface Integration {
  id: string;
  name: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  connected: boolean;
  logoImage?: any;
}

// Mock integrations data
const INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    color: '#DC2626',
    connected: true,
    logoImage: require('../../../assets/images/gmail-logo.png'),
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: Cloud,
    color: '#611F69',
    connected: false,
    logoImage: require('../../../assets/images/slack-logo.png'),
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: Send,
    color: '#5865F2',
    connected: false,
    logoImage: require('../../../assets/images/discord-logo.png'),
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Share2,
    color: '#1DA1F2',
    connected: false,
    logoImage: require('../../../assets/images/twitter-logo.png'),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Heart,
    color: '#E4405F',
    connected: false,
    logoImage: require('../../../assets/images/instagram-logo.png'),
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: FileText,
    color: '#000000',
    connected: false,
    logoImage: require('../../../assets/images/notion-logo.png'),
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Code,
    color: '#181717',
    connected: false,
    logoImage: require('../../../assets/images/github-logo.png'),
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: CheckSquare,
    color: '#5E6AD2',
    connected: false,
    logoImage: require('../../../assets/images/linear-logo.png'),
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: Zap,
    color: '#FF4A00',
    connected: false,
    logoImage: require('../../../assets/images/zapier-logo.png'),
  },
  {
    id: 'make',
    name: 'Make',
    icon: Puzzle,
    color: '#6D00CC',
    connected: false,
    logoImage: require('../../../assets/images/make-logo.png'),
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: CreditCard,
    color: '#635BFF',
    connected: false,
    logoImage: require('../../../assets/images/stripe-logo.png'),
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: Users,
    color: '#FF7A59',
    connected: false,
    logoImage: require('../../../assets/images/hubspot-logo.png'),
  },
];

// Integration card component
function IntegrationCard({
  integration,
  onPress,
  isLast,
}: {
  integration: Integration;
  onPress: () => void;
  isLast: boolean;
}) {
  const IconComponent = integration.icon;
  const [logoError, setLogoError] = useState(false);

  const logoImage = integration.logoImage;
  const shouldShowLogo = logoImage && !logoError;

  return (
    <>
      <Pressable
        onPress={onPress}
        style={[styles.integrationRow, !isLast && styles.integrationRowBorder]}
      >
        <View style={styles.integrationLeft}>
          {shouldShowLogo ? (
            <RNImage
              source={logoImage}
              style={styles.integrationLogo}
              resizeMode="contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <View
              style={[
                styles.integrationIconContainer,
                { backgroundColor: integration.color },
              ]}
            >
              <IconComponent size={20} color="#FFFFFF" />
            </View>
          )}
          <Text style={{ color: DS.text, fontSize: 15, fontWeight: '500' }}>
            {integration.name}
          </Text>
        </View>
        {integration.connected ? (
          <View style={styles.connectedBadge}>
            <Check size={12} color="#FFFFFF" />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        ) : (
          <Text style={{ color: DS.textTertiary, fontSize: 13 }}>
            Not connected
          </Text>
        )}
      </Pressable>
    </>
  );
}

export default function IntegrationsScreen() {
  const router = useRouter();

  const handleIntegrationPress = (integration: Integration) => {
    // Mock handler - in real app would navigate to config screen
    console.log('Tapped:', integration.name);
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.bg }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.header}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <Text style={{ color: DS.text, fontSize: 16, fontWeight: '600' }}>
              Back
            </Text>
          </Pressable>
          <Text style={styles.headerTitle}>Integrations</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Integrations List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.sectionCard}
          >
            {INTEGRATIONS.map((integration, index) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onPress={() => handleIntegrationPress(integration)}
                isLast={index === INTEGRATIONS.length - 1}
              />
            ))}
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
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
    paddingVertical: 12,
  },
  headerTitle: {
    color: DS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: DS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  integrationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  integrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  integrationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectedText: {
    color: DS.success,
    fontSize: 12,
    fontWeight: '600',
  },
});
