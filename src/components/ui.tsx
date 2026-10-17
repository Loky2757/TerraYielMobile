import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, SERIF } from '@/constants/terra';

type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({ name, size = 22, color = C.primary }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function Logo({ size = 56, tagline = true }: { size?: number; tagline?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Icon name="leaf" size={size} />
      <Text style={[s.brand, { fontSize: size * 0.6 }]}>
        Terra<Text style={{ color: C.gold }}>Yield</Text>
      </Text>
      {tagline ? <Text style={s.muted}>Cultiva el futuro</Text> : null}
    </View>
  );
}

// Pantalla con scroll y márgenes seguros (para pantallas sin mapa).
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
        {children}
      </ScrollView>
    </View>
  );
}

type FieldProps = {
  icon: IconName;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  maxLength?: number;
};

export function Field({ icon, placeholder, value, onChangeText, secure, keyboardType, autoCapitalize, maxLength }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={s.field}>
      <Icon name={icon} color={C.muted} size={20} />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !visible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? (secure || keyboardType ? 'none' : 'words')}
        autoCorrect={false}
        maxLength={maxLength}
      />
      {secure ? (
        <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={10}>
          <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} color={C.muted} size={20} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Check({ value, onChange, children }: { value: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <TouchableOpacity style={s.checkRow} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={[s.box, value && { backgroundColor: C.primary, borderColor: C.primary }]}>
        {value ? <Icon name="checkmark" size={14} color={C.bg} /> : null}
      </View>
      {children}
    </TouchableOpacity>
  );
}

export function PrimaryButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity
      style={[s.btn, loading && { opacity: 0.6 }]}
      activeOpacity={0.85}
      onPress={loading ? undefined : onPress}>
      <Text style={s.btnText}>{loading ? 'Espere...' : label}</Text>
    </TouchableOpacity>
  );
}

export function Chips({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <TouchableOpacity
            key={o}
            style={[s.chip, on && { backgroundColor: C.primary, borderColor: C.primary }]}
            onPress={() => onChange(o)}>
            <Text style={[s.small, { color: on ? C.bg : C.text, fontWeight: '600' }]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${value}%`, backgroundColor: value < 65 ? C.gold : C.primary }]} />
    </View>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.small, style]}>{children}</Text>;
}

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  brand: { color: C.text, fontWeight: '700', fontFamily: SERIF, marginTop: 4 },
  h1: { color: C.text, fontSize: 26, fontWeight: '700' },
  h2: { color: C.text, fontSize: 18, fontWeight: '700' },
  muted: { color: C.muted, fontSize: 14, textAlign: 'center' },
  small: { color: C.muted, fontSize: 13, lineHeight: 18 },
  link: { color: C.primary, fontSize: 13, fontWeight: '600' },
  error: { color: C.danger, fontSize: 13, marginTop: 12 },
  rowTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  value: { color: C.text, fontSize: 15, fontWeight: '700' },
  rowH: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, color: C.text, fontSize: 15, height: '100%' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: { backgroundColor: C.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  cropThumb: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: C.card2, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  bigNum: { color: C.text, fontSize: 24, fontWeight: '700', fontFamily: SERIF },
});
