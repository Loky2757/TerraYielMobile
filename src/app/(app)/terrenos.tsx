import { useEffect, useState } from 'react';
import { FlatList, Platform, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ParcelMap from '@/components/parcel-map';
import type { MapFocus, MapKind } from '@/components/map-types';
import ParcelModal from '@/components/parcel-modal';
import { Icon, s } from '@/components/ui';
import { C } from '@/constants/terra';
import { useParcels, type Parcel } from '@/context/parcels';
import { useUserLocation } from '@/hooks/use-location';
import { askOpenSettings, notify } from '@/lib/dialog';
import { fmt } from '@/lib/calc';

export default function TerrenosScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { parcels, add, loading, error } = useParcels();
  const { status, coords, locate } = useUserLocation();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [editing, setEditing] = useState<Parcel | null>(null);
  const [mapType, setMapType] = useState<MapKind>('standard');
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [late, setLate] = useState(false);

  const shown = parcels.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  const current = parcels.find((t) => t.id === selectedId);

  // Si el mapa no termina de cargar en 10 s, mostramos un aviso con la causa probable.
  useEffect(() => {
    const id = setTimeout(() => setLate(true), 10000);
    return () => clearTimeout(id);
  }, []);

  // Al abrir la pantalla pide permiso de ubicación (si lo niega, no pasa nada).
  useEffect(() => {
    goToMe(true);
  }, []);

  // Cuando llegan los terrenos y aún no hay un punto de enfoque, el mapa va al primero.
  useEffect(() => {
    if (!focus && parcels.length > 0) {
      setFocus({ latitude: parcels[0].lat, longitude: parcels[0].lng, nonce: Date.now() });
    }
  }, [parcels.length]);

  async function goToMe(silent: boolean) {
    const r = await locate();
    if (r === 'denied') {
      if (!silent) askOpenSettings('Ubicación desactivada', 'Activa el permiso de ubicación para ver tu posición en el mapa.');
      return;
    }
    if (r) setFocus({ latitude: r.latitude, longitude: r.longitude, nonce: Date.now() });
    else if (!silent) notify('No se pudo obtener tu ubicación', 'Verifica que el GPS esté encendido.');
  }

  async function addAt(c: { latitude: number; longitude: number }) {
    try {
      const t = await add({ name: `Terreno ${parcels.length + 1}`, lat: c.latitude, lng: c.longitude });
      setSelectedId(t.id);
      setEditing(t); // se abre el detalle para ponerle nombre y superficie
    } catch (e) {
      notify('No se pudo guardar el terreno', (e as Error).message);
    }
  }

  function onAddPress() {
    if (coords) return addAt(coords);
    notify('Nuevo terreno', 'Mantén presionado el mapa donde está tu terreno, o activa tu ubicación con el botón de la mira.');
  }

  function pick(t: Parcel) {
    setSelectedId(t.id);
    setFocus({ latitude: t.lat, longitude: t.lng, nonce: Date.now() });
  }

  const mapHeight = Math.max(240, Math.round(height * 0.36));

  return (
    <View style={[s.root, { paddingTop: insets.top + 12 }]}>
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <View style={s.spaceBetween}>
          <Text style={s.h1}>Mis terrenos</Text>
          <TouchableOpacity
            onPress={onAddPress}
            style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="add" color={C.bg} />
          </TouchableOpacity>
        </View>

        <View style={s.field}>
          <Icon name="search" color={C.muted} size={20} />
          <TextInput
            style={s.input}
            placeholder="Buscar terreno..."
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* El mapa va fuera de cualquier ScrollView para que sus gestos funcionen bien */}
      <View
        style={{
          height: mapHeight,
          marginHorizontal: 16,
          marginTop: 12,
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.border,
        }}>
        <ParcelMap
          parcels={shown}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onLongPress={addAt}
          focus={focus}
          mapType={mapType}
          showsUserLocation={status === 'granted'}
          onLoaded={() => setLoaded(true)}
        />

        {Platform.OS !== 'web' && !loaded && late ? (
          <View style={{ position: 'absolute', left: 12, right: 60, bottom: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(7,20,14,0.92)' }}>
            <Text style={s.small}>
              El mapa no termina de cargar. Revisa tu internet y, si usas una compilación propia (no Expo Go), la clave de Google Maps y que esté activo «Maps SDK for Android».
            </Text>
          </View>
        ) : null}

        {Platform.OS !== 'web' ? (
          <>
            <TouchableOpacity
              onPress={() => goToMe(false)}
              style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={status === 'granted' ? 'locate' : 'locate-outline'} color={C.bg} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMapType((m) => (m === 'standard' ? 'hybrid' : 'standard'))}
              style={{ position: 'absolute', top: 60, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="layers" color={C.text} />
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {__DEV__ ? (
        <Text style={[s.small, { marginHorizontal: 16, marginTop: 6 }]}>
          Mapa · plataforma: {Platform.OS} · {Platform.OS === 'web' ? 'no disponible en web' : loaded ? 'cargado' : 'cargando...'}
        </Text>
      ) : null}

      {current ? (
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 10 }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.rowTitle}>{current.name}</Text>
            <Text style={s.small}>{fmt(current.area, 1)} ha · {current.crop}</Text>
            <View style={[s.rowH, { gap: 6 }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: current.health === 'Atención' ? C.danger : C.primary }} />
              <Text style={s.small}>Estado: {current.health}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setEditing(current)} hitSlop={10}>
            <Icon name="create-outline" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedId('')} hitSlop={10}>
            <Icon name="close" color={C.muted} />
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={shown}
        keyExtractor={(t) => t.id}
        style={{ flex: 1, marginTop: 10 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
        ListEmptyComponent={
          <Text style={[s.small, { textAlign: 'center', marginTop: 12 }]}>
            {loading
              ? 'Cargando tus terrenos…'
              : error
                ? error
                : parcels.length === 0
                  ? 'Aún no tienes terrenos. Mantén presionado el mapa o toca + para agregar el primero.'
                  : 'Ningún terreno coincide con la búsqueda.'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.card, s.rowH]} onPress={() => pick(item)}>
            <View style={[s.cropThumb, { backgroundColor: C.card2 }]}>
              <Icon name="location" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{item.name}</Text>
              <Text style={s.small}>{item.crop}</Text>
            </View>
            <Text style={s.value}>{fmt(item.area, 1)} ha</Text>
          </TouchableOpacity>
        )}
      />

      {editing ? <ParcelModal key={editing.id} parcel={editing} onClose={() => setEditing(null)} /> : null}
    </View>
  );
}
