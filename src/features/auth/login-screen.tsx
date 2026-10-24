import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
import { FieldMessage, PrimaryButton } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';

import { useAuth } from './auth-context';

type Mode = 'login' | 'register' | 'forgot';
type FieldErrors = { name?: string; email?: string; password?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  login: { title: '¡Bienvenido!', sub: 'Inicia sesión para continuar', cta: 'Iniciar sesión' },
  register: { title: 'Crear cuenta', sub: 'Regístrate para realizar trámites y reportes', cta: 'Crear mi cuenta' },
  forgot: { title: 'Recuperar acceso', sub: 'Escribe tu correo y te enviaremos instrucciones', cta: 'Enviar instrucciones' },
};

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);

  const switchMode = (m: Mode) => {
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setMode(m);
    AccessibilityInfo.announceForAccessibility(COPY[m].title);
  };

  /** Client-side checks so the user learns what is wrong next to the field, before any network call. */
  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (mode === 'register' && name.trim().length < 3) e.name = 'Escribe tu nombre completo.';
    if (!email.trim()) e.email = 'Escribe tu correo electrónico.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Revisa el formato del correo (ejemplo: nombre@correo.com).';
    if (mode !== 'forgot') {
      if (!password) e.password = 'Escribe tu contraseña.';
      else if (mode === 'register' && password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return e;
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    const e = validate();
    setFieldErrors(e);
    if (e.name || e.email || e.password) {
      const first = e.name ?? e.email ?? e.password;
      if (first) AccessibilityInfo.announceForAccessibility(first);
      if (e.email) emailRef.current?.focus();
      else if (e.password) passRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        onSuccess();
      } else if (mode === 'register') {
        await signUp(email.trim(), password, name.trim());
        onSuccess();
      } else {
        await sendPasswordReset(email.trim());
        setInfo('Listo. Revisa tu correo (también la carpeta de spam) para restablecer tu contraseña.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const copy = COPY[mode];

  return (
    <View style={s.root}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor={C.blueSoft} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
      </Svg>
      <View style={s.blob} pointerEvents="none" />

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
          contentContainerStyle={[s.content, { paddingTop: insets.top + 28, paddingBottom: 150 + insets.bottom }]}>
          <View accessible accessibilityLabel="CityPay. Tu municipio, en un solo lugar." style={{ alignItems: 'center' }}>
            <Illustration />
            <View style={{ marginTop: 2 }}>
              <Wordmark fontSize={44} />
            </View>
            <Text style={s.tagline}>
              TU MUNICIPIO, <Text style={{ color: C.blueMid }}>EN UN SOLO LUGAR.</Text>
            </Text>
          </View>

          <Text accessibilityRole="header" style={s.h1}>
            {copy.title}
          </Text>
          <Text style={s.sub}>{copy.sub}</Text>

          {mode === 'login' ? (
            <View style={s.presetRow}>
              <Pressable
                onPress={() => {
                  setEmail('admin@citypay.gob.mx');
                  setPassword('admin123');
                }}
                style={[s.presetPill, email === 'admin@citypay.gob.mx' && s.presetPillActive]}>
                <Text style={[s.presetText, email === 'admin@citypay.gob.mx' && s.presetTextActive]}>
                  👑 Admin (Gestión)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEmail('demo@citypay.gob.mx');
                  setPassword('demo123');
                }}
                style={[s.presetPill, email === 'demo@citypay.gob.mx' && s.presetPillActive]}>
                <Text style={[s.presetText, email === 'demo@citypay.gob.mx' && s.presetTextActive]}>
                  👤 Demo Ciudadano
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={s.form}>
            {mode === 'register' ? (
              <Field label="Nombre completo" icon="user" error={fieldErrors.name}>
                <TextInput
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: undefined }));
                  }}
                  accessibilityLabel="Nombre completo"
                  placeholder="Ej. María López"
                  placeholderTextColor={C.text3}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={s.input}
                />
              </Field>
            ) : null}

            <Field label="Correo electrónico" icon="mail" error={fieldErrors.email}>
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                }}
                accessibilityLabel="Correo electrónico"
                placeholder="nombre@correo.com"
                placeholderTextColor={C.text3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType={mode === 'forgot' ? 'send' : 'next'}
                onSubmitEditing={() => (mode === 'forgot' ? submit() : passRef.current?.focus())}
                style={s.input}
              />
            </Field>

            {mode !== 'forgot' ? (
              <Field label="Contraseña" icon="lock" error={fieldErrors.password}>
                <TextInput
                  ref={passRef}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                  }}
                  accessibilityLabel="Contraseña"
                  accessibilityHint={mode === 'register' ? 'Mínimo 6 caracteres' : undefined}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  placeholderTextColor={C.text3}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  textContentType={mode === 'register' ? 'newPassword' : 'password'}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  style={s.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onPress={() => setShow((v) => !v)}
                  style={s.eye}>
                  <Icon name={show ? 'eyeOff' : 'eye'} size={20} color={C.text2} />
                </Pressable>
              </Field>
            ) : null}

            {mode === 'login' ? (
              <TextLink label="¿Olvidaste tu contraseña?" onPress={() => switchMode('forgot')} align="flex-end" />
            ) : null}

            <FieldMessage text={error} tone="error" />
            <FieldMessage text={info} tone="success" />

            <PrimaryButton
              label={busy ? 'Procesando…' : copy.cta}
              accessibilityLabel={copy.cta}
              loading={busy}
              onPress={submit}
            />

            {mode === 'forgot' ? (
              <TextLink label="Volver a iniciar sesión" onPress={() => switchMode('login')} align="center" />
            ) : null}
          </View>

          {mode === 'login' ? (
            <>
              <View style={s.orRow} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <View style={s.line} />
                <Text style={s.orText}>o continúa con</Text>
                <View style={s.line} />
              </View>
              <View style={s.socials}>
                <SocialButton label="Google" />
                <SocialButton label="Apple" />
              </View>
            </>
          ) : null}

          {mode !== 'forgot' ? (
            <View style={s.signupRow}>
              <Text style={s.signup}>{mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</Text>
              <TextLink
                label={mode === 'login' ? 'Crear una cuenta' : 'Iniciar sesión'}
                bold
                onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: IconName;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>
      <View style={[s.field, error ? s.fieldErr : null]}>
        <Icon name={icon} size={18} color={error ? C.danger : C.blueMid} />
        {children}
      </View>
      <FieldMessage text={error} />
    </View>
  );
}

function TextLink({
  label,
  onPress,
  align,
  bold,
}: {
  label: string;
  onPress: () => void;
  align?: 'flex-end' | 'center';
  bold?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      hitSlop={6}
      style={[s.link, align ? { alignSelf: align } : null]}>
      <Text style={[s.linkText, bold && { fontFamily: FONT.sansBold }]}>{label}</Text>
    </Pressable>
  );
}

/** Social sign-in is not connected yet: shown as "Próximamente" instead of a button that fails. */
function SocialButton({ label }: { label: string }) {
  return (
    <View
      style={s.social}
      accessible
      accessibilityLabel={`Continuar con ${label}, próximamente`}
      accessibilityState={{ disabled: true }}>
      <Text style={s.socialText}>{label}</Text>
      <Text style={s.soon}>Próximamente</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' },
  blob: { position: 'absolute', top: -70, left: -60, width: 190, height: 190, borderRadius: 95, backgroundColor: C.blueIcon, opacity: 0.55 },
  skyline: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 150 },
  content: { paddingHorizontal: 24, alignItems: 'center', flexGrow: 1 },
  tagline: { fontFamily: FONT.sansBold, fontSize: 11.5, letterSpacing: 0.9, color: C.navy, marginTop: 6 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 24, color: C.navy, marginTop: 20 },
  sub: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, marginTop: 4, textAlign: 'center', lineHeight: 20 },
  form: { width: '100%', gap: 14, marginTop: 18 },
  label: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.text1 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, minHeight: 50, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder },
  fieldErr: { borderColor: C.danger, borderWidth: 1.5, backgroundColor: C.dangerSoft },
  input: { flex: 1, minWidth: 0, minHeight: 48, fontFamily: FONT.sans, fontSize: 16, color: C.text1, paddingVertical: 0, paddingRight: 14 },
  eye: { width: TOUCH + 4, height: 48, alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: TOUCH, justifyContent: 'center' },
  linkText: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
  orRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { fontFamily: FONT.sans, fontSize: 13, color: C.text2 },
  socials: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 12 },
  social: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 12, backgroundColor: C.screen, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  socialText: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.text2 },
  soon: { fontFamily: FONT.sans, fontSize: 11.5, color: C.text3 },
  signupRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', columnGap: 6, marginTop: 14 },
  signup: { fontFamily: FONT.sans, fontSize: 14, color: C.text2 },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4 },
  presetPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.border },
  presetPillActive: { backgroundColor: C.blue, borderColor: C.blue },
  presetText: { fontFamily: FONT.sansSemi, fontSize: 11, color: C.blue },
  presetTextActive: { color: '#fff' },
});
