# Mejoras de accesibilidad y usabilidad — app móvil CityPay

Rama: `mejoras-ux-accesibilidad` · Alcance: app Expo / React Native (`src/`). El prototipo `web/` y el `backend/` no se modificaron.

La versión inicial queda en `main`, así que se puede comparar antes y después con las mismas tareas.

## Flujos revisados

| # | Flujo | Tarea del usuario | Resultado esperado | Pantallas |
|---|-------|-------------------|--------------------|-----------|
| 1 | Inicio de sesión | Entrar con correo y contraseña | Llega al panel de inicio | Login → Cargando → Inicio |
| 2 | Búsqueda y conciliación de un pago | Encontrar un pago con diferencia y conciliarlo manualmente | El pago queda “Cuadrado” y se confirma | Inicio / Pagos → Detalle → Conciliar manualmente |
| 3 | Registro de un reporte ciudadano | Crear un reporte con ubicación y descripción | El reporte aparece en la lista | Reportes → Nuevo reporte → Reportes |

## Problemas encontrados y cambios

Prioridad: **Alta** impide la tarea · **Media** la dificulta o provoca errores · **Baja** claridad o consistencia.

| Pantalla o flujo | Problema detectado | Método | Efecto en el usuario | Prioridad | Cambio realizado |
|---|---|---|---|---|---|
| Todas | Texto gris `#94A3B8` con contraste 2.6:1 (2.2:1 sobre el fondo azul); `text2` 4.1:1 sobre el fondo | Cálculo WCAG / axe | Etiquetas, fechas y placeholders difíciles de leer, sobre todo con brillo bajo | Media | Paleta corregida en `colors.ts`: todo texto ≥ 4.5:1 (AA) |
| Todas | Letras de 9.5–10.5 px (pestañas, acciones rápidas, etiquetas de filtros, contador) | Revisión de código | Texto ilegible para muchas personas | Media | Mínimo ~12 px; campos de texto a 16 px |
| Encabezado, login, pagos, nuevo reporte | Áreas táctiles menores a 44 pt (campana, avatar, ojo de contraseña, borrar búsqueda, quitar foto de 18 px, cerrar de 32 px) | Revisión de código / TalkBack | Toques fallidos o en el control equivocado | Media | Constante `TOUCH = 44`; todos los controles ≥ 44 pt |
| Login, pagos, reportes, nuevo reporte | Campos sin etiqueta accesible (solo placeholder) | axe Linter / TalkBack | El lector de pantalla dice “cuadro de edición” sin indicar qué escribir | Alta | `accessibilityLabel` en todos los campos y etiquetas visibles encima de los campos del login |
| Filas de pagos, actividad, reportes | Controles sin nombre: TalkBack leía emojis (“casa”, “gota”) y fragmentos sueltos | TalkBack | No se entiende qué pago o reporte se va a abrir | Alta | Etiqueta completa por fila (servicio, folio, montos, estado) y emojis decorativos ocultos |
| Login | Errores genéricos al final y sin anunciarse | Prueba de uso / TalkBack | No se sabe qué campo corregir | Media | Validación por campo, borde rojo, mensaje junto al campo, anuncio y foco en el primer error |
| Login | Botones de idioma, Google y Apple que solo mostraban “no disponible” | Prueba de uso | Callejones sin salida | Baja | Idioma eliminado; Google/Apple marcados como “Próximamente” y no interactivos |
| Login → Inicio | Pantalla de carga artificial de 2.8 s | Prueba de uso (tiempo) | Añade casi 3 s a cada inicio de sesión | Baja | 1 s; el giro se detiene con “reducir movimiento” |
| Inicio | 4 de 5 acciones rápidas mostraban “no disponible” | Prueba de uso | El usuario cree que la app falla | Media | Solo acciones que funcionan; alerta visible de pagos con diferencia |
| Encabezado | Menú hamburguesa sin función que duplicaba las pestañas | Prueba de uso | Callejón sin salida | Baja | Eliminado |
| Pagos | Los tres estados eran tonos de azul casi iguales | Revisión visual | Las diferencias no destacan | Media | Verde (cuadrado), rojo (diferencia), azul (pendiente), siempre con símbolo y texto |
| Pagos | Folio truncado en la lista | Revisión visual | No se puede confirmar el pago buscado | Media | Folio en su propia línea |
| Pagos | Sin conteo por filtro ni forma de salir de “sin resultados” | Prueba de uso | Esfuerzo extra al buscar | Baja | Conteo en cada filtro, total de resultados y botón “Limpiar filtros” |
| Conciliar manualmente | Botón deshabilitado sin explicación (blanco sobre azul claro, 1.3:1) | Prueba de uso / contraste | No se sabe por qué no se puede confirmar | Alta | Mensaje “Para continuar: …” con lo que falta; botón deshabilitado legible |
| Conciliar manualmente | Al confirmar, la hoja se cerraba sin aviso | Prueba de uso | No hay certeza de que se guardó | Media | Vuelve al detalle con “Pago conciliado manualmente” y se anuncia |
| Reportes | El filtro “Periodo” no filtraba nada | Revisión de código | Resultados engañosos | Media | Eliminado |
| Reportes | Tocar un reporte solo mostraba “no disponible” | Prueba de uso | No se puede consultar un reporte | Alta | Hoja de detalle con seguimiento por etapas |
| Reportes | “Nuevo reporte” debajo de cuatro filtros | Prueba de uso | La tarea principal cuesta encontrarla | Media | Botón al inicio; los contadores filtran por estado |
| Nuevo reporte | Botón de ubicación solo con ícono; el “mapa” era una imagen SVG con un pin fijo que no respondía a la ubicación | Prueba de uso / TalkBack / revisión de código | No se entiende el ícono; el mapa sugiere una ubicación falsa y no permite marcar el lugar | Alta | Botón “Mi ubicación” con texto y **mapa real** con Leaflet + OpenStreetMap (ver abajo) |
| Nuevo reporte | Al enviar con errores el usuario no los ve (el botón está lejos) | Prueba de uso | Parece que el botón no hace nada | Alta | Desplaza y enfoca el primer campo con error y lo anuncia |
| Nuevo reporte | Prioridad “Bajo” en el formulario y “Baja” en los filtros; “Alta” preseleccionada | Revisión de consistencia | Confusión y prioridades infladas | Baja | “Baja” en ambos lados, con descripción; “Media” por defecto |
| Perfil | Cerrar sesión sin confirmación | Prueba de uso | Salidas accidentales | Baja | Diálogo de confirmación |

