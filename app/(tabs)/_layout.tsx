import { Tabs } from 'expo-router';
import { House, BookOpen, ListChecks } from 'lucide-react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
   const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0E3B2E',
        tabBarInactiveTintColor: '#7B7B7B',
        tabBarStyle: {
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}