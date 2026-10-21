import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, FONT } from '@/constants/colors';
import type { Status, Transaction } from '@/types';

import { fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';

export const STATUS_CFG = {
  conciliado: { label: 'Cuadrado', bg: C.blueSoft, text: C.blue, sym: '✓' },
  discrepancia: { label: 'Diferencia', bg: C.blueIcon, text: C.blueMid, sym: '!' },
  pendiente: { label: 'Pendiente', bg: C.blueChip, text: C.blueChipText, sym: '…' },
} as const;

export function StatusPill({ estado }: { estado: Status }) {
  const c = STATUS_CFG[estado];
  return (
    <View style={[s.pill, { backgroundColor: c.bg }]}>
      <Text style={[s.pillText, { color: c.text }]}>
        {c.sym} {c.label}
      </Text>
    </View>
  );
}

export function TransactionRow({
  tx,
  resolved,
  last,
  onPress,
}: {
  tx: Transaction;
  resolved: boolean;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.row, !last && s.rowDivider, pressed && { backgroundColor: C.blueSoft }]}>
      <View style={s.icon}>
        <Text style={{ fontSize: 17 }}>{SERVICE_ICON[tx.servicio]}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.title}>
          {SERVICE_LABEL[tx.servicio]} — {tx.folio}
        </Text>
        <Text style={s.sub}>Banco: {tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={s.amount}>{fmtMoney(tx.montoSistema)}</Text>
        <StatusPill estado={resolved ? 'conciliado' : tx.estado} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  pillText: { fontFamily: FONT.sansBold, fontSize: 10.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text1 },
  sub: { fontFamily: FONT.mono, fontSize: 11, color: C.text3, marginTop: 1 },
  amount: { fontFamily: FONT.monoMedium, fontSize: 12.5, color: C.text1 },
});
