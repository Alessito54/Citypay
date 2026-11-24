import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button, InfoList, SheetHeader, SheetPanel, type InfoRow } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import type { Transaction } from '@/types';

import { fmtDate, fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';
import { useReconciliation } from './reconciliation-context';
import { bankAmountLabel, StatusPill } from './transaction-row';

export function TransactionDetailSheet() {
  const { selected: tx, resolvedIds, close, startForce } = useReconciliation();
  const insets = useSafeAreaInsets();
  if (!tx) return null;
  const justResolved = resolvedIds.has(tx.id);
  const canReconcile = tx.estado !== 'conciliado';

  const rows: InfoRow[] = [
    { label: 'Servicio', value: SERVICE_LABEL[tx.servicio] },
    { label: 'Método de pago', value: tx.metodoPago },
    { label: 'Institución bancaria', value: tx.banco },
    { label: 'Referencia bancaria', value: tx.referenciaBancaria, mono: true },
    { label: 'Monto banco', value: bankAmountLabel(tx), mono: true },
  ];

  return (
    <SheetPanel maxHeight="90%">
      <SheetHeader title="Detalle del pago" onClose={close} closeLabel="Cerrar detalle">
        <View style={s.meta}>
          <Text style={s.folio}>{tx.folio}</Text>
          <StatusPill estado={tx.estado} />
        </View>
      </SheetHeader>

      <ScrollView contentContainerStyle={s.body}>
        <Concept tx={tx} />
        {tx.estado === 'discrepancia' ? <Difference tx={tx} /> : null}
        <InfoList rows={rows} />
      </ScrollView>

      {justResolved ? (
        <View style={[s.done, { paddingBottom: 20 + insets.bottom }]} accessibilityLiveRegion="polite">
          <View style={s.doneRow}>
            <Icon name="check" size={18} color={C.success} strokeWidth={2.6} />
            <Text style={s.doneText}>Pago conciliado manualmente</Text>
          </View>
          <Text style={s.doneSub}>Quedó registrado en el historial de auditoría.</Text>
          <Button variant="secondary" label="Listo" onPress={close} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <View style={[s.actions, { paddingBottom: 20 + insets.bottom }]}>
          {canReconcile ? (
            <>
              <Text style={s.hint}>¿El banco ya confirmó el pago? Puedes conciliarlo manualmente.</Text>
              <Button label="Conciliar manualmente" accessibilityHint="Abre un formulario para justificar la conciliación" onPress={startForce} />
            </>
          ) : null}
          <Button variant="quiet" label="Cerrar" onPress={close} />
        </View>
      )}
    </SheetPanel>
  );
}

function Concept({ tx }: { tx: Transaction }) {
  return (
    <View
      style={s.concept}
      accessible
      accessibilityLabel={`${tx.concepto}. ${tx.ciudadano}. Fecha ${fmtDate(tx.fecha)}. Monto ${fmtMoney(tx.montoSistema)}.`}>
      <View style={s.conceptIcon}>
        <Text style={{ fontSize: 22 }}>{SERVICE_ICON[tx.servicio]}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.conceptTitle}>{tx.concepto}</Text>
        <Text style={s.conceptSub}>{tx.ciudadano}</Text>
        <Text style={s.conceptDate}>
          Fecha: <Text style={{ color: C.blue, fontFamily: FONT.sansSemi }}>{fmtDate(tx.fecha)}</Text>
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.conceptAmount}>{fmtMoney(tx.montoSistema)}</Text>
        <Text style={s.mxn}>MXN</Text>
      </View>
    </View>
  );
}

function Difference({ tx }: { tx: Transaction }) {
  const diff = tx.montoBanco - tx.montoSistema;
  return (
    <View style={s.diffBox}>
      <View style={s.diffHead}>
        <Icon name="warn" size={16} color={C.danger} strokeWidth={2.2} />
        <Text accessibilityRole="header" style={s.diffHeadText}>
          Diferencia detectada
        </Text>
      </View>
      <View style={s.diffGrid}>
        <View style={[s.diffCell, s.diffDivider]} accessible accessibilityLabel={`Registrado en la app: ${fmtMoney(tx.montoSistema)}`}>
          <Text style={s.diffLabel}>Registrado en app</Text>
          <Text style={[s.diffAmount, { color: C.text1 }]}>{fmtMoney(tx.montoSistema)}</Text>
          <Text style={s.diffSub}>Sistema CityPay</Text>
        </View>
        <View style={s.diffCell} accessible accessibilityLabel={`Reportado por el banco ${tx.banco}: ${bankAmountLabel(tx)}`}>
          <Text style={s.diffLabel}>Reportado por banco</Text>
          <Text style={[s.diffAmount, { color: C.blue }]}>{bankAmountLabel(tx)}</Text>
          <Text style={s.diffSub}>{tx.banco}</Text>
        </View>
      </View>
      <View style={s.diffNet} accessible accessibilityLabel={`Diferencia neta: ${fmtMoney(diff)}`}>
        <Text style={s.diffNetLabel}>Diferencia neta</Text>
        <Text style={s.diffNetValue}>
          {diff > 0 ? '+' : ''}
          {fmtMoney(diff)}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  folio: { fontFamily: FONT.mono, fontSize: 13, color: C.text3 },
  body: { padding: 18, gap: 14 },
  concept: { backgroundColor: C.blueSoft, borderRadius: RADIUS, padding: 14, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, borderLeftColor: C.blue, flexDirection: 'row', alignItems: 'center', gap: 12 },
  conceptIcon: { width: 46, height: 46, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  conceptTitle: { fontFamily: FONT.sansBold, fontSize: 15, color: C.text1, lineHeight: 19 },
  conceptSub: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 3 },
  conceptDate: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  conceptAmount: { fontFamily: FONT.displayXBold, fontSize: 17, color: C.blue },
  mxn: { fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  diffBox: { borderRadius: RADIUS, overflow: 'hidden', borderWidth: 1, borderColor: '#FECACA' },
  diffHead: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffHeadText: { fontFamily: FONT.sansBold, fontSize: 14, color: C.danger },
  diffGrid: { flexDirection: 'row', backgroundColor: '#fff' },
  diffCell: { flex: 1, padding: 14 },
  diffDivider: { borderRightWidth: 1, borderRightColor: C.border },
  diffLabel: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.text3, marginBottom: 6 },
  diffAmount: { fontFamily: FONT.monoMedium, fontSize: 16 },
  diffSub: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 4 },
  diffNet: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffNetLabel: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2 },
  diffNetValue: { fontFamily: FONT.monoMedium, fontSize: 15, color: C.danger },
  actions: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border, gap: 10, backgroundColor: '#fff' },
  hint: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, textAlign: 'center' },
  done: { paddingTop: 16, paddingHorizontal: 18, backgroundColor: C.successSoft, borderTopWidth: 1, borderTopColor: '#BBF7D0' },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  doneText: { textAlign: 'center', fontFamily: FONT.sansBold, fontSize: 15.5, color: C.success },
  doneSub: { textAlign: 'center', fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 4 },
});
