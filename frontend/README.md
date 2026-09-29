# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Weather map tiles

The map uses CARTO's light basemap when no tile API is configured. To use a MapTiler key, copy `.env.example` to `.env.local` and set:

```env
VITE_MAP_API_KEY=your_maptiler_key
```

For another XYZ tile service, configure `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION`; the URL may contain `{apiKey}` where the key belongs. Vite reads these values when it starts, so restart the dev server after editing `.env.local`. Vite variables are included in browser code: use a public client key restricted to your deployed domains, never a server secret.

## Replay controls

Historical replay advances the storm visualization and observations together. Use the timeline and speed controls, or Space to play/pause, the arrow keys to step, and Home to return to the first frame. Export data downloads the loaded replay frames as CSV.

The Safety & Shelters page stores a user-confirmed location and readiness checklist in browser storage. Locations are not uploaded or verified by the service; confirm shelter availability with local authorities before travelling.
