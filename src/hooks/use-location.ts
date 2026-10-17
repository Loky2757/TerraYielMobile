import * as Location from 'expo-location';
import { useState } from 'react';

export type Coords = { latitude: number; longitude: number };
export type LocateResult = Coords | 'denied' | null;

// Pide permiso de ubicación y devuelve la posición con GPS de alta precisión.
export function useUserLocation() {
  const [status, setStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [coords, setCoords] = useState<Coords | null>(null);

  const locate = async (): Promise<LocateResult> => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        return 'denied';
      }
      setStatus('granted');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      return c;
    } catch {
      return null;
    }
  };

  return { status, coords, locate };
}
