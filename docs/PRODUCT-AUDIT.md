# ROYO product audit — 28 October 2026

**Release decision: the complete master specification is not yet passed.** The existing app contained prototype behavior despite successful baseline type checks and Go tests. This change repairs core flows, redesigns the existing screens, adds regression coverage, and documents unfinished requirements. It does not certify the product as production-ready.

## Verification scope

Browser tests run the actual React application and Go HTTP server with explicitly selected in-memory development repositories. Records survive page reloads and authentication changes during the server process; they do not survive a server restart. These results do not prove PostgreSQL persistence.

Gemini and YouTube credentials are intentionally empty in end-to-end tests. Provider response validation is tested with deterministic fixtures. Real paid inference, video search, provider-account quotas, and live technical accuracy were not exercised. Missing credentials now produce honest unavailability, rather than fabricated results.

## Requirement matrix

| Master requirement | Status | Evidence or remaining work |
|---|---|---|
| 1. Motorcycle assistance, context, safety labels | Partial | Real vehicle context and structured response rendering exist; reviewed repair guides, illustrations, and manufacturer grounding are missing. Live inference not verified. |
| 2. React web, React Native, Go backend | Partial | Web runs against Go; native app connects through shared hooks. Bundle exports are checked separately. Physical Android/iOS/tablet/Chromebook execution is not certified. |
| 3. pnpm/Turborepo monorepo | Implemented | Two applications and shared TypeScript packages; Go retains its own tooling. React runtimes remain platform-specific. |
| 4. Shared code architecture | Partial | Auth, vehicles, chat, quotas, maintenance, validation, and tokens shared. Some older exported DOM components retain legacy inline styles. |
| 5. Central API endpoints/client | Partial | Central endpoint map and token-aware client; login storage, logout revocation/clearance and bounded refresh retries repaired. Cancellation/refresh timeout behavior needs further hardening. |
| 6. Environment configuration | Partial | Native API URL is environment-configurable; web uses same-origin proxy by default. Production no longer downgrades to development after invalid config or database failure. Hosting and secret provisioning are not verified. |
| 7. Redux Toolkit/RTK Query | Partial | Typed store factory and slices exist; logout resets account data. RTK Query base has no feature endpoints; most persisted resources still use local hook state and need cache/invalidation consolidation. |
| 8. Shared utilities and validation | Partial | Shared schemas exist; catalogue identifiers work in both memory and PostgreSQL modes. Backend validation and utility-specific test coverage remain incomplete. |
| 9. Cross-platform components | Partial | Shared headless feature hooks with separate platform presentations. The old DOM component package is not universal native UI; new native screens do not import it. |
| 10. Responsive/adaptive design | Tested with limits | Web matrix includes fifteen viewport/orientation combinations, including width boundaries and 320px. Native responds to window dimensions, with device testing outstanding. |
| 11. Layered Go services/repositories | Implemented with limits | Handler/service/repository separation exists. Maintenance creation and vehicle updates are not one PostgreSQL transaction; initial chat-message errors and follow-up context need further work. |
| 12. Managed PostgreSQL | Not verified | Pooling, parameterized SQL and migrations exist. Missing maintenance table migration and note/video persistence repaired. No live database/migration run, TLS enforcement proof, backup/restore drill, least-privilege verification, or managed catalogue bootstrap performed. |
| 13. Gemini orchestration | Partial | Configurable model, server-only credentials, empty-response/cause validation, disclaimers and basic safety escalation. No paid fallback provider, token/cost accounting, full schema validation, reviewed grounding, or conversation-history prompt context. |
| 14. Quotas and conversations | Partial | Atomic memory reservation tested under 100 concurrent attempts; SQL row-lock implementation inspected. Failed requests refund; conversations can be created/resumed/deleted and scoped by vehicle. Request idempotency, crash-safe reservation recovery, plan policies, global spending limits and per-user request throttling remain missing. |
| 15. YouTube integration | Partial | Actual API response mapping and caching exist; fabricated fallback metadata removed. No live provider test, quota monitoring, cache-retention policy audit, or safe external-media provenance review. |
| 16. Security/privacy | Not passed for release | Password hashing, JWT, single-use refresh rotation and ownership guards present. Missing account deletion/data export, robust rate limiting, full RBAC enforcement, HttpOnly browser refresh cookies, production TLS verification, request-size limits and comprehensive error redaction/security scan. Logout revokes refresh credentials; already-issued JWTs remain valid until expiration. |
| 17. Performance | Partial | Web production build verified; layout is bounded and asset export is small. No measured native profiling, list virtualization, API pagination, load test or performance budget. Multiple quota-hook consumers still issue redundant reads. |
| 18. Testing and quality | Expanded, incomplete | Browser responsive/product/accessibility coverage and Go regression tests added. Local race detector unavailable with installed Windows toolchain; CI retains Linux race testing. Physical-device, PostgreSQL, real-provider, offline mutation recovery and comprehensive frontend-unit coverage remain outstanding. |
| 19. Development phases | Incomplete | Core phases exist; advanced and release-readiness phases are not finished. |
| 20. Strict implementation rules | Partial | Strong typing, shared logic, central endpoints and separate active styling improved. Remaining architecture/security/performance gaps above prevent full compliance. |
| 21–22. Documentation and original setup deliverables | Partial | Architecture README and this audit exist. Historical sequencing cannot be independently verified; ER diagram, release operating procedures and complete architectural decisions still need completion. |

## Defects repaired

