import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: "#6e6496",
      tabBarInactiveTintColor: "grey",
      headerShown: false,
      tabBarStyle: {
        height: 60 + Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 0),
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 5),
        borderTopWidth: 0,
        backgroundColor: '#ffffff',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      sceneStyle: { backgroundColor: '#e1dfea' }
    }}>
      <Tabs.Screen name='index' options={{
        title: 'Documents',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="document-text" size={size} color={color} />
        ),
      }} />
      <Tabs.Screen name='search' options={{
        title: 'Search',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="search" size={size} color={color} />
        ),
      }} />
      <Tabs.Screen name='remainder' options={{
        title: 'Remainder',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="alarm" size={size} color={color} />
        ),
      }} />
    </Tabs>
  );
};

export default TabsLayout;