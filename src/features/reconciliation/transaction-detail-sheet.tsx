import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button, FieldMessage, InfoList, SheetHeader, SheetPanel, type InfoRow } from '@/components/ui';
import { FONT, RADIUS } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/features/theme/theme-context';
import { exportFormalPaymentPdf } from '@/services/pdf-receipt-service';
import type { Transaction } from '@/types';

import { fmtDate, fmtMoney, SERVICE_ICON, SERVICE_LABEL } from './format';
import { useReconciliation } from './reconciliation-context';
import { bankAmountLabel, StatusPill } from './transaction-row';

export function TransactionDetailSheet() {
  const { session, permissions } = useAuth();
  const { colors } = useTheme();
  const { selected: tx, resolvedIds, close, startForce } = useReconciliation();
  const insets = useSafeAreaInsets();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (!tx) return null;
  const justResolved = resolvedIds.has(tx.id);
  const canReconcile = tx.estado !== 'conciliado' && permissions.canReconcilePayments;
  const canExportPdf = tx.estado === 'conciliado' || justResolved;

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    setPdfError(null);
    try {
      await exportFormalPaymentPdf({
        kind: 'reconciliation',
        transaction: tx,
        issuerName: session?.displayName,
      });
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'No se pudo generar el documento PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const rows: InfoRow[] = [
    { label: 'Servicio', value: SERVICE_LABEL[tx.servicio] },
    { label: 'Método de pago', value: tx.metodoPago },
    { label: 'Institución bancaria', value: tx.banco },
    { label: 'Referencia bancaria', value: tx.referenciaBancaria, mono: true },
    { label: 'Monto banco', value: bankAmountLabel(tx), mono: true },
    ...(tx.reconciliationReason ? [{ label: 'Dictamen / Póliza', value: tx.reconciliationReason }] : []),
    ...(tx.reconciliationNotes ? [{ label: 'Auditoría', value: tx.reconciliationNotes }] : []),
  ];

  return (
    <SheetPanel maxHeight="90%">
      <SheetHeader title="Detalle del pago" onClose={close} closeLabel="Cerrar detalle">
        <View style={s.meta}>
          <Text style={[s.folio, { color: colors.text3 }]}>{tx.folio}</Text>
          <StatusPill estado={tx.estado} />
        </View>
      </SheetHeader>

      <ScrollView contentContainerStyle={s.body}>
        <Concept tx={tx} />
        {tx.estado === 'discrepancia' ? <Difference tx={tx} /> : null}
        <InfoList rows={rows} />
      </ScrollView>

      {justResolved ? (
        <View
          style={[
            s.done,
            { paddingBottom: 20 + insets.bottom, backgroundColor: colors.successSoft, borderTopColor: colors.success },
          ]}
          accessibilityLiveRegion="polite">
          <View style={s.doneRow}>
            <Icon name="check" size={18} color={colors.success} strokeWidth={2.6} />
            <Text style={[s.doneText, { color: colors.success }]}>Pago conciliado manualmente</Text>
          </View>
          <Text style={[s.doneSub, { color: colors.text2 }]}>
            Quedó registrado en el historial de auditoría. Puedes generar su dictamen formal en PDF.
          </Text>
          <FieldMessage text={pdfError ?? undefined} />
          <View style={{ gap: 8, marginTop: 12 }}>
            <Button
              icon="download"
              label={exportingPdf ? 'Generando PDF formal…' : 'Generar dictamen oficial PDF'}
              loading={exportingPdf}
              onPress={handleDownloadPdf}
            />
            <Button variant="secondary" label="Listo" onPress={close} />
          </View>
        </View>
      ) : (
        <View
          style={[
            s.actions,
            { paddingBottom: 20 + insets.bottom, backgroundColor: colors.white, borderTopColor: colors.border },
          ]}>
          <FieldMessage text={pdfError ?? undefined} />
          {canExportPdf ? (
            <Button
              icon="download"
              label={exportingPdf ? 'Generando PDF formal…' : 'Descargar dictamen formal PDF'}
              loading={exportingPdf}
              onPress={handleDownloadPdf}
            />
          ) : null}
          {canReconcile ? (
            <>
              <Text style={[s.hint, { color: colors.text2 }]}>
                Para conciliar este movimiento deberás capturar estado de cuenta, póliza y triple verificación.
              </Text>
              <Button
                label="Iniciar dictamen de conciliación"
                accessibilityHint="Abre el protocolo paso a paso de conciliación bancaria"
                onPress={startForce}
              />
            </>
          ) : tx.estado !== 'conciliado' ? (
            <Text style={[s.hint, { color: colors.text2 }]}>
              Modo consulta / auditoría: tu coordinación supervisa este movimiento, pero la conciliación manual corresponde a Ingresos o al área recaudadora titular.
            </Text>
          ) : null}
          <Button variant="quiet" label="Cerrar" onPress={close} />
        </View>
      )}
    </SheetPanel>
  );
}

