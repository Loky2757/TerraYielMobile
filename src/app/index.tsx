// @ts-nocheck
import { supabase } from "@/lib/supabase";

export default function App() {
  // @section:imports @depends:[]
  const React = require("react");
  const {
    View,
    Text,
    TextInput,
    Alert,
    Linking,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Platform,
    useWindowDimensions,
  } = require("react-native");
  const { Ionicons } = require("@expo/vector-icons");
  const { createBottomTabNavigator } = require("expo-router/js-tabs");
  const { useSafeAreaInsets } = require("react-native-safe-area-context");
  var h = React.createElement;
  // Módulos nativos opcionales: si no están instalados, la app sigue funcionando.
  var Location = null;
  var MapModule = null;
  var AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  try {
    Location = require("expo-location");
  } catch (e) {}
  try {
    MapModule = require("react-native-maps");
  } catch (e) {}
  // @end:imports

  // @section:theme @depends:[]
  var C = {
    bg: "#07140E",
    card: "#0E2318",
    card2: "#143222",
    primary: "#3FA35B",
    gold: "#D9B45B",
    text: "#F2F6F3",
    muted: "#9FB5A7",
    border: "#1F3D2D",
    danger: "#E5584F",
  };
  var SERIF = Platform.OS === "ios" ? "Georgia" : "serif";
  var TAB_H = Platform.OS === "web" ? 56 : 52;
  // Botones de Google / Apple / Microsoft: ponlos en true cuando los configures.
  var SHOW_SOCIAL = false;
  // @end:theme

  // @section:api @depends:[]
  // Traduce los errores de Supabase al español.
  var traducir = function (msg) {
    var m = String(msg || "").toLowerCase();
    if (m.indexOf("invalid login") !== -1)
      return "Correo o contraseña incorrectos.";
    if (m.indexOf("already registered") !== -1)
      return "Ese correo ya está registrado.";
    if (m.indexOf("not confirmed") !== -1)
      return "Confirma tu correo antes de iniciar sesión.";
    if (m.indexOf("network") !== -1 || m.indexOf("fetch") !== -1)
      return "No hay conexión con el servidor. Revisa tu internet.";
    if (m.indexOf("rate limit") !== -1)
      return "Demasiados intentos. Espera unos minutos.";
    return msg;
  };
  var cap = function (n) {
    n = n || "Productor";
    return n.charAt(0).toUpperCase() + n.slice(1);
  };
  var nombreDe = function (user) {
    var m = (user && user.user_metadata) || {};
    var n = m.nombre || m.full_name || m.name || (user && user.email) || "";
    return n.split(" ")[0];
  };
  // Lee los parámetros que Supabase devuelve en la URL (?code=... o #access_token=...).
  var parseParams = function (url) {
    var out = {};
    var hash = url.split("#")[1] || "";
    var query = (url.split("?")[1] || "").split("#")[0];
    (query + "&" + hash).split("&").forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf("=");
      if (i < 0) return;
      out[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(
        kv.slice(i + 1),
      );
    });
    return out;
  };
  // @end:api

  // @section:sample-data @depends:[]
  var CROPS = [
    {
      id: "maiz",
      name: "Maíz",
      phase: "Floración",
      health: 85,
      icon: "nutrition",
      color: "#D9B45B",
    },
    {
      id: "trigo",
      name: "Trigo",
      phase: "Crecimiento",
      health: 60,
      icon: "leaf",
      color: "#B8A15A",
    },
    {
      id: "jitomate",
      name: "Jitomate",
      phase: "Fructificación",
      health: 72,
      icon: "ellipse",
      color: "#E5584F",
    },
    {
      id: "frijol",
      name: "Frijol",
      phase: "Desarrollo vegetativo",
      health: 91,
      icon: "ellipse-outline",
      color: "#8A5A3C",
    },
    {
      id: "chile",
      name: "Chile",
      phase: "Floración",
      health: 78,
      icon: "flame",
      color: "#E27D3A",
    },
  ];
  var INITIAL_PARCELS = [
    {
      id: "esperanza",
      name: "La Esperanza",
      area: 12.5,
      crop: "Maíz",
      health: "Óptima",
      lat: 20.8833,
      lng: -103.8333,
    },
    {
      id: "mirador",
      name: "El Mirador",
      area: 2.3,
      crop: "Trigo",
      health: "Buena",
      lat: 20.889,
      lng: -103.827,
    },
    {
      id: "palmas",
      name: "Las Palmas",
      area: 1.6,
      crop: "Jitomate",
      health: "Atención",
      lat: 20.879,
      lng: -103.84,
    },
  ];
  // ---- Calculadora de siembra ----
  // REFERENCIA: valida estos valores con un agrónomo o el INIFAP antes de usarlos en campo.
  // Los factores por tipo de suelo son de EJEMPLO: cámbialos por los tuyos.
  var SOILS = ["Franco", "Arcilloso", "Arenoso"];
  var CALC = {
    Maíz: {
      semillaKgHa: 25, // dosis base por hectárea
      suelo: { Franco: 1.0, Arcilloso: 0.9, Arenoso: 1.1 },
    },
  };
  var L_POR_MM_HA = 10000; // 1 mm de lámina = 10,000 litros por hectárea
  var CULTIVOS = [
    "Maíz",
    "Trigo",
    "Jitomate",
    "Frijol",
    "Chile",
    "Sin cultivo",
  ];
  // @end:sample-data

  // @section:AppContext @depends:[]
  var AppContext = React.createContext(null);
  var useApp = function () {
    return React.useContext(AppContext);
  };
  // @end:AppContext

  // @section:shared-components @depends:[theme,styles]
  var Icon = function (p) {
    return h(Ionicons, {
      name: p.name,
      size: p.size || 22,
      color: p.color || C.primary,
    });
  };
  var Logo = function (p) {
    var s = p.size || 56;
    return h(
      View,
      { style: { alignItems: "center" } },
      h(Icon, { name: "leaf", size: s, color: C.primary }),
      h(
        Text,
        { style: [styles.brand, { fontSize: s * 0.6 }] },
        "Terra",
        h(Text, { style: { color: C.gold } }, "Yield"),
      ),
      p.tagline === false
        ? null
        : h(Text, { style: styles.muted }, "Cultiva el futuro"),
    );
  };
  var Field = function (p) {
    var vis = React.useState(false);
    return h(
      View,
      { style: styles.field },
      h(Icon, { name: p.icon, color: C.muted, size: 20 }),
      h(TextInput, {
        style: styles.input,
        placeholder: p.placeholder,
        placeholderTextColor: C.muted,
        value: p.value,
        onChangeText: p.onChange,
        secureTextEntry: p.secure && !vis[0],
        autoCapitalize: p.secure || p.keyboard ? "none" : "words",
        keyboardType: p.keyboard || "default",
      }),
      p.secure
        ? h(
            TouchableOpacity,
            {
              onPress: function () {
                vis[1](!vis[0]);
              },
              hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
            },
            h(Icon, {
              name: vis[0] ? "eye-off-outline" : "eye-outline",
              color: C.muted,
              size: 20,
            }),
          )
        : null,
    );
  };
  var Check = function (p) {
    return h(
      TouchableOpacity,
      {
        style: styles.checkRow,
        onPress: function () {
          p.onChange(!p.value);
        },
        activeOpacity: 0.7,
      },
      h(
        View,
        {
          style: [
            styles.box,
            p.value && { backgroundColor: C.primary, borderColor: C.primary },
          ],
        },
        p.value ? h(Icon, { name: "checkmark", size: 14, color: C.bg }) : null,
      ),
      p.children,
    );
  };
  var PrimaryButton = function (p) {
    return h(
      TouchableOpacity,
      {
        style: [styles.btn, p.loading && { opacity: 0.6 }],
        activeOpacity: 0.85,
        onPress: p.loading ? undefined : p.onPress,
      },
      h(Text, { style: styles.btnText }, p.loading ? "Espere..." : p.label),
    );
  };
  var Progress = function (p) {
    return h(
      View,
      { style: styles.track },
      h(View, {
        style: [
          styles.fill,
          {
            width: p.value + "%",
            backgroundColor: p.value < 65 ? C.gold : C.primary,
          },
        ],
      }),
    );
  };
  var CropCard = function (p) {
    var c = p.crop;
    return h(
      View,
      { style: styles.cropCard },
      h(
        View,
        { style: [styles.cropThumb, { backgroundColor: c.color + "33" }] },
        h(Icon, { name: c.icon, color: c.color }),
      ),
      h(
        View,
        { style: { flex: 1, gap: 4 } },
        h(Text, { style: styles.rowTitle }, c.name),
        h(Text, { style: styles.small }, "Fase: " + c.phase),
        h(Progress, { value: c.health }),
      ),
      h(Text, { style: styles.value }, c.health + "%"),
    );
  };
  var ScreenScroll = function (p) {
    var insets = useSafeAreaInsets();
    var dims = useWindowDimensions();
    return h(
      View,
      { style: styles.root },
      h(StatusBar, { backgroundColor: C.bg, barStyle: "light-content" }),
      h(
        ScrollView,
        {
          style: { height: dims.height - insets.top - insets.bottom },
          keyboardShouldPersistTaps: "handled",
          contentContainerStyle: {
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: (p.noTab ? 0 : TAB_H + insets.bottom) + 24,
          },
        },
        p.children,
      ),
    );
  };
  // @end:shared-components

  // @section:WelcomeScreen @depends:[shared-components]
  var WelcomeScreen = function (p) {
    var insets = useSafeAreaInsets();
    var rows = [];
    for (var i = 0; i < 9; i++) {
      rows.push(
        h(View, {
          key: i,
          style: {
            height: 14 + i * 3,
            marginBottom: 6 + i,
            backgroundColor: i % 2 ? "#1E5A34" : "#2B7A47",
            opacity: 0.35 + i * 0.07,
            transform: [{ skewY: "-4deg" }],
          },
        }),
      );
    }
    return h(
      View,
      {
        style: [
          styles.root,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 16 },
        ],
      },
      h(
        View,
        {
          style: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          },
        },
        h(Logo, { size: 72 }),
        h(
          Text,
          { style: [styles.muted, { marginTop: 24 }] },
          "Datos. Tecnología. Mejores cosechas.",
        ),
      ),
      h(View, { style: { overflow: "hidden", paddingTop: 8 } }, rows),
      h(
        View,
        { style: { paddingHorizontal: 24, gap: 16, marginTop: 16 } },
        h(PrimaryButton, {
          label: "Comenzar",
          onPress: function () {
            p.go("register");
          },
        }),
        h(
          TouchableOpacity,
          {
            onPress: function () {
              p.go("login");
            },
            style: { alignItems: "center", padding: 8 },
          },
          h(Text, { style: styles.link }, "Iniciar sesión"),
        ),
      ),
    );
  };
  // @end:WelcomeScreen

  // @section:LoginScreen @depends:[shared-components]
  var LoginScreen = function (p) {
    var email = React.useState("");
    var pass = React.useState("");
    var remember = React.useState(false);
    var error = React.useState("");
    var loading = React.useState(false);
    var submit = async function () {
      if (!/^\S+@\S+\.\S+$/.test(email[0]))
        return error[1]("Ingresa un correo válido.");
      if (pass[0].length < 6)
        return error[1]("La contraseña debe tener al menos 6 caracteres.");
      error[1]("");
      loading[1](true);
      try {
        var r = await supabase.auth.signInWithPassword({
          email: email[0].trim(),
          password: pass[0],
        });
        if (r.error) throw new Error(traducir(r.error.message));
        p.onAuth(nombreDe(r.data.user), remember[0]);
      } catch (e) {
        error[1](traducir(e.message));
      }
      loading[1](false);
    };
    var google = async function () {
      error[1]("");
      loading[1](true);
      try {
        await p.onGoogle();
      } catch (e) {
        error[1](traducir(e.message));
      }
      loading[1](false);
    };
    var social = function (icon) {
      return h(
        TouchableOpacity,
        {
          key: icon,
          style: styles.social,
          onPress:
            icon === "logo-google"
              ? google
              : function () {
                  error[1](
                    "El acceso con " +
                      icon.replace("logo-", "") +
                      " aún no está disponible.",
                  );
                },
        },
        h(Icon, { name: icon, size: 24, color: C.text }),
      );
    };
    return h(
      ScreenScroll,
      { noTab: true },
      h(
        View,
        { style: { alignItems: "center", marginVertical: 24 } },
        h(Logo, { size: 44 }),
      ),
      h(Text, { style: styles.h1 }, "Iniciar sesión"),
      h(
        Text,
        { style: [styles.muted, { marginBottom: 20 }] },
        "Bienvenido de nuevo, ¡nos alegra verte!",
      ),
      h(
        View,
        { style: { gap: 12 } },
        h(Field, {
          icon: "mail-outline",
          placeholder: "Correo electrónico",
          value: email[0],
          onChange: email[1],
          keyboard: "email-address",
        }),
        h(Field, {
          icon: "lock-closed-outline",
          placeholder: "Contraseña",
          value: pass[0],
          onChange: pass[1],
          secure: true,
        }),
      ),
      h(
        View,
        { style: styles.spaceBetween },
        h(
          Check,
          { value: remember[0], onChange: remember[1] },
          h(Text, { style: styles.small }, "Recuérdame"),
        ),
        h(Text, { style: styles.link }, "¿Olvidaste tu contraseña?"),
      ),
      error[0] ? h(Text, { style: styles.error }, error[0]) : null,
      h(
        View,
        { style: { marginTop: 16 } },
        h(PrimaryButton, {
          label: "Iniciar sesión",
          onPress: submit,
          loading: loading[0],
        }),
      ),
      SHOW_SOCIAL
        ? h(
            Text,
            {
              style: [
                styles.muted,
                { textAlign: "center", marginVertical: 20 },
              ],
            },
            "o continúa con",
          )
        : null,
      SHOW_SOCIAL
        ? h(
            View,
            {
              style: {
                flexDirection: "row",
                justifyContent: "center",
                gap: 20,
              },
            },
            ["logo-google", "logo-apple", "logo-windows"].map(social),
          )
        : null,
      h(
        TouchableOpacity,
        {
          style: { alignItems: "center", marginTop: 28 },
          onPress: function () {
            p.go("register");
          },
        },
        h(
          Text,
          { style: styles.small },
          "¿No tienes una cuenta? ",
          h(Text, { style: styles.link }, "Regístrate"),
        ),
      ),
    );
  };
  // @end:LoginScreen

  // @section:RegisterScreen @depends:[shared-components]
  var RegisterScreen = function (p) {
    var role = React.useState("Producto");
    var name = React.useState("");
    var email = React.useState("");
    var pass = React.useState("");
    var pass2 = React.useState("");
    var terms = React.useState(false);
    var error = React.useState("");
    var loading = React.useState(false);
    var submit = async function () {
      if (!name[0].trim()) return error[1]("Escribe tu nombre completo.");
      if (!/^\S+@\S+\.\S+$/.test(email[0]))
        return error[1]("Ingresa un correo válido.");
      if (pass[0].length < 6)
        return error[1]("La contraseña debe tener al menos 6 caracteres.");
      if (pass[0] !== pass2[0])
        return error[1]("Las contraseñas no coinciden.");
      if (!terms[0])
        return error[1]("Debes aceptar los términos y condiciones.");
      error[1]("");
      loading[1](true);
      try {
        var r = await supabase.auth.signUp({
          email: email[0].trim(),
          password: pass[0],
          options: {
            data: {
              nombre: name[0].trim(),
              rol: role[0] === "Empresa" ? "empresa" : "productor",
            },
          },
        });
        if (r.error) throw new Error(traducir(r.error.message));
        if (!r.data.session) {
          // El proyecto exige confirmar el correo antes de entrar.
          Alert.alert(
            "Revisa tu correo",
            "Te enviamos un enlace para confirmar tu cuenta. Después inicia sesión.",
          );
          p.go("login");
        } else {
          p.onAuth(nombreDe(r.data.user), true);
        }
      } catch (e) {
        error[1](traducir(e.message));
      }
      loading[1](false);
    };
    var roles = [
      ["Producto", "Productor"],
      ["Empresa", "Empresa"],
    ];
    return h(
      ScreenScroll,
      { noTab: true },
      h(
        View,
        {
          style: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          },
        },
        h(
          TouchableOpacity,
          {
            onPress: function () {
              p.go("welcome");
            },
            hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
          },
          h(Icon, { name: "chevron-back", color: C.text }),
        ),
        h(
          View,
          { style: { flex: 1, alignItems: "center", marginRight: 30 } },
          h(Logo, { size: 24, tagline: false }),
        ),
      ),
      h(Text, { style: styles.h1 }, "Crear cuenta"),
      h(
        Text,
        { style: [styles.muted, { marginBottom: 16 }] },
        "Únete a la comunidad de agricultores más innovadora del mundo.",
      ),
      h(
        View,
        { style: styles.segment },
        roles.map(function (r) {
          var on = role[0] === r[0];
          return h(
            TouchableOpacity,
            {
              key: r[0],
              style: [styles.segItem, on && { backgroundColor: C.primary }],
              onPress: function () {
                role[1](r[0]);
              },
            },
            h(
              Text,
              {
                style: [
                  styles.small,
                  { fontWeight: "700", color: on ? C.bg : C.muted },
                ],
              },
              r[1],
            ),
          );
        }),
      ),
      h(
        View,
        { style: { gap: 12, marginTop: 16 } },
        h(Field, {
          icon: "person-outline",
          placeholder: "Nombre completo",
          value: name[0],
          onChange: name[1],
        }),
        h(Field, {
          icon: "mail-outline",
          placeholder: "Correo electrónico",
          value: email[0],
          onChange: email[1],
          keyboard: "email-address",
        }),
        h(Field, {
          icon: "lock-closed-outline",
          placeholder: "Contraseña",
          value: pass[0],
          onChange: pass[1],
          secure: true,
        }),
        h(Field, {
          icon: "lock-closed-outline",
          placeholder: "Confirmar contraseña",
          value: pass2[0],
          onChange: pass2[1],
          secure: true,
        }),
      ),
      h(
        View,
        { style: { marginTop: 12 } },
        h(
          Check,
          { value: terms[0], onChange: terms[1] },
          h(
            Text,
            { style: [styles.small, { flex: 1 }] },
            "Acepto los ",
            h(Text, { style: styles.link }, "Términos y Condiciones"),
            " y la ",
            h(Text, { style: styles.link }, "Política de Privacidad"),
          ),
        ),
      ),
      error[0] ? h(Text, { style: styles.error }, error[0]) : null,
      h(
        View,
        { style: { marginTop: 16 } },
        h(PrimaryButton, {
          label: "Registrarse",
          onPress: submit,
          loading: loading[0],
        }),
      ),
      h(
        TouchableOpacity,
        {
          style: { alignItems: "center", marginTop: 20 },
          onPress: function () {
            p.go("login");
          },
        },
        h(
          Text,
          { style: styles.small },
          "¿Ya tienes una cuenta? ",
          h(Text, { style: styles.link }, "Iniciar sesión"),
        ),
      ),
    );
  };
  // @end:RegisterScreen

  // @section:InicioScreen @depends:[shared-components]
  var InicioScreen = function (p) {
    var app = useApp();
    var stat = function (icon, n, label, color) {
      return h(
        View,
        { style: styles.stat, key: label },
        h(Icon, { name: icon, color: color }),
        h(Text, { style: styles.statNum }, String(n)),
        h(Text, { style: styles.small }, label),
      );
    };
    return h(
      ScreenScroll,
      null,
      h(
        View,
        { style: [styles.rowH, { marginBottom: 16 }] },
        h(
          View,
          { style: styles.avatar },
          h(Icon, { name: "person", color: C.bg }),
        ),
        h(
          View,
          { style: { flex: 1 } },
          h(Text, { style: styles.rowTitle }, "Hola, " + app.user),
          h(
            Text,
            { style: styles.small },
            "¡Aquí está el resumen de tu actividad!",
          ),
        ),
      ),
      h(
        View,
        { style: styles.weather },
        h(Icon, { name: "sunny", size: 44, color: C.gold }),
        h(
          View,
          { style: { flex: 1 } },
          h(Text, { style: styles.temp }, "24°C"),
          h(Text, { style: styles.small }, "Soleado"),
        ),
        h(
          View,
          { style: { alignItems: "flex-end" } },
          h(Text, { style: styles.rowTitle }, "El Valle, Jalisco"),
          h(Text, { style: styles.small }, "H: 28°  L: 16°"),
        ),
      ),
      h(
        View,
        { style: [styles.rowH, { marginTop: 12, gap: 10 }] },
        stat("map-outline", app.parcels.length, "Terrenos", C.primary),
        stat("leaf-outline", CROPS.length, "Cultivos", C.gold),
        stat("warning-outline", 2, "Alertas", C.danger),
      ),
      h(
        View,
        { style: [styles.spaceBetween, { marginTop: 24, marginBottom: 12 }] },
        h(Text, { style: styles.h2 }, "Tus cultivos"),
        h(
          TouchableOpacity,
          {
            onPress: function () {
              p.navigation.navigate("Cultivos");
            },
          },
          h(Text, { style: styles.link }, "Ver todos ›"),
        ),
      ),
      h(
        View,
        { style: { gap: 10 } },
        CROPS.slice(0, 3).map(function (c) {
          return h(CropCard, { key: c.id, crop: c });
        }),
      ),
    );
  };
  // @end:InicioScreen

  // @section:ParcelModal @depends:[shared-components,sample-data]
  var ParcelModal = function (p) {
    var app = useApp();
    var insets = useSafeAreaInsets();
    var t = p.parcel;
    var name = React.useState(t.name);
    var areaTxt = React.useState(t.area ? String(t.area) : "");
    var crop = React.useState(t.crop);
    var soil = React.useState("Franco");
    var mmTxt = React.useState("");
    var result = React.useState(null);
    var busy = React.useState(false);
    var num = function (x) {
      return parseFloat(String(x).replace(",", "."));
    };
    var fmt = function (n, d) {
      var parts = n.toFixed(d).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    };
    var label = function (txt) {
      return h(Text, { style: styles.small }, txt);
    };
    var chips = function (options, value, set) {
      return h(
        View,
        { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
        options.map(function (o) {
          var on = o === value;
          return h(
            TouchableOpacity,
            {
              key: o,
              style: [
                styles.chip,
                on && { backgroundColor: C.primary, borderColor: C.primary },
              ],
              onPress: function () {
                set(o);
                result[1](null);
              },
            },
            h(
              Text,
              {
                style: [
                  styles.small,
                  { color: on ? C.bg : C.text, fontWeight: "600" },
                ],
              },
              o,
            ),
          );
        }),
      );
    };
    var save = async function () {
      var area = num(areaTxt[0]);
      if (!name[0].trim())
        return Alert.alert(
          "Falta el nombre",
          "Escribe un nombre para el terreno.",
        );
      if (!(area >= 0))
        return Alert.alert(
          "Superficie no válida",
          "Escribe las hectáreas, por ejemplo 2.5",
        );
      busy[1](true);
      try {
        await app.updateParcel(t.id, {
          name: name[0].trim(),
          area: area,
          crop: crop[0],
        });
        p.onClose();
      } catch (e) {
        Alert.alert("No se pudo guardar", e.message);
      }
      busy[1](false);
    };
    var remove = function () {
      Alert.alert(
        "Eliminar terreno",
        "¿Seguro que quieres eliminar «" + t.name + "»? No se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async function () {
              try {
                await app.deleteParcel(t.id);
                p.onClose();
              } catch (e) {
                Alert.alert("No se pudo eliminar", e.message);
              }
            },
          },
        ],
      );
    };
    var calculate = function () {
      var cfg = CALC[crop[0]];
      var area = num(areaTxt[0]);
      var mm = num(mmTxt[0]);
      if (!cfg) return;
      if (!(area > 0))
        return Alert.alert(
          "Falta la superficie",
          "Escribe las hectáreas del terreno para calcular.",
        );
      var perHa = cfg.semillaKgHa * cfg.suelo[soil[0]];
      result[1]({
        perHa: perHa,
        seed: perHa * area,
        water: mm > 0 ? mm * L_POR_MM_HA * area : null,
      });
    };
    var r = result[0];
    return h(
      Modal,
      { visible: true, animationType: "slide", onRequestClose: p.onClose },
      h(
        View,
        { style: styles.root },
        h(
          ScrollView,
          {
            keyboardShouldPersistTaps: "handled",
            contentContainerStyle: {
              padding: 16,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 32,
              gap: 12,
            },
          },
          h(
            View,
            { style: styles.spaceBetween },
            h(Text, { style: styles.h1 }, "Detalle del terreno"),
            h(
              TouchableOpacity,
              {
                onPress: p.onClose,
                hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
              },
              h(Icon, { name: "close", color: C.text, size: 26 }),
            ),
          ),
          label("Nombre"),
          h(Field, {
            icon: "create-outline",
            placeholder: "Nombre del terreno",
            value: name[0],
            onChange: name[1],
          }),
          label("Superficie (hectáreas)"),
          h(Field, {
            icon: "resize-outline",
            placeholder: "Ej. 2.5",
            value: areaTxt[0],
            onChange: function (v) {
              areaTxt[1](v);
              result[1](null);
            },
            keyboard: "decimal-pad",
          }),
          label("Cultivo"),
          chips(CULTIVOS, crop[0], crop[1]),
          h(PrimaryButton, {
            label: "Guardar cambios",
            onPress: save,
            loading: busy[0],
          }),
          h(
            Text,
            { style: [styles.h2, { marginTop: 16 }] },
            "Calculadora de siembra",
          ),
          CALC[crop[0]]
            ? h(
                View,
                { style: { gap: 12 } },
                label("Tipo de suelo"),
                chips(SOILS, soil[0], soil[1]),
                label("Riego: lámina de agua (mm)"),
                h(Field, {
                  icon: "water-outline",
                  placeholder: "Ej. 50",
                  value: mmTxt[0],
                  onChange: function (v) {
                    mmTxt[1](v);
                    result[1](null);
                  },
                  keyboard: "decimal-pad",
                }),
                h(PrimaryButton, { label: "Calcular", onPress: calculate }),
                r
                  ? h(
                      View,
                      { style: styles.calcBox },
                      label("Semilla necesaria"),
                      h(
                        Text,
                        { style: styles.statNum },
                        fmt(r.seed, 1) + " kg",
                      ),
                      label(fmt(r.perHa, 1) + " kg por hectárea"),
                      r.water != null
                        ? h(
                            View,
                            { style: { marginTop: 12 } },
                            label("Agua para un riego de " + mmTxt[0] + " mm"),
                            h(
                              Text,
                              { style: styles.statNum },
                              fmt(r.water, 0) + " L",
                            ),
                            label("≈ " + fmt(r.water / 1000, 1) + " m³"),
                          )
                        : h(
                            Text,
                            { style: [styles.small, { marginTop: 12 }] },
                            "Escribe la lámina de riego (mm) para calcular el agua.",
                          ),
                      h(
                        Text,
                        { style: [styles.small, { marginTop: 12 }] },
                        "Cálculo de referencia: valida las fórmulas con un agrónomo o el INIFAP antes de usarlas en campo.",
                      ),
                    )
                  : null,
              )
            : h(
                Text,
                { style: styles.small },
                "Para " +
                  crop[0] +
                  " todavía no hay fórmula cargada. Por ahora la calculadora funciona con Maíz.",
              ),
          h(
            TouchableOpacity,
            { onPress: remove, style: { alignItems: "center", padding: 14 } },
            h(
              Text,
              { style: [styles.link, { color: C.danger }] },
              "Eliminar terreno",
            ),
          ),
        ),
      ),
    );
  };
  // @end:ParcelModal

  // @section:TerrenosScreen @depends:[shared-components]
  var TerrenosScreen = function () {
    var app = useApp();
    var query = React.useState("");
    var selected = React.useState("");
    var myPos = React.useState(null);
    var perm = React.useState("unknown");
    var editing = React.useState(null);
    var mapType = React.useState("standard");
    var loaded = React.useState(false);
    var late = React.useState(false);
    // Si el mapa no termina de cargar en 10 s, mostramos un aviso con la causa probable.
    React.useEffect(function () {
      var id = setTimeout(function () {
        late[1](true);
      }, 10000);
      return function () {
        clearTimeout(id);
      };
    }, []);
    var mapRef = React.useRef(null);
    var MapView = MapModule ? MapModule.default : null;
    var Marker = MapModule ? MapModule.Marker : null;
    var shown = app.parcels.filter(function (t) {
      return t.name.toLowerCase().indexOf(query[0].toLowerCase()) !== -1;
    });
    var current = app.parcels.filter(function (t) {
      return t.id === selected[0];
    })[0];

    // Pide permiso, obtiene la posición con GPS de alta precisión y centra el mapa.
    var locate = async function (silent) {
      if (!Location) {
        if (!silent)
          Alert.alert(
            "Falta un módulo",
            "Instala expo-location para usar tu ubicación.",
          );
        return;
      }
      try {
        var r = await Location.requestForegroundPermissionsAsync();
        if (r.status !== "granted") {
          perm[1]("denied");
          if (!silent) {
            Alert.alert(
              "Ubicación desactivada",
              "Activa el permiso de ubicación para ver tu posición en el mapa.",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Abrir ajustes",
                  onPress: function () {
                    Linking.openSettings();
                  },
                },
              ],
            );
          }
          return;
        }
        perm[1]("granted");
        var pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        var c = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        myPos[1](c);
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: c.latitude,
              longitude: c.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            600,
          );
        }
      } catch (e) {
        if (!silent)
          Alert.alert(
            "No se pudo obtener tu ubicación",
            "Verifica que el GPS esté encendido.",
          );
      }
    };
    React.useEffect(function () {
      locate(true);
    }, []);

    var addParcelAt = async function (c) {
      try {
        var t = await app.saveParcel({
          name: "Terreno " + (app.parcels.length + 1),
          area: 0,
          crop: "Sin cultivo",
          lat: c.latitude,
          lng: c.longitude,
        });
        app.setParcels(app.parcels.concat([t]));
        selected[1](t.id);
      } catch (e) {
        Alert.alert("No se pudo guardar el terreno", e.message);
      }
    };
    var onAdd = function () {
      if (myPos[0]) return addParcelAt(myPos[0]);
      Alert.alert(
        "Nuevo terreno",
        "Mantén presionado el mapa donde está tu terreno, o activa tu ubicación con el botón de la mira.",
      );
    };

    var mapView = MapView
      ? h(
          MapView,
          {
            ref: mapRef,
            style: { flex: 1 },
            provider:
              Platform.OS === "android" ? MapModule.PROVIDER_GOOGLE : undefined,
            mapType: mapType[0],
            onMapLoaded: function () {
              loaded[1](true);
            },
            initialRegion: {
              latitude: app.parcels[0] ? app.parcels[0].lat : 20.8833,
              longitude: app.parcels[0] ? app.parcels[0].lng : -103.8333,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            showsUserLocation: perm[0] === "granted",
            showsMyLocationButton: false,
            onLongPress: function (e) {
              addParcelAt(e.nativeEvent.coordinate);
            },
          },
          shown.map(function (t) {
            return h(Marker, {
              key: t.id,
              coordinate: { latitude: t.lat, longitude: t.lng },
              title: t.name,
              description: t.area + " ha · " + t.crop,
              pinColor: t.id === selected[0] ? "gold" : "green",
              onPress: function () {
                selected[1](t.id);
              },
            });
          }),
        )
      : h(
          View,
          {
            style: {
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            },
          },
          h(
            Text,
            { style: styles.muted },
            "El mapa necesita react-native-maps y funciona en el teléfono o emulador (no en web).",
          ),
        );

    return h(
      ScreenScroll,
      null,
      h(
        View,
        { style: [styles.spaceBetween, { marginBottom: 12 }] },
        h(Text, { style: styles.h1 }, "Mis terrenos"),
        h(
          TouchableOpacity,
          { style: styles.addBtn, onPress: onAdd },
          h(Icon, { name: "add", color: C.bg, size: 22 }),
        ),
      ),
      h(
        View,
        { style: styles.field },
        h(Icon, { name: "search", color: C.muted, size: 20 }),
        h(TextInput, {
          style: styles.input,
          placeholder: "Buscar terreno...",
          placeholderTextColor: C.muted,
          value: query[0],
          onChangeText: query[1],
        }),
      ),
      h(
        View,
        { style: styles.map },
        mapView,
        MapView && !loaded[0] && late[0]
          ? h(
              View,
              { style: styles.mapWarn },
              h(
                Text,
                { style: styles.small },
                "El mapa no termina de cargar. Revisa tu internet y, si usas una compilación propia (no Expo Go), la clave de Google Maps en app.json.",
              ),
            )
          : null,
        MapView
          ? h(
              TouchableOpacity,
              {
                style: styles.layerBtn,
                onPress: function () {
                  mapType[1](mapType[0] === "standard" ? "hybrid" : "standard");
                },
              },
              h(Icon, { name: "layers", color: C.text, size: 22 }),
            )
          : null,
        h(
          TouchableOpacity,
          {
            style: styles.locBtn,
            onPress: function () {
              locate(false);
            },
          },
          h(Icon, {
            name: perm[0] === "granted" ? "locate" : "locate-outline",
            color: C.bg,
            size: 22,
          }),
        ),
      ),
      current
        ? h(
            View,
            { style: styles.selCard },
            h(
              View,
              { style: [styles.cropThumb, { backgroundColor: C.card2 }] },
              h(Icon, { name: "map", color: C.primary }),
            ),
            h(
              View,
              { style: { flex: 1, gap: 2 } },
              h(Text, { style: styles.rowTitle }, current.name),
              h(
                Text,
                { style: styles.small },
                current.area + " ha · " + current.crop,
              ),
              h(
                View,
                { style: [styles.rowH, { gap: 6 }] },
                h(View, {
                  style: [
                    styles.dot,
                    {
                      backgroundColor:
                        current.health === "Atención" ? C.danger : C.primary,
                    },
                  ],
                }),
                h(
                  Text,
                  { style: styles.small },
                  "Salud del cultivo: " + current.health,
                ),
              ),
            ),
            h(
              TouchableOpacity,
              {
                onPress: function () {
                  editing[1](current);
                },
                hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
              },
              h(Icon, { name: "create-outline", color: C.primary }),
            ),
            h(
              TouchableOpacity,
              {
                onPress: function () {
                  selected[1]("");
                },
                hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
              },
              h(Icon, { name: "close", color: C.muted }),
            ),
          )
        : null,
      h(
        View,
        { style: { marginTop: 16, gap: 10 } },
        shown.map(function (t) {
          return h(
            TouchableOpacity,
            {
              key: t.id,
              style: styles.cropCard,
              onPress: function () {
                selected[1](t.id);
                if (mapRef.current)
                  mapRef.current.animateToRegion(
                    {
                      latitude: t.lat,
                      longitude: t.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    },
                    600,
                  );
              },
            },
            h(
              View,
              { style: [styles.cropThumb, { backgroundColor: C.card2 }] },
              h(Icon, { name: "location" }),
            ),
            h(
              View,
              { style: { flex: 1 } },
              h(Text, { style: styles.rowTitle }, t.name),
              h(Text, { style: styles.small }, t.crop),
            ),
            h(Text, { style: styles.value }, t.area + " ha"),
          );
        }),
      ),
      editing[0]
        ? h(ParcelModal, {
            key: editing[0].id,
            parcel: editing[0],
            onClose: function () {
              editing[1](null);
            },
          })
        : null,
    );
  };
  // @end:TerrenosScreen

  // @section:CultivosScreen @depends:[shared-components]
  var CultivosScreen = function () {
    return h(
      ScreenScroll,
      null,
      h(Text, { style: [styles.h1, { marginBottom: 16 }] }, "Cultivos"),
      h(
        View,
        { style: { gap: 10 } },
        CROPS.map(function (c) {
          return h(CropCard, { key: c.id, crop: c });
        }),
      ),
    );
  };
  // @end:CultivosScreen

  // @section:DatosScreen @depends:[shared-components]
  var DatosScreen = function () {
    var avg = Math.round(
      CROPS.reduce(function (s, c) {
        return s + c.health;
      }, 0) / CROPS.length,
    );
    return h(
      ScreenScroll,
      null,
      h(Text, { style: [styles.h1, { marginBottom: 16 }] }, "Datos"),
      h(
        View,
        { style: styles.weather },
        h(
          View,
          { style: { flex: 1 } },
          h(Text, { style: styles.temp }, avg + "%"),
          h(Text, { style: styles.small }, "salud promedio de cultivos"),
        ),
        h(
          View,
          { style: { flex: 1 } },
          h(Text, { style: styles.temp }, "64%"),
          h(Text, { style: styles.small }, "humedad del suelo"),
        ),
      ),
      h(
        Text,
        { style: [styles.h2, { marginTop: 24, marginBottom: 12 }] },
        "Salud por cultivo",
      ),
      h(
        View,
        {
          style: [
            styles.cropCard,
            { flexDirection: "column", alignItems: "stretch", gap: 14 },
          ],
        },
        CROPS.map(function (c) {
          return h(
            View,
            { key: c.id, style: { gap: 6 } },
            h(
              View,
              { style: styles.spaceBetween },
              h(Text, { style: styles.small }, c.name),
              h(Text, { style: styles.small }, c.health + "%"),
            ),
            h(Progress, { value: c.health }),
          );
        }),
      ),
    );
  };
  // @end:DatosScreen

  // @section:PerfilScreen @depends:[shared-components]
  var PerfilScreen = function () {
    var app = useApp();
    return h(
      ScreenScroll,
      null,
      h(Text, { style: [styles.h1, { marginBottom: 16 }] }, "Perfil"),
      h(
        View,
        { style: [styles.weather, { gap: 14 }] },
        h(
          View,
          {
            style: [styles.avatar, { width: 56, height: 56, borderRadius: 28 }],
          },
          h(Icon, { name: "person", size: 30, color: C.bg }),
        ),
        h(
          View,
          { style: { flex: 1 } },
          h(Text, { style: styles.rowTitle }, app.user),
          h(Text, { style: styles.small }, "Productor · El Valle, Jalisco"),
        ),
      ),
      h(
        View,
        { style: { marginTop: 24 } },
        h(PrimaryButton, { label: "Cerrar sesión", onPress: app.logout }),
      ),
    );
  };
  // @end:PerfilScreen

  // @section:styles @depends:[theme]
  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    brand: {
      color: C.text,
      fontWeight: "700",
      fontFamily: SERIF,
      marginTop: 4,
    },
    h1: { color: C.text, fontSize: 26, fontWeight: "700", marginBottom: 4 },
    h2: { color: C.text, fontSize: 18, fontWeight: "700" },
    muted: { color: C.muted, fontSize: 14, textAlign: "center" },
    small: { color: C.muted, fontSize: 13, lineHeight: 18 },
    link: { color: C.primary, fontSize: 13, fontWeight: "600" },
    error: { color: C.danger, fontSize: 13, marginTop: 12 },
    rowTitle: { color: C.text, fontSize: 16, fontWeight: "700" },
    value: { color: C.text, fontSize: 15, fontWeight: "700" },
    rowH: { flexDirection: "row", alignItems: "center", gap: 12 },
    spaceBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 52,
    },
    input: { flex: 1, color: C.text, fontSize: 15, height: "100%" },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
    },
    box: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: C.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    btn: {
      backgroundColor: C.primary,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    social: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    segment: {
      flexDirection: "row",
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: C.border,
    },
    segItem: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    weather: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.card,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: C.border,
    },
    temp: { color: C.text, fontSize: 34, fontWeight: "700", fontFamily: SERIF },
    stat: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 14,
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: C.border,
    },
    statNum: {
      color: C.text,
      fontSize: 24,
      fontWeight: "700",
      fontFamily: SERIF,
    },
    cropCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: C.border,
    },
    cropThumb: {
      width: 52,
      height: 52,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: C.card2,
      overflow: "hidden",
    },
    fill: { height: 6, borderRadius: 3 },
    addBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    map: {
      height: 320,
      marginTop: 12,
      borderRadius: 18,
      backgroundColor: "#0F2B1B",
      borderWidth: 1,
      borderColor: C.border,
      overflow: "hidden",
    },
    selCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 12,
      marginTop: -16,
      marginHorizontal: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    layerBtn: {
      position: "absolute",
      top: 60,
      right: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    mapWarn: {
      position: "absolute",
      left: 12,
      right: 60,
      bottom: 12,
      padding: 10,
      borderRadius: 12,
      backgroundColor: "rgba(7,20,14,0.92)",
    },
    chip: {
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      alignItems: "center",
      justifyContent: "center",
    },
    calcBox: {
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 16,
      gap: 4,
      borderWidth: 1,
      borderColor: C.border,
    },
    locBtn: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.gold,
      alignItems: "center",
      justifyContent: "center",
    },
  });
  // @end:styles

  // @section:TabNavigator @depends:[InicioScreen,TerrenosScreen,CultivosScreen,DatosScreen,PerfilScreen]
  var Tab = createBottomTabNavigator();
  var TabNavigator = function () {
    var insets = useSafeAreaInsets();
    var tabs = [
      ["Inicio", InicioScreen, "home"],
      ["Terrenos", TerrenosScreen, "map"],
      ["Cultivos", CultivosScreen, "leaf"],
      ["Datos", DatosScreen, "stats-chart"],
      ["Perfil", PerfilScreen, "person"],
    ];
    return h(
      View,
      { style: { flex: 1, width: "100%", height: "100%", overflow: "hidden" } },
      h(
        Tab.Navigator,
        {
          screenOptions: {
            headerShown: false,
            tabBarActiveTintColor: C.primary,
            tabBarInactiveTintColor: C.muted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            tabBarStyle: {
              position: "absolute",
              bottom: 0,
              height: Platform.OS === "web" ? TAB_H : TAB_H + insets.bottom,
              borderTopWidth: 1,
              borderTopColor: C.border,
              backgroundColor: C.card,
            },
          },
        },
        tabs.map(function (t) {
          return h(Tab.Screen, {
            key: t[0],
            name: t[0],
            component: t[1],
            options: {
              tabBarIcon: function (i) {
                return h(Ionicons, {
                  name: i.focused ? t[2] : t[2] + "-outline",
                  size: 24,
                  color: i.color,
                });
              },
            },
          });
        }),
      ),
    );
  };
  // @end:TabNavigator

  // @section:return @depends:[WelcomeScreen,LoginScreen,RegisterScreen,TabNavigator]
  var screenState = React.useState("welcome");
  var userState = React.useState("Alex");
  var parcelsState = React.useState([]);
  var go = screenState[1];
  // Convierte un terreno de la base de datos al formato de la app.
  var fromDb = function (t) {
    return {
      id: t.id,
      name: t.nombre,
      area: t.area_ha || 0,
      crop: t.cultivo || "Sin cultivo",
      health: t.salud || "Buena",
      lat: t.latitud,
      lng: t.longitud,
    };
  };
  var loadParcels = async function () {
    var r = await supabase
      .from("terrenos")
      .select("*")
      .order("creado_en", { ascending: true });
    if (!r.error) parcelsState[1](r.data.map(fromDb));
  };
  // Al abrir la app: si hay una sesión guardada, entra directo
  // (a menos que el usuario no haya marcado "Recuérdame").
  React.useEffect(function () {
    (async function () {
      try {
        var r = await supabase.auth.getSession();
        var remember = await AsyncStorage.getItem("ty_remember");
        if (r.data.session && remember === "0") {
          await supabase.auth.signOut();
          return;
        }
        if (r.data.session) {
          userState[1](cap(nombreDe(r.data.session.user)));
          loadParcels();
          go("app");
        }
      } catch (e) {}
    })();
    // Si la sesión se cierra o caduca, regresa al login.
    var sub = supabase.auth.onAuthStateChange(function (event) {
      if (event === "SIGNED_OUT") {
        parcelsState[1]([]);
        go("login");
      }
    });
    return function () {
      sub.data.subscription.unsubscribe();
    };
  }, []);
  var onAuth = function (name, remember) {
    AsyncStorage.setItem("ty_remember", remember ? "1" : "0").catch(
      function () {},
    );
    loadParcels();
    userState[1](cap(name));
    go("app");
  };
  // Inicio de sesión con Google: abre el navegador, el usuario elige su cuenta
  // y Supabase regresa a la app con un código (o tokens) en la URL.
  var signInWithGoogle = async function () {
    var WebBrowser = require("expo-web-browser");
    var ExpoLinking = require("expo-linking");
    var redirectTo = ExpoLinking.createURL("auth-callback");
    var r = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo, skipBrowserRedirect: true },
    });
    if (r.error) throw new Error(traducir(r.error.message));
    var res = await WebBrowser.openAuthSessionAsync(r.data.url, redirectTo);
    if (res.type !== "success") return; // el usuario cerró la ventana
    var q = parseParams(res.url);
    var ses;
    if (q.code) {
      ses = await supabase.auth.exchangeCodeForSession(q.code);
    } else if (q.access_token) {
      ses = await supabase.auth.setSession({
        access_token: q.access_token,
        refresh_token: q.refresh_token,
      });
    } else {
      throw new Error(
        q.error_description ||
          "No se pudo completar el inicio de sesión con Google.",
      );
    }
    if (ses.error) throw new Error(traducir(ses.error.message));
    onAuth(nombreDe(ses.data.user), true);
  };
  var ctx = {
    user: userState[0],
    parcels: parcelsState[0],
    setParcels: parcelsState[1],
    saveParcel: async function (t) {
      var r = await supabase
        .from("terrenos")
        .insert({
          nombre: t.name,
          latitud: t.lat,
          longitud: t.lng,
          area_ha: t.area,
          cultivo: t.crop,
        })
        .select()
        .single();
      if (r.error) throw new Error(traducir(r.error.message));
      return fromDb(r.data);
    },
    updateParcel: async function (id, f) {
      var r = await supabase
        .from("terrenos")
        .update({ nombre: f.name, area_ha: f.area, cultivo: f.crop })
        .eq("id", id)
        .select()
        .single();
      if (r.error) throw new Error(traducir(r.error.message));
      var upd = fromDb(r.data);
      parcelsState[1](function (list) {
        return list.map(function (x) {
          return x.id === id ? upd : x;
        });
      });
    },
    deleteParcel: async function (id) {
      var r = await supabase.from("terrenos").delete().eq("id", id);
      if (r.error) throw new Error(traducir(r.error.message));
      parcelsState[1](function (list) {
        return list.filter(function (x) {
          return x.id !== id;
        });
      });
    },
    logout: async function () {
      await supabase.auth.signOut();
      parcelsState[1]([]);
      go("login");
    },
  };
  var content =
    screenState[0] === "welcome"
      ? h(WelcomeScreen, { go: go })
      : screenState[0] === "login"
        ? h(LoginScreen, { go: go, onAuth: onAuth, onGoogle: signInWithGoogle })
        : screenState[0] === "register"
          ? h(RegisterScreen, { go: go, onAuth: onAuth })
          : h(TabNavigator);
  return h(AppContext.Provider, { value: ctx }, content);
  // @end:return
}
