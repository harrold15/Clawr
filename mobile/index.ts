import "react-native-get-random-values";

// Initialize reanimated logger config before anything else uses it
// This prevents "Cannot read properties of undefined (reading 'level')" on web
import { Platform } from "react-native";
if (Platform.OS === "web") {
  // @ts-expect-error - Setting up global reanimated config for web
  global.__reanimatedLoggerConfig = {
    level: 1, // LogLevel.warn
    strict: false,
    logFunction: () => {}, // No-op on web to prevent crashes
  };
}

import "react-native-reanimated";
import { LogBox } from "react-native";
import "./global.css";
import "expo-router/entry";
LogBox.ignoreLogs(["Expo AV has been deprecated", "Disconnected from Metro"]);
