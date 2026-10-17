import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Check, Field, Icon, Logo, PrimaryButton, Screen, s } from '@/components/ui';
import { C } from '@/constants/terra';
import { useAuth } from '@/context/auth';
import { notify } from '@/lib/dialog';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [rol, setRol] = useState<'productor' | 'empresa'>('productor');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!nombre.trim()) return setError('Escribe tu nombre completo.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Ingresa un correo válido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== password2) return setError('Las contraseñas no coinciden.');
    if (!terms) return setError('Debes aceptar los términos y condiciones.');
    setError('');
    setLoading(true);
    try {
      const r = await signUp(nombre.trim(), email, password, rol);
      if (r.needsConfirmation) {
        notify('Revisa tu correo', 'Te enviamos un enlace para confirmar tu cuenta. Después inicia sesión.');
        router.replace('/login');
      }
      // Si no necesita confirmación, la app cambia sola a la pantalla de inicio.
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="chevron-back" color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 30 }}>
          <Logo size={24} tagline={false} />
        </View>
      </View>
      <Text style={s.h1}>Crear cuenta</Text>
      <Text style={[s.muted, { textAlign: 'left', marginTop: 4, marginBottom: 16 }]}>
        Únete a la comunidad de agricultores más innovadora del mundo.
      </Text>

      <View style={{ flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border }}>
        {(['productor', 'empresa'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={{ flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: rol === r ? C.primary : 'transparent' }}
            onPress={() => setRol(r)}>
            <Text style={[s.small, { fontWeight: '700', color: rol === r ? C.bg : C.muted }]}>{r === 'productor' ? 'Productor' : 'Empresa'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ gap: 12, marginTop: 16 }}>
        <Field icon="person-outline" placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
        <Field icon="mail-outline" placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field icon="lock-closed-outline" placeholder="Contraseña" value={password} onChangeText={setPassword} secure />
        <Field icon="lock-closed-outline" placeholder="Confirmar contraseña" value={password2} onChangeText={setPassword2} secure />
      </View>

      <View style={{ marginTop: 12 }}>
        <Check value={terms} onChange={setTerms}>
          <Text style={[s.small, { flex: 1 }]}>
            Acepto los <Text style={s.link}>Términos y Condiciones</Text> y la <Text style={s.link}>Política de Privacidad</Text>
          </Text>
        </Check>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={{ marginTop: 16 }}>
        <PrimaryButton label="Registrarse" onPress={submit} loading={loading} />
      </View>

      <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }} onPress={() => router.replace('/login')}>
        <Text style={s.small}>
          ¿Ya tienes una cuenta? <Text style={s.link}>Iniciar sesión</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
