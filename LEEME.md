# TerraYield v2: cómo aplicar estos archivos

1. BORRA el archivo viejo:  src/app/index.tsx   (ahora la pantalla de inicio es src/app/(app)/index.tsx)
2. Copia el contenido de este zip sobre tu proyecto (acepta reemplazar):
   - app.json  (nuevo nombre de paquete com.terrayield.app y tema oscuro)
   - eas.json  (perfil "preview" que genera APK)
   - src/...   (pantallas, contextos, mapa y utilidades)
3. NO borres src/lib/supabase.ts ni tu archivo .env (siguen igual).
4. Reinicia:  npx expo start -c
5. Recuperar contraseña: en Supabase -> Authentication -> Email Templates -> "Reset Password",
   cambia el contenido para mostrar el código:  Tu código es: {{ .Token }}
