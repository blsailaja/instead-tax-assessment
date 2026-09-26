# INSTEAD Form Studio

> **Tax Form Annotation, Calibration, Validation, and Production PDF Export Studio for IRS Form 1040**

INSTEAD Form Studio is an open, declarative layout specification and visual engineering studio designed to decouple tax computation engines from document placement. It provides tax software developers, preparers, and document automation engineers with an interactive environment to map, validate, calibrate, and print accurate return data onto government tax forms.

---

## 🚀 Key Features

- **Standardized Specification Contract (v1.0.0)**
  - Normalized 72 DPI PDF point coordinate system with an intuitive top-left origin.
  - Native field types: `text`, `currency`, `checkbox`, `comb`, `multiline`, and `date`.
  - Dynamic comb cell partitioning for SSNs and bank routing/account numbers.
- **Interactive Visual Canvas**
  - High-fidelity PDF rendering via `pdfjs-dist`.
  - Live bounding-box drawing, resizing, and 1.0pt magnetic snapping.
  - Multi-page navigation (IRS Form 1040 Page 1 & Page 2) with smooth zoom controls.
- **Dynamic Nested Data Binding**
  - Evaluates structured tax return data into form fields using JSONPath syntax.
  - Supports array wildcards, slices, and aggregations (e.g., `income.w2[*].wages`).
  - Field formatters: currency parentheses, zero-blanking, and SSN digit masking.
- **Real-time Validation Engine**
  - **Printer Margin Safety**: Enforces a 0.25-inch (18pt) physical printable margin threshold.
  - **Text Overflow Simulation**: Predicts text clipping based on dynamic font metrics.
  - **Collision Detection**: Detects overlapping fields and static form line conflicts.
  - **Schema Verification**: Flags missing paths and invalid data types before export.
- **Hardware Printer Calibration**
  - Sub-millimeter horizontal (X) and vertical (Y) drift adjustments to compensate for mechanical office printer drift.
  - Printable alignment test page with crosshair grids and centimeter scales.
- **Dual-Mode Production PDF Export**
  - **Composite PDF**: Merges original IRS form artwork with dynamic calculated return values.
  - **Overlay-Only PDF**: Generates pure ink layers for feeding official pre-printed blank IRS stock into high-speed office printers.
- **Guided 5-Minute Video Walkthrough & Live Demo (`/walkthrough`)**
  - Autonomous 5-minute video presentation with integrated Web Speech audio narration and subtitles.
  - Embedded live functional Form 1040 studio with 1-click feature exploration triggers.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [TanStack Start](https://tanstack.com/start) + [Vite](https://vite.dev/) + [React 19](https://react.dev/)
- **Routing & State**: TanStack Router with type-safe URL navigation and in-memory undo/redo history stacks.
- **Document Engine**: [PDF.js](https://mozilla.github.io/pdf.js/) (viewer rendering) & [pdf-lib](https://pdf-lib.js.org/) (vector PDF generation and flattening).
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), Radix UI primitives, Lucide Icons, and Sonner notifications.
- **Language & Quality**: TypeScript with strict mode, ESLint, and Prettier.

---

## 📁 Repository Structure

```
├── docs/
│   ├── INSTEAD-annotation-spec.md  # Detailed technical specification
│   ├── annotation-schema.json      # JSON Schema v1.0.0 definition
│   └── form-1040-page-1.example.json
├── src/
│   ├── components/
│   │   ├── SiteHeader.tsx          # Main navigation header
│   │   ├── studio/                 # Visual editor components
│   │   │   ├── PageCanvas.tsx      # Interactive PDF canvas & bounding boxes
│   │   │   ├── Inspector.tsx       # Field property editor & data binding
│   │   │   ├── Sidebar.tsx         # Layer list and validation issues
│   │   │   ├── CalibrationPanel.tsx# Printer drift offset controls
│   │   │   ├── ExportDialog.tsx    # PDF-lib export dialog
│   │   │   └── useStudio.ts        # Central studio state machine
│   │   └── ui/                     # UI components
│   ├── data/
│   │   ├── f1040.template.json     # IRS Form 1040 (2025) annotation template
│   │   └── sample-return.json      # Sample taxpayer return data
│   ├── lib/
│   │   └── annotation/             # Layout calculation, formatting & PDF export logic
│   └── routes/
│       ├── index.tsx               # Landing page
│       ├── spec.tsx                # Specification documentation viewer
│       ├── studio.tsx              # Main annotation workspace
│       └── walkthrough.tsx         # 5-minute video walkthrough & live demo
└── metadata.json                   # Applet metadata and capabilities
```

---

## 💻 Getting Started Locally

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Installation & Run

```bash
# 1. Clone the repository
git clone <repo-url>
cd instead-form-studio

# 2. Install dependencies
npm install

# 3. Start local development server (runs on port 3000)
npm run dev

# 4. Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Future Roadmap & Enhancements

1. **State Tax Return Expansion**: Add standard templates for state tax forms (e.g., California Form 540, New York IT-201, and federal Schedules 1-3).
2. **AI Multimodal Draft Form Ingestion**: Integrate Gemini multimodal vision to automatically identify boxes on newly released IRS draft forms and generate annotation coordinates in seconds.
3. **Cryptographic Template Signatures**: SHA-256 template hashing and digital signatures to guarantee audit compliance across production tax runs.
4. **Wasm Batch Generation**: High-performance WebAssembly PDF flattening for batch-rendering 10,000+ returns per minute.

---

## 📄 License

MIT License.
