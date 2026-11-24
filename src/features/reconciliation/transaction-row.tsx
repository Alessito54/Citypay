import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import type { Status, Transaction } from '@/types';

import { fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';

/** Each status has its own hue plus a symbol and text, so meaning never depends on color alone. */
export const STATUS_CFG = {
  conciliado: { label: 'Cuadrado', bg: C.successSoft, text: C.success, sym: '✓' },
  discrepancia: { label: 'Diferencia', bg: C.dangerSoft, text: C.danger, sym: '!' },
  pendiente: { label: 'Pendiente', bg: C.blueChip, text: C.blueChipText, sym: '…' },
} as const;

export function StatusPill({ estado }: { estado: Status }) {
  const c = STATUS_CFG[estado];
  return <Badge label={c.label} symbol={c.sym} bg={c.bg} fg={c.text} />;
}

export const bankAmountLabel = (tx: Transaction) => (tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco));

export function TransactionRow({ tx, last, onPress }: { tx: Transaction; last: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${SERVICE_LABEL[tx.servicio]}, folio ${tx.folio}. Sistema ${fmtMoney(tx.montoSistema)}, banco ${bankAmountLabel(tx)}. Estado: ${STATUS_CFG[tx.estado].label}.`}
      accessibilityHint="Abre el detalle del pago"
      onPress={onPress}
      style={({ pressed }) => [s.row, !last && s.divider, pressed && { backgroundColor: C.blueSoft }]}>
      <View style={s.icon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
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
          Banco: {bankAmountLabel(tx)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={s.amount}>{fmtMoney(tx.montoSistema)}</Text>
        <StatusPill estado={tx.estado} />
      </View>
      <Icon name="chevronRight" size={14} color={C.text3} strokeWidth={2.5} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  icon: { width: 40, height: 40, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  folio: { fontFamily: FONT.mono, fontSize: 12.5, color: C.text1, marginTop: 1 },
  sub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 1 },
  amount: { fontFamily: FONT.monoMedium, fontSize: 13.5, color: C.text1 },
});
