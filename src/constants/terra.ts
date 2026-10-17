import { Platform } from 'react-native';

export const C = {
  bg: '#07140E',
  card: '#0E2318',
  card2: '#143222',
  primary: '#3FA35B',
  gold: '#D9B45B',
  text: '#F2F6F3',
  muted: '#9FB5A7',
  border: '#1F3D2D',
  danger: '#E5584F',
};

export const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });

// Punto de partida del mapa y del clima cuando el usuario aún no tiene terrenos.
export const DEFAULT_COORDS = { latitude: 20.8833, longitude: -103.8333 };
