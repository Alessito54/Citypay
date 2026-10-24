# Welcome to your Expo app 👋

## Environment configuration

Copy `.env.example` to `.env.local` and fill in the Firebase project
configuration. Expo only exposes variables prefixed with `EXPO_PUBLIC_` to the
client bundle.

The Neon connection string and Cloudinary API secret are server-only
credentials. Do not add them to `.env.local`, application code, or an Expo
build. Store them in the secret manager for the backend that will access
PostgreSQL or sign Cloudinary uploads. The values previously shared for these
services should be rotated before use.

The app reads its data from the NestJS backend in `backend/`, which persists to
PostgreSQL (Neon). `EXPO_PUBLIC_API_URL` has to point at a running instance of
that backend, or every screen fails with "No se pudo conectar con el servidor
municipal". There is no demo-data fallback any more: a freshly registered
account starts empty, by design.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Deploy the web app to Netlify

The web build is a static site. [`netlify.toml`](netlify.toml) already sets the
build command (`npx expo export --platform web`) and publish directory (`dist`),
so connecting the repository in Netlify is enough — no `_redirects` file is
needed, because `web.output` is `"static"` and every route gets its own HTML
file.

Before the first build, set the `EXPO_PUBLIC_*` variables under **Site
configuration > Environment variables**. Expo inlines them into the client
bundle *at build time*, so a variable added afterwards needs a redeploy to take
effect. `netlify.toml` lists the full set.

Two things this does not cover:

- **The backend is not deployed by this.** Netlify serves static files and
  serverless functions; the NestJS app in `backend/` needs its own host (Render,
  Railway, Fly.io…). Point `EXPO_PUBLIC_API_URL` at that deployment.
- **It must be HTTPS.** A site served over HTTPS cannot call an `http://`
  API — the browser blocks it as mixed content — so `http://localhost:3000`
  will not work from the deployed site.

Also add the Netlify domain to `CORS_ORIGINS` in the backend environment, or the
browser will reject the responses.

To check a production build locally before pushing:

```bash
npx expo export --platform web
npx serve dist
```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
