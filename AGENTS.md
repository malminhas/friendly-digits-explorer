# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side React/TypeScript SPA (no backend, no database, no external APIs). All ML computation runs in-browser.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Vite Dev Server | `npm run dev` | 8080 | Only required service for development |

### Key Commands

See `package.json` scripts. Standard commands:
- **Dev server**: `npm run dev` (port 8080)
- **Lint**: `npm run lint` (ESLint 9; has 4 pre-existing errors in shadcn/ui components and tailwind config)
- **Build**: `npm run build`
- **Preview**: `npm run preview` (port 8081)

### Caveats

- The MNIST dataset binary files (~55 MB) are pre-committed in `public/data/`. No download step needed.
- Trained model state is stored in browser `localStorage` — clearing browser data resets the model.
- The Vite dev server listens on `::` (all interfaces), port 8080. The `preview` server uses port 8081.
- Docker and Terraform configs exist for production deployment only; not needed for development.
