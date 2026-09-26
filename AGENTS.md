# Engineering Guidelines — INSTEAD Form Studio

Guidelines for developers and autonomous agents working on INSTEAD Form Studio.

## Architecture
- **Framework**: TanStack Start + Vite + React 19
- **Styling**: Tailwind CSS v4
- **PDF Engine**: PDF.js for visual rendering & pdf-lib for vector flattening
- **Annotation Specification**: INSTEAD v1.0.0 (top-left 72 DPI origin)

## Workflow
- Keep components modular and functional.
- Maintain strict typing with TypeScript and JSON schema alignment.
- Verify changes with `npm run lint` and `npm run build`.
