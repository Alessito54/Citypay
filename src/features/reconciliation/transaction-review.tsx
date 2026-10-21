import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { notAvailable } from '@/components/not-available';
import { C, FONT } from '@/constants/colors';

import { ForceReconcileForm } from './force-reconcile-form';
import { fmtDate, fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';
import { useReconciliation } from './reconciliation-context';

/**
 * Hosts both the detail bottom sheet and the force-reconcile sheet in a single
 * Modal (nested Modals are unreliable on iOS). Mount once inside the tabs layout.
 */
export function TransactionReviewHost() {
  const { selected, phase, close } = useReconciliation();
  if (!selected || phase === 'closed') return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <View style={s.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Cerrar" />
        {phase === 'detail' ? <DetailSheet /> : <ForceReconcileForm />}
      </View>
    </Modal>
  );
}

function DetailSheet() {
  const { selected: tx, resolvedIds, close, startForce } = useReconciliation();
  const insets = useSafeAreaInsets();
  if (!tx) return null;
  const resolved = resolvedIds.has(tx.id);
  const diff = tx.montoBanco - tx.montoSistema;
  const isDiscrepancy = tx.estado === 'discrepancia' && !resolved;

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Servicio', value: SERVICE_LABEL[tx.servicio] },
    { label: 'Método de pago', value: tx.metodoPago },
    { label: 'Institución bancaria', value: tx.banco },
    { label: 'Referencia bancaria', value: tx.referenciaBancaria, mono: true },
    { label: 'Monto banco', value: tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco), mono: true },
  ];

  return (
    <View style={s.sheet}>
      <View style={s.handle} />
      <View style={s.head}>
        <View>
          <Text style={s.title}>Detalle del Registro</Text>
          <Text style={s.folio}>{tx.folio}</Text>
        </View>
        <Pressable onPress={close} accessibilityLabel="Cerrar" style={s.closeBtn}>
          <Text style={{ fontSize: 14, color: C.text2 }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.concept}>
          <View style={s.conceptIcon}>
            <Text style={{ fontSize: 22 }}>{SERVICE_ICON[tx.servicio]}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.conceptTitle}>{tx.concepto}</Text>
            <Text style={s.conceptSub}>{tx.ciudadano}</Text>
            <Text style={s.conceptDate}>
              Fecha: <Text style={{ color: C.blueMid, fontFamily: FONT.sansSemi }}>{fmtDate(tx.fecha)}</Text>
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.conceptAmount}>{fmtMoney(tx.montoSistema)}</Text>
            <Text style={s.mxn}>MXN</Text>
          </View>
        </View>

        {isDiscrepancy ? (
          <View style={s.diffBox}>
            <View style={s.diffHead}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={s.diffHeadText}>Diferencia detectada</Text>
            </View>
            <View style={s.diffGrid}>
              <View style={[s.diffCell, { borderRightWidth: 1, borderRightColor: C.border }]}>
                <Text style={s.diffLabel}>REGISTRADO EN APP</Text>
                <Text style={[s.diffAmount, { color: '#1a1a2e' }]}>{fmtMoney(tx.montoSistema)}</Text>
                <Text style={s.diffSub}>Sistema CityPay</Text>
              </View>
              <View style={s.diffCell}>
                <Text style={s.diffLabel}>REPORTADO POR BANCO</Text>
                <Text style={[s.diffAmount, { color: C.blueMid }]}>
                  {tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco)}
                </Text>
                <Text style={s.diffSub}>{tx.banco}</Text>
              </View>
            </View>
            <View style={s.diffNet}>
              <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.text2 }}>Diferencia neta</Text>
              <Text style={{ fontFamily: FONT.monoMedium, fontSize: 14, color: C.blue }}>
                {diff > 0 ? '+' : ''}
                {fmtMoney(diff)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={s.infoBox}>
          {rows.map((row, i) => (
            <View key={row.label} style={[s.infoRow, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={[s.infoValue, row.mono && { fontFamily: FONT.monoMedium }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {resolved ? (
        <View style={[s.doneBar, { paddingBottom: 20 + insets.bottom }]}>
          <Text style={s.doneText}>✓ Cuadrado manualmente (registro local de demostración)</Text>
        </View>
      ) : (
        <View style={[s.actions, { paddingBottom: 20 + insets.bottom }]}>
          <Pressable accessibilityRole="button" onPress={startForce} style={[s.btn, s.btnOutline]}>
            <Text style={[s.btnText, { color: C.blue }]}>⚡ Forzar Conciliación</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => notAvailable('Notificar falla')}
            style={[s.btn, { backgroundColor: C.blue }]}>
            <Text style={[s.btnText, { color: '#fff' }]}>🔔 Notificar Falla</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 14, marginBottom: 6 },
  head: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.screen, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: FONT.displayXBold, fontSize: 18, color: '#1a1a2e' },
  folio: { fontFamily: FONT.mono, fontSize: 11, color: C.text3, marginTop: 4 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.screen, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, gap: 14 },
  concept: { backgroundColor: C.blueSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  conceptIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  conceptTitle: { fontFamily: FONT.sansBold, fontSize: 14, color: '#1a1a2e', lineHeight: 17 },
  conceptSub: { fontFamily: FONT.sans, fontSize: 11.5, color: C.text2, marginTop: 3 },
  conceptDate: { fontFamily: FONT.sans, fontSize: 11, color: C.text3, marginTop: 1 },
  conceptAmount: { fontFamily: FONT.displayXBold, fontSize: 16, color: C.blue },
  mxn: { fontFamily: FONT.sans, fontSize: 10, color: C.text3 },
  diffBox: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  diffHead: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.blueIcon, flexDirection: 'row', alignItems: 'center', gap: 6 },
  diffHeadText: { fontFamily: FONT.sansBold, fontSize: 12.5, color: C.blue },
  diffGrid: { flexDirection: 'row', backgroundColor: '#fff' },
  diffCell: { flex: 1, padding: 14 },
  diffLabel: { fontFamily: FONT.sansBold, fontSize: 9.5, color: C.text3, letterSpacing: 0.6, marginBottom: 6 },
  diffAmount: { fontFamily: FONT.monoMedium, fontSize: 15 },
  diffSub: { fontFamily: FONT.sans, fontSize: 10, color: C.text3, marginTop: 4 },
  diffNet: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoBox: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  infoLabel: { fontFamily: FONT.sans, fontSize: 13, color: C.text2 },
  infoValue: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: '#1a1a2e', textAlign: 'right', flexShrink: 1 },
  actions: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border, gap: 10, backgroundColor: '#fff' },
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  btnOutline: { borderWidth: 2, borderColor: C.blue },
  btnText: { fontFamily: FONT.sansBold, fontSize: 15 },
  doneBar: { paddingTop: 16, paddingHorizontal: 18, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border },
  doneText: { textAlign: 'center', fontFamily: FONT.sansBold, fontSize: 14, color: C.blue },
});
