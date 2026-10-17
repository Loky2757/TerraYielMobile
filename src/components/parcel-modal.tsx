import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chips, Field, Icon, Label, PrimaryButton, s } from '@/components/ui';
import { C } from '@/constants/terra';
import { useParcels, type Parcel } from '@/context/parcels';
import { CALC, CULTIVOS, SALUD, SOILS, calcular, fmt, type CalcResult, type Soil } from '@/lib/calc';
import { confirmDialog, notify } from '@/lib/dialog';

const num = (x: string) => parseFloat(x.replace(',', '.'));

// Detalle del terreno: editar, eliminar y calculadora de siembra.
export default function ParcelModal({ parcel, onClose }: { parcel: Parcel; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { update, remove } = useParcels();
  const [name, setName] = useState(parcel.name);
  const [areaTxt, setAreaTxt] = useState(parcel.area ? String(parcel.area) : '');
  const [crop, setCrop] = useState(parcel.crop);
  const [health, setHealth] = useState(parcel.health);
  const [soil, setSoil] = useState<Soil>('Franco');
  const [mmTxt, setMmTxt] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const area = num(areaTxt || '0');
    if (!name.trim()) return notify('Falta el nombre', 'Escribe un nombre para el terreno.');
    if (!(area >= 0)) return notify('Superficie no válida', 'Escribe las hectáreas, por ejemplo 2.5');
    setBusy(true);
    try {
      await update(parcel.id, { name: name.trim(), area, crop, health });
      onClose();
    } catch (e) {
      notify('No se pudo guardar', (e as Error).message);
    }
    setBusy(false);
  };

  const askDelete = async () => {
    const ok = await confirmDialog('Eliminar terreno', `¿Seguro que quieres eliminar «${parcel.name}»? No se puede deshacer.`, 'Eliminar', true);
    if (!ok) return;
    try {
      await remove(parcel.id);
      onClose();
    } catch (e) {
      notify('No se pudo eliminar', (e as Error).message);
    }
  };

  const calculate = () => {
    const ha = num(areaTxt);
    if (!(ha > 0)) return notify('Falta la superficie', 'Escribe las hectáreas del terreno para calcular.');
    setResult(calcular(crop, soil, ha, num(mmTxt)));
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, gap: 12 }}>
          <View style={s.spaceBetween}>
            <Text style={s.h1}>Detalle del terreno</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Icon name="close" color={C.text} size={26} />
            </TouchableOpacity>
          </View>

          <Label>Nombre</Label>
          <Field icon="create-outline" placeholder="Nombre del terreno" value={name} onChangeText={setName} />
          <Label>Superficie (hectáreas)</Label>
          <Field icon="resize-outline" placeholder="Ej. 2.5" value={areaTxt} keyboardType="decimal-pad"
            onChangeText={(v) => { setAreaTxt(v); setResult(null); }} />
          <Label>Cultivo</Label>
          <Chips options={CULTIVOS} value={crop} onChange={(v) => { setCrop(v); setResult(null); }} />
          <Label>Estado del cultivo</Label>
          <Chips options={SALUD} value={health} onChange={setHealth} />
          <PrimaryButton label="Guardar cambios" onPress={save} loading={busy} />

          <Text style={[s.h2, { marginTop: 16 }]}>Calculadora de siembra</Text>
          {CALC[crop] ? (
            <View style={{ gap: 12 }}>
              <Label>Tipo de suelo</Label>
              <Chips options={SOILS} value={soil} onChange={(v) => { setSoil(v as Soil); setResult(null); }} />
              <Label>Riego: lámina de agua (mm)</Label>
              <Field icon="water-outline" placeholder="Ej. 50" value={mmTxt} keyboardType="decimal-pad"
                onChangeText={(v) => { setMmTxt(v); setResult(null); }} />
              <PrimaryButton label="Calcular" onPress={calculate} />
              {result ? (
                <View style={[s.card, { gap: 4 }]}>
                  <Label>Semilla necesaria</Label>
                  <Text style={s.bigNum}>{fmt(result.seedKg, 1)} kg</Text>
                  <Label>{fmt(result.perHa, 1)} kg por hectárea</Label>
                  {result.waterL != null ? (
                    <View style={{ marginTop: 12 }}>
                      <Label>Agua para un riego de {mmTxt} mm</Label>
                      <Text style={s.bigNum}>{fmt(result.waterL, 0)} L</Text>
                      <Label>≈ {fmt(result.waterL / 1000, 1)} m³</Label>
                    </View>
                  ) : (
                    <Label style={{ marginTop: 12 }}>Escribe la lámina de riego (mm) para calcular el agua.</Label>
                  )}
                  <Label style={{ marginTop: 12 }}>
                    Cálculo de referencia: valida las fórmulas con un agrónomo o el INIFAP antes de usarlas en campo.
                  </Label>
                </View>
              ) : null}
            </View>
          ) : (
            <Label>Para {crop} todavía no hay fórmula cargada. Por ahora la calculadora funciona con Maíz.</Label>
          )}

          <TouchableOpacity onPress={askDelete} style={{ alignItems: 'center', padding: 14 }}>
            <Text style={[s.link, { color: C.danger }]}>Eliminar terreno</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