1. Successful login/registration did not save tokens. Auth now saves them through the configured platform storage adapter.
2. Logout omitted the refresh token and retained local credentials. It now submits the refresh token, revokes it, clears credentials even on network failure, and resets account state.
3. Repeated 401s could cause an unbounded refresh/retry loop. Requests retry once and then clear the invalid session.
4. Refresh-token rotation used separate lookup/revocation without checking whether another caller had consumed it. Revocation now atomically checks the unrevoked session; concurrency tests permit one winner.
5. Both apps displayed invented vehicles, service history, or diagnosis results. Running screens now use real records and honest empty/unavailable states.
6. Chat context could carry into another vehicle; late responses could populate the wrong context. Context changes reset selection/messages and ignore stale responses. Drafts survive tab and width changes, including before a session exists.
7. Empty Go lists could return JSON null and break the frontend. Resource hooks normalize empty arrays.
8. Failed AI calls consumed quota. Uncompleted calls release their reserved slot, using the original UTC accounting date.
9. The YouTube fallback invented titles, channels, dates and thumbnails. It now returns no videos when search is unavailable; response bodies are closed on non-200 responses.
10. Invalid production configuration could silently start a development server with a known JWT secret, or use volatile memory after a DB failure. Startup now fails closed for those production cases and generates a random ephemeral development signing key when needed.
11. PostgreSQL lacked the maintenance table used by its repository. Migration 000002 adds it and preserves maintenance notes and chat video metadata.
12. Native lacked its declared entry point and used memory-only refresh storage. Expo registration and SecureStore persistence are now present.
13. Native dependency resolution and SVG versions prevented bundling. Metro resolves pnpm dependencies, shared hooks use the native React runtime, and react-native-svg matches the installed Expo SDK.
14. Web builds emitted stale JavaScript alongside TypeScript; Vite could resolve stale generated App.js. Build configuration now uses noEmit and generated source duplicates were removed.
15. The Docker database bootstrap referenced a nonexistent migration; Nginx did not proxy same-origin API requests. Migration mounts and API proxy configuration were repaired. Docker deployment was not run.
16. Browser checks found 320px heading overflow and low-contrast sidebar/safety captions. Wrapping and colors were corrected.

## Checks and their limits

| Executed check | Result |
|---|---|
| Workspace TypeScript checks | 12 of 12 packages passed |
| Shared CSS token consistency | Passed |
| Production web build | Passed; main bundle 411.86 kB / 124.80 kB gzip, CSS 16.27 kB / 4.19 kB gzip |
| Chromium, Firefox, WebKit suite | 76 passed; 2 deliberately skipped duplicate screenshot exports |
| Responsive checks | Fifteen viewport/orientation combinations per browser; phone composer visibility explicitly asserted |
| Accessibility scans | Selected phone/tablet/desktop light and dark screens passed automated WCAG A/AA checks |
| Real local API workflows | Registration, login, logout, refresh single-use concurrency, ownership isolation, vehicle creation, service records, reload, conversation resume/delete, AI failure refund passed |
| Go tests and go vet | Passed |
| Native JavaScript exports | Android and iOS passed; physical-device execution not verified |
| Go race detector | Not run successfully locally: incompatible Windows C toolchain; configured in Linux CI |
| Live PostgreSQL / Gemini / YouTube | Not verified |

Go coverage shows the limits of the current suite: AI 74.7%, auth 62.9%, config 100%, repositories 4.8%, services 70.2%, YouTube 22.2%. Repository coverage is low because real PostgreSQL is not exercised. HTTP browser tests run separately and are not included in these unit coverage figures.

Commands:

```sh
pnpm typecheck
pnpm theme:check
pnpm --filter @royo/web build
pnpm test
cd backend && go test ./...
cd backend && go vet ./...
pnpm --filter @royo/mobile exec expo export --platform android --output-dir dist-export
pnpm --filter @royo/mobile exec expo export --platform ios --output-dir dist-export-ios
```

The browser suite covers Chromium, Firefox and WebKit. Sizes: 320×568, 360×800, 390×844, 599×800, 600×900, 768×1024, 839×900, 840×900, 1024×768, 1199×900, 1200×900, 1440×960, 1920×1080, 2560×1440, and 844×390. Actual backend workflows are exercised at widths 390, 768 and 1440. Axe scans cover selected light/dark screens and sign-in dialogs; they do not certify every screen-reader interaction.

The local `go test -race` attempt could not compile: cgo is disabled by default, and the installed MSVC-target Clang does not support Go's required `-mthreads` option. Ordinary concurrency tests do run; Linux CI is configured for the race detector. This is a verification limitation, not a passing race check.

## Remaining release priorities

1. Provision a separate development PostgreSQL database, apply both migrations, bootstrap/review the motorcycle catalogue, and run repository integration tests and a restart persistence test. Verify TLS and backups.
2. Configure a valid Gemini key/model and YouTube key; test real responses, provider errors and video provenance. Validate the complete structured response and include bounded authorized conversation history.
3. Finish account privacy/deletion, request throttling, browser session hardening, transactional service recording, idempotency and durable quota reservation/recovery.
4. Decide whether subscriptions, notifications, repair guides, illustrations and the admin dashboard are launch requirements. They are not implemented and must not be advertised as complete.
5. Run signed development builds on physical phones/tablets, screen readers, keyboard/mouse devices, and resizable Chromebook windows; verify keyboard and safe-area behavior.
6. Add actual feature query endpoints/caching, lint rules, broader unit/DB tests, monitoring, restore procedures, deployment verification and store-release checks.

No production deployment, managed database mutation, app-store publication, or paid provider call was performed during this audit.

The configured Gemini default replaces the old hardcoded model and can be overridden through `GEMINI_MODEL`. Model availability was checked against [Google's model documentation](https://ai.google.dev/gemini-api/docs/models); the selected project still needs a real provider smoke test before launch.
