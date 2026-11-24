# Auditoría técnica — CityPay (app Expo + backend NestJS)

Fecha: 24 nov 2026 · Alcance: app móvil (`src/`) y backend (`backend/src/`). El prototipo `web/` (Figma Make) no se modificó.

La auditoría se usó como lista de trabajo: cada hallazgo indica qué se cambió. Lo que quedó fuera está en **Pendiente**.

Prioridad: **Crítica**: riesgo de seguridad o datos falsos presentados como reales · **Alta**: impide la tarea o hace perder datos · **Media**: la dificulta o provoca errores · **Baja**: claridad, consistencia o mantenimiento.

## 1. Seguridad (backend)

| # | Hallazgo | Efecto | Prioridad | Cambio |
|---|---|---|---|---|
| S1 | `syncUser` daba rol **admin** a cualquier correo que empezara con `admin@` (de cualquier dominio) o que contuviera un nombre de usuario fijo en el código | Cualquiera registraba `admin@gmail.com` y podía ver y conciliar todos los pagos | Crítica | Lista explícita `ADMIN_EMAILS` (coincidencia exacta) y solo con correo verificado por Firebase (`email_verified`) |
| S2 | Al iniciar sesión, si el UID no existía, se buscaba el perfil **por correo** y se le reasignaba el UID sin comprobar el correo | Registrar en Firebase el correo de un perfil sembrado (sin cuenta real) entregaba ese perfil y su rol | Crítica | Solo se vincula por correo si Firebase lo verificó; si no, responde 409 con instrucción de verificar |
| S3 | `GET /payments/:id` no revisaba dueño ni rol | Cualquier ciudadano autenticado podía leer pagos ajenos por id | Alta | Ciudadano: solo sus pagos (404 si no es suyo); personal: todos |
| S4 | `GET /reports/:id` devolvía nombre y correo de quien reportó a cualquier usuario | Exposición de datos personales | Alta | Solo personal municipal o el propio autor ven al autor |
| S5 | Credenciales (Neon, Cloudinary) compartidas en texto plano en el chat y en la documentación | Riesgo de uso indebido | Alta | **Pendiente:** rotar en Neon y Cloudinary, y actualizar `backend/.env` y Render |
| S6 | `ssl: { rejectUnauthorized: false }` en la conexión a PostgreSQL | No se valida el certificado del servidor | Baja | Pendiente: usar el certificado de Neon |

## 2. Datos y funcionamiento

