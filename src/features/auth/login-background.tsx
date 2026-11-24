import { StyleSheet } from 'react-native';
import Svg, { Defs, G, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

import { C } from '@/constants/colors';

/** Decorative gradient, corner block and skyline behind the login form. */
export function LoginBackground() {
  return (
    <>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor={C.blueSoft} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
        <Rect x={-40} y={-40} width={150} height={150} fill={C.blueIcon} opacity={0.55} />
      </Svg>
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
    </>
  );
}

const s = StyleSheet.create({
  skyline: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 150 },
});
