import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Illustration, Wordmark } from '@/components/brand';
import { FONT } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

/**
 * Animación de entrada rápida (< 1 segundo) con el logo de CityPay centrado al abrir la app.
 */
export function SplashIntro() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const [logoScale] = useState(() => new Animated.Value(0.84));
  const [logoOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 110,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(340),
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1.06,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    seq.start(() => setVisible(false));
    return () => seq.stop();
  }, [logoOpacity, logoScale, overlayOpacity]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.overlay,
        {
          backgroundColor: colors.bg,
          opacity: overlayOpacity,
        },
      ]}>
      <Animated.View
        style={[
          s.center,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}>
        <View style={[s.badge, { backgroundColor: colors.white, borderColor: colors.border }]}>
          <Illustration size={74} />
        </View>
        <Wordmark fontSize={30} />
        <Text style={[s.tagline, { color: colors.text2 }]}>Tu municipio, en un solo lugar</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 108,
    height: 108,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontFamily: FONT.sansSemi,
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