## Mapa real (Leaflet + OpenStreetMap)

La versión inicial mostraba un dibujo SVG (calles pintadas y un pin en posición fija). Ahora el formulario usa un mapa real, con herramientas de código abierto y sin llave de API:

- **Leaflet 1.9.4** (licencia BSD-2) para el mapa, cargado desde unpkg con hash de integridad (SRI).
- **OpenStreetMap** para las calles (datos ODbL; la atribución aparece en el mapa).
- **Nominatim** (geocodificador de OpenStreetMap) para convertir dirección ⇄ coordenadas, respetando su política: máximo 1 solicitud por segundo, identificación de la app y solo ante acciones del usuario.
- En iOS/Android el mapa corre en `react-native-webview` (incluido en Expo Go). En web se usa un `<iframe>` con la misma página.

Funcionamiento:

1. Tocar el mapa o arrastrar el marcador coloca el punto y completa la dirección.
2. Escribir la dirección y pulsar “Buscar en el mapa” (o Enter) mueve el marcador. La búsqueda se limita a México y da preferencia a la zona actual.
3. “Mi ubicación” usa el GPS, coloca el marcador y llena la dirección.
4. El reporte se envía con `latitude` y `longitude`, campos que el backend ya aceptaba. El detalle del reporte muestra el mapa con el punto.

Accesibilidad: el mapa es visual, así que con TalkBack/VoiceOver se anuncia como una sola imagen descrita (“Mapa con marcador en …”). Para marcar el lugar con lector de pantalla se usan la dirección + “Buscar en el mapa” o “Mi ubicación”. Los botones de zoom del mapa se agrandaron a 44 px.

Archivos: `src/components/map/` y `src/services/geocoding.ts`. Si el municipio tiene muchos usuarios, debe usar su propio servidor de Nominatim y de mosaicos, cambiando `NOMINATIM_URL` y `TILE_URL`.

## Cómo verificar

1. `npm install`, luego `npx tsc --noEmit` (sin errores).
2. VS Code sugiere la extensión **axe Accessibility Linter** (`.vscode/extensions.json`); abrir los archivos de `src/features/**`.
3. Mapa: en *Reportes → Nuevo reporte*, tocar el mapa, buscar una dirección y enviar; abrir el reporte creado para ver el punto.
4. En Android, activar TalkBack (Ajustes → Accesibilidad) y recorrer las tres tareas con gestos.
5. Para comparar, ejecutar `main` (versión inicial) y esta rama con las mismas tareas.

Pendiente fuera de alcance: dos avisos de ESLint previos en `reconciliation-context.tsx` y `reports-context.tsx` (carga de datos en `useEffect`), no relacionados con la interfaz.
