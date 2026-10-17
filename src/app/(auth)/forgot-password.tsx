import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Field, Icon, PrimaryButton, Screen, s } from '@/components/ui';
import { C } from '@/constants/terra';
import { useAuth } from '@/context/auth';

// Paso 1: pedir el código al correo. Paso 2: escribir el código y la nueva contraseña.
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendResetCode, resetWithCode } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Ingresa un correo válido.');
    setError('');
    setLoading(true);
    try {
      await sendResetCode(email);
      setInfo(`Te enviamos un código a ${email.trim()}. Revisa también la carpeta de spam.`);
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const reset = async () => {
    if (code.trim().length < 6) return setError('Escribe el código que recibiste en tu correo.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setError('');
    setLoading(true);
    try {
      await resetWithCode(email, code, password); // al terminar, la app entra sola
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <Screen>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={{ marginBottom: 16 }}>
        <Icon name="chevron-back" color={C.text} />
      </TouchableOpacity>
      <Text style={s.h1}>Recuperar contraseña</Text>
      <Text style={[s.muted, { textAlign: 'left', marginTop: 4, marginBottom: 20 }]}>
        {step === 1 ? 'Escribe tu correo y te enviaremos un código.' : info}
      </Text>

      <View style={{ gap: 12 }}>
        <Field icon="mail-outline" placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
        {step === 2 ? (
          <>
            <Field icon="keypad-outline" placeholder="Código del correo" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={8} />
            <Field icon="lock-closed-outline" placeholder="Nueva contraseña" value={password} onChangeText={setPassword} secure />
          </>
        ) : null}
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={{ marginTop: 16 }}>
        {step === 1 ? (
          <PrimaryButton label="Enviar código" onPress={send} loading={loading} />
        ) : (
          <PrimaryButton label="Cambiar contraseña" onPress={reset} loading={loading} />
        )}
      </View>
      {step === 2 ? (
        <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }} onPress={send}>
          <Text style={s.link}>Reenviar código</Text>
        </TouchableOpacity>
      ) : null}
    </Screen>
  );
}
