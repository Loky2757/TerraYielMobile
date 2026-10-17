import Constants from 'expo-constants';
import { Text, View } from 'react-native';

import { Icon, PrimaryButton, Screen, s } from '@/components/ui';
import { C } from '@/constants/terra';
import { useAuth } from '@/context/auth';

export default function PerfilScreen() {
  const { nombre, email, rol, signOut } = useAuth();
  return (
    <Screen>
      <Text style={[s.h1, { marginBottom: 16 }]}>Perfil</Text>
      <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }]}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="person" size={30} color={C.bg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>{nombre}</Text>
          <Text style={s.small}>{email}</Text>
          <Text style={s.small}>{rol === 'empresa' ? 'Empresa' : 'Productor'}</Text>
        </View>
      </View>
      <View style={{ marginTop: 24 }}>
        <PrimaryButton label="Cerrar sesión" onPress={signOut} />
      </View>
      <Text style={[s.small, { textAlign: 'center', marginTop: 24 }]}>TerraYield v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </Screen>
  );
}
