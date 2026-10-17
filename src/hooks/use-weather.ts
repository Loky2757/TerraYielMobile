import { useEffect, useState } from 'react';

export type Weather = {
  temp: number;
  max: number;
  min: number;
  wind: number;
  rain: number | null;
  label: string;
  icon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy' | 'thunderstorm' | 'snow';
};

// Códigos de clima WMO que devuelve Open-Meteo.
function describe(code: number): Pick<Weather, 'label' | 'icon'> {
  if (code === 0) return { label: 'Despejado', icon: 'sunny' };
  if (code <= 2) return { label: 'Parcialmente nublado', icon: 'partly-sunny' };
  if (code === 3 || code === 45 || code === 48) return { label: 'Nublado', icon: 'cloudy' };
  if (code >= 51 && code <= 67) return { label: 'Lluvia', icon: 'rainy' };
  if (code >= 71 && code <= 77) return { label: 'Nieve', icon: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Chubascos', icon: 'rainy' };
  if (code >= 95) return { label: 'Tormenta', icon: 'thunderstorm' };
  return { label: 'Variable', icon: 'partly-sunny' };
}

// Clima real del lugar (Open-Meteo, sin clave de API).
export function useWeather(lat: number, lng: number) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      '&current=temperature_2m,weather_code,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto';

    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        setWeather({
          temp: Math.round(j.current.temperature_2m),
          max: Math.round(j.daily.temperature_2m_max[0]),
          min: Math.round(j.daily.temperature_2m_min[0]),
          wind: Math.round(j.current.wind_speed_10m),
          rain: j.daily.precipitation_probability_max?.[0] ?? null,
          ...describe(j.current.weather_code),
        });
        setFailed(false);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') setFailed(true);
      });

    return () => ctrl.abort();
  }, [lat, lng]);

  return { weather, failed };
}
