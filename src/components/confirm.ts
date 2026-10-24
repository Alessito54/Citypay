import { Alert, Platform } from 'react-native';

/**
 * react-native-web ships `Alert.alert` as an empty function, so any dialog built
 * on it silently does nothing in the browser — the button just looks dead. Web
 * therefore falls back to the DOM dialogs.
 */

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function confirmAction({
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
}: ConfirmOptions) {
  if (Platform.OS === 'web') {
    // Guarded for the prerender pass of `web.output: 'static'`, where there is no window.
    if (typeof window !== 'undefined' && window.confirm(message ? `${title}\n\n${message}` : title)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }

  Alert.alert(title, message);
}
