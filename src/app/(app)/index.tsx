import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { Icon, PrimaryButton, Progress, Screen, s } from '@/components/ui';
import { C, DEFAULT_COORDS, SERIF } from '@/constants/terra';
import { useAuth } from '@/context/auth';
import { summarizeCrops, useParcels } from '@/context/parcels';
import { useWeather } from '@/hooks/use-weather';
import { SALUD_PCT, fmt } from '@/lib/calc';

function Stat({ icon, color, n, label }: { icon: 'map-outline' | 'leaf-outline' | 'warning-outline'; color: string; n: number; label: string }) {
  return (
    <View style={[s.card, { flex: 1, alignItems: 'center', gap: 4 }]}>
      <Icon name={icon} color={color} />
      <Text style={s.bigNum}>{n}</Text>
      <Text style={s.small}>{label}</Text>
    </View>
  );
}

export default function InicioScreen() {
  const router = useRouter();
  const { nombre } = useAuth();
  const { parcels } = useParcels();
  const first = parcels[0];
  const { weather, failed } = useWeather(first?.lat ?? DEFAULT_COORDS.latitude, first?.lng ?? DEFAULT_COORDS.longitude);
  const crops = summarizeCrops(parcels, SALUD_PCT);
  const alerts = parcels.filter((p) => p.health === 'Atención').length;

  return (
    <Screen>
      <View style={[s.rowH, { marginBottom: 16 }]}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="person" color={C.bg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>Hola, {nombre.split(' ')[0]}</Text>
          <Text style={s.small}>¡Aquí está el resumen de tu actividad!</Text>
        </View>
      </View>

      <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 }]}>
        {weather ? (
          <>
            <Icon name={weather.icon} size={44} color={C.gold} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 34, fontWeight: '700', fontFamily: SERIF }}>{weather.temp}°C</Text>
              <Text style={s.small}>{weather.label}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={s.rowTitle}>{first ? first.name : 'Tu zona'}</Text>
              <Text style={s.small}>Máx {weather.max}° · Mín {weather.min}°</Text>
              <Text style={s.small}>Viento {weather.wind} km/h{weather.rain != null ? ` · Lluvia ${weather.rain}%` : ''}</Text>
            </View>
          </>
        ) : (
          <Text style={s.small}>{failed ? 'No se pudo cargar el clima. Revisa tu internet.' : 'Cargando el clima…'}</Text>
        )}
      </View>

      <View style={[s.rowH, { marginTop: 12, gap: 10 }]}>
        <Stat icon="map-outline" color={C.primary} n={parcels.length} label="Terrenos" />
        <Stat icon="leaf-outline" color={C.gold} n={crops.length} label="Cultivos" />
        <Stat icon="warning-outline" color={C.danger} n={alerts} label="Alertas" />
      </View>

      <View style={[s.spaceBetween, { marginTop: 24, marginBottom: 12 }]}>
        <Text style={s.h2}>Tus cultivos</Text>
        {crops.length > 0 ? (
          <TouchableOpacity onPress={() => router.push('/cultivos')}>
            <Text style={s.link}>Ver todos ›</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {parcels.length === 0 ? (
        <View style={[s.card, { gap: 12 }]}>
          <Text style={s.rowTitle}>Agrega tu primer terreno</Text>
          <Text style={s.small}>Márcalo en el mapa y calcula cuánta semilla y agua necesitas para sembrar.</Text>
          <PrimaryButton label="Ir a Terrenos" onPress={() => router.push('/terrenos')} />
        </View>
      ) : crops.length === 0 ? (
        <View style={s.card}>
          <Text style={s.small}>Tus terrenos aún no tienen cultivo. Entra a Terrenos, toca el lápiz de un terreno y elige su cultivo.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {crops.slice(0, 3).map((c) => (
            <View key={c.name} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <View style={[s.cropThumb, { backgroundColor: C.card2 }]}>
                <Icon name="leaf" />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.rowTitle}>{c.name}</Text>
                <Text style={s.small}>{c.count} {c.count === 1 ? 'terreno' : 'terrenos'} · {fmt(c.area, 1)} ha</Text>
                <Progress value={c.healthPct} />
              </View>
              <Text style={s.value}>{c.healthPct}%</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
