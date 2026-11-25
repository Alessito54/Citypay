import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, FieldMessage, InputFrame, SelectField, SheetHeader, SheetModal, SheetPanel } from '@/components/ui';
import { FONT } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';
import type { MunicipalCitizenData } from '@/types';

export function MunicipalDataSheet({
  initial,
  onSave,
  onClose,
}: {
  initial: MunicipalCitizenData;
  onSave: (data: MunicipalCitizenData) => Promise<void>;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [cadastralKey, setCadastralKey] = useState(initial.cadastralKey ?? '');
  const [propertyAddress, setPropertyAddress] = useState(initial.propertyAddress ?? '');
  const [propertyType, setPropertyType] = useState<'Urbano' | 'Rústico'>(initial.propertyType ?? 'Urbano');
  const [waterAccount, setWaterAccount] = useState(initial.waterAccount ?? '');
  const [vehiclePlates, setVehiclePlates] = useState(initial.vehiclePlates ?? '');
  const [driverLicense, setDriverLicense] = useState(initial.driverLicense ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        cadastralKey,
        propertyAddress,
        propertyType,
        waterAccount,
        vehiclePlates,
        driverLicense,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar tus datos municipales.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontFamily: FONT.sans,
    fontSize: 16,
    color: colors.text1,
    paddingVertical: 0,
    paddingRight: 12,
  } as const;

  return (
    <SheetModal onDismiss={onClose} dismissLabel="Cerrar mis datos municipales">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '92%' }}>
        <SheetPanel padBottom maxHeight="100%">
          <SheetHeader title="Mis datos municipales" onClose={onClose} closeLabel="Cerrar" />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
            <Text style={[s.intro, { color: colors.text2 }]}>
              Guarda los datos de tu propiedad, toma de agua y vehículo para consultar rápidamente tus adeudos, predial e infracciones de tránsito.
            </Text>

            <View style={[s.group, { borderTopColor: colors.divider }]}>
              <Text style={[s.sectionTitle, { color: colors.blue }]}>Catastro y Predial</Text>
              <Text style={[s.label, { color: colors.text1 }]}>Clave catastral</Text>
              <InputFrame icon="home">
                <TextInput
                  value={cadastralKey}
                  onChangeText={setCadastralKey}
                  autoCapitalize="characters"
                  placeholder="Ej. 04-018-009-02-004"
                  placeholderTextColor={colors.text3}
                  style={fieldStyle}
                />
              </InputFrame>

              <Text style={[s.label, { color: colors.text1 }]}>Domicilio del predio</Text>
              <InputFrame icon="pin">
                <TextInput
                  value={propertyAddress}
                  onChangeText={setPropertyAddress}
                  placeholder="Calle, número y colonia"
                  placeholderTextColor={colors.text3}
                  style={fieldStyle}
                />
              </InputFrame>

              <SelectField
                variant="row"
                label="Tipo de predio"
                leftIcon="doc"
                value={propertyType}
                options={['Urbano', 'Rústico']}
                onChange={(v) => setPropertyType(v as 'Urbano' | 'Rústico')}
              />
            </View>

            <View style={[s.group, { borderTopColor: colors.divider }]}>
              <Text style={[s.sectionTitle, { color: colors.blue }]}>Agua Potable y Alcantarillado</Text>
              <Text style={[s.label, { color: colors.text1 }]}>Número de contrato / cuenta de agua</Text>
              <InputFrame icon="doc">
                <TextInput
                  value={waterAccount}
                  onChangeText={setWaterAccount}
                  autoCapitalize="characters"
                  placeholder="Ej. AG-204918"
                  placeholderTextColor={colors.text3}
                  style={fieldStyle}
                />
              </InputFrame>
            </View>

            <View style={[s.group, { borderTopColor: colors.divider }]}>
              <Text style={[s.sectionTitle, { color: colors.blue }]}>Tránsito y Vehículos</Text>
              <Text style={[s.label, { color: colors.text1 }]}>Placas del vehículo</Text>
              <InputFrame icon="card">
                <TextInput
                  value={vehiclePlates}
                  onChangeText={setVehiclePlates}
                  autoCapitalize="characters"
                  placeholder="Ej. YHK-482-B"
                  placeholderTextColor={colors.text3}
                  style={fieldStyle}
                />
              </InputFrame>

              <Text style={[s.label, { color: colors.text1 }]}>Número de licencia de conducir (opcional)</Text>
              <InputFrame icon="user">
                <TextInput
                  value={driverLicense}
                  onChangeText={setDriverLicense}
                  autoCapitalize="characters"
                  placeholder="Ej. LIC-992841"
                  placeholderTextColor={colors.text3}
                  style={fieldStyle}
                />
              </InputFrame>
            </View>

            <FieldMessage text={error ?? undefined} />
            <Button
              icon="check"
              label={saving ? 'Guardando datos…' : 'Guardar mis datos municipales'}
              loading={saving}
              onPress={handleSave}
            />
            <Button variant="quiet" label="Cancelar" onPress={onClose} />
          </ScrollView>
        </SheetPanel>
      </KeyboardAvoidingView>
    </SheetModal>
  );
}

const s = StyleSheet.create({
  body: { padding: 18, gap: 16 },
  intro: { fontFamily: FONT.sans, fontSize: 13.5, lineHeight: 19 },
  group: { gap: 8, paddingTop: 4, borderTopWidth: 1 },
  sectionTitle: { fontFamily: FONT.displayBold, fontSize: 15, marginTop: 4 },
  label: { fontFamily: FONT.sansSemi, fontSize: 13 },
});
