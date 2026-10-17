import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { C } from '@/constants/terra';
import { AuthProvider, useAuth } from '@/context/auth';
import { ParcelsProvider } from '@/context/parcels';

// Mantiene la pantalla de carga hasta saber si hay una sesión guardada.
SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.card, primary: C.primary, border: C.border, text: C.text },
};

// Decide qué grupo de pantallas se puede ver: sin sesión → (auth), con sesión → (app).
function Gate() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <ParcelsProvider>
          <StatusBar style="light" />
          <Gate />
        </ParcelsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
