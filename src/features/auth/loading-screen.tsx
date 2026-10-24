import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Illustration, Wordmark } from '@/components/brand';
import { C, FONT } from '@/constants/colors';

/**
 * Splash/loading screen shown right after signing in. Calls onDone after `delay` ms.
 *
 * The original mockup waited 2800 ms with no real work behind it, which added almost
 * three seconds to every login task. It now waits 1000 ms, and the spinner stops
 * when the system "reduce motion" setting is on.
 */
export function LoadingScreen({ onDone, delay = 1000 }: { onDone?: () => void; delay?: number }) {
  const [spin] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reduceMotion]);

  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, delay);
    return () => clearTimeout(t);
  }, [onDone, delay]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.root}>
      <View accessible accessibilityLabel="CityPay" style={{ alignItems: 'center' }}>
        <Illustration size={72} />
        <View style={{ marginTop: 4 }}>
          <Wordmark fontSize={34} />
        </View>
      </View>
      <Animated.View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[s.spinner, { transform: [{ rotate }] }]}
      />
      <View accessible accessibilityRole="progressbar" accessibilityLiveRegion="polite" accessibilityLabel="Iniciando sesión, espera un momento">
        <Text style={s.title}>Preparando tu panel…</Text>
        <Text style={s.sub}>Esto solo tomará un momento.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  spinner: { width: 44, height: 44, borderRadius: 22, borderWidth: 5, borderColor: C.blueIcon, borderTopColor: C.blue, marginTop: 44 },
  title: { fontFamily: FONT.sansBold, fontSize: 16, color: C.navy, marginTop: 18, textAlign: 'center' },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 4, textAlign: 'center' },
});
