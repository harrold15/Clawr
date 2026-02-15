import { Stack } from "expo-router";
import { colors } from '@/lib/theme';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="create-agent" />
      <Stack.Screen name="connect-agent" />
      <Stack.Screen name="approval" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="task-composer" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="task-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="agent-settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="permissions" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="agent-profile" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="integrations" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="wallet" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
