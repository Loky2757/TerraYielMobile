import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { traducir } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

const REMEMBER_KEY = 'ty_remember';

type AuthValue = {
  session: Session | null;
  loading: boolean;
  nombre: string;
  email: string;
  rol: string;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (
    nombre: string,
    email: string,
    password: string,
    rol: 'productor' | 'empresa',
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendResetCode: (email: string) => Promise<void>;
  resetWithCode: (email: string, code: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Al abrir la app: recupera la sesión guardada, salvo que el usuario
    // no haya marcado "Recuérdame" la última vez.
    (async () => {
      const { data } = await supabase.auth.getSession();
      const remember = await AsyncStorage.getItem(REMEMBER_KEY);
      if (data.session && remember === '0') {
        await supabase.auth.signOut();
        if (active) setSession(null);
      } else if (active) {
        setSession(data.session);
      }
      if (active) setLoading(false);
    })().catch(() => {
      if (active) setLoading(false);
    });

    // Importante: aquí solo se actualiza el estado (sin llamar a otros métodos de supabase).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user;
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;

  const value: AuthValue = {
    session,
    loading,
    nombre: meta.nombre ?? meta.full_name ?? meta.name ?? user?.email?.split('@')[0] ?? 'Productor',
    email: user?.email ?? '',
    rol: meta.rol ?? 'productor',

    signIn: async (email, password, remember) => {
      await AsyncStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(traducir(error.message));
    },

    signUp: async (nombre, email, password, rol) => {
      await AsyncStorage.setItem(REMEMBER_KEY, '1');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nombre, rol } },
      });
      if (error) throw new Error(traducir(error.message));
      return { needsConfirmation: !data.session };
    },

    signOut: async () => {
      await supabase.auth.signOut();
    },

    // Recuperar contraseña con código de 6 dígitos (ver README: plantilla de correo).
    sendResetCode: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw new Error(traducir(error.message));
    },

    resetWithCode: async (email, code, password) => {
      await AsyncStorage.setItem(REMEMBER_KEY, '1');
      const v = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
      if (v.error) throw new Error(traducir(v.error.message));
      const u = await supabase.auth.updateUser({ password });
      if (u.error) throw new Error(traducir(u.error.message));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