| # | Hallazgo | Efecto | Prioridad | Cambio |
|---|---|---|---|---|
| D1 | Los contextos cargaban reportes y pagos **una sola vez al abrir la app, antes de iniciar sesión**. La API respondía 401 y se mostraban datos de demostración toda la sesión | Con backend y login funcionando, la app seguía mostrando datos inventados | Crítica | `useSessionData`: carga al haber sesión, recarga si cambia el usuario y nunca muestra datos del usuario anterior |
| D2 | Conciliar manualmente ignoraba los errores del servidor y marcaba el pago como "Cuadrado" | Falso éxito en una operación financiera auditada | Crítica | El error llega al formulario; solo los registros de demostración se concilian localmente |
| D3 | Si el envío de un reporte fallaba, se creaba un reporte "local" y se mostraba "Reporte enviado" | El ciudadano creía haber reportado y el reporte nunca llegaba | Alta | El error se muestra junto al botón y el formulario conserva lo escrito |
| D4 | Si una foto no se subía a Cloudinary, se mandaba al backend la ruta `file://` del teléfono como evidencia | Evidencia rota guardada en la base de datos | Alta | `uploads-service` lanza un error claro; no se envían rutas locales |
| D5 | La sesión de Firebase en iOS/Android quedaba solo en memoria | Había que iniciar sesión cada vez que se abría la app | Alta | `initializeAuth` con `getReactNativePersistence(AsyncStorage)` (archivo `.native.ts`); en web sigue IndexedDB |
| D6 | Un ciudadano veía el panel de administración y la pestaña Pagos; `/payments` respondía 403 y aparecían **pagos de demostración** | Datos ficticios de otros ciudadanos ante un usuario sin permisos | Alta | Navegación por rol: el personal ve Inicio (conciliación), Pagos, Reportes y Perfil; el ciudadano ve un Inicio de reportes, Reportes y Perfil. `/payments` redirige si no es personal |
| D7 | Cifras inventadas mostradas como reales: tendencias "↑ 2.4 % vs ayer", "+8.3 %", "hace 5 min", "hace 52 min", 6 reportes fijos, campana con "3" sin leer | El administrador decide con números falsos | Alta | Se quitaron; todos los valores se calculan con los datos cargados |
| D8 | Avisos fijos "Datos de demostración" y "el reporte se guarda en este dispositivo", aunque el backend funcionara | Mensaje contrario a la realidad | Media | `Notice` solo aparece cuando la fuente es demostración (`source === 'demo'`) |
| D9 | La lista de reportes no incluía coordenadas y el detalle no las pedía, así que el mapa del detalle nunca aparecía | Se perdía la ubicación marcada | Media | El detalle pide `GET /reports/:id` (descripción, fotos y mapa) y la lista ya incluye `latitude/longitude` |
| D10 | `latitude: dto.latitude \|\| null` | La coordenada 0 se guardaba como nula | Baja | `?? null` |
| D11 | "Descuadre" sumaba diferencias con signo y los pendientes como negativos | El total podía cancelarse y engañar | Media | Suma de diferencias absolutas de las discrepancias abiertas |
| D12 | El estado del pago seleccionado era una copia; tras conciliar, la hoja mostraba datos viejos | Inconsistencia visual | Baja | Se guarda el `id` y se deriva de la lista |
| D13 | Sin límite de tiempo en las peticiones | La app podía esperar sin fin con Render dormido | Media | `AbortController` de 60 s y mensaje de conexión |
| D14 | El restablecimiento de contraseña decía "No existe una cuenta con este correo" | Permitía saber qué correos están registrados | Baja | Mensaje neutro en ambos casos |

## 3. Usabilidad

| # | Hallazgo | Prioridad | Cambio |
|---|---|---|---|
| U1 | "Notificar falla al ciudadano" y la campana solo abrían un aviso de "no disponible" (callejones sin salida, como el menú que ya se había quitado) | Media | Se quitaron hasta que existan en el backend |
| U2 | Botones "Google / Apple · Próximamente" sin función en el login | Baja | Se quitaron |
| U3 | Botón "Quitar foto" con área de 28 px | Media | Área táctil de 44 px (caja visible de 28 px) |
| U4 | El botón de envío no decía que estaba subiendo fotos (puede tardar) | Baja | "Subiendo fotos y enviando…" |
| U5 | En el detalle del pago, la única salida en estados "Cuadrado" era tocar fuera | Baja | Botón "Cerrar" siempre visible; "Conciliar" solo si hay algo que conciliar |

## 4. Separación de responsabilidades

Antes, varias pantallas mezclaban en un solo archivo la red, las reglas de negocio, el estado y la vista (`new-report-screen.tsx` tenía 484 líneas; `ui.tsx` tenía siete componentes distintos). Ahora hay capas:

| Capa | Responsabilidad | Archivos |
|---|---|---|
| `app/` | Solo rutas: elige la pantalla según sesión y rol | `(tabs)/index.tsx` (personal o ciudadano), `(tabs)/payments.tsx` (protegida) |
| `features/*/…-screen.tsx` | Componer la vista; sin reglas ni red | `reports-screen`, `payments-screen`, `home-screen`, `citizen-home-screen`, `profile-screen` |
| `features/*/` componentes | Una pieza visual por archivo | `report-card`, `report-detail-sheet`, `transaction-detail-sheet`, `priority-picker`, `location-section`, `photo-section`, `auth-field`, `login-background` |
| Hooks de feature | Estado e interacción con el dispositivo | `use-location-picker` (GPS, mapa, geocodificación), `use-photo-attachments` (permisos, cámara, galería) |
| Reglas puras | Validaciones y cálculos sin React, fáciles de probar | `report-form.ts`, `reconcile-rules.ts`, `auth-rules.ts`, `report-status.ts`, `selectors.ts`, `lib/validation.ts`, `lib/roles.ts` |
| Contextos | Estado compartido por sesión | `auth-context`, `reports-context`, `reconciliation-context` + `lib/use-session-data.ts` |
| `services/` | Red y fuentes de datos; devuelven `{ items, source }` | `api-client`, `auth-service`, `reports-service`, `reconciliation-service`, `uploads-service` |
| `components/ui/` | Kit visual sin lógica de negocio | `button`, `sheet`, `select-field`, `search-field`, `input-frame`, `info-list`, `badge`, `notice`, `kpi-card`, `empty-state`, `section` |
| `config/` | Inicialización de Firebase por plataforma | `firebase.ts`, `firebase-auth.ts`, `firebase-auth.native.ts` |

