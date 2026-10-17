import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth';
import { traducir } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export type Parcel = {
  id: string;
  name: string;
  area: number; // hectáreas
  crop: string;
  health: string;
  lat: number;
  lng: number;
};

type Row = {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  area_ha: number | null;
  cultivo: string | null;
  salud: string | null;
};

const fromDb = (r: Row): Parcel => ({
  id: r.id,
  name: r.nombre,
  area: r.area_ha ?? 0,
  crop: r.cultivo ?? 'Sin cultivo',
  health: r.salud ?? 'Buena',
  lat: r.latitud,
  lng: r.longitud,
});

type NewParcel = { name: string; lat: number; lng: number; area?: number; crop?: string };
type ParcelChanges = { name: string; area: number; crop: string; health: string };

type ParcelsValue = {
  parcels: Parcel[];
  loading: boolean;
  error: string | null;
  add: (p: NewParcel) => Promise<Parcel>;
  update: (id: string, changes: ParcelChanges) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const ParcelsContext = createContext<ParcelsValue | null>(null);

export function useParcels(): ParcelsValue {
  const v = useContext(ParcelsContext);
  if (!v) throw new Error('useParcels debe usarse dentro de <ParcelsProvider>');
  return v;
}

export function ParcelsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que cambia el usuario, carga SUS terrenos (la base de datos solo devuelve los suyos).
  useEffect(() => {
    if (!userId) {
      setParcels([]);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from('terrenos')
      .select('*')
      .order('creado_en', { ascending: true })
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) setError(traducir(err.message));
        else {
          setError(null);
          setParcels((data as Row[]).map(fromDb));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const value: ParcelsValue = {
    parcels,
    loading,
    error,

    add: async (p) => {
      const { data, error: err } = await supabase
        .from('terrenos')
        .insert({
          nombre: p.name,
          latitud: p.lat,
          longitud: p.lng,
          area_ha: p.area ?? 0,
          cultivo: p.crop ?? 'Sin cultivo',
        })
        .select()
        .single();
      if (err) throw new Error(traducir(err.message));
      const created = fromDb(data as Row);
      setParcels((list) => [...list, created]);
      return created;
    },

    update: async (id, c) => {
      const { data, error: err } = await supabase
        .from('terrenos')
        .update({ nombre: c.name, area_ha: c.area, cultivo: c.crop, salud: c.health })
        .eq('id', id)
        .select()
        .single();
      if (err) throw new Error(traducir(err.message));
      const updated = fromDb(data as Row);
      setParcels((list) => list.map((x) => (x.id === id ? updated : x)));
    },

    remove: async (id) => {
      const { error: err } = await supabase.from('terrenos').delete().eq('id', id);
      if (err) throw new Error(traducir(err.message));
      setParcels((list) => list.filter((x) => x.id !== id));
    },
  };

  return <ParcelsContext.Provider value={value}>{children}</ParcelsContext.Provider>;
}

// Resumen por cultivo (para las pantallas Inicio y Cultivos).
export type CropSummary = { name: string; count: number; area: number; healthPct: number };

export function summarizeCrops(parcels: Parcel[], pct: Record<string, number>): CropSummary[] {
  const groups = new Map<string, Parcel[]>();
  for (const p of parcels) {
    if (p.crop === 'Sin cultivo') continue;
    groups.set(p.crop, [...(groups.get(p.crop) ?? []), p]);
  }
  return [...groups.entries()].map(([name, list]) => ({
    name,
    count: list.length,
    area: list.reduce((s, p) => s + p.area, 0),
    healthPct: Math.round(list.reduce((s, p) => s + (pct[p.health] ?? 80), 0) / list.length),
  }));
}
