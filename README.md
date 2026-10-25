# Edu Bridge – Smart Scholarship and Student Services Management System

Graduation project, University College of Science and Technology (UCST), Computer Systems Engineering, 2026/2027.
Supervisor: Ms. Amina Al-Salout.

Live demo: https://edubridge.infinityfreeapp.com

## Team

| Student | ID | Part |
|---|---|---|
| Lamia Fathi Hamdi Madi | 220217142 | Backend (PHP API) |
| Nada Musa Abdul Qader Al-Asital | 220217234 | Frontend (React) |
| Alaa Suleiman Abdulrahman Abu Mustafa | 220217287 | Database design & integration |
| Janeen Osama Atiya Al-Qutati | 220217280 | AI recommendation, CRM & evaluation |

## Repository

| Folder | Contents |
|---|---|
| `edubridge-react/` | React 18 + Vite site, Arabic (RTL) / English, student, advisor and admin dashboards |
| `edubridge-api/` | PHP 8 REST API, MySQL schema/seed/views, Swagger (`/docs`) and Postman collection |
| `deploy/` | Scripts that build and upload the InfinityFree package |
| `docs/` | System Analysis & Database Design, AI Integration & Automation (Word + PDF) |
| `docs-build/` | Scripts that generate those documents and their diagrams |
| `team-tasks/` | Task sheets for each team member |
| `front end/` | The original static HTML prototype |

## Run locally

Needs PHP 8.1+, MySQL/MariaDB (e.g. XAMPP) and Node 18+.

```bash
cd edubridge-api
cp .env.example .env        # set DB_* and JWT_SECRET
php bin/setup.php           # creates the database, demo data and views
php -S localhost:8000 -t public public/index.php
```

```bash
cd edubridge-react
cp .env.example .env        # VITE_API_URL=http://localhost:8000/api
npm install
npm run dev                 # http://localhost:5173
```

Demo accounts (password `demo1234`): `student@edubridge.app`, `advisor@edubridge.app`, `admin@edubridge.app`.
API documentation: http://localhost:8000/docs
