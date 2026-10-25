# EduBridge — Frontend (React)

The front end for the **Edu Bridge – Smart Scholarship and Student Services Management System**: three portals (student, advisor/employee, admin) plus the public site, fully bilingual (Arabic RTL / English LTR).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

Without a backend the app runs on demo data. Demo accounts (any password of 6+ characters), or use the **Demo access** buttons on the sign-in page:

| Role | Email |
|---|---|
| Student | `student@edubridge.app` |
| Advisor | `advisor@edubridge.app` |
| Admin | `admin@edubridge.app` |

To connect the PHP API (`../edubridge-api`, MySQL), set `VITE_API_URL=http://localhost:8000/api` in `.env`. Endpoints that are already built use the real API; the rest (advisor CRM, admin) keep using demo data until they are implemented — see `LIVE_ROUTES` in `src/services/api.js`. Every request then goes to the API with the `Authorization: Bearer <token>` and `Accept-Language` headers.

## Structure

```
src/
  assets/            logo + optimised photos
  components/
    ui/              shared UI kit (Button, Card, Badge, Field, Modal, DataTable, Stepper…)
    layout/          PortalLayout (sidebar + topbar), Logo, LangToggle
    ScholarshipCard.jsx
  config/navigation.js   sidebar menu per role
  context/           AuthContext (session + roles), ToastContext
  hooks/             useAsync, useLocalized (loc / fmtDate / fmtNum)
  i18n/              i18next setup — sets <html lang dir> automatically
  locales/{en,ar}/   one JSON file per section: common, public, auth, student, employee, admin
  pages/
    public/  auth/  student/  employee/  admin/  shared/
  routes/ProtectedRoute.jsx   role-based access
  services/
    api.js           axios instance (token, language, 401 handling)
    authService.js   login / register / password reset
    dataService.js   student, scholarship, CRM and admin endpoints
    matching.js      rule-based match score + readiness score (proposal weights)
    mockData.js      demo data until the backend is ready
  styles/            tokens (colours, fonts), base, components, layout
```

## Language & direction

- Toggle with the language button (top bar / sign-in page). The choice is saved and sets `dir="rtl"` for Arabic.
- Fonts: English — Plus Jakarta Sans (text) + Fraunces (headings); Arabic — IBM Plex Sans Arabic (text) + Noto Kufi Arabic (headings).
- CSS uses logical properties (`margin-inline-start`, `inset-inline-end`…), so layouts mirror automatically. Directional icons use the `flip-rtl` class.
- Add every new text to **both** `locales/en/<section>.json` and `locales/ar/<section>.json`.

See `CONVENTIONS.md` for the coding rules used across the project.
