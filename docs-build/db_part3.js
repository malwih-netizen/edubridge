// System Analysis & Database Design — Part 3: database design, data dictionary, SQL, security, API mapping.
const fs = require('fs');
const path = require('path');
const { P, H1, H2, H3, bullets, numbered, table, figure, code, note } = require('./lib');
const { parse } = require('./schema_parse');

const API = path.join(__dirname, '..', 'edubridge-api', 'database');
const sqlBlock = (file, table) => {
  const s = fs.readFileSync(path.join(API, file), 'utf8');
  const m = s.match(new RegExp(`CREATE TABLE ${table} \\([\\s\\S]*?\\) ENGINE=InnoDB[^;]*;`));
  return m ? m[0] : '';
};
const viewBlock = (name) => {
  const s = fs.readFileSync(path.join(API, 'views.sql'), 'utf8');
  const m = s.match(new RegExp(`CREATE OR REPLACE VIEW ${name} AS[\\s\\S]*?;`));
  return m ? m[0] : '';
};

const GROUPS = [
  ['9.6.1 Users & authentication', ['users', 'user_sessions', 'password_resets', 'email_verifications']],
  ['9.6.2 Students & documents', ['students', 'student_countries', 'document_types', 'documents']],
  ['9.6.3 Scholarships & matching', ['scholarships', 'scholarship_levels', 'scholarship_fields', 'scholarship_nationalities', 'scholarship_documents', 'match_scores']],
  ['9.6.4 Services, applications & CRM', ['services', 'service_requests', 'applications', 'application_documents', 'application_stage_history', 'notes', 'communications']],
  ['9.6.5 Notifications, contact & audit', ['notifications', 'notification_settings', 'contact_messages', 'audit_log']],
];

