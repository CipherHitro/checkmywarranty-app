import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#e1dfea' }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#e1dfea' } }} />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
