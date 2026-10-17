import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo, PrimaryButton, s } from '@/components/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Logo size={72} />
        <Text style={[s.muted, { marginTop: 24 }]}>Datos. Tecnología. Mejores cosechas.</Text>
      </View>
      {/* Franjas que imitan los surcos de un cultivo */}
      <View style={{ overflow: 'hidden', paddingTop: 8 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <View
            key={i}
            style={{
              height: 14 + i * 3,
              marginBottom: 6 + i,
              backgroundColor: i % 2 ? '#1E5A34' : '#2B7A47',
              opacity: 0.35 + i * 0.07,
              transform: [{ skewY: '-4deg' }],
            }}
          />
        ))}
      </View>
      <View style={{ paddingHorizontal: 24, gap: 16, marginTop: 16 }}>
        <PrimaryButton label="Comenzar" onPress={() => router.push('/register')} />
        <TouchableOpacity onPress={() => router.push('/login')} style={{ alignItems: 'center', padding: 8 }}>
          <Text style={s.link}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
