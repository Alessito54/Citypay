import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Illustration, Wordmark } from '@/components/brand';
import { C, FONT } from '@/constants/colors';

/** Splash/loading screen. Calls onDone after `delay` ms (mockup: 2800). */
export function LoadingScreen({ onDone, delay = 2800 }: { onDone?: () => void; delay?: number }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, delay);
    return () => clearTimeout(t);
  }, [onDone, delay]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.root}>
      <Illustration size={72} />
      <View style={{ marginTop: 4 }}>
        <Wordmark fontSize={34} />
      </View>
      <Animated.View accessibilityRole="progressbar" accessibilityLabel="Cargando" style={[s.spinner, { transform: [{ rotate }] }]} />
      <Text style={s.title}>Procesando tu solicitud...</Text>
      <Text style={s.sub}>Esto solo tomará unos segundos.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  spinner: { width: 44, height: 44, borderRadius: 22, borderWidth: 5, borderColor: C.blueIcon, borderTopColor: C.blue, marginTop: 44 },
  title: { fontFamily: FONT.sansBold, fontSize: 13, color: C.navy, marginTop: 18 },
  sub: { fontFamily: FONT.sans, fontSize: 11, color: C.text2, marginTop: 3 },
});
