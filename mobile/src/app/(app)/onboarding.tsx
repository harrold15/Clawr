import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { getAvatarImage } from '@/lib/avatars';

const CARDS = [
  {
    id: 'cloud' as const,
    title: 'Cloud Agent',
    subtitle: 'Runs in the cloud',
    route: '/(app)/create-agent',
    image: require('../../../assets/images/cloud-agent-new.jpg'),
  },
  {
    id: 'local' as const,
    title: 'Local Agent',
    subtitle: 'On your computer',
    route: '/(app)/connect-agent',
    image: require('../../../assets/images/local-agent-new.jpg'),
  },
  {
    id: 'marketplace' as const,
    title: 'Marketplace Agent',
    subtitle: 'Browse & discover',
    route: '/(app)/marketplace',
    image: require('../../../assets/images/marketplace-agent-new.jpg'),
  },
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleCardPress = (card: (typeof CARDS)[number]) => {
    setSelected(card.id);
    router.push(card.route as any);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <Text
              style={[
                styles.title,
              ]}
            >
              Get started
            </Text>
            <Text style={styles.headerSubtitle}>
              Choose how to set up your agent
            </Text>
          </Animated.View>

          {/* Cards */}
          <View style={styles.cardsSection}>
            <View style={styles.cardsContainer}>
              {CARDS.map((card, index) => {
                const isSelected = selected === card.id;
                return (
                  <Animated.View
                    key={card.id}
                    entering={FadeInDown.delay(100 + index * 150).duration(500)}
                  >
                    <Pressable
                      onPress={() => handleCardPress(card)}
                      style={[
                        styles.card,
                        isSelected && styles.cardSelected,
                      ]}
                    >
                      {/* Radio Circle */}
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}
                      >
                        {isSelected ? <View style={styles.radioInnerDot} /> : null}
                      </View>

                      {/* Text Content */}
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>{card.subtitle}</Text>
                      </View>

                      {/* Image - fills right side edge to edge */}
                      <Image
                        source={card.image}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Social Proof Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.socialProofSection}
        >
          <Text style={styles.socialProofTitle}>Join over 100+ agents</Text>
          <View style={styles.avatarsRow}>
            {[1, 3, 5, 7, 9].map((avatarId, idx) => (
              <Animated.View
                key={avatarId}
                entering={FadeInDown.delay(500 + idx * 100).duration(400)}
                style={[styles.avatarWrapper, { marginLeft: idx > 0 ? -12 : 0 }]}
              >
                <Image
                  source={getAvatarImage(avatarId)}
                  style={styles.smallAvatar}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const CARD_HEIGHT = 100;
const IMAGE_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'sf-pro-rounded-semibold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 17,
    fontFamily: 'sf-pro-rounded-semibold',
    color: '#A1A1AA',
    letterSpacing: -0.2,
  },

  // Cards
  cardsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  cardsContainer: {
    gap: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    height: CARD_HEIGHT,
    paddingLeft: 20,
    paddingRight: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    marginBottom: 12,
    width: '100%',
  },
  cardSelected: {
    borderColor: '#007AFF',
  },
  cardPressed: {
    backgroundColor: '#222222',
  },

  // Radio
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#48484A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  // Card text
  cardTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
    justifyContent: 'center',
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'sf-pro-rounded-semibold',
    color: '#A1A1AA',
    letterSpacing: -0.1,
  },

  // Card image - flush to right edge, fills full height
  cardImage: {
    width: IMAGE_SIZE,
    height: CARD_HEIGHT,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },

  // Social proof
  socialProofSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  socialProofTitle: {
    fontSize: 15,
    fontFamily: 'sf-pro-rounded-semibold',
    fontWeight: '600',
    color: '#A1A1AA',
    letterSpacing: -0.2,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  smallAvatar: {
    width: 40,
    height: 40,
  },
});
