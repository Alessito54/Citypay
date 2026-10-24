import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { notAvailable } from '@/components/not-available';
import { C, FONT, TOUCH } from '@/constants/colors';

import { ForceReconcileForm } from './force-reconcile-form';
import { fmtDate, fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';
import { useReconciliation } from './reconciliation-context';
import { StatusPill } from './transaction-row';

/**
 * Hosts both the detail bottom sheet and the force-reconcile sheet in a single
 * Modal (nested Modals are unreliable on iOS). Mount once inside the tabs layout.
 */
export function TransactionReviewHost() {
  const { selected, phase, close, cancelForce } = useReconciliation();
  if (!selected || phase === 'closed') return null;
  const dismiss = phase === 'force' ? cancelForce : close;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={s.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel={phase === 'force' ? 'Cancelar y volver al detalle' : 'Cerrar detalle'}
        />
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
  const estado = resolved ? 'conciliado' : tx.estado;

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Servicio', value: SERVICE_LABEL[tx.servicio] },
    { label: 'Método de pago', value: tx.metodoPago },
    { label: 'Institución bancaria', value: tx.banco },
    { label: 'Referencia bancaria', value: tx.referenciaBancaria, mono: true },
    { label: 'Monto banco', value: tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco), mono: true },
  ];

  return (
    <View style={s.sheet} accessibilityViewIsModal>
      <View style={s.handle} />
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={s.title}>
            Detalle del pago
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Text style={s.folio}>{tx.folio}</Text>
            <StatusPill estado={estado} />
          </View>
        </View>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Cerrar detalle" style={s.closeBtn}>
          <View style={s.closeCircle}>
            <Icon name="x" size={16} color={C.text1} strokeWidth={2.4} />
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.body}>
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

        {isDiscrepancy ? (
          <View style={s.diffBox}>
            <View style={s.diffHead}>
              <Icon name="warn" size={16} color={C.danger} strokeWidth={2.2} />
              <Text accessibilityRole="header" style={s.diffHeadText}>
                Diferencia detectada
              </Text>
            </View>
            <View style={s.diffGrid}>
              <View
                style={[s.diffCell, { borderRightWidth: 1, borderRightColor: C.border }]}
                accessible
                accessibilityLabel={`Registrado en la app: ${fmtMoney(tx.montoSistema)}`}>
                <Text style={s.diffLabel}>Registrado en app</Text>
                <Text style={[s.diffAmount, { color: C.text1 }]}>{fmtMoney(tx.montoSistema)}</Text>
                <Text style={s.diffSub}>Sistema CityPay</Text>
              </View>
              <View
                style={s.diffCell}
                accessible
                accessibilityLabel={`Reportado por el banco ${tx.banco}: ${tx.montoBanco === 0 ? 'sin acreditar' : fmtMoney(tx.montoBanco)}`}>
                <Text style={s.diffLabel}>Reportado por banco</Text>
                <Text style={[s.diffAmount, { color: C.blue }]}>
                  {tx.montoBanco === 0 ? 'Sin acreditar' : fmtMoney(tx.montoBanco)}
                </Text>
                <Text style={s.diffSub}>{tx.banco}</Text>
              </View>
            </View>
            <View style={s.diffNet} accessible accessibilityLabel={`Diferencia neta: ${fmtMoney(diff)}`}>
              <Text style={{ fontFamily: FONT.sans, fontSize: 13.5, color: C.text2 }}>Diferencia neta</Text>
              <Text style={{ fontFamily: FONT.monoMedium, fontSize: 15, color: C.danger }}>
                {diff > 0 ? '+' : ''}
                {fmtMoney(diff)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={s.infoBox}>
          {rows.map((row, i) => (
            <View
              key={row.label}
              accessible
              accessibilityLabel={`${row.label}: ${row.value}`}
              style={[s.infoRow, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={[s.infoValue, row.mono && { fontFamily: FONT.monoMedium }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {resolved ? (
        <View style={[s.doneBar, { paddingBottom: 20 + insets.bottom }]} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="check" size={18} color={C.success} strokeWidth={2.6} />
            <Text style={s.doneText}>Pago conciliado manualmente</Text>
          </View>
          <Text style={s.doneSub}>Quedó registrado en el historial de auditoría (demostración local).</Text>
          <Pressable accessibilityRole="button" onPress={close} style={[s.btn, s.btnOutline, { marginTop: 12 }]}>
            <Text style={[s.btnText, { color: C.blue }]}>Listo</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[s.actions, { paddingBottom: 20 + insets.bottom }]}>
          {isDiscrepancy ? (
            <Text style={s.actionsHint}>¿El banco ya confirmó el pago? Puedes conciliarlo manualmente.</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Abre un formulario para justificar la conciliación"
            onPress={startForce}
            style={({ pressed }) => [s.btn, { backgroundColor: C.blue }, pressed && { opacity: 0.85 }]}>
            <Text style={[s.btnText, { color: '#fff' }]}>Conciliar manualmente</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Avisa al ciudadano que su pago tuvo un problema"
            onPress={() => notAvailable('Notificar falla al ciudadano')}
            style={({ pressed }) => [s.btn, s.btnOutline, pressed && { backgroundColor: C.blueSoft }]}>
            <Text style={[s.btnText, { color: C.blue }]}>Notificar falla al ciudadano</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 12, marginBottom: 4 },
  head: { paddingLeft: 18, paddingRight: 8, paddingTop: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.screen, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: FONT.displayXBold, fontSize: 19, color: C.text1 },
  folio: { fontFamily: FONT.mono, fontSize: 13, color: C.text3 },
  closeBtn: { width: TOUCH + 4, height: TOUCH + 4, alignItems: 'center', justifyContent: 'center' },
  closeCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.screen, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, gap: 14 },
  concept: { backgroundColor: C.blueSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  conceptIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  conceptTitle: { fontFamily: FONT.sansBold, fontSize: 15, color: C.text1, lineHeight: 19 },
  conceptSub: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 3 },
  conceptDate: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 2 },
  conceptAmount: { fontFamily: FONT.displayXBold, fontSize: 17, color: C.blue },
  mxn: { fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  diffBox: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#FECACA' },
  diffHead: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffHeadText: { fontFamily: FONT.sansBold, fontSize: 14, color: C.danger },
  diffGrid: { flexDirection: 'row', backgroundColor: '#fff' },
  diffCell: { flex: 1, padding: 14 },
  diffLabel: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.text3, marginBottom: 6 },
  diffAmount: { fontFamily: FONT.monoMedium, fontSize: 16 },
  diffSub: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 4 },
  diffNet: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.blueSoft, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoBox: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  infoLabel: { fontFamily: FONT.sans, fontSize: 14, color: C.text2 },
  infoValue: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.text1, textAlign: 'right', flexShrink: 1 },
  actions: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border, gap: 10, backgroundColor: '#fff' },
  actionsHint: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, textAlign: 'center' },
  btn: { minHeight: 50, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { borderWidth: 2, borderColor: C.blue, backgroundColor: '#fff' },
  btnText: { fontFamily: FONT.sansBold, fontSize: 15.5 },
  doneBar: { paddingTop: 16, paddingHorizontal: 18, backgroundColor: C.successSoft, borderTopWidth: 1, borderTopColor: '#BBF7D0' },
  doneText: { textAlign: 'center', fontFamily: FONT.sansBold, fontSize: 15.5, color: C.success },
  doneSub: { textAlign: 'center', fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 4 },
});
