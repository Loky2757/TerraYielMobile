// Versión para web: react-native-maps no funciona en web, así que solo se muestra un aviso.
import { StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/terra';

export default function ParcelMap() {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        El mapa solo está disponible en la app de Android o iPhone. Abre el proyecto en tu teléfono con Expo Go o instala el APK.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 20 },
  text: { color: C.muted, textAlign: 'center', fontSize: 14 },
});
