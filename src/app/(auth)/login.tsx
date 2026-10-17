import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Check, Field, Logo, PrimaryButton, Screen, s } from '@/components/ui';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Ingresa un correo válido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setError('');
    setLoading(true);
    try {
      await signIn(email, password, remember); // al entrar, la app cambia sola a la pantalla de inicio
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <Logo size={44} />
      </View>
      <Text style={s.h1}>Iniciar sesión</Text>
      <Text style={[s.muted, { textAlign: 'left', marginTop: 4, marginBottom: 20 }]}>Bienvenido de nuevo, ¡nos alegra verte!</Text>

      <View style={{ gap: 12 }}>
        <Field icon="mail-outline" placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field icon="lock-closed-outline" placeholder="Contraseña" value={password} onChangeText={setPassword} secure />
      </View>

      <View style={s.spaceBetween}>
        <Check value={remember} onChange={setRemember}>
          <Text style={s.small}>Recuérdame</Text>
        </Check>
        <TouchableOpacity onPress={() => router.push('/forgot-password')} hitSlop={8}>
          <Text style={s.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={{ marginTop: 16 }}>
        <PrimaryButton label="Iniciar sesión" onPress={submit} loading={loading} />
      </View>

      <TouchableOpacity style={{ alignItems: 'center', marginTop: 28 }} onPress={() => router.replace('/register')}>
        <Text style={s.small}>
          ¿No tienes una cuenta? <Text style={s.link}>Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
