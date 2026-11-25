import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';
import type { Status, Transaction } from '@/types';

import { fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';

/** Each status has its own hue plus a symbol and text, so meaning never depends on color alone. */
export const STATUS_CFG = {
  conciliado: { label: 'Cuadrado', bg: C.successSoft, text: C.success, sym: '✓' },
  discrepancia: { label: 'Diferencia', bg: C.dangerSoft, text: C.danger, sym: '!' },
  pendiente: { label: 'Pendiente', bg: C.blueChip, text: C.blueChipText, sym: '…' },
} as const;

export function StatusPill({ estado }: { estado: Status }) {
  const { colors } = useTheme();
  const map = {
    conciliado: { label: 'Cuadrado', bg: colors.successSoft, text: colors.success, sym: '✓' },
    discrepancia: { label: 'Diferencia', bg: colors.dangerSoft, text: colors.danger, sym: '!' },
    pendiente: { label: 'Pendiente', bg: colors.blueChip, text: colors.blueChipText, sym: '…' },
  } as const;
  const c = map[estado];
  return <Badge label={c.label} symbol={c.sym} bg={c.bg} fg={c.text} />;
}

export const bankAmountLabel = (tx: Transaction) => (tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco));

export function TransactionRow({ tx, last, onPress }: { tx: Transaction; last: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${SERVICE_LABEL[tx.servicio]}, folio ${tx.folio}. Sistema ${fmtMoney(tx.montoSistema)}, banco ${bankAmountLabel(tx)}. Estado: ${STATUS_CFG[tx.estado].label}.`}
      accessibilityHint="Abre el detalle del pago"
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        { backgroundColor: colors.white },
        !last && { borderBottomWidth: 1, borderBottomColor: colors.divider },
        pressed && { backgroundColor: colors.blueSoft },
      ]}>
      <View
        style={[s.icon, { backgroundColor: colors.blueIcon }]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden>
        <Text style={{ fontSize: 18 }}>{SERVICE_ICON[tx.servicio]}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[s.title, { color: colors.text1 }]}>
          {SERVICE_LABEL[tx.servicio]}
        </Text>
        <Text numberOfLines={1} style={[s.folio, { color: colors.text1 }]}>
          {tx.folio}
        </Text>
        <Text numberOfLines={1} style={[s.sub, { color: colors.text3 }]}>
          Banco: {bankAmountLabel(tx)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[s.amount, { color: colors.text1 }]}>{fmtMoney(tx.montoSistema)}</Text>
        <StatusPill estado={tx.estado} />
      </View>
      <Icon name="chevronRight" size={14} color={colors.text3} strokeWidth={2.5} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
  icon: { width: 40, height: 40, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.sansBold, fontSize: 14.5 },
  folio: { fontFamily: FONT.mono, fontSize: 12.5, marginTop: 1 },
  sub: { fontFamily: FONT.sans, fontSize: 12.5, marginTop: 1 },
  amount: { fontFamily: FONT.monoMedium, fontSize: 13.5 },
});
