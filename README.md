# JSON Schema Forge

Convert JSON into ready-to-use **TypeScript interfaces/types**, **Zod schemas**, and
**JSON Schema (draft 2020-12)** — entirely in your browser. Paste JSON or upload a `.json` file, tweak the generation
settings, and copy or download the result.

**Live app:** https://json-schema-forge-eight.vercel.app

## Features

- **Live generation** — output updates as you type (debounced), side by side in Monaco editors
- **Smart inference**
    - nested objects and arrays of arbitrary depth
    - optional-field detection across array samples (`discount?: number`)
    - `null` handling (`string | null` → `z.string().nullable()`) and union types
    - empty/heterogeneous array merging (`[] ∪ [{…}]` → typed element)
    - PascalCase type naming from key paths (`user.address` → `UserAddress`), collision-safe
- **Generation settings** — `interface` vs `type`, optional style (`key?: T` vs
  `key: T | undefined`), `unknown[]` vs `any[]` for empty arrays, `readonly` output,
  literal types, `z.infer` exports, custom root type name, type name prefix/suffix
  (`IUser`, `UserDto`)
- **Privacy by design** — no backend: your JSON never leaves the browser

## Getting started

```bash
npm install
npm run dev   # http://localhost:3000
```

## Scripts

| Command                | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | start the dev server                  |
| `npm run build`        | production build (includes typecheck) |
| `npm run lint`         | ESLint                                |
| `npm run typecheck`    | `tsc --noEmit`                        |
| `npm run format`       | Prettier write                        |
| `npm run format:check` | Prettier check (used in CI)           |

## How it works

```
raw JSON ─► parse.ts ─► infer.ts ─► IR (ir.ts) ─┬─► generate-ts.ts          ─► TypeScript
                                                ├─► generate-zod.ts         ─► Zod schema
                                                │     (format.ts → Prettier standalone)
                                                └─► generate-json-schema.ts ─► JSON Schema
```
