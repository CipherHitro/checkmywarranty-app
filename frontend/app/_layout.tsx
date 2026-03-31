import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#e1dfea' }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#e1dfea' } }} >
        <Stack.Screen name='index' />
        <Stack.Screen name='login' />
        <Stack.Screen name='signup' />
        <Stack.Screen name='(tabs)' />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
