// Traduce los errores de Supabase al español.
export function traducir(msg: string | undefined): string {
  const m = (msg ?? '').toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('already registered')) return 'Ese correo ya está registrado.';
  if (m.includes('not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (m.includes('token has expired') || m.includes('otp_expired') || m.includes('invalid token'))
    return 'El código no es válido o ya venció. Pide uno nuevo.';
  if (m.includes('same password')) return 'La nueva contraseña debe ser distinta a la anterior.';
  if (m.includes('rate limit') || m.includes('security purposes'))
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (m.includes('network') || m.includes('fetch'))
    return 'No hay conexión con el servidor. Revisa tu internet.';
  return msg || 'Ocurrió un error. Inténtalo de nuevo.';
}
