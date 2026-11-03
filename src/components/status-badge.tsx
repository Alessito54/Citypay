import { StyleSheet, Text, View } from 'react-native';

import { C, FONT } from '@/constants/colors';
import type { ReportEstado, ReportPrioridad } from '@/types';

export const ESTADO_STYLE: Record<ReportEstado, { bg: string; fg: string; dot: string }> = {
  Nuevo: { bg: C.blueSoft, fg: C.blue, dot: C.blue },
  'En proceso': { bg: '#FEF3C7', fg: '#92400E', dot: '#B45309' },
  Asignado: { bg: C.blueChip, fg: C.blueChipText, dot: C.blueChipText },
  Resuelto: { bg: C.successSoft, fg: C.success, dot: C.success },
};

const PRIORIDAD_STYLE: Record<ReportPrioridad, { bg: string; fg: string }> = {
  Alta: { bg: C.dangerSoft, fg: C.danger },
  Media: { bg: '#FEF3C7', fg: '#92400E' },
  Baja: { bg: C.blueSoft, fg: C.blueChipText },
};

/** Report workflow state, drawn the same way everywhere it appears. */
export function EstadoBadge({ estado }: { estado: ReportEstado }) {
  const st = ESTADO_STYLE[estado] ?? ESTADO_STYLE.Nuevo;
  return (
    <View style={[s.badge, { backgroundColor: st.bg }]}>
      <View style={[s.dot, { backgroundColor: st.dot }]} />
      <Text style={[s.text, { color: st.fg }]}>{estado}</Text>
    </View>
  );
}

export function PrioridadBadge({ prioridad }: { prioridad: ReportPrioridad }) {
  const st = PRIORIDAD_STYLE[prioridad] ?? PRIORIDAD_STYLE.Media;
  return (
    <View style={[s.badge, { backgroundColor: st.bg }]}>
      <Text style={[s.text, { color: st.fg }]}>Prioridad {prioridad.toLowerCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: FONT.sansBold, fontSize: 12 },
});
