import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, G, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

import { Illustration, Wordmark } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { notAvailable } from '@/components/not-available';
import { C, FONT } from '@/constants/colors';
import { authService } from '@/services/auth-service';

import { useAuth } from './auth-context';

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess();
      } else if (mode === 'register') {
        await signUp(email, password, name);
        onSuccess();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setInfo('Se ha enviado un correo con instrucciones para restablecer tu contraseña.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.root}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor={C.blueSoft} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
      </Svg>
      <View style={s.blob} pointerEvents="none" />
      <Pressable accessibilityRole="button" onPress={() => notAvailable('Idioma')} style={[s.lang, { top: insets.top + 12 }]}>
        <Icon name="globe" size={12} color={C.navy} />
        <Text style={s.langText}>ES</Text>
        <Icon name="chevronDown" size={9} color={C.navy} />
      </Pressable>

      <Svg viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice" style={s.skyline} pointerEvents="none">
        <G fill={C.blueIcon} opacity={0.9}>
          <Rect x={6} y={80} width={34} height={70} />
          <Rect x={44} y={58} width={28} height={92} />
          <Rect x={76} y={92} width={30} height={58} />
          <Rect x={284} y={70} width={32} height={80} />
          <Rect x={320} y={50} width={26} height={100} />
          <Rect x={350} y={86} width={40} height={64} />
          <Rect x={120} y={108} width={150} height={42} />
          <Polygon points="115,108 195,76 275,108" />
          <Rect x={132} y={112} width={12} height={38} fill="#fff" opacity={0.7} />
          <Rect x={156} y={112} width={12} height={38} fill="#fff" opacity={0.7} />
          <Rect x={222} y={112} width={12} height={38} fill="#fff" opacity={0.7} />
          <Rect x={246} y={112} width={12} height={38} fill="#fff" opacity={0.7} />
        </G>
        <Rect x={0} y={140} width={390} height={10} fill="#C3D6F5" />
      </Svg>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.content, { paddingTop: insets.top + 34, paddingBottom: 150 + insets.bottom }]}>
          <Illustration />
          <View style={{ marginTop: 2 }}>
            <Wordmark fontSize={44} />
          </View>
          <Text style={s.tagline}>
            TU MUNICIPIO, <Text style={{ color: C.blueMid }}>EN UN SOLO LUGAR.</Text>
          </Text>

          <Text style={s.h1}>
            {mode === 'login' ? '¡Bienvenido!' : mode === 'register' ? 'Crear cuenta' : 'Recuperar acceso'}
          </Text>
          <Text style={s.sub}>
            {mode === 'login'
              ? 'Inicia sesión para continuar'
              : mode === 'register'
              ? 'Regístrate para realizar trámites y reportes'
              : 'Ingresa tu correo para recibir las instrucciones'}
          </Text>

          <View style={s.form}>
            {mode === 'register' ? (
              <Field icon="user">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre completo"
                  placeholderTextColor={C.text3}
                  autoCapitalize="words"
                  style={s.input}
                />
              </Field>
            ) : null}

            <Field icon="mail">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electrónico"
                placeholderTextColor={C.text3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                style={s.input}
              />
            </Field>

            {mode !== 'forgot' ? (
              <Field icon="lock">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña"
                  placeholderTextColor={C.text3}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  onSubmitEditing={submit}
                  style={s.input}
                />
                <Pressable
                  accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onPress={() => setShow((v) => !v)}
                  hitSlop={8}>
                  <Icon name={show ? 'eyeOff' : 'eye'} size={18} color={C.text3} />
                </Pressable>
              </Field>
            ) : null}

            {mode === 'login' ? (
              <Pressable
                onPress={() => {
                  setError(null);
                  setInfo(null);
                  setMode('forgot');
                }}
                style={{ alignSelf: 'flex-end', marginTop: -4 }}>
                <Text style={s.forgot}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            ) : null}

            {error ? <Text style={s.error}>{error}</Text> : null}
            {info ? <Text style={s.infoText}>{info}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={submit}
              style={({ pressed }) => [s.submit, pressed && { opacity: 0.85 }]}>
              <Text style={s.submitText}>
                {busy
                  ? 'PROCESANDO…'
                  : mode === 'login'
                  ? 'INGRESAR'
                  : mode === 'register'
                  ? 'REGISTRARME'
                  : 'ENVIAR CORREO'}
              </Text>
            </Pressable>

            {mode === 'forgot' ? (
              <Pressable
                onPress={() => {
                  setError(null);
                  setInfo(null);
                  setMode('login');
                }}
                style={{ alignSelf: 'center', marginTop: 4 }}>
                <Text style={s.forgot}>Volver a inicio de sesión</Text>
              </Pressable>
            ) : null}
          </View>

          {mode === 'login' ? (
            <>
              <View style={s.orRow}>
                <View style={s.line} />
                <Text style={s.orText}>o continúa con</Text>
                <View style={s.line} />
              </View>
              <View style={s.socials}>
                <Pressable accessibilityRole="button" onPress={() => notAvailable('Google')} style={s.social}>
                  <Text style={{ fontFamily: FONT.displayXBold, fontSize: 16, color: C.blueMid }}>G</Text>
                  <Text style={s.socialText}>Google</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => notAvailable('Apple')} style={s.social}>
                  <Text style={{ fontSize: 16, color: C.text1 }}></Text>
                  <Text style={s.socialText}>Apple</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {mode === 'login' ? (
            <Text style={s.signup}>
              ¿No tienes cuenta?{' '}
              <Text
                onPress={() => {
                  setError(null);
                  setInfo(null);
                  setMode('register');
                }}
                style={{ fontFamily: FONT.sansBold, color: C.blueMid }}>
                Crea una aquí
              </Text>
            </Text>
          ) : mode === 'register' ? (
            <Text style={s.signup}>
              ¿Ya tienes cuenta?{' '}
              <Text
                onPress={() => {
                  setError(null);
                  setInfo(null);
                  setMode('login');
                }}
                style={{ fontFamily: FONT.sansBold, color: C.blueMid }}>
                Inicia sesión aquí
              </Text>
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Icon name={icon} size={18} color={C.blueMid} />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' },
  blob: { position: 'absolute', top: -70, left: -60, width: 190, height: 190, borderRadius: 95, backgroundColor: C.blueIcon, opacity: 0.55 },
  lang: { position: 'absolute', right: 16, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
  langText: { fontFamily: FONT.sansSemi, fontSize: 10.5, color: C.navy },
  skyline: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 150 },
  content: { paddingHorizontal: 26, alignItems: 'center', flexGrow: 1 },
  tagline: { fontFamily: FONT.sansBold, fontSize: 9.5, letterSpacing: 0.95, color: C.navy, marginTop: 6 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 20, color: C.navy, marginTop: 18 },
  sub: { fontFamily: FONT.sans, fontSize: 12, color: C.text2, marginTop: 2, textAlign: 'center' },
  form: { width: '100%', gap: 12, marginTop: 16 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 46, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  input: { flex: 1, minWidth: 0, fontFamily: FONT.sans, fontSize: 13, color: C.text1, paddingVertical: 0 },
  forgot: { fontFamily: FONT.sansSemi, fontSize: 11, color: C.blueMid },
  error: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.danger },
  infoText: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue, textAlign: 'center' },
  submit: { height: 46, borderRadius: 10, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', shadowColor: C.blue, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  submitText: { fontFamily: FONT.sansBold, fontSize: 13, letterSpacing: 1.3, color: '#fff' },
  demo: { fontFamily: FONT.sans, fontSize: 10.5, color: C.text2, textAlign: 'center' },
  orRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { fontFamily: FONT.sans, fontSize: 10.5, color: C.text3 },
  socials: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 12 },
  social: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  socialText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
  signup: { fontFamily: FONT.sans, fontSize: 11, color: C.text2, marginTop: 16 },
});
