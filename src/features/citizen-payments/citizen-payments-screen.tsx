import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import {
  Badge,
  Button,
  EmptyState,
  FieldMessage,
  InfoList,
  InputFrame,
  KpiCard,
  Section,
  SelectField,
  cardShadow,
  inputText,
  surface,
} from '@/components/ui';
import { ACCENT_BAR, C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { fmtDate, fmtMoney, SERVICE_ICON, SERVICE_LABEL } from '@/features/reconciliation/format';
import { ScreenTop } from '@/features/shell/screen-top';
import { useTheme } from '@/features/theme/theme-context';
import { citizenFinanceService } from '@/services/citizen-finance-service';
import { exportFormalPaymentPdf } from '@/services/pdf-receipt-service';
import type { CitizenDebt, MunicipalCitizenData, Servicio, Transaction } from '@/types';

import { CitizenPaySheet } from './citizen-pay-sheet';
import { MunicipalDataSheet } from './municipal-data-sheet';

const FILTER_TABS: { id: 'todos' | Servicio; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'predial', label: 'Predial / Catastro' },
  { id: 'agua', label: 'Agua' },
  { id: 'multas', label: 'Tránsito' },
];

const LINK_TYPES: Record<string, Servicio> = {
  'Predial (Clave catastral)': 'predial',
  'Agua Potable (No. de contrato)': 'agua',
  'Infracción de Tránsito (Placa o boleta)': 'multas',
};

