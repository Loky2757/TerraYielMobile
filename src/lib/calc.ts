// ---- Calculadora de siembra ----
// REFERENCIA: valida estos valores con un agrónomo o el INIFAP antes de usarlos en campo.
// Los factores por tipo de suelo son de EJEMPLO: cámbialos por los tuyos.
export const SOILS = ['Franco', 'Arcilloso', 'Arenoso'] as const;
export type Soil = (typeof SOILS)[number];

type CropFormula = {
  semillaKgHa: number; // dosis base por hectárea
  suelo: Record<Soil, number>; // factor de ajuste por tipo de suelo
};

export const CALC: Record<string, CropFormula> = {
  Maíz: {
    semillaKgHa: 25,
    suelo: { Franco: 1.0, Arcilloso: 0.9, Arenoso: 1.1 },
  },
};

export const L_POR_MM_HA = 10000; // 1 mm de lámina = 10,000 litros por hectárea

export const CULTIVOS = ['Maíz', 'Trigo', 'Jitomate', 'Frijol', 'Chile', 'Sin cultivo'];
export const SALUD = ['Óptima', 'Buena', 'Atención'];
// Porcentaje que representa cada estado de salud en las barras de progreso.
export const SALUD_PCT: Record<string, number> = { Óptima: 95, Buena: 80, Atención: 45 };

export type CalcResult = { perHa: number; seedKg: number; waterL: number | null };

export function calcular(crop: string, soil: Soil, ha: number, mm: number): CalcResult | null {
  const f = CALC[crop];
  if (!f || !(ha > 0)) return null;
  const perHa = f.semillaKgHa * f.suelo[soil];
  return { perHa, seedKg: perHa * ha, waterL: mm > 0 ? mm * L_POR_MM_HA * ha : null };
}

// 12345.6 -> "12,345.6"
export function fmt(n: number, decimals = 1): string {
  const [int, dec] = n.toFixed(decimals).split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${withCommas}.${dec}` : withCommas;
}
