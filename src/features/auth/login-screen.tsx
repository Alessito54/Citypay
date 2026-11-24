import { type ComponentRef, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Illustration, Wordmark } from '@/components/brand';
import { Icon } from '@/components/icon';
import { Button, FieldMessage, inputText } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';

import { AuthField, TextLink } from './auth-field';
import { AUTH_COPY, validateAuth, type AuthErrors, type AuthMode } from './auth-rules';
import { useAuth } from './auth-context';
import { LoginBackground } from './login-background';

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passRef = useRef<ComponentRef<typeof TextInput>>(null);
  const copy = AUTH_COPY[mode];

  const switchMode = (m: AuthMode) => {
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setMode(m);
    AccessibilityInfo.announceForAccessibility(AUTH_COPY[m].title);
  };

  const clearField = (k: keyof AuthErrors) => fieldErrors[k] && setFieldErrors((f) => ({ ...f, [k]: undefined }));

  const submit = async () => {
    setError(null);
    setInfo(null);
    const e = validateAuth(mode, name, email, password);
    setFieldErrors(e);
    const first = e.name ?? e.email ?? e.password;
    if (first) {
      AccessibilityInfo.announceForAccessibility(first);
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
        setInfo('Si existe una cuenta con ese correo, te enviamos instrucciones. Revisa también la carpeta de spam.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.root}>
      <LoginBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingTop: insets.top + 28, paddingBottom: 150 + insets.bottom }]}>
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

          <View style={s.form}>
            {mode === 'register' ? (
              <AuthField label="Nombre completo" icon="user" error={fieldErrors.name}>
                <TextInput
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    clearField('name');
                  }}
                  accessibilityLabel="Nombre completo"
                  placeholder="Ej. María López"
                  placeholderTextColor={C.text3}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={inputText}
                />
              </AuthField>
            ) : null}

            <AuthField label="Correo electrónico" icon="mail" error={fieldErrors.email}>
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearField('email');
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
                style={inputText}
              />
            </AuthField>

            {mode !== 'forgot' ? (
              <AuthField label="Contraseña" icon="lock" error={fieldErrors.password}>
                <TextInput
                  ref={passRef}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    clearField('password');
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
                  style={inputText}
                />
                <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setShow((v) => !v)} style={s.eye}>
                  <Icon name={show ? 'eyeOff' : 'eye'} size={20} color={C.text2} />
                </Pressable>
              </AuthField>
            ) : null}

            {mode === 'login' ? <TextLink label="¿Olvidaste tu contraseña?" onPress={() => switchMode('forgot')} align="flex-end" /> : null}

            <FieldMessage text={error} tone="error" />
            <FieldMessage text={info} tone="success" />

            <Button label={busy ? 'Procesando…' : copy.cta} accessibilityLabel={copy.cta} loading={busy} onPress={submit} />

            {mode === 'forgot' ? <TextLink label="Volver a iniciar sesión" onPress={() => switchMode('login')} align="center" /> : null}
          </View>

          {mode !== 'forgot' ? (
            <View style={s.signupRow}>
              <Text style={s.signup}>{mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</Text>
              <TextLink label={mode === 'login' ? 'Crear una cuenta' : 'Iniciar sesión'} bold onPress={() => switchMode(mode === 'login' ? 'register' : 'login')} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' },
  content: { paddingHorizontal: 24, alignItems: 'center', flexGrow: 1 },
  tagline: { fontFamily: FONT.sansBold, fontSize: 12, letterSpacing: 0.9, color: C.navy, marginTop: 6 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 24, color: C.navy, marginTop: 20 },
  sub: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text2, marginTop: 4, textAlign: 'center', lineHeight: 20 },
  form: { width: '100%', gap: 14, marginTop: 18 },
  eye: { width: TOUCH + 4, height: 48, alignItems: 'center', justifyContent: 'center' },
  signupRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', columnGap: 6, marginTop: 18 },
  signup: { fontFamily: FONT.sans, fontSize: 14, color: C.text2 },
});
