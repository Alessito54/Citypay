import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { C, FONT } from '@/constants/colors';
import type { Status, Transaction } from '@/types';

import { fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';

/**
 * Status styles. The original three statuses were all light blues, so "Diferencia"
 * did not stand out. Each one now has its own hue plus a symbol and text, so the
 * meaning never depends on color alone. All pairs are ≥ 4.5:1.
 */
export const STATUS_CFG = {
  conciliado: { label: 'Cuadrado', bg: C.successSoft, text: C.success, sym: '✓' },
  discrepancia: { label: 'Diferencia', bg: C.dangerSoft, text: C.danger, sym: '!' },
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
  const estado: Status = resolved ? 'conciliado' : tx.estado;
  const banco = tx.montoBanco === 0 ? 'sin acreditar' : fmtMoney(tx.montoBanco);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${SERVICE_LABEL[tx.servicio]}, folio ${tx.folio}. Sistema ${fmtMoney(tx.montoSistema)}, banco ${banco}. Estado: ${STATUS_CFG[estado].label}.`}
      accessibilityHint="Abre el detalle del pago"
      onPress={onPress}
      style={({ pressed }) => [s.row, !last && s.rowDivider, pressed && { backgroundColor: C.blueSoft }]}>
      <View style={s.icon}>
        <Text style={{ fontSize: 18 }}>{SERVICE_ICON[tx.servicio]}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.title}>
          {SERVICE_LABEL[tx.servicio]}
        </Text>
        <Text numberOfLines={1} style={s.folio}>
          {tx.folio}
        </Text>
        <Text numberOfLines={1} style={s.sub}>
          Banco: {tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={s.amount}>{fmtMoney(tx.montoSistema)}</Text>
        <StatusPill estado={estado} />
      </View>
      <Icon name="chevronRight" size={14} color={C.text3} strokeWidth={2.5} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  pillText: { fontFamily: FONT.sansBold, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  folio: { fontFamily: FONT.mono, fontSize: 12.5, color: C.text1, marginTop: 1 },
  sub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 1 },
  amount: { fontFamily: FONT.monoMedium, fontSize: 13.5, color: C.text1 },
});
