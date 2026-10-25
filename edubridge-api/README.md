# EduBridge API (PHP + MySQL)

REST API for **Edu Bridge – Smart Scholarship and Student Services Management System**.
Plain PHP 8 (no framework, no Composer) + MySQL/MariaDB through PDO. All queries use prepared statements.

## Run locally

Requirements: PHP 8.1+ with `pdo_mysql`, and MySQL or MariaDB (XAMPP works).

```bash
cp .env.example .env          # then set DB_* and a long random JWT_SECRET
php bin/setup.php             # creates the `edubridge` database, tables and demo data
php -S localhost:8000 -t public public/index.php
```

Reset everything to clean demo data: `php bin/setup.php --fresh`

In the React app (`edubridge-react/.env`): `VITE_API_URL=http://localhost:8000/api`

Demo accounts (password `demo1234`): `student@edubridge.app`, `advisor@edubridge.app`, `admin@edubridge.app`.

## API documentation

- **Swagger:** http://localhost:8000/docs — every endpoint with examples and "Try it out". Run `POST /auth/login` first; the token is applied automatically (or press **Authorize**).
- **Postman:** import `docs/EduBridge.postman_collection.json` (and optionally `docs/EduBridge.local.postman_environment.json`). Start with **Auth → POST /auth/login**; the token is saved for the other requests. Staff endpoints sign in as the advisor automatically. The whole collection can be run with **Run collection** (33 requests).
- Both are generated from `docs/generate.py` — after adding an endpoint, add it there and run `python docs/generate.py`.

## Structure

```
public/index.php          front controller + all routes
src/Core/                 Env, Database (PDO), Router, Request, Response, Jwt, Auth, Validator
src/Controllers/          Auth, Scholarship, Student, Account, Contact, Health
src/Services/Matching.php scholarship match score + readiness score (proposal weights)
src/Services/Mapper.php   DB rows (snake_case) → JSON for the React app (camelCase)
database/schema.sql       25 tables (utf8mb4 — Arabic + English)
database/seed.sql         demo data
storage/uploads/          uploaded documents (outside public/)
```

## Conventions

- **Auth:** `Authorization: Bearer <JWT>` (HS256). Each sign-in creates a row in `user_sessions`, so a device can be signed out remotely; sign-out revokes the token.
- **Roles:** routes are public, any signed-in user, or limited to `student` / `employee` / `admin` (see `public/index.php`).
- **Errors:** `{ "error": { "code": "validation_failed", "details": { "email": "email" } } }` with the matching HTTP status (401, 403, 404, 409, 422, 500).
- **Uploads:** PDF, JPG, PNG, DOCX up to 10 MB; the type is checked from the file content, stored with a random name.

## Endpoints (ready)

| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/register` · `/auth/login` · `/auth/forgot-password` · `/auth/verify-code` · `/auth/reset-password` · `/auth/resend-confirmation` | public |
| GET / POST | `/api/auth/me` · `/auth/logout` | signed in |
| GET | `/api/scholarships?level=&country=&field=&funding=&status=&q=` · `/scholarships/{id}` | public |
| POST / PUT | `/api/scholarships` · `/scholarships/{id}` · `/scholarships/{id}/results` | employee, admin |
| GET / PUT | `/api/students/me` | student |
| GET / POST | `/api/students/me/documents` (multipart `type`, `file`) | student |
| GET | `/api/students/me/readiness` · `/recommendations` · `/applications` · `/service-requests` | student |
| POST | `/api/service-requests` | student |
| GET / DELETE / POST | `/api/account/sessions` · `/account/sessions/{id}` · `/account/sessions/revoke-others` | signed in |
| PUT / POST | `/api/account/profile` · `/account/email` · `/account/password` · `/account/security` · `/account/notifications` | signed in |
| POST | `/api/contact` | public |

## Next (not built yet — the React app shows demo data for these)

- CRM for advisors: students list, Student 360, notes, communication log, request assignment, stage changes, document review.
- Admin: users & roles, reports.
- Email sending (PHPMailer) for confirmation and reset codes — in `APP_ENV=local` the reset code is returned in the response for testing.
- Groq API explanation for match results.
