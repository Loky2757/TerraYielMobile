import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from 'expo-router/js-tabs';
import { withLayoutContext } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/constants/terra';

// Barra de pestañas de React Navigation conectada al sistema de archivos de Expo Router.
const { Navigator } = createBottomTabNavigator();
const Tabs = withLayoutContext(Navigator);

type IconName = keyof typeof Ionicons.glyphMap;
const tabIcon = (name: string) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={(focused ? name : `${name}-outline`) as IconName} size={24} color={color} />;
  };

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          height: 54 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="terrenos" options={{ title: 'Terrenos', tabBarIcon: tabIcon('map') }} />
      <Tabs.Screen name="cultivos" options={{ title: 'Cultivos', tabBarIcon: tabIcon('leaf') }} />
      <Tabs.Screen name="datos" options={{ title: 'Datos', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
