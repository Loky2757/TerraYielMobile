// Versión para Android / iOS. En web se usa parcel-map.web.tsx automáticamente.
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { DEFAULT_COORDS } from '@/constants/terra';
import type { Parcel } from '@/context/parcels';
import type { MapFocus, MapKind } from '@/components/map-types';

type Props = {
  parcels: Parcel[];
  selectedId: string;
  onSelect: (id: string) => void;
  onLongPress: (c: { latitude: number; longitude: number }) => void;
  focus: MapFocus | null;
  mapType: MapKind;
  showsUserLocation: boolean;
  onLoaded: () => void;
};

export default function ParcelMap(p: Props) {
  const ref = useRef<MapView>(null);
  const start = p.parcels[0]
    ? { latitude: p.parcels[0].lat, longitude: p.parcels[0].lng }
    : DEFAULT_COORDS;

  // Cada vez que cambia "focus" (mi ubicación o un terreno), el mapa se mueve hasta ahí.
  useEffect(() => {
    if (!p.focus) return;
    ref.current?.animateToRegion(
      { latitude: p.focus.latitude, longitude: p.focus.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600,
    );
  }, [p.focus]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      mapType={p.mapType}
      initialRegion={{ ...start, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      showsUserLocation={p.showsUserLocation}
      showsMyLocationButton={false}
      onMapLoaded={p.onLoaded}
      onLongPress={(e) => p.onLongPress(e.nativeEvent.coordinate)}>
      {p.parcels.map((t) => (
        <Marker
          key={t.id}
          coordinate={{ latitude: t.lat, longitude: t.lng }}
          title={t.name}
          description={`${t.area} ha · ${t.crop}`}
          pinColor={t.id === p.selectedId ? 'gold' : 'green'}
          onPress={() => p.onSelect(t.id)}
        />
      ))}
    </MapView>
  );
}
