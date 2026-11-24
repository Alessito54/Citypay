import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { LocationMap } from '@/components/map/location-map';
import { FieldMessage, InputFrame, inputText } from '@/components/ui';
import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { fmtCoords } from '@/services/geocoding';

import type { LocationPicker } from './use-location-picker';

/** Address field + "Mi ubicación" + "Buscar en el mapa" + interactive map. */
export const LocationSection = forwardRef<
  TextInput,
  { loc: LocationPicker; error?: string; onEdit: () => void; onMapTouch: (active: boolean) => void }
>(function LocationSection({ loc, error, onEdit, onMapTouch }, ref) {
  return (
    <>
      <InputFrame icon="pin" error={!!error}>
        <TextInput
          ref={ref}
          value={loc.addr}
          onChangeText={(t) => {
            loc.setAddr(t);
            if (t.trim()) onEdit();
          }}
          accessibilityLabel="Ubicación del problema, obligatorio"
          accessibilityHint="Al terminar, usa Buscar en el mapa para colocar el marcador"
          placeholder="Calle, número y colonia"
          placeholderTextColor={C.text3}
          returnKeyType="search"
          onSubmitEditing={loc.searchOnMap}
          style={inputText}
        />
        {loc.addr ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar ubicación" onPress={loc.clear} style={s.clear}>
            <Icon name="xCircle" size={18} color={C.text2} />
          </Pressable>
        ) : null}
      </InputFrame>
      <FieldMessage text={error} />
      <View style={s.row}>
        <ActionButton
          icon="locate"
          busy={loc.busy === 'gps'}
          label={loc.busy === 'gps' ? 'Ubicando…' : 'Mi ubicación'}
          a11y={loc.busy === 'gps' ? 'Obteniendo tu ubicación' : 'Usar mi ubicación actual'}
          disabled={!!loc.busy}
          onPress={loc.useMyLocation}
        />
        <ActionButton
          icon="search"
          busy={loc.busy === 'search'}
          label={loc.busy === 'search' ? 'Buscando…' : 'Buscar en el mapa'}
          a11y={loc.busy === 'search' ? 'Buscando en el mapa' : 'Buscar la dirección en el mapa'}
          disabled={!loc.canSearch}
          quiet={!loc.canSearch || !loc.textChanged}
          onPress={loc.searchOnMap}
        />
      </View>
      <LocationMap
        coords={loc.coords}
        onPick={loc.pickOnMap}
        onTouchActiveChange={onMapTouch}
        height={210}
        accessibilityLabel={loc.coords ? `Mapa con marcador en ${loc.addr || fmtCoords(loc.coords)}` : 'Mapa sin marcador'}
        accessibilityHint="Para marcar el lugar con lector de pantalla, escribe la dirección y usa Buscar en el mapa, o usa Mi ubicación"
      />
      <View style={{ minHeight: 20 }} accessibilityLiveRegion="polite">
        {loc.busy === 'reverse' ? (
          <Text style={s.status}>Buscando la dirección de ese punto…</Text>
        ) : loc.note ? (
          <FieldMessage text={loc.note.text} tone={loc.note.tone} />
        ) : (
          <Text style={s.status}>{loc.coords ? `Marcador en ${fmtCoords(loc.coords)}.` : 'Opcional: toca el mapa para marcar el lugar exacto.'}</Text>
        )}
      </View>
    </>
  );
});

function ActionButton({
  icon,
  label,
  a11y,
  busy,
  disabled,
  quiet,
  onPress,
}: {
  icon: IconName;
  label: string;
  a11y: string;
  busy: boolean;
  disabled: boolean;
  quiet?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ busy, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, quiet && s.btnQuiet, pressed && { backgroundColor: C.blueIcon }]}>
      {busy ? <ActivityIndicator size="small" color={C.blue} /> : <Icon name={icon} size={18} color={C.blue} />}
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  clear: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: TOUCH + 2, paddingHorizontal: 8, borderRadius: RADIUS, borderWidth: 1.5, borderColor: C.blue, backgroundColor: C.blueSoft },
  btnQuiet: { borderColor: C.inputBorder, backgroundColor: '#fff' },
  btnText: { fontFamily: FONT.sansBold, fontSize: 14, color: C.blue, flexShrink: 1 },
  status: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, lineHeight: 18 },
});
