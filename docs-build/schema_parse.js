// Reads database/schema.sql and returns tables → columns, keys, references (for the data dictionary).
const fs = require('fs');
const path = require('path');

const SQL = fs.readFileSync(path.join(__dirname, '..', 'edubridge-api', 'database', 'schema.sql'), 'utf8');

const TABLE_INFO = {
  users: 'Every account (student, advisor/employee, administrator) with credentials and status.',
  user_sessions: 'One row per signed-in device; the JWT id (jti) lets a device be signed out remotely.',
  password_resets: 'Hashed 6-digit reset codes with a 10-minute expiry.',
  email_verifications: 'Pending email confirmations (sign-up and email change).',
  students: 'Academic and personal profile of a student (1 : 0..1 with users).',
  student_countries: 'Preferred destination countries of a student (max. 3).',
  document_types: 'Catalogue of document types and their weight in the readiness score.',
  documents: 'Uploaded files, their review status and reviewer.',
  scholarships: 'Scholarship records with eligibility criteria, window and results status.',
  scholarship_levels: 'Study levels a scholarship offers (multi-valued attribute).',
  scholarship_fields: 'Academic fields a scholarship covers (multi-valued attribute).',
  scholarship_nationalities: 'Eligible nationalities; the value "all" means open to everyone.',
  scholarship_documents: 'Documents a scholarship requires.',
  match_scores: 'Cached result of the matching engine for each student–scholarship pair.',
  services: 'Catalogue of the seven consultancy services.',
  service_requests: 'Service requests submitted by students and handled by advisors.',
  applications: 'Scholarship applications and their position in the 8-stage workflow.',
  application_documents: 'Documents reused in an application (many-to-many).',
  application_stage_history: 'Audit trail of every stage change of an application.',
  notes: 'Internal advisor notes about a student (CRM).',
  communications: 'Log of calls, WhatsApp messages, emails and meetings (CRM).',
  notifications: 'In-app notifications per user (bilingual).',
  notification_settings: 'Per-user notification preferences by category and channel.',
  contact_messages: 'Messages from the public “Contact us” form.',
  audit_log: 'Security and activity log of important actions.',
};

const COL_HINT = {
  id: 'Primary key (auto increment)', created_at: 'Creation time', updated_at: 'Last update time (auto)',
  password_hash: 'bcrypt hash of the password — never the plain password', email: 'Email address (lower-case)',
  status: 'Current status', role: 'Access role', name_ar: 'Full name in Arabic', title_ar: 'Arabic version of title',
  stage: 'Workflow stage 0–7 (New request … Accepted/Rejected)', priority: 'Handling priority', readiness_weight: 'Weight in the readiness score (sum = 100)',
  token_id: 'JWT id (jti) of the issued token', revoked_at: 'Set when the device is signed out', expires_at: 'Expiry time', used_at: 'When the code/token was used',
  gpa: 'Grade point average', gpa_scale: 'Maximum of the GPA scale (4 or 100)', min_gpa: 'Minimum GPA required', language_score: 'Test score (e.g. IELTS 6.5)',
  language_test: 'IELTS, TOEFL …', funding: 'full | partial | self', funding_pref: 'Preferred funding type', deadline: 'Application deadline', opens_on: 'Application window opens',
  results_status: 'Admission results progress', score: 'Match score 0–100', level: 'Match level / study level', details: 'Per-criterion partial scores (JSON)',
  explanation: 'LLM explanation text (Groq)', computed_at: 'When the match was computed', stored_path: 'Path inside storage/uploads (not public)',
  mime_type: 'Detected MIME type', size_bytes: 'File size in bytes', reject_reason: 'Why the advisor rejected the document', reviewed_at: 'Review time',
  read_at: 'When the notification was read', in_app: 'In-app channel on/off', code: 'Business code', name_en: 'English name', summary: 'Summary of the interaction',
  channel: 'call | whatsapp | email | meeting', direction: 'inbound | outbound', follow_up_on: 'Planned follow-up date', body: 'Text', meta: 'Extra data (JSON)',
  ip_address: 'IPv4/IPv6 address', device_type: 'laptop | phone | tablet', last_active_at: 'Last request from this device', result: 'accepted | rejected (final)',
  from_stage: 'Previous stage', to_stage: 'New stage', note: 'Short note', two_factor: '2-step verification enabled', login_alerts: 'Email on new device sign-in',
  email_verified_at: 'Email confirmation time', last_login_at: 'Last successful sign-in', department: 'Staff department', is_required: 'Counts in readiness',
  sort_order: 'Display order', active: 'Visible in the catalogue', amount: 'Award value (text)', description: 'English description', description_ar: 'Arabic description',
  nationality: 'Country code of nationality', country: 'Country code', field: 'Academic field code', subject: 'Contact subject', message: 'Message text',
  handled_at: 'When staff handled the message', category: 'Notification category', type: 'Type', type_code: 'Document type', link: 'Front-end link',
};

function describe(table, col, fk) {
  if (fk) return `References ${fk}`;
  if (COL_HINT[col]) return COL_HINT[col];
  if (col.endsWith('_ar')) return `Arabic version of ${col.slice(0, -3).replace(/_/g, ' ')}`;
  return col.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function parse() {
  const tables = [];
  const re = /CREATE TABLE (\w+) \(([\s\S]*?)\n\) ENGINE/g;
  let m;
  while ((m = re.exec(SQL))) {
    const name = m[1];
    const body = m[2].split('\n').map((l) => l.trim().replace(/,$/, '')).filter(Boolean);
    const pk = new Set(); const uk = new Set(); const fk = {};
    body.forEach((l) => {
      let x;
      if ((x = l.match(/^PRIMARY KEY \(([^)]+)\)/))) x[1].split(',').forEach((c) => pk.add(c.trim()));
      if ((x = l.match(/^UNIQUE KEY \w+ \(([^)]+)\)/))) x[1].split(',').forEach((c) => uk.add(c.trim()));
      if ((x = l.match(/FOREIGN KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)/))) fk[x[1]] = `${x[2]}.${x[3]}`;
    });
    const cols = [];
    body.forEach((l) => {
      if (/^(PRIMARY|UNIQUE|KEY|CONSTRAINT|INDEX)\b/.test(l)) return;
      const c = l.match(/^(\w+)\s+([A-Z]+(?:\([^)]*\))?(?:\s+UNSIGNED)?)(.*)$/);
      if (!c) return;
      const [, col, type, rest] = c;
      if (/PRIMARY KEY/.test(rest)) pk.add(col);
      const keys = [pk.has(col) && 'PK', fk[col] && 'FK', uk.has(col) && 'UK'].filter(Boolean).join(', ');
      const def = (rest.match(/DEFAULT ([^ ]+(?: ON UPDATE CURRENT_TIMESTAMP)?)/) || [])[1];
      cols.push({ col, type: type.replace(/\s+UNSIGNED/, ' UNSIGNED'), nullable: /NOT NULL/.test(rest) || pk.has(col) ? 'No' : 'Yes', keys, def: def ? def.replace(/'/g, '') : '', desc: describe(name, col, fk[col]) });
    });
    tables.push({ name, info: TABLE_INFO[name] || '', cols, fk });
  }
  return tables;
}

module.exports = { parse, SQL };
if (require.main === module) {
  const t = parse();
  console.log(t.length, 'tables', t.reduce((a, x) => a + x.cols.length, 0), 'columns');
  console.log(t.find((x) => x.name === 'documents'));
}
