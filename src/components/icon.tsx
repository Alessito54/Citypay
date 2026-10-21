import type { ReactNode } from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

export type IconName =
  | 'money' | 'card' | 'warn' | 'clock' | 'home' | 'chart' | 'doc' | 'user' | 'chat'
  | 'bell' | 'chevronRight' | 'chevronDown' | 'chevronLeft' | 'search' | 'mail' | 'lock'
  | 'eye' | 'eyeOff' | 'globe' | 'calendar' | 'bulb' | 'pin' | 'locate' | 'x' | 'xCircle'
  | 'camera' | 'image' | 'send' | 'file' | 'settings' | 'check' | 'logout';

const ICONS: Record<IconName, ReactNode> = {
  money: <><Line x1="12" y1="1" x2="12" y2="23" /><Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  card: <><Rect x="1" y="4" width="22" height="16" rx="2" /><Line x1="1" y1="10" x2="23" y2="10" /></>,
  warn: <><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><Line x1="12" y1="9" x2="12" y2="13" /><Line x1="12" y1="17" x2="12.01" y2="17" /></>,
  clock: <><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></>,
  home: <><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></>,
  chart: <><Line x1="18" y1="20" x2="18" y2="10" /><Line x1="12" y1="20" x2="12" y2="4" /><Line x1="6" y1="20" x2="6" y2="14" /></>,
  doc: <><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline points="14 2 14 8 20 8" /></>,
  file: <><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline points="14 2 14 8 20 8" /><Line x1="8" y1="13" x2="16" y2="13" /><Line x1="8" y1="17" x2="14" y2="17" /></>,
  user: <><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></>,
  chat: <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  bell: <><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  chevronRight: <Polyline points="9 18 15 12 9 6" />,
  chevronLeft: <Polyline points="15 18 9 12 15 6" />,
  chevronDown: <Polyline points="6 9 12 15 18 9" />,
  search: <><Circle cx="11" cy="11" r="8" /><Line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  mail: <><Rect x="3" y="5" width="18" height="14" rx="2" /><Polyline points="3 7 12 13 21 7" /></>,
  lock: <><Rect x="4" y="11" width="16" height="10" rx="2" /><Path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  eye: <><Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><Circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><Circle cx="12" cy="12" r="3" /><Line x1="3" y1="3" x2="21" y2="21" /></>,
  globe: <><Circle cx="12" cy="12" r="10" /><Line x1="2" y1="12" x2="22" y2="12" /><Path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></>,
  calendar: <><Rect x="3" y="4" width="18" height="18" rx="2" /><Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" /><Line x1="3" y1="10" x2="21" y2="10" /></>,
  bulb: <><Path d="M9 18h6" /><Path d="M10 22h4" /><Path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" /></>,
  pin: <><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" /></>,
  locate: <><Circle cx="12" cy="12" r="3" /><Circle cx="12" cy="12" r="8" /><Line x1="12" y1="1" x2="12" y2="4" /><Line x1="12" y1="20" x2="12" y2="23" /><Line x1="1" y1="12" x2="4" y2="12" /><Line x1="20" y1="12" x2="23" y2="12" /></>,
  x: <><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></>,
  xCircle: <><Circle cx="12" cy="12" r="10" /><Line x1="15" y1="9" x2="9" y2="15" /><Line x1="9" y1="9" x2="15" y2="15" /></>,
  camera: <><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" /></>,
  image: <><Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Polyline points="21 15 16 10 5 21" /></>,
  send: <><Line x1="22" y1="2" x2="11" y2="13" /><Polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  settings: <Circle cx="12" cy="12" r="3" />,
  check: <Polyline points="20 6 9 17 4 12" />,
  logout: <><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1="21" y1="12" x2="9" y2="12" /></>,
};

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, color = '#000', fill = 'none', strokeWidth = 1.8 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {ICONS[name]}
    </Svg>
  );
}