Duplicados eliminados: cinco estilos de botón distintos ahora son un solo `Button` (`primary`, `secondary`, `quiet`); tres hojas inferiores comparten `SheetModal`, `SheetPanel` y `SheetHeader`; dos buscadores comparten `SearchField`; dos tablas comparten `InfoList`; la expresión regular del correo estaba en dos lugares y ahora está en `lib/validation.ts`; la carga del perfil se repetía tres veces en `auth-service` y ahora es `toSession`; el cálculo de "estado efectivo" del pago se repetía en tres pantallas y se eliminó.

En el backend, la regla "quién es personal" queda en `backend/src/auth/roles.ts` (`isStaff`).

## 5. Diseño: de redondeado a cuadrado

- Un solo token, `RADIUS = 0` en `src/constants/colors.ts`. Todas las superficies lo usan: tarjetas, botones, campos, chips, hojas, avatares, insignias, fotos y mapa. Ya no queda ningún `borderRadius` con número directo. Para cambiar la forma basta con cambiar ese valor.
- La selección se marca con una **barra de acento** (`ACCENT_BAR = 4`) en lugar de píldoras y puntos redondos:
  - pestaña activa: barra superior;
  - opción elegida en listas y motivos: barra izquierda + ✓;
  - prioridades: barra superior con el tono de cada nivel;
  - insignias de estado: barra izquierda del color del estado + símbolo;
  - seguimiento del reporte: barras segmentadas.
- Las hojas inferiores tienen esquinas rectas y un borde superior azul de 4 px.
- Íconos con terminaciones cuadradas (`strokeLinecap="square"`, `strokeLinejoin="miter"`).
- Controles de Leaflet y atribución del mapa sin redondeo.
- Los motivos de conciliación ya no usan un círculo de radio que, al ser cuadrado, se confundiría con una casilla. La casilla de confirmación sí es un cuadrado, que es su forma convencional.
- El logotipo (círculo de la marca) no se modificó: es identidad, no interfaz.

## Cómo verificar

1. `npx tsc --noEmit` y `npx expo lint`: sin errores (los dos errores previos de `useEffect` también se corrigieron).
2. `cd backend && npm run build`.
3. Seguridad:
   - registrar una cuenta nueva `admin@<cualquier-dominio>` debe quedar como **Ciudadano**;
   - con un ciudadano, `GET /payments/<id ajeno>` → 404.
4. Datos:
   - iniciar sesión con un usuario del personal: los pagos y reportes son los de Neon y no aparece el aviso de demostración;
   - apagar el backend: aparece el aviso naranja.
5. Ciudadano: no ve la pestaña Pagos; su Inicio muestra "Reportar un problema" y sus reportes recientes.
6. Enviar un reporte sin conexión: muestra el error y no "Enviado".
7. Cerrar y reabrir la app en el teléfono: la sesión se conserva.

## Pendiente

- **Rotar credenciales** de Neon y Cloudinary (S5) y configurar `ADMIN_EMAILS` en Render. Los cambios del backend se aplican en Render cuando se despliegue esta versión.
- Las pruebas del backend (`npm test`) no corren con Node 22: este Jest requiere Node ≥ 24.9 para cargar `@nestjs/testing`. Ya fallaban antes de estos cambios.
- Pruebas unitarias para las reglas puras (`report-form`, `reconcile-rules`, `auth-rules`, `selectors`): ahora son funciones sin React y se pueden probar directamente.
- Notificaciones y "Notificar falla al ciudadano": requieren endpoints nuevos.
- Subida firmada de fotos (`/uploads/sign` ya existe) en lugar del preset sin firma, para que nadie pueda subir a la cuenta de Cloudinary sin sesión.
- Paginación de `/reports` y `/payments`.
