import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import './global.css'

export const unstable_settings = {
  anchor: '(tabs)',
};

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F6F4EE',
    card: '#FFFFFF',
    text: '#1A1A1A',
    primary: '#0E3B2E',
    border: '#ECE7D9',
    notification: '#0E3B2E',
  },
};

export default function RootLayout() {

  return (
    <ThemeProvider value={appTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal', headerShown: true }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}