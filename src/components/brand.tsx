import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { C, FONT } from '@/constants/colors';

export function Illustration({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M52 16A26 26 0 1 0 52 48" stroke={C.blueMid} strokeWidth={5} strokeLinecap="round" />
      <Path d="M38 50V26l8-6 8 6v24" stroke={C.navy} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      <Rect x={43} y={30} width={3} height={4} fill={C.navy} />
      <Rect x={43} y={38} width={3} height={4} fill={C.navy} />
      <Path d="M22 50V34l6-5 6 5v16" stroke={C.blueMid} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function Wordmark({ fontSize }: { fontSize: number }) {
  return (
    <Text style={{ fontFamily: FONT.displayXBold, fontSize, letterSpacing: fontSize * 0.04 }}>
      <Text style={{ color: C.navy }}>CITY</Text>
      <Text style={{ color: C.blueMid }}>PAY</Text>
    </Text>
  );
}

/** Small header logo (illustration + wordmark) used on Reports screens. */
export function HeaderLogo() {
  return (
    <View style={styles.row}>
      <Illustration size={30} />
      <Wordmark fontSize={16} />
    </View>
  );
}

/** "CITYPAY / ADMIN" logo used on the home screen header. */
export function AdminLogo() {
  return (
    <View style={styles.row}>
      <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
        <Path d="M17 1a16 16 0 1 0 0 32 16 16 0 0 0 0-32z" stroke={C.blue} strokeWidth={1.8} fill={C.white} />
        <Path d="M8 18L17 10L26 18" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x={10} y={18} width={5} height={7} rx={0.5} fill={C.blue} />
        <Rect x={19} y={18} width={5} height={7} rx={0.5} fill={C.blue} />
        <Rect x={14} y={21} width={6} height={4} rx={0.5} fill={C.white} />
      </Svg>
      <View>
        <Text style={styles.admin1}>CITYPAY</Text>
        <Text style={styles.admin2}>ADMIN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  admin1: { fontFamily: FONT.displayXBold, fontSize: 14, color: C.blue, letterSpacing: 0.56, lineHeight: 15 },
  admin2: { fontFamily: FONT.sansSemi, fontSize: 10, color: C.text3, letterSpacing: 0.54, lineHeight: 12 },
});
