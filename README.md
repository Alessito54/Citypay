# CityPay — Portal Municipal de Pagos, Reportes y Conciliación Bancaria

**CityPay** es una aplicación multiplataforma (**iOS, Android y Web**) construida con **Expo SDK 58 / React Native 0.88** y un backend en **NestJS + PostgreSQL (Neon) + Firebase Auth + Cloudinary**. Conecta a los ciudadanos con las áreas operativas y administrativas del municipio para realizar pagos en línea, reportar incidencias urbanas con fotografía y ubicación, y conciliar operaciones bancarias de forma auditable.

---

## Funcionalidades principales

### Portal Ciudadano
- **Pagos municipales y adeudos («Cosas por pagar»):** consulta y liquidación de *Predial*, *Agua Potable* e *Infracciones de Tránsito* mediante tarjeta, SPEI o CoDi, además de buscador para vincular nuevos predios, contratos o boletas.
- **Aval obligatorio de ubicación y datos del inmueble:** antes de confirmar pagos de *Predial* (y servicios asociados), el ciudadano valida clave catastral, titular, tipo de predio y ubicación exacta (con botón de detección GPS vía `expo-location`), guardando sus datos en el expediente municipal.
- **Expediente municipal personal:** registro y edición de clave catastral, domicilio del predio, contrato de agua, placas vehiculares y licencia de conducir.
- **Reportes urbanos con evidencia fotográfica y mapa:** captura de hasta 4 fotos (cámara o galería en móvil y web) subidas a Cloudinary, selección de ubicación en mapa y seguimiento del estatus.
- **Guía rápida («¿Qué necesitas hacer hoy?»):** navegación intuitiva con accesos directos y directorio de áreas municipales.

### Panel Administrativo y Tesorería
- **Dictamen riguroso de conciliación bancaria en 3 pasos:**
  1. *Cotejo contra estado de cuenta*: clave SPEI/referencia bancaria verificada, importe real acreditado con cálculo de variación en vivo, folio de póliza/corte y evidencia documental opcional.
  2. *Clasificación contable*: motivo normativo y observaciones de auditoría obligatorias ($\ge 25$ caracteres).
  3. *Protocolo de responsabilidad*: triple confirmación y código anti-error con los últimos 4 caracteres del folio.
- **Generación de documentos PDF formales:** emisión de **Dictamen Formal de Conciliación de Pago** y **Comprobante Oficial de Pago Municipal** (`expo-print` + `expo-sharing`, con respaldo nativo a impresión/Guardar como PDF en Expo Go) incluyendo folio, cotejo financiero, datos avalados, firmas y sello digital de integridad.
- **Sincronización automática en tiempo real:** canal `Server-Sent Events` (`GET /reports/stream`) respaldado por actualización silenciosa periódica entre dispositivos.
- **Control de acceso por rol y coordinación:** permisos diferenciados para *Ciudadano*, *Personal de área*, *Supervisor / Contraloría* y *Administrador*, con panel de asignación de personal.

### Experiencia de Usuario
- **Modo oscuro (`Claro / Oscuro / Sistema`):** paleta oscura de alto contraste con persistencia local, selector en *Perfil* y botón rápido de cambio en la barra superior.
- **Navegación por gestos:** deslizamiento horizontal animado entre pestañas (*Inicio, Pagos, Reportes, Guía y Perfil*).
- **Animación de entrada rápida:** transición inicial centrada con el logotipo de CityPay (< 1 s).

---

## Stack tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend móvil / web** | Expo SDK 58, React Native 0.88, React 19.3, Expo Router, TypeScript, React Native Gesture Handler, `expo-print`, `expo-sharing`, `expo-location`, `expo-image-picker` |
| **Backend API** | NestJS, TypeORM, PostgreSQL (Neon), Swagger (`/api/docs`), RxJS SSE |
| **Autenticación y archivos** | Firebase Authentication (Web SDK + Admin SDK), Cloudinary |
| **Despliegue** | Render (Backend API) · Netlify (Cliente Web) · Expo Go / EAS (Móvil) |

---

## Estructura del repositorio

```text
ProyectoCityPay/
├── src/
│   ├── app/                  # Rutas de Expo Router (tabs, login, new-report, loading)
│   ├── components/           # Componentes UI reutilizables, íconos, marca y mapa
│   ├── config/               # Configuración de Firebase cliente
│   ├── constants/            # Tokens de diseño y paletas (clara y oscura)
│   ├── features/             # Módulos: auth, citizen-payments, reconciliation, reports, orizaba (guía), profile, theme, shell
│   ├── lib/                  # Reglas de roles, áreas municipales, alertas y hooks de datos
│   └── services/             # Cliente HTTP, auth, reportes, pagos, PDF formal, tiempo real y uploads
├── backend/
│   └── src/                  # Módulos NestJS: auth, users, debts, payments, reports, services, uploads, realtime, database
├── cambios.MD                # Bitácora cronológica de todos los cambios realizados
├── app.json                  # Configuración de Expo y plugins nativos
└── package.json              # Dependencias y scripts del cliente
```

---

## Inicio rápido

### 1. Instalación y ejecución

```bash
# Instalar dependencias del cliente
npm install

# Iniciar el servidor de desarrollo de Expo (Android, iOS y Web)
npx expo start
```

Para ejecutar el backend de forma local:

```bash
cd backend
npm install
npm run start:dev
```

### 2. Validación y calidad de código

```bash
# Verificación de tipos TypeScript (cliente)
npx tsc --noEmit

# Linter ESLint (cliente)
npx eslint .

# Compilación del backend NestJS
npm --prefix backend run build
```

---

## Bitácora de cambios

Consulta el historial detallado de cada mejora y corrección aplicada al proyecto en [cambios.MD](./cambios.MD).
