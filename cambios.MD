# Bitácora de Cambios — Proyecto CityPay

Este documento registra de forma ordenada todos los requerimientos atendidos y las mejoras implementadas en **CityPay** (aplicación móvil/web en Expo + servidor backend en NestJS). Cada vez que se realiza una modificación en el proyecto, se documenta aquí con una explicación breve.

---

## Etapa 1 · Configuración base, compatibilidad móvil y acceso
1. **Actualización a Expo SDK 58 y React Native 0.88** (`package.json`, `app.json`, `src/app/(tabs)/_layout.tsx`, `src/components/map/location-map.tsx`):
   - Se actualizaron las dependencias del cliente para hacerlas compatibles con la versión vigente de Expo Go (SDK 58), ajustando el `TabBar` (`emitter` y `navigateToTab`) y el tipado de referencias en React 19.3.
2. **Corrección de condición de carrera al registrar e iniciar sesión** (`src/services/auth-service.ts`, `backend/src/users/users.service.ts`):
   - Se unificaron las solicitudes simultáneas a `/users/me` durante el registro y se agregó manejo de colisiones en PostgreSQL para evitar el error al sincronizar un usuario recién creado.
3. **Configuración de despliegue y linter** (`netlify.toml`, `eslint.config.js`):
   - Se integró la configuración de compilación web estática para Netlify y las reglas de ESLint enfocadas en el cliente Expo.

---

## Etapa 2 · Tiempo real, áreas operativas y evidencia fotográfica
4. **Actualización en tiempo real entre ciudadano y panel administrativo** (`backend/src/realtime/realtime.service.ts`, `backend/src/reports/reports.controller.ts`, `src/services/realtime-service.ts`, `src/features/reports/reports-context.tsx`, `src/features/reconciliation/home-screen.tsx`):
   - Se implementó un canal `Server-Sent Events` (`GET /reports/stream`) respaldado por sincronización automática silenciosa cada 4 segundos. Cuando un ciudadano levanta un reporte (ej. un bache) o realiza un pago, el dashboard administrativo abierto en otro dispositivo recibe una alerta inmediata y actualiza indicadores y listados sin recargar.
5. **Canalización departamental y permisos por área municipal** (`src/lib/orizaba.ts`, `src/lib/roles.ts`, `backend/src/auth/orizaba.ts`, `backend/src/auth/roles.ts`):
   - Se estructuraron las coordinaciones operativas (*Ingresos, Egresos, Catastro, Tránsito y Vialidad, Agua Potable, Obras Públicas, Alumbrado Público, Limpia Pública, Parques y Jardines, Recursos Humanos y Contraloría*) para que cada reporte y cada pago se turne y filtre según el área correspondiente, incluyendo gestión de personal para Administración y Recursos Humanos.
6. **Captura, subida y visualización de fotografías en reportes** (`src/features/reports/new-report/use-photo-attachments.ts`, `src/services/uploads-service.ts`, `src/features/reports/new-report/photo-section.tsx`, `src/features/reports/report-detail-sheet.tsx`):
   - Se habilitó adjuntar hasta 4 fotos desde cámara o galería en iOS, Android y Web (`base64: true`), subiéndolas de forma autenticada vía `POST /uploads` y `POST /uploads/sign` hacia Cloudinary, con vista previa a pantalla completa en tarjetas y detalle de reporte.

---

## Etapa 3 · Experiencia intuitiva de usuario, conciliación rigurosa y pagos/expediente ciudadano
7. **Guía intuitiva orientada al usuario y limpieza de textos técnicos/locales** (`src/features/orizaba/orizaba-screen.tsx`, `src/features/profile/profile-screen.tsx`, `src/features/reports/citizen-home-screen.tsx`, `src/app/(tabs)/_layout.tsx`):
   - Se eliminó la sección técnica *"Definición de Roles y Responsabilidades"* y se retiraron las referencias textuales locales para ofrecer una interfaz general e intuitiva (**pestaña Guía: "¿Qué necesitas hacer hoy?"**), con indicaciones claras y accesos directos que orientan al usuario sobre a dónde dirigirse según el trámite o problema que desea resolver.
8. **Protocolo riguroso de conciliación bancaria en 3 pasos** (`src/features/reconciliation/force-reconcile-form.tsx`, `src/features/reconciliation/reconcile-rules.ts`, `src/services/reconciliation-service.ts`, `backend/src/payments/dto/reconcile-payment.dto.ts`, `backend/src/payments/payments.service.ts`):
   - Se reemplazó el botón simple de conciliación por un **Dictamen de Conciliación Bancaria** auditable en tres etapas obligatorias:
     1. *Cotejo de estado de cuenta*: captura obligatoria de clave de rastreo SPEI / referencia bancaria verificada, importe real acreditado en banco (calculando variaciones en vivo), folio de póliza/corte y opción para fotografiar o adjuntar ficha de respaldo.
     2. *Clasificación contable*: selección de motivo normativo y redacción obligatoria de justificación detallada (mínimo 25 caracteres).
     3. *Triple verificación y código anti-error*: marcado obligatorio de 3 casillas de responsabilidad y captura de los últimos 4 caracteres del folio de la operación antes de emitir el dictamen.
