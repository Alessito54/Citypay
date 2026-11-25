import * as Location from 'expo-location';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Button, FieldMessage, InfoList, InputFrame, SelectField, SheetHeader, SheetModal, SheetPanel } from '@/components/ui';
import { FONT, RADIUS } from '@/constants/colors';
import { fmtMoney, SERVICE_ICON, SERVICE_LABEL } from '@/features/reconciliation/format';
import { useTheme } from '@/features/theme/theme-context';
import { exportFormalPaymentPdf, type PdfPropertyAval } from '@/services/pdf-receipt-service';
import type { CitizenDebt, MunicipalCitizenData, Transaction } from '@/types';

const METHODS = ['Tarjeta de débito / crédito', 'Transferencia SPEI', 'CoDi / QR bancario'];
const BANKS = ['BBVA México', 'Banamex', 'Santander', 'HSBC', 'Banorte', 'Scotiabank'];
const PROPERTY_TYPES: ('Urbano' | 'Rústico')[] = ['Urbano', 'Rústico'];

export function CitizenPaySheet({
  debt,
  municipalData,
  citizenName,
  onSaveMunicipalData,
  onPay,
  onClose,
}: {
  debt: CitizenDebt;
  municipalData: MunicipalCitizenData;
  citizenName?: string;
  onSaveMunicipalData: (next: MunicipalCitizenData) => Promise<void>;
  onPay: (params: { paymentMethod: string; bank: string; bankReference: string }) => Promise<Transaction>;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [method, setMethod] = useState(METHODS[0]);
  const [bank, setBank] = useState(BANKS[0]);
  const [cardOrRef, setCardOrRef] = useState('');

  // Datos de aval de propiedad / servicio (obligatorios para usuarios nuevos y pagos de Predial)
  const isPredial = debt.serviceSlug === 'predial';
  const isAgua = debt.serviceSlug === 'agua';
  const isMultas = debt.serviceSlug === 'multas';

  const [ownerName, setOwnerName] = useState(citizenName ?? '');
  const [cadastralKey, setCadastralKey] = useState(municipalData.cadastralKey || (isPredial ? debt.folio : ''));
  const [propertyAddress, setPropertyAddress] = useState(municipalData.propertyAddress || '');
  const [propertyType, setPropertyType] = useState<'Urbano' | 'Rústico'>(municipalData.propertyType || 'Urbano');
  const [waterAccount, setWaterAccount] = useState(municipalData.waterAccount || (isAgua ? debt.folio : ''));
  const [vehiclePlates, setVehiclePlates] = useState(municipalData.vehiclePlates || (isMultas ? debt.folio : ''));
  const [coordinates, setCoordinates] = useState<string | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const [avalConfirmed, setAvalConfirmed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [savedAval, setSavedAval] = useState<PdfPropertyAval | undefined>(undefined);

  const isCard = method.startsWith('Tarjeta');
  const minDigits = isCard ? 4 : 6;
  const inputValid = cardOrRef.trim().length >= minDigits;

  const locateProperty = async () => {
    setLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Activa el permiso de ubicación para detectar la dirección del predio automáticamente.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude.toFixed(5);
      const lng = pos.coords.longitude.toFixed(5);
      setCoordinates(`${lat}, ${lng}`);
      const geo = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
      if (geo.length > 0) {
        const g = geo[0];
        const parts = [g.street, g.streetNumber, g.district, g.city, g.postalCode].filter(Boolean);
        if (parts.length > 0) {
          setPropertyAddress(parts.join(', '));
        } else {
          setPropertyAddress(`Ubicación GPS verificada (${lat}, ${lng})`);
        }
      } else {
        setPropertyAddress(`Ubicación GPS verificada (${lat}, ${lng})`);
      }
    } catch {
      setError('No se pudo obtener tu ubicación actual. Puedes escribir la dirección manualmente.');
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    if (ownerName.trim().length < 4) {
      setError('Confirma el nombre completo del titular o propietario para avalar el pago.');
      return;
    }
    if (isPredial) {
      if (cadastralKey.trim().length < 5) {
        setError('Ingresa una clave catastral válida (mínimo 5 caracteres) para avalar el pago de Predial.');
        return;
      }
      if (propertyAddress.trim().length < 8) {
        setError('Ingresa o detecta con GPS la ubicación exacta del predio (calle, número y colonia).');
        return;
      }
    } else if (isAgua) {
      if (waterAccount.trim().length < 4) {
        setError('Confirma tu número de contrato de agua potable.');
        return;
      }
      if (propertyAddress.trim().length < 8) {
        setError('Confirma la dirección donde se presta el servicio de agua.');
        return;
      }
    } else if (isMultas) {
      if (vehiclePlates.trim().length < 4) {
        setError('Confirma las placas del vehículo o número de boleta de tránsito.');
        return;
      }
    }

    if (!avalConfirmed) {
      setError('Debes marcar la casilla de aval confirmando que la ubicación y datos de la propiedad/servicio son correctos.');
      return;
    }

    if (!inputValid) {
      setError(
        isCard
          ? 'Ingresa los últimos 4 dígitos de tu tarjeta para confirmar el cargo.'
          : 'Ingresa los caracteres de referencia o clave SPEI (mínimo 6 caracteres).',
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // Guarda los datos municipales avalados para futuras operaciones
      const updatedMuni: MunicipalCitizenData = {
        ...municipalData,
        ...(cadastralKey.trim() ? { cadastralKey: cadastralKey.trim().toUpperCase() } : {}),
        ...(propertyAddress.trim() ? { propertyAddress: propertyAddress.trim() } : {}),
        ...(isPredial ? { propertyType } : {}),
        ...(waterAccount.trim() ? { waterAccount: waterAccount.trim().toUpperCase() } : {}),
        ...(vehiclePlates.trim() ? { vehiclePlates: vehiclePlates.trim().toUpperCase() } : {}),
      };
      await onSaveMunicipalData(updatedMuni).catch(() => undefined);

      const bankCode = bank.split(' ')[0].toUpperCase();
      const ref = isCard ? `${bankCode}-TDD-${cardOrRef.trim()}` : cardOrRef.trim().toUpperCase();
      const tx = await onPay({
        paymentMethod: method,
        bank,
        bankReference: ref,
      });

      setSavedAval({
        ownerName: ownerName.trim(),
        cadastralKey: isPredial ? cadastralKey.trim().toUpperCase() : undefined,
        propertyAddress: propertyAddress.trim() || undefined,
        propertyType: isPredial ? propertyType : undefined,
        waterContract: isAgua ? waterAccount.trim().toUpperCase() : undefined,
        vehiclePlate: isMultas ? vehiclePlates.trim().toUpperCase() : undefined,
        coordinates,
      });
      setReceipt(tx);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar tu pago. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!receipt) return;
    setExportingPdf(true);
    setError(null);
    try {
      await exportFormalPaymentPdf({
        kind: 'payment',
        transaction: receipt,
        propertyAval: savedAval,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el comprobante PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const fieldTextStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontFamily: FONT.sans,
    fontSize: 15,
    color: colors.text1,
    paddingVertical: 0,
    paddingRight: 12,
  } as const;

  return (
    <SheetModal onDismiss={onClose} dismissLabel="Cerrar pago">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '94%' }}>
        <SheetPanel padBottom maxHeight="100%">
          <SheetHeader
            title={receipt ? 'Comprobante oficial de pago' : 'Validar datos y pagar en línea'}
            onClose={onClose}
            closeLabel="Cerrar"
          />

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
            {receipt ? (
              <View style={{ gap: 14 }}>
                <View style={[s.successBox, { backgroundColor: colors.successSoft, borderLeftColor: colors.success }]}>
                  <Icon name="check" size={24} color={colors.success} strokeWidth={2.8} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.successTitle, { color: colors.success }]}>¡Pago acreditado correctamente!</Text>
                    <Text style={[s.successSub, { color: colors.text1 }]}>
                      Tu obligación quedó liquidada con datos avalados y puedes descargar su documento oficial en PDF.
                    </Text>
                  </View>
                </View>

                <InfoList
                  rows={[
                    { label: 'Folio oficial de recibo', value: receipt.folio, mono: true },
                    { label: 'Concepto pagado', value: receipt.concepto },
                    { label: 'Importe total', value: fmtMoney(receipt.montoSistema), mono: true },
                    ...(savedAval?.cadastralKey ? [{ label: 'Clave catastral avalada', value: savedAval.cadastralKey, mono: true }] : []),
                    ...(savedAval?.propertyAddress ? [{ label: 'Ubicación avalada', value: savedAval.propertyAddress }] : []),
                    ...(savedAval?.waterContract ? [{ label: 'Contrato de agua', value: savedAval.waterContract, mono: true }] : []),
                    ...(savedAval?.vehiclePlate ? [{ label: 'Placas avaladas', value: savedAval.vehiclePlate, mono: true }] : []),
                    { label: 'Método', value: receipt.metodoPago },
                    { label: 'Institución', value: receipt.banco },
                    { label: 'Referencia', value: receipt.referenciaBancaria, mono: true },
                  ]}
                />

                <FieldMessage text={error ?? undefined} />

                <Button
                  icon="download"
                  label={exportingPdf ? 'Generando PDF formal…' : 'Descargar comprobante oficial PDF'}
                  loading={exportingPdf}
                  onPress={handleDownloadPdf}
                />
                <Button variant="secondary" label="Finalizar" onPress={onClose} />
              </View>
            ) : (
              <>
                <View style={[s.summaryCard, { backgroundColor: colors.blueSoft, borderColor: colors.border, borderLeftColor: colors.blue }]}>
                  <View style={[s.iconBox, { backgroundColor: colors.blueIcon }]}>
                    <Text style={{ fontSize: 22 }}>{SERVICE_ICON[debt.serviceSlug]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.svcLabel, { color: colors.blue }]}>{SERVICE_LABEL[debt.serviceSlug]}</Text>
                    <Text style={[s.concept, { color: colors.text1 }]}>{debt.concept}</Text>
                    <Text style={[s.folio, { color: colors.text2 }]}>Folio de adeudo: {debt.folio}</Text>
                  </View>
                  <Text style={[s.amount, { color: colors.navy }]}>{fmtMoney(debt.amount)}</Text>
                </View>

                <View style={[s.avalBox, { backgroundColor: colors.screen, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="pin" size={18} color={colors.blue} strokeWidth={2.3} />
                    <Text style={[s.avalTitle, { color: colors.navy }]}>
                      1. Aval de ubicación y datos {isPredial ? 'de la propiedad' : 'del servicio'}
                    </Text>
                  </View>
                  <Text style={[s.avalHint, { color: colors.text2 }]}>
                    {isPredial
                      ? 'Para confirmar tu pago de Predial, verifica la ubicación exacta del inmueble y su clave catastral.'
                      : 'Verifica los datos de tu cuenta y ubicación antes de confirmar el movimiento.'}
                  </Text>

                  <View style={{ gap: 6 }}>
                    <Text style={[s.label, { color: colors.text1 }]}>Titular / Propietario</Text>
                    <InputFrame icon="user">
                      <TextInput
                        value={ownerName}
                        onChangeText={setOwnerName}
                        placeholder="Nombre completo del contribuyente"
                        placeholderTextColor={colors.text3}
                        style={fieldTextStyle}
                      />
                    </InputFrame>
                  </View>

                  {isPredial ? (
                    <>
                      <View style={{ gap: 6 }}>
                        <Text style={[s.label, { color: colors.text1 }]}>Clave catastral del predio *</Text>
                        <InputFrame icon="doc">
                          <TextInput
                            value={cadastralKey}
                            onChangeText={setCadastralKey}
                            autoCapitalize="characters"
                            placeholder="Ej. CAT-2026-00412"
                            placeholderTextColor={colors.text3}
                            style={fieldTextStyle}
                          />
                        </InputFrame>
                      </View>

                      <SelectField
                        variant="row"
                        label="Tipo / Uso del inmueble"
                        leftIcon="home"
                        value={propertyType}
                        options={PROPERTY_TYPES}
                        onChange={(v) => setPropertyType(v === 'Rústico' ? 'Rústico' : 'Urbano')}
                      />
                    </>
                  ) : null}

                  {isAgua ? (
                    <View style={{ gap: 6 }}>
                      <Text style={[s.label, { color: colors.text1 }]}>Número de contrato de agua *</Text>
                      <InputFrame icon="doc">
                        <TextInput
                          value={waterAccount}
                          onChangeText={setWaterAccount}
                          autoCapitalize="characters"
                          placeholder="Ej. CTA-AGUA-8812"
                          placeholderTextColor={colors.text3}
                          style={fieldTextStyle}
                        />
                      </InputFrame>
                    </View>
                  ) : null}

                  {isMultas ? (
                    <View style={{ gap: 6 }}>
                      <Text style={[s.label, { color: colors.text1 }]}>Placas del vehículo / Boleta *</Text>
                      <InputFrame icon="doc">
                        <TextInput
                          value={vehiclePlates}
                          onChangeText={setVehiclePlates}
                          autoCapitalize="characters"
                          placeholder="Ej. YXK-482-A"
                          placeholderTextColor={colors.text3}
                          style={fieldTextStyle}
                        />
                      </InputFrame>
                    </View>
                  ) : null}

                  {isPredial || isAgua ? (
                    <View style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[s.label, { color: colors.text1 }]}>
                          Ubicación exacta (Calle, número y colonia) *
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={locateProperty}
                          disabled={locating}
                          style={[s.gpsBtn, { backgroundColor: colors.blueSoft, borderColor: colors.blue }]}>
                          <Icon name="locate" size={14} color={colors.blue} strokeWidth={2.3} />
                          <Text style={[s.gpsText, { color: colors.blue }]}>{locating ? 'Ubicando…' : 'Usar GPS'}</Text>
                        </Pressable>
                      </View>
                      <InputFrame icon="pin">
                        <TextInput
                          value={propertyAddress}
                          onChangeText={setPropertyAddress}
                          placeholder="Ej. Calle Norte 4 #210, Col. Centro"
                          placeholderTextColor={colors.text3}
                          style={fieldTextStyle}
                        />
                      </InputFrame>
                      {coordinates ? (
                        <Text style={[s.coordText, { color: colors.success }]}>
                          ✓ Coordenadas verificadas: {coordinates}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: avalConfirmed }}
                    onPress={() => {
                      setAvalConfirmed((v) => !v);
                      if (error) setError(null);
                    }}
                    style={[
                      s.checkRow,
                      {
                        backgroundColor: avalConfirmed ? colors.successSoft : colors.white,
                        borderColor: avalConfirmed ? colors.success : colors.inputBorder,
                      },
                    ]}>
                    <View
                      style={[
                        s.checkbox,
                        {
                          borderColor: avalConfirmed ? colors.success : colors.inputBorder,
                          backgroundColor: avalConfirmed ? colors.success : 'transparent',
                        },
                      ]}>
                      {avalConfirmed ? <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                    <Text style={[s.checkLabel, { color: colors.text1 }]}>
                      Avalo que la ubicación y los datos proporcionados corresponden a mi propiedad o servicio.
                    </Text>
                  </Pressable>
                </View>

                <Text style={[s.avalTitle, { color: colors.navy }]}>2. Datos del método de pago</Text>

                <SelectField
                  variant="row"
                  label="Método de pago"
                  leftIcon="card"
                  value={method}
                  options={METHODS}
                  onChange={setMethod}
                />

                <SelectField
                  variant="row"
                  label="Banco emisor"
                  leftIcon="money"
                  value={bank}
                  options={BANKS}
                  onChange={setBank}
                />

                <View style={{ gap: 6 }}>
                  <Text style={[s.label, { color: colors.text1 }]}>
                    {isCard ? 'Últimos 4 dígitos de tu tarjeta' : 'Clave de rastreo / Referencia de transferencia'}
                  </Text>
                  <InputFrame icon={isCard ? 'card' : 'lock'} error={!!error}>
                    <TextInput
                      value={cardOrRef}
                      onChangeText={(t) => {
                        setCardOrRef(t);
                        if (error) setError(null);
                      }}
                      keyboardType={isCard ? 'number-pad' : 'default'}
                      maxLength={isCard ? 4 : 24}
                      autoCapitalize="characters"
                      placeholder={isCard ? 'Ej. 4821' : 'Ej. SPEI20269918'}
                      placeholderTextColor={colors.text3}
                      style={fieldTextStyle}
                    />
                  </InputFrame>
                </View>

                <FieldMessage text={error ?? undefined} />

                <Button
                  icon="check"
                  label={busy ? 'Procesando pago…' : `Confirmar y pagar ${fmtMoney(debt.amount)}`}
                  loading={busy}
                  onPress={submit}
                />
                <Button variant="quiet" label="Cancelar" onPress={onClose} />
              </>
            )}
          </ScrollView>
        </SheetPanel>
      </KeyboardAvoidingView>
    </SheetModal>
  );
}

const s = StyleSheet.create({
  body: { padding: 18, gap: 14 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderLeftWidth: 4, borderRadius: RADIUS },
  iconBox: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  svcLabel: { fontFamily: FONT.sansBold, fontSize: 12, textTransform: 'uppercase' },
  concept: { fontFamily: FONT.sansBold, fontSize: 14.5, marginTop: 2 },
  folio: { fontFamily: FONT.mono, fontSize: 12, marginTop: 2 },
  amount: { fontFamily: FONT.displayXBold, fontSize: 18 },
  avalBox: { padding: 14, borderWidth: 1, gap: 10 },
  avalTitle: { fontFamily: FONT.sansBold, fontSize: 14 },
  avalHint: { fontFamily: FONT.sans, fontSize: 12.5, lineHeight: 17 },
  label: { fontFamily: FONT.sansSemi, fontSize: 13 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  gpsText: { fontFamily: FONT.sansBold, fontSize: 12 },
  coordText: { fontFamily: FONT.mono, fontSize: 11.5 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderWidth: 1 },
  checkbox: { width: 20, height: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkLabel: { flex: 1, fontFamily: FONT.sansMedium, fontSize: 12.5, lineHeight: 17 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderLeftWidth: 4 },
  successTitle: { fontFamily: FONT.sansBold, fontSize: 15 },
  successSub: { fontFamily: FONT.sans, fontSize: 13, marginTop: 2, lineHeight: 18 },
});
