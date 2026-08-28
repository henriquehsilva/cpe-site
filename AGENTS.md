# AGENTS.md

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + Firebase (Auth + Firestore) + Cloudinary (images). UI strings and data layer are in pt-BR.

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # Production build — runs `vite build` ONLY, does NOT type-check
npm run lint     # ESLint (flat config: eslint.config.js)
npm run preview  # Serve production build locally
```

- No test framework is configured.
- There is no `typecheck` script. Type errors are NOT caught by `npm run lint` or `npm run build`. Run `npx tsc --noEmit` manually to type-check before relying on a build.

## Environment Variables

Required in `.env` (all `VITE_` prefixed; client-exposed):

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`, `VITE_CLOUDINARY_API_KEY`, `VITE_CLOUDINARY_API_SECRET`

`src/firebase.ts` throws at startup if any of `apiKey`, `authDomain`, `projectId`, or `appId` is missing.

## Architecture

- **Entry**: `src/main.tsx` → `src/App.tsx`.
- **Auth / RBAC**: Firebase Auth. Admin users live in the Firestore `adminUsers` collection; roles are read in `src/contexts/RBACContext.tsx`. Super admin email is hardcoded in `src/types/rbac.ts` (`SUPER_ADMIN_EMAIL`) — change it there, not in the dashboard.
- **Data model (unusual — do not assume plain Firestore)**:
  - Each business module's seed/default data is a TS file under `src/data/` (e.g. `src/data/viaturas.ts`).
  - Modules persist state with `usePersistentState(key, seed)` (`src/hooks/usePersistentState.ts`). It writes to `localStorage` AND mirrors to the Firestore `adminData` collection (doc id = sanitized key). On load, Firestore wins if it has data; otherwise localStorage does.
  - Firestore is used directly (outside `usePersistentState`) only for: admin users (`adminUsers`), photos (`photos`, via `src/services/photosService.ts`), and as the sync backend above. Treat `adminData` as a cache, not the source of truth.
- **Adding a module requires wiring 4 places**:
  1. `src/types/rbac.ts`: add a `ModuleKey`, a `MODULE_LABELS` entry, a `MODULE_ID_TO_KEY` entry (menu id → key), and a `DEFAULT_PERMISSIONS` entry.
  2. `src/components/AdminDashboard.tsx`: add to `ALL_MODULES` (menu entry), import the component, and add a render case in the big ternary.
  3. `src/components/admin/<Name>Module.tsx`: default-exported component with props `{ onBack, permissions? }`; gate create/edit/delete on `permissions` (super admin passes `undefined` = full access).
  4. `src/data/<module>.ts`: seed array passed to `usePersistentState('cpe-site:<module>:vN', seed)`.
  - Gotcha: `ALL_MODULES` lists `medalhas` and `lesp`, but neither has a component or render case — clicking them just re-renders the module grid. Don't assume all 14 menu items have working modules; only 12 do.
- **PWA**: manual service worker in `public/sw.js` (not generated). Bump the `CACHE` constant (`cpe-v5`) on every deploy.

## Tailwind

Custom colors: `cpe-dark`, `cpe-gray`, `cpe-red`, `cpe-gold` (config at `tailwind.config.js`). The admin UI is themed via CSS variables (`--adm-*`) injected per theme from `src/data/themes.ts`, not via Tailwind classes alone.

## Conventions

- `lucide-react` for all icons; `xlsx` (imported as `XLSX`) for Excel export.
- Portuguese (pt-BR) in all UI strings and data fields.
- Module registry and permissions live in code (`src/types/rbac.ts` + `AdminDashboard.tsx`), not in a database table.