9. **Pagos ciudadanos (Predial, Agua e Infracciones de Tránsito) y gestión de datos municipales** (`src/features/citizen-payments/citizen-payments-screen.tsx`, `src/features/citizen-payments/citizen-pay-sheet.tsx`, `src/features/citizen-payments/municipal-data-sheet.tsx`, `src/services/citizen-finance-service.ts`, `backend/src/debts/debts.service.ts`, `backend/src/users/users.service.ts`):
   - Se habilitó la pestaña **Pagos** para cuentas ciudadanas con tres funciones integradas:
     - **Mis datos municipales**: registro y edición de clave catastral, domicilio/tipo de predio, contrato de agua potable, placas de vehículo y licencia de conducir.
     - **Cosas por pagar (Adeudos)**: consulta de obligaciones pendientes (*Predial, Agua Potable y Boletas/Infracciones de Tránsito*) más buscador para vincular nuevos adeudos por clave catastral, contrato o placa/folio.
     - **Pago en línea y recibo digital**: liquidación con tarjeta, SPEI o CoDi que marca el adeudo como pagado, genera comprobante oficial con folio y notifica en tiempo real al módulo de recaudación.
10. **Limpieza visual de etiquetas "En vivo" / "Tiempo real activo"** (`src/features/reports/citizen-home-screen.tsx`, `src/features/reports/reports-screen.tsx`, `src/features/reconciliation/home-screen.tsx`):
    - Se retiraron las insignias y textos de *"En vivo"* y *"Tiempo real activo"* de las cabeceras para mantener una interfaz más limpia, conservando la actualización automática en segundo plano sin ruido visual.

---

## Etapa 4 · Documentos PDF formales, aval de ubicación/predial, gestos, splash y modo oscuro
11. **Generación de documento PDF formal para conciliaciones y pagos** (`src/services/pdf-receipt-service.ts`, `src/features/reconciliation/transaction-detail-sheet.tsx`, `src/features/citizen-payments/citizen-pay-sheet.tsx`, `src/features/citizen-payments/citizen-payments-screen.tsx`):
    - Se integraron `expo-print` y `expo-sharing` para emitir documentos PDF con formato institucional oficial (*Dictamen Formal de Conciliación de Pago* y *Comprobante Oficial de Pago Municipal*) con folio, desglose bancario, variación neta, datos de ubicación/propiedad avalados, observaciones de auditoría, firmas de respaldo y sello digital de integridad.
12. **Aval obligatorio de ubicación y datos de propiedad/servicio antes de pagar** (`src/features/citizen-payments/citizen-pay-sheet.tsx`):
    - Para usuarios nuevos y pagos de *Predial* (así como *Agua* y *Tránsito*), ahora se exige validar y avalar la ubicación exacta del inmueble (con botón de detección GPS vía `expo-location`), clave catastral, titular, tipo de predio y casilla de declaración antes de confirmar el pago, guardando automáticamente los datos en el expediente municipal del ciudadano e incluyéndolos en el PDF oficial.
13. **Navegación deslizando entre menús con animación suave** (`src/app/(tabs)/_layout.tsx`):
    - Se agregó un gesto horizontal (`Gesture.Pan`) con filtro anti-conflicto para scroll vertical y animación horizontal/fade al deslizar o cambiar entre *Inicio, Pagos, Reportes, Guía y Perfil*.
14. **Diagnóstico y corrección de "Sin conexión con el servidor: se muestran datos de demostración"** (`src/services/api-client.ts`, `src/lib/use-session-data.ts`, `src/features/reports/reports-context.tsx`, `src/features/reconciliation/reconciliation-context.tsx`, `src/services/reconciliation-service.ts`, `src/services/reports-service.ts`):
    - Se agregó calentamiento automático del servidor Render al abrir la app (`warmUpServer`), aumento de timeout a 75 s con reintento automático en `GET`, limpieza inmediata del aviso en cuanto el servidor responde, y diferenciación entre desconexión real y vista previa de rol (`403 Forbidden` cuando la cuenta en BD aún es ciudadana).
15. **Animación rápida de entrada con logo centrado de CityPay** (`src/features/shell/splash-intro.tsx`, `src/app/_layout.tsx`):
    - Se implementó una transición inicial ágil (~900 ms) con el logotipo de CityPay centrado haciendo escala suave y desvanecimiento al abrir la aplicación.
16. **Modo oscuro completo (`Claro / Oscuro / Sistema`)** (`src/constants/colors.ts`, `src/features/theme/theme-context.tsx`, `src/components/app-header.tsx`, `src/features/profile/profile-screen.tsx`, `src/components/ui/*`):
    - Se creó `ThemeProvider` con persistencia local, paleta oscura de alto contraste, selector completo en *Perfil* y botón rápido de sol/luna en la barra superior de todas las pantallas.
17. **Corrección de tarjetas en modo oscuro y generación de PDF en Expo Go Android** (`src/services/pdf-receipt-service.ts`, `src/features/reports/report-card.tsx`, `src/features/reconciliation/transaction-row.tsx`, `src/features/reconciliation/payments-screen.tsx`, `src/features/reconciliation/home-screen.tsx`, `src/features/reports/reports-screen.tsx`, `src/features/orizaba/orizaba-screen.tsx`, `src/features/citizen-payments/citizen-payments-screen.tsx`):
    - Se adaptaron dinámicamente las tarjetas de reportes, filas de pagos, chips de filtro, estados y contenedores para eliminar fondos blancos en modo oscuro.
    - Se corrigió el error `ExpoSharing.shareAsync: Not allowed to read file under given URL` en Expo Go Android agregando respaldo automático a `Print.printAsync({ html })` (vista previa nativa de impresión / Guardar como PDF).
18. **Corrección de modo oscuro en el Dictamen de Conciliación y hoja de Datos Municipales** (`src/features/reconciliation/force-reconcile-form.tsx`, `src/features/citizen-payments/municipal-data-sheet.tsx`):
    - Se migraron todos los textos, campos `TextInput`, banner superior, barra de ajuste bancario, casillas de auditoría y pie de acciones a `useTheme()` para asegurar contraste total en modo oscuro.