module.exports = () => {
  const tables = parse();
  const byName = Object.fromEntries(tables.map((t) => [t.name, t]));
  const dictionary = [];
  GROUPS.forEach(([title, names]) => {
    dictionary.push(H3(title));
    names.forEach((n) => {
      const t = byName[n];
      dictionary.push(P(`**${t.name}** — ${t.info}`, { para: { keepNext: true } }));
      dictionary.push(...table(['Column', 'Type', 'Null', 'Key', 'Default', 'Description'],
        t.cols.map((c) => [c.col, c.type.replace(/ENUM\((.*)\)/, (x, v) => `ENUM(${v.replace(/,/g, ', ')})`), c.nullable, c.keys, c.def, c.desc]),
        [18, 22, 7, 8, 13, 32], null, { size: 15 }));
    });
  });

  return [
    H1('9. Database Design'),
    H2('9.1 Design approach'),
    P('The database was designed top-down: entities were taken from the proposal modules, refined into a conceptual ERD, then into a logical relational model in **third normal form (3NF)**, and finally implemented in MySQL with InnoDB (transactions + foreign keys) and the `utf8mb4` character set so that Arabic and English text are stored correctly.'),
    ...table(['Decision', 'Reason'], [
      ['One `users` table for all roles + `students` (1 : 0..1)', 'Shared login and security for every role; only students have academic data.'],
      ['Multi-valued attributes in their own tables', 'Levels, fields, nationalities and preferred countries need many values per row (1NF).'],
      ['ENUM for fixed status values', 'The state diagrams define a closed set of values; ENUM rejects invalid data.'],
      ['`match_scores` as a cache table', 'Scores are expensive to recompute on every page; they are refreshed when inputs change.'],
      ['History tables (`application_stage_history`, `audit_log`)', 'Full traceability of who changed what and when.'],
      ['Files on disk, metadata in MySQL', 'Keeps the database small; paths are not public.'],
    ], [42, 58], 'Main design decisions'),
    H2('9.2 Conceptual ERD'),
    P('The overview shows the main entities and their relationships. Link tables are shown in the detailed ERDs that follow.'),
    ...figure('erd_overview', 'Conceptual ERD (main entities)', 6.27, 4.0),
    H2('9.3 Logical ERDs by module'),
    ...figure('erd_users', 'ERD — users, authentication and notifications', 6.27, 5.6),
    ...figure('erd_students', 'ERD — students and documents', 3.6, 7.2),
    ...figure('erd_scholarships', 'ERD — scholarships and match results', 6.27, 4.4),
    ...figure('erd_crm', 'ERD — services, applications and CRM', 6.27, 4.2),
    H2('9.4 Normalisation'),
    ...bullets([
      '**1NF** — every column holds one atomic value. Repeating groups (study levels, fields, nationalities, preferred countries) were moved to their own tables, e.g. `scholarship_levels(scholarship_id, level)`.',
      '**2NF** — tables with composite keys (`student_countries`, `scholarship_fields`, `match_scores`, `notification_settings`) contain no attribute that depends on only part of the key.',
      '**3NF** — no transitive dependencies: document type names live in `document_types`, service names in `services`, and only codes are stored in `documents` and `service_requests`.',
      '**Controlled redundancy** — `match_scores` stores computed values on purpose (caching) and can be rebuilt at any time from the source tables.',
    ]),
    H2('9.5 Keys, constraints and indexes'),
    ...table(['Rule', 'Where', 'Purpose'], [
      ['Primary keys', 'Every table (AUTO_INCREMENT or composite)', 'Unique row identity'],
      ['34 foreign keys', 'ON DELETE CASCADE for owned data, SET NULL for staff references', 'Referential integrity'],
      ['UNIQUE', '`users.email`, `user_sessions.token_id`, `applications.code`, (student, scholarship)', 'No duplicates'],
      ['CHECK', '`stage BETWEEN 0 AND 7`', 'Valid workflow stage'],
      ['Indexes', '`users(role,status)`, `scholarships(status,country,deadline)`, `documents(student_id,type_code)` …', 'Fast filtering and dashboards'],
    ], [18, 52, 30], 'Integrity rules'),
    H2('9.6 Data dictionary'),
    P(`The dictionary below is generated directly from \`database/schema.sql\`, so it always matches the real database: **${tables.length} tables** and **${tables.reduce((a, t) => a + t.cols.length, 0)} columns**.`),
    ...dictionary,

    H2('9.7 SQL implementation'),
    H3('Table definitions (excerpt)'),
    ...code(sqlBlock('schema.sql', 'documents'), 'documents — file metadata with review status'),
    ...code(sqlBlock('schema.sql', 'applications'), 'applications — 8-stage workflow'),
    H3('Example queries used by the API'),
    ...code([
      '-- Scholarship directory: master programmes in Germany (public page)',
      "SELECT * FROM scholarships",
      " WHERE status <> 'draft' AND country = ?",
      "   AND id IN (SELECT scholarship_id FROM scholarship_levels WHERE level = ?)",
      " ORDER BY FIELD(status,'open','upcoming','closed'), deadline;",
      '',
      '-- Sign in: one session row per device (JWT id)',
      'INSERT INTO user_sessions (user_id, token_id, device_type, browser, os, ip_address)',
      'VALUES (?, ?, ?, ?, ?, ?);',
      '',
      '-- Move an application to the next stage and keep the history (one transaction)',
      'START TRANSACTION;',
      'UPDATE applications SET stage = ? WHERE id = ?;',
      'INSERT INTO application_stage_history (application_id, from_stage, to_stage, changed_by, note)',
      'VALUES (?, ?, ?, ?, ?);',
      'COMMIT;',
    ], 'Prepared statements (the ? placeholders are bound by PDO)'),
    H3('Reporting views'),
    P('Seven views implement the statistics required by the Reporting Module of the proposal. They are created by `database/views.sql`.'),
    ...table(['View', 'Answers'], [
      ['v_totals', 'Number of students, requests, applications and decisions'],
      ['v_countries_demand', 'Most requested destination countries'],
      ['v_services_demand', 'Most requested services'],
      ['v_application_stages', 'Application status statistics'],
      ['v_acceptance_rate', 'Acceptance statistics'],
      ['v_employee_workload', 'Employee workload'],
      ['v_student_readiness', 'Readiness score of every student'],
    ], [32, 68], 'Reporting views'),
    ...code(viewBlock('v_employee_workload'), 'v_employee_workload'),
    ...table(['employee', 'students', 'open_requests', 'completed_requests', 'active_applications'], [
      ['Maya Khalil', '4', '1', '0', '2'],
      ['Omar Farouk', '1', '0', '1', '0'],
      ['Noor Hassan', '1', '0', '0', '0'],
    ], [30, 14, 18, 20, 18], 'Result of v_employee_workload on the demo data'),

    H2('9.8 Security'),
    ...bullets([
      'Passwords and reset codes are stored only as **bcrypt hashes** (`password_hash`).',
      'All queries use **PDO prepared statements** with emulation disabled — no string concatenation of user input.',
      'Each token is linked to a `user_sessions` row; signing out or “sign out other devices” sets `revoked_at`.',
      'Routes declare their roles; the router returns **401** without a valid token and **403** for the wrong role.',
      'Uploaded files: MIME detected from content, 10 MB limit, random names, stored outside `public/`.',
      'The application database user should have only SELECT, INSERT, UPDATE, DELETE on `edubridge` in production.',
    ]),
    H2('9.9 Backup and recovery'),
    ...table(['Task', 'How', 'When'], [
      ['Full backup', '`mysqldump --single-transaction --routines edubridge > edubridge_YYYYMMDD.sql`', 'Daily, 02:00'],
      ['Uploaded files', 'Copy `storage/uploads/` to backup storage', 'Daily'],
      ['Retention', 'Keep 14 daily + 8 weekly copies', 'Automatic'],
      ['Restore test', 'Restore the latest dump into a test database and run the API health check', 'Monthly'],
      ['Reset demo data', '`php bin/setup.php --fresh`', 'Before presentations'],
    ], [18, 60, 22], 'Backup plan'),

    H1('10. API and Database Mapping'),
    P('The table maps the implemented REST endpoints to the tables they read or write. The full interactive documentation is available at `http://localhost:8000/docs` (Swagger) and as a Postman collection.'),
    ...table(['Endpoint', 'Access', 'Tables'], [
      ['POST /api/auth/register', 'Public', 'users, students, student_countries, email_verifications, user_sessions'],
      ['POST /api/auth/login · /logout', 'Public / signed in', 'users, user_sessions'],
      ['POST /api/auth/forgot-password · /verify-code · /reset-password', 'Public', 'password_resets, users, user_sessions'],
      ['GET /api/scholarships · /scholarships/{id}', 'Public', 'scholarships, scholarship_levels, scholarship_fields, scholarship_nationalities'],
      ['POST · PUT /api/scholarships', 'Advisor / Admin', 'scholarships + link tables'],
      ['GET · PUT /api/students/me', 'Student', 'users, students, student_countries'],
      ['GET · POST /api/students/me/documents', 'Student', 'documents, document_types'],
      ['GET /api/students/me/readiness', 'Student', 'documents, document_types'],
      ['GET /api/students/me/recommendations', 'Student', 'students, scholarships…, match_scores'],
      ['GET /api/students/me/applications', 'Student', 'applications, scholarships, users'],
      ['POST /api/service-requests', 'Student', 'service_requests, services'],
      ['/api/account/*', 'Signed in', 'user_sessions, users, email_verifications, notification_settings'],
      ['POST /api/contact', 'Public', 'contact_messages'],
    ], [42, 17, 41], 'Endpoints and tables', { size: 16 }),

    H1('11. Conclusion'),
    P('The analysis models and the database design together describe a complete, consistent system: every use case is supported by API endpoints, every endpoint uses well-defined tables, and every status value follows a state diagram. The database is implemented, seeded with demo data and verified through the running API, Swagger and an automated Postman run (33 requests passed).'),
    note('Next steps', [
      'Implement the remaining CRM and administrator endpoints on the same tables.',
      'Add the scheduled jobs (deadline reminders, re-matching) described in the AI & Automation report.',
      'Prepare production configuration: restricted database user, HTTPS and automated backups.',
    ]),
  ];
};