function Concept({ tx }: { tx: Transaction }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        s.concept,
        { backgroundColor: colors.blueSoft, borderColor: colors.border, borderLeftColor: colors.blue },
      ]}
      accessible
      accessibilityLabel={`${tx.concepto}. ${tx.ciudadano}. Fecha ${fmtDate(tx.fecha)}. Monto ${fmtMoney(tx.montoSistema)}.`}>
      <View style={[s.conceptIcon, { backgroundColor: colors.blueIcon }]}>
        <Text style={{ fontSize: 22 }}>{SERVICE_ICON[tx.servicio]}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.conceptTitle, { color: colors.text1 }]}>{tx.concepto}</Text>
        <Text style={[s.conceptSub, { color: colors.text2 }]}>{tx.ciudadano}</Text>
        <Text style={[s.conceptDate, { color: colors.text3 }]}>
          Fecha: <Text style={{ color: colors.blue, fontFamily: FONT.sansSemi }}>{fmtDate(tx.fecha)}</Text>
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.conceptAmount, { color: colors.blue }]}>{fmtMoney(tx.montoSistema)}</Text>
        <Text style={[s.mxn, { color: colors.text3 }]}>MXN</Text>
      </View>
    </View>
  );
}

function Difference({ tx }: { tx: Transaction }) {
  const { colors } = useTheme();
  const diff = tx.montoBanco - tx.montoSistema;
  return (
    <View style={[s.diffBox, { borderColor: colors.danger }]}>
      <View style={[s.diffHead, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="warn" size={16} color={colors.danger} strokeWidth={2.2} />
        <Text accessibilityRole="header" style={[s.diffHeadText, { color: colors.danger }]}>
          Diferencia detectada
        </Text>
      </View>
      <View style={[s.diffGrid, { backgroundColor: colors.white }]}>
        <View
          style={[s.diffCell, { borderRightWidth: 1, borderRightColor: colors.border }]}
          accessible
          accessibilityLabel={`Registrado en la app: ${fmtMoney(tx.montoSistema)}`}>
          <Text style={[s.diffLabel, { color: colors.text3 }]}>Registrado en app</Text>
          <Text style={[s.diffAmount, { color: colors.text1 }]}>{fmtMoney(tx.montoSistema)}</Text>
          <Text style={[s.diffSub, { color: colors.text3 }]}>Sistema CityPay</Text>
        </View>
        <View style={s.diffCell} accessible accessibilityLabel={`Reportado por el banco ${tx.banco}: ${bankAmountLabel(tx)}`}>
          <Text style={[s.diffLabel, { color: colors.text3 }]}>Reportado por banco</Text>
          <Text style={[s.diffAmount, { color: colors.blue }]}>{bankAmountLabel(tx)}</Text>
          <Text style={[s.diffSub, { color: colors.text3 }]}>{tx.banco}</Text>
        </View>
      </View>
      <View
        style={[s.diffNet, { backgroundColor: colors.blueSoft, borderTopColor: colors.border }]}
        accessible
        accessibilityLabel={`Diferencia neta: ${fmtMoney(diff)}`}>
        <Text style={[s.diffNetLabel, { color: colors.text2 }]}>Diferencia neta</Text>
        <Text style={[s.diffNetValue, { color: colors.danger }]}>
          {diff > 0 ? '+' : ''}
          {fmtMoney(diff)}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  folio: { fontFamily: FONT.mono, fontSize: 13 },
  body: { padding: 18, gap: 14 },
  concept: { borderRadius: RADIUS, padding: 14, borderWidth: 1, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  conceptIcon: { width: 46, height: 46, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },
  conceptTitle: { fontFamily: FONT.sansBold, fontSize: 15, lineHeight: 19 },
  conceptSub: { fontFamily: FONT.sans, fontSize: 13, marginTop: 3 },
  conceptDate: { fontFamily: FONT.sans, fontSize: 12.5, marginTop: 2 },
  conceptAmount: { fontFamily: FONT.displayXBold, fontSize: 17 },
  mxn: { fontFamily: FONT.sans, fontSize: 12 },
  diffBox: { borderRadius: RADIUS, overflow: 'hidden', borderWidth: 1 },
  diffHead: { paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffHeadText: { fontFamily: FONT.sansBold, fontSize: 14 },
  diffGrid: { flexDirection: 'row' },
  diffCell: { flex: 1, padding: 14 },
  diffLabel: { fontFamily: FONT.sansSemi, fontSize: 12, marginBottom: 6 },
  diffAmount: { fontFamily: FONT.monoMedium, fontSize: 16 },
  diffSub: { fontFamily: FONT.sans, fontSize: 12, marginTop: 4 },
  diffNet: { paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffNetLabel: { fontFamily: FONT.sans, fontSize: 13.5 },
  diffNetValue: { fontFamily: FONT.monoMedium, fontSize: 15 },
  actions: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, gap: 10 },
  hint: { fontFamily: FONT.sans, fontSize: 13.5, textAlign: 'center' },
  done: { paddingTop: 16, paddingHorizontal: 18, borderTopWidth: 1 },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  doneText: { textAlign: 'center', fontFamily: FONT.sansBold, fontSize: 15.5 },
  doneSub: { textAlign: 'center', fontFamily: FONT.sans, fontSize: 13, marginTop: 4 },
});
