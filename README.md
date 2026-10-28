# ROYO — Repair On Your Own

> **"Understand Your Vehicle. Maintain with Confidence. Repair Smarter."**  
> 🌐 **Live Web App:** [https://royo-app.web.app](https://royo-app.web.app)

Motorcycle assistance, a personal garage, conversations, and a service logbook. React/Vite web, React Native/Expo mobile, and a layered Go API share one pnpm/Turborepo workspace.

**The full production specification is not complete.** Read [the product audit](docs/PRODUCT-AUDIT.md) for tested behavior, repaired defects, missing requirements, and verification limits. [The design notes](docs/DESIGN.md) explain shared styling, desktop/phone layouts and branding.

## Development

Use Node 22, the pinned pnpm version in `package.json`, and Go. On Windows, use `pnpm.cmd` when PowerShell execution policy blocks `pnpm.ps1`.

```sh
pnpm install
```

Start the API from `backend/`:

```sh
go run ./cmd/server
```

Without `DATABASE_URL`, development uses volatile in-memory repositories and a seeded catalogue. User data is lost when the API process stops. Missing Gemini credentials return a clear unavailable error; missing YouTube credentials return no videos. The app does not fabricate diagnoses, video metadata, vehicles, or service records.

To use real services, create `backend/.env` from the example and configure a separate development PostgreSQL database and server-side provider keys. `GEMINI_MODEL` is configurable; choose a model available to your project. Database migrations must be applied in order; migration 000002 supplies the maintenance table and persistent video metadata. No migrations are automatically applied to an existing managed database by the Go server. Production startup refuses missing required configuration or a failed database connection.

Start web from the repository root:

```sh
pnpm web
```

Open `http://localhost:5173`. Web uses the same origin for `/api` and Vite proxies it to `http://localhost:8080`. Set `VITE_API_BASE_URL` for an explicitly separate API origin, or `ROYO_API_PROXY_URL` to change the development proxy. Nginx has a same-origin API proxy for container use.

Start native:

```sh
pnpm mobile
```

Set `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env` for your device. Android emulator defaults to `http://10.0.2.2:8080`; the iOS simulator defaults to `http://localhost:8080`. Physical devices need the computer's reachable LAN address during development. Release configuration must use HTTPS. Refresh tokens use Expo SecureStore; access tokens remain in memory. Bundle exports do not replace simulator or device QA.

## Checks

```sh
pnpm typecheck
pnpm theme:check
pnpm --filter @royo/web build
pnpm exec playwright install chromium firefox webkit
pnpm test
```

From `backend/`:

```sh
go test ./...
go vet ./...
go test -race ./...
```

The race detector requires a compatible C toolchain; Linux CI runs it. Browser tests launch isolated web/API servers on ports 5174 and 18080, intentionally use memory repositories and empty provider keys, and cover Chromium, Firefox, WebKit, fifteen viewport combinations, selected accessibility scans, and actual core API workflows. They do not prove managed PostgreSQL persistence or real provider behavior. Reports are written to `playwright-report/`; reviewed UI captures are under `docs/screenshots/`.

Native JavaScript bundle checks:

```sh
pnpm --filter @royo/mobile exec expo export --platform android --output-dir dist-export
pnpm --filter @royo/mobile exec expo export --platform ios --output-dir dist-export-ios
```

CI includes the workspace checks, web build, browser tests and native bundle exports. No deployment or app-store publication is implied by a successful build.

## Hosting & Deployment

The web client is deployed and hosted on **Firebase Hosting**:
- **Live URL:** [https://royo-app.web.app](https://royo-app.web.app)
- **Firebase Console:** [https://console.firebase.google.com/project/royo-app/overview](https://console.firebase.google.com/project/royo-app/overview)

To build and deploy new changes to Firebase Hosting:
```sh
pnpm deploy:web
```

## Shared styles and assets

Edit `packages/theme/src/tokens.json`, then run `pnpm theme:generate`. Web globally imports the emitted variables and modular CSS from `packages/theme/assets/css/`. Native consumes the same tokens in `apps/mobile/src/styles.ts`; React Native cannot read browser CSS directly.

Both apps use the transparent PNG in `packages/theme/assets/images/royo-wordmark.png`. The SVG master is beside it; `node scripts/export-logo.mjs` re-exports it and copies the web asset. See the design notes for font reproducibility.

Subscriptions, notifications, administration, reviewed repair guides, account deletion and other release requirements remain unfinished. The audit lists the release priorities and remaining security/performance work.