export function CitizenPaymentsScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const uid = session?.uid ?? '';

  const [debts, setDebts] = useState<CitizenDebt[]>([]);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [muniData, setMuniData] = useState<MunicipalCitizenData>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | Servicio>('todos');
  const [payingDebt, setPayingDebt] = useState<CitizenDebt | null>(null);
  const [editingMuni, setEditingMuni] = useState(false);

  // Buscador rápido para vincular una boleta de tránsito, predio o contrato de agua
  const [showLinker, setShowLinker] = useState(false);
  const [linkTypeLabel, setLinkTypeLabel] = useState(Object.keys(LINK_TYPES)[0]);
  const [linkRef, setLinkRef] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    Promise.all([
      citizenFinanceService.listMyDebts(uid),
      citizenFinanceService.listMyPayments(),
      citizenFinanceService.getMunicipalData(uid, session?.municipalData),
    ]).then(([d, p, m]) => {
      if (!alive) return;
      setDebts(d);
      setPayments(p);
      setMuniData(m);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [uid, session?.municipalData]);

  const pendingDebts = useMemo(() => debts.filter((d) => d.status !== 'paid'), [debts]);
  const filteredDebts = useMemo(
    () => (filter === 'todos' ? pendingDebts : pendingDebts.filter((d) => d.serviceSlug === filter)),
    [pendingDebts, filter],
  );

  const totalToPay = useMemo(
    () => pendingDebts.reduce((acc, d) => acc + d.amount, 0),
    [pendingDebts],
  );

  const handleLinkDebt = useCallback(async () => {
    if (linkRef.trim().length < 4) {
      setLinkMsg({ text: 'Ingresa al menos 4 caracteres (clave catastral, contrato o placa/folio).', tone: 'error' });
      return;
    }
    setLinkBusy(true);
    setLinkMsg(null);
    try {
      const slug = LINK_TYPES[linkTypeLabel] ?? 'predial';
      const added = await citizenFinanceService.linkDebt(uid, {
        serviceSlug: slug,
        referenceCode: linkRef.trim(),
      });
      setDebts((prev) => [added, ...prev]);
      setLinkRef('');
      setShowLinker(false);
      setLinkMsg({ text: `Se vinculó "${added.concept}" a tus adeudos pendientes.`, tone: 'success' });
    } catch (e) {
      setLinkMsg({ text: e instanceof Error ? e.message : 'No se pudo consultar el adeudo.', tone: 'error' });
    } finally {
      setLinkBusy(false);
    }
  }, [uid, linkTypeLabel, linkRef]);

  const handleSaveMunicipalData = useCallback(
    async (next: MunicipalCitizenData) => {
      const saved = await citizenFinanceService.saveMunicipalData(uid, next);
      setMuniData(saved);
    },
    [uid],
  );

  const handlePayDebt = useCallback(
    async (params: { paymentMethod: string; bank: string; bankReference: string }) => {
      if (!payingDebt) throw new Error('Selecciona un concepto a pagar.');
      const tx = await citizenFinanceService.payDebt(uid, {
        debt: payingDebt,
        serviceSlug: payingDebt.serviceSlug,
        concept: payingDebt.concept,
        amount: payingDebt.amount,
        ...params,
      });
      setDebts((prev) => prev.map((d) => (d.id === payingDebt.id ? { ...d, status: 'paid' } : d)));
      setPayments((prev) => [tx, ...prev]);
      return tx;
    },
    [uid, payingDebt],
  );

  const hasMuniData = Boolean(
    muniData.cadastralKey || muniData.waterAccount || muniData.vehiclePlates,
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTop />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={s.head}>
          <Text accessibilityRole="header" style={[s.h1, { color: colors.text1 }]}>
            Pagos y Expediente Municipal
          </Text>
          <Text style={[s.sub, { color: colors.text2 }]}>
            Consulta tus cosas por pagar (predial, agua e infracciones de tránsito) y administra tus datos de catastro y vehículos.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 18, flexDirection: 'row', gap: 10 }}>
          <KpiCard
            icon="money"
            label="Total por pagar"
            value={fmtMoney(totalToPay)}
            sub={`${pendingDebts.length} ${pendingDebts.length === 1 ? 'adeudo pendiente' : 'adeudos pendientes'}`}
          />
          <KpiCard
            icon="check"
            label="Pagos realizados"
            value={`${payments.length}`}
            sub="con recibo digital"
          />
        </View>

        <Section
          label="Mis datos municipales (Catastro, Agua y Vehículos)"
          link={hasMuniData ? 'Editar' : 'Registrar'}
          onLinkPress={() => setEditingMuni(true)}>
          <View style={[s.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
            {hasMuniData ? (
              <InfoList
                rows={[
                  { label: 'Clave catastral', value: muniData.cadastralKey || 'Sin registrar', mono: !!muniData.cadastralKey },
                  ...(muniData.propertyAddress
                    ? [{ label: 'Predio', value: `${muniData.propertyAddress} (${muniData.propertyType ?? 'Urbano'})` }]
                    : []),
                  { label: 'Contrato de agua', value: muniData.waterAccount || 'Sin registrar', mono: !!muniData.waterAccount },
                  { label: 'Placas registradas', value: muniData.vehiclePlates || 'Sin registrar', mono: !!muniData.vehiclePlates },
                ]}
              />
            ) : (
              <View style={{ padding: 14, gap: 10 }}>
                <Text style={[s.helper, { color: colors.text2 }]}>
                  Aún no has guardado tu clave catastral, contrato de agua o placas. Regístralos para tener siempre a la mano tus trámites.
                </Text>
                <Button variant="secondary" icon="doc" label="Capturar mis datos de catastro y tránsito" onPress={() => setEditingMuni(true)} />
              </View>
            )}
          </View>
        </Section>

        <Section
          label="Cosas por pagar (Adeudos pendientes)"
          link={showLinker ? 'Ocultar buscador' : '+ Buscar boleta / predio'}
          onLinkPress={() => setShowLinker((v) => !v)}>
          {showLinker ? (
            <View style={[s.card, { padding: 14, gap: 10, marginBottom: 10, backgroundColor: colors.white, borderColor: colors.border }]}>
              <Text style={[s.linkerTitle, { color: colors.navy }]}>Vincular predial, contrato de agua o infracción de tránsito</Text>
              <SelectField
                variant="row"
                label="Trámite"
                leftIcon="search"
                value={linkTypeLabel}
                options={Object.keys(LINK_TYPES)}
                onChange={setLinkTypeLabel}
              />
              <InputFrame icon="doc">
                <TextInput
                  value={linkRef}
                  onChangeText={setLinkRef}
                  autoCapitalize="characters"
                  placeholder="Clave catastral, contrato o placa / folio"
                  placeholderTextColor={colors.text3}
                  style={[inputText, { color: colors.text1 }]}
                />
              </InputFrame>
              <Button
                icon="search"
                label={linkBusy ? 'Consultando padrón…' : 'Buscar y agregar a mis adeudos'}
                loading={linkBusy}
                onPress={handleLinkDebt}
              />
            </View>
          ) : null}

          {linkMsg ? (
            <View style={{ marginBottom: 8 }}>
              <FieldMessage text={linkMsg.text} tone={linkMsg.tone} />
            </View>
          ) : null}

          <View style={s.tabsRow}>
            {FILTER_TABS.map((t) => {
              const on = filter === t.id;
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setFilter(t.id)}
                  style={[
                    s.tabChip,
                    {
                      backgroundColor: on ? colors.blueSoft : colors.white,
                      borderColor: on ? colors.blue : colors.border,
                      borderTopColor: on ? colors.blue : 'transparent',
                    },
                  ]}>
                  <Text style={[s.tabChipText, { color: on ? colors.blue : colors.text2 }, on && { fontFamily: FONT.sansBold }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loading ? <Text style={[s.helper, { color: colors.text2 }]}>Consultando estado de cuenta…</Text> : null}

          {!loading && filteredDebts.length === 0 ? (
            <EmptyState
              title="Estás al corriente en este rubro"
              body="No tienes adeudos pendientes aquí. Si tienes una boleta de tránsito o predio adicional, usa '+ Buscar boleta / predio'."
            />
          ) : null}

          <View style={{ gap: 10 }}>
            {filteredDebts.map((debt) => {
              const isOverdue = debt.status === 'overdue';
              return (
                <View
                  key={debt.id}
                  style={[
                    s.debtCard,
                    {
                      backgroundColor: colors.white,
                      borderColor: colors.border,
                      borderLeftColor: isOverdue ? colors.danger : colors.blue,
                    },
                  ]}>
                  <View style={s.debtTop}>
                    <View style={[s.debtIcon, { backgroundColor: colors.blueIcon }]}>
                      <Text style={{ fontSize: 20 }}>{SERVICE_ICON[debt.serviceSlug]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[s.debtSvc, { color: colors.blue }]}>{SERVICE_LABEL[debt.serviceSlug]}</Text>
                        <Badge
                          label={isOverdue ? 'Vencido / Recargo' : 'Por pagar'}
                          bg={isOverdue ? colors.dangerSoft : colors.blueSoft}
                          fg={isOverdue ? colors.danger : colors.blue}
                        />
                      </View>
                      <Text style={[s.debtConcept, { color: colors.text1 }]}>{debt.concept}</Text>
                      <Text style={[s.debtMeta, { color: colors.text3 }]}>
                        Folio {debt.folio} · Vence: {fmtDate(debt.dueDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={[s.debtFooter, { borderTopColor: colors.divider }]}>
                    <View>
                      <Text style={[s.amountLabel, { color: colors.text3 }]}>Importe</Text>
                      <Text style={[s.amountVal, { color: colors.navy }]}>{fmtMoney(debt.amount)}</Text>
                    </View>
                    <Button
                      icon="card"
                      label="Pagar ahora"
                      onPress={() => setPayingDebt(debt)}
                      style={{ paddingHorizontal: 18 }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </Section>

        <Section label="Mis pagos y recibos digitales">
          <View style={[s.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
            {payments.length === 0 ? (
              <Text style={[s.helper, { padding: 14, color: colors.text2 }]}>
                Cuando realices un pago de predial, agua o tránsito aparecerá aquí tu recibo oficial con folio.
              </Text>
            ) : (
              payments.map((p, i) => (
                <View
                  key={p.id}
                  style={[
                    s.paidRow,
                    i < payments.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}>
                  <View style={[s.paidIcon, { backgroundColor: colors.successSoft }]}>
                    <Icon name="check" size={16} color={colors.success} strokeWidth={2.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.paidTitle, { color: colors.text1 }]}>{p.concepto}</Text>
                    <Text style={[s.paidSub, { color: colors.text3 }]}>
                      Folio {p.folio} · {fmtDate(p.fecha)} · {p.metodoPago}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[s.paidAmount, { color: colors.success }]}>{fmtMoney(p.montoSistema)}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Descargar PDF del recibo ${p.folio}`}
                      onPress={() =>
                        void exportFormalPaymentPdf({
                          kind: 'payment',
                          transaction: p,
                          propertyAval: {
                            ownerName: session?.displayName,
                            cadastralKey: p.servicio === 'predial' ? muniData.cadastralKey : undefined,
                            propertyAddress: muniData.propertyAddress,
                            propertyType: p.servicio === 'predial' ? muniData.propertyType : undefined,
                            waterContract: p.servicio === 'agua' ? muniData.waterAccount : undefined,
                            vehiclePlate: p.servicio === 'multas' ? muniData.vehiclePlates : undefined,
                          },
                        })
                      }
                      style={[s.pdfChip, { backgroundColor: colors.blueSoft, borderColor: colors.blue }]}>
                      <Icon name="download" size={12} color={colors.blue} strokeWidth={2.4} />
                      <Text style={[s.pdfChipText, { color: colors.blue }]}>PDF</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </Section>
      </ScrollView>

      {payingDebt ? (
        <CitizenPaySheet
          debt={payingDebt}
          municipalData={muniData}
          citizenName={session?.displayName}
          onSaveMunicipalData={handleSaveMunicipalData}
          onPay={handlePayDebt}
          onClose={() => setPayingDebt(null)}
        />
      ) : null}

      {editingMuni ? (
        <MunicipalDataSheet
          initial={muniData}
          onSave={handleSaveMunicipalData}
          onClose={() => setEditingMuni(false)}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  h1: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.text1 },
  sub: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, marginTop: 3, lineHeight: 19 },
  card: { ...surface, overflow: 'hidden', ...cardShadow },
  helper: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, lineHeight: 19 },
  linkerTitle: { fontFamily: FONT.sansBold, fontSize: 14, color: C.navy },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tabChip: { minHeight: TOUCH - 6, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderTopWidth: ACCENT_BAR, borderTopColor: 'transparent' },
  tabChipOn: { borderColor: C.blue, borderTopColor: C.blue, backgroundColor: C.blueSoft },
  tabChipText: { fontFamily: FONT.sansMedium, fontSize: 12.5, color: C.text2 },
  debtCard: { ...surface, padding: 14, gap: 12, borderLeftWidth: 4, borderLeftColor: C.blue, borderRadius: RADIUS, ...cardShadow },
  debtTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  debtIcon: { width: 42, height: 42, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  debtSvc: { fontFamily: FONT.sansBold, fontSize: 12, color: C.blue, textTransform: 'uppercase' },
  debtConcept: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1, marginTop: 3, lineHeight: 19 },
  debtMeta: { fontFamily: FONT.mono, fontSize: 12, color: C.text3, marginTop: 3 },
  debtFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.divider },
  amountLabel: { fontFamily: FONT.sans, fontSize: 12, color: C.text3 },
  amountVal: { fontFamily: FONT.displayXBold, fontSize: 19, color: C.navy },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  paidIcon: { width: 32, height: 32, backgroundColor: C.successSoft, alignItems: 'center', justifyContent: 'center' },
  paidTitle: { fontFamily: FONT.sansBold, fontSize: 13.5, color: C.text1 },
  paidSub: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 2 },
  paidAmount: { fontFamily: FONT.monoMedium, fontSize: 14, color: C.success },
  pdfChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  pdfChipText: { fontFamily: FONT.sansBold, fontSize: 11 },
});
