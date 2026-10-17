import { Text, View } from 'react-native';

import { Progress, Screen, s } from '@/components/ui';
import { C } from '@/constants/terra';
import { summarizeCrops, useParcels } from '@/context/parcels';
import { SALUD, SALUD_PCT, fmt } from '@/lib/calc';

export default function DatosScreen() {
  const { parcels } = useParcels();
  const totalHa = parcels.reduce((sum, p) => sum + p.area, 0);
  const crops = summarizeCrops(parcels, SALUD_PCT);
  const attention = parcels.filter((p) => p.health === 'Atención');

  return (
    <Screen>
      <Text style={[s.h1, { marginBottom: 16 }]}>Datos</Text>

      <View style={[s.card, { flexDirection: 'row', gap: 12, padding: 18 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.bigNum}>{fmt(totalHa, 1)}</Text>
          <Text style={s.small}>hectáreas en total</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bigNum}>{parcels.length}</Text>
          <Text style={s.small}>terrenos</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bigNum}>{crops.length}</Text>
          <Text style={s.small}>cultivos</Text>
        </View>
      </View>

      <Text style={[s.h2, { marginTop: 24, marginBottom: 12 }]}>Estado de tus terrenos</Text>
      <View style={[s.card, { gap: 14 }]}>
        {parcels.length === 0 ? (
          <Text style={s.small}>Cuando agregues terrenos, aquí verás cómo está cada uno.</Text>
        ) : (
          SALUD.map((estado) => {
            const n = parcels.filter((p) => p.health === estado).length;
            return (
              <View key={estado} style={{ gap: 6 }}>
                <View style={s.spaceBetween}>
                  <Text style={s.small}>{estado}</Text>
                  <Text style={s.small}>{n}</Text>
                </View>
                <Progress value={Math.round((n / parcels.length) * 100)} />
              </View>
            );
          })
        )}
      </View>

      {attention.length > 0 ? (
        <>
          <Text style={[s.h2, { marginTop: 24, marginBottom: 12 }]}>Requieren atención</Text>
          <View style={{ gap: 10 }}>
            {attention.map((p) => (
              <View key={p.id} style={[s.card, s.spaceBetween]}>
                <View>
                  <Text style={s.rowTitle}>{p.name}</Text>
                  <Text style={s.small}>{p.crop}</Text>
                </View>
                <Text style={[s.value, { color: C.danger }]}>{fmt(p.area, 1)} ha</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
