# EduBridge React — conventions

Stack: Vite 5 · React 18 (JSX) · React Router 6 · react-i18next · lucide-react 0.453 · recharts 2.13 · axios.

## Read before writing a page
- `src/components/ui/index.jsx` — Button, IconButton, Card, Badge (+ `statusTone`), PageHeader, StatCard, ProgressRing, ProgressBar, Avatar, Field, Input, Select, Textarea, Tabs, DataTable, EmptyState, Modal, Stepper.
- `src/styles/components.css`, `src/styles/layout.css` — available classes (`grid grid-2/3/4`, `row`, `between`, `stack`, `list`, `list-item`, `form-grid`, `span-2`, `badge-*`, `btn-*`, `table`, `chips/chip`, `link`, `text-muted`, `divider`, `fade-up`).
- `src/hooks/index.js` — `useAsync(fn, deps)`, `useLocalized()` → `loc(obj,'name')` (picks `nameAr` in Arabic), `fmtDate`, `fmtNum`, `isAr`.
- `src/services/dataService.js` (+ `mockData.js`, `matching.js`) — all data access. Never import mockData into pages directly unless no service exists.
- `src/locales/en/common.json` — shared keys: `nav`, `actions`, `status`, `match`, `results`, `funding`, `levels`, `countries`, `fields`, `docTypes`, `services`, `departments`, `priority`, `time`, `toast`, `empty`.
- Reference page: `src/pages/student/Dashboard.jsx` + `src/pages/student/student.css`.

## Rules
1. **No hard-coded UI text.** Use `t()` from the section namespace (`public`, `student`, `employee`, `admin`) or `common`. Every key goes into BOTH `src/locales/en/<ns>.json` and `src/locales/ar/<ns>.json` with identical key sets. Arabic = clear professional Modern Standard Arabic.
2. **RTL-safe CSS only**: logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-start`, `text-align: start`). Never `left`/`right` for layout. Directional icons (ArrowRight, ChevronRight, ArrowLeft…) get `className="flip-rtl"`.
3. Section styles live in `src/pages/<section>/<section>.css`, imported by the page. Do not edit shared files (`components/ui`, `styles/*`, `common.json`, `App.jsx`, `mockData.js`, `dataService.js`).
4. Charts (recharts): navy `#0f2c55`, gold `#c9952d`, `#e0b354`, `#24508a`, `#95a5b9`. In Arabic: `XAxis reversed`, `YAxis orientation="right"`.
5. Brand: navy structure, gold primary actions (`Button` default variant = gold), headings use the display font automatically.
6. Every list/table needs a loading and an empty state; demo-only actions show a toast (`useToast`).
7. Responsive: one column under 720px; no horizontal page scroll.
