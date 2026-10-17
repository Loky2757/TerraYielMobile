import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Icon, PrimaryButton, Progress, Screen, s } from '@/components/ui';
import { C } from '@/constants/terra';
import { summarizeCrops, useParcels } from '@/context/parcels';
import { SALUD_PCT, fmt } from '@/lib/calc';

export default function CultivosScreen() {
  const router = useRouter();
  const { parcels } = useParcels();
  const crops = summarizeCrops(parcels, SALUD_PCT);

  return (
    <Screen>
      <Text style={[s.h1, { marginBottom: 16 }]}>Cultivos</Text>
      {crops.length === 0 ? (
        <View style={[s.card, { gap: 12 }]}>
          <Text style={s.rowTitle}>Aún no hay cultivos</Text>
          <Text style={s.small}>Elige el cultivo de cada terreno desde la pantalla Terrenos (lápiz de editar) y aquí verás el resumen.</Text>
          <PrimaryButton label="Ir a Terrenos" onPress={() => router.push('/terrenos')} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {crops.map((c) => (
            <View key={c.name} style={[s.card, { gap: 10 }]}>
              <View style={s.rowH}>
                <View style={[s.cropThumb, { backgroundColor: C.card2 }]}>
                  <Icon name="leaf" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{c.name}</Text>
                  <Text style={s.small}>{c.count} {c.count === 1 ? 'terreno' : 'terrenos'} · {fmt(c.area, 1)} ha</Text>
                </View>
                <Text style={s.value}>{c.healthPct}%</Text>
              </View>
              <Progress value={c.healthPct} />
              <Text style={s.small}>Estado promedio de tus terrenos con este cultivo</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
