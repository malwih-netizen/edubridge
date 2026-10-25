-- EduBridge database for phpMyAdmin (InfinityFree)
-- 1. Open phpMyAdmin for if0_43270586_edubridge  2. Import this file.
-- Creates 25 tables, demo data (password demo1234) and 7 reporting views.

-- ===================== schema.sql =====================
-- =====================================================================
-- EduBridge – Smart Scholarship and Student Services Management System
-- MySQL / MariaDB schema  (utf8mb4 for Arabic + English)
-- Run: php bin/setup.php   (creates the database, tables and demo data)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- Users & authentication
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role              ENUM('student','employee','admin') NOT NULL DEFAULT 'student',
  first_name        VARCHAR(80)  NOT NULL,
  last_name         VARCHAR(80)  NOT NULL,
  name_ar           VARCHAR(160) NULL,
  email             VARCHAR(190) NOT NULL,
  phone             VARCHAR(30)  NULL,
  password_hash     VARCHAR(255) NOT NULL,
  status            ENUM('active','pending','suspended','invited') NOT NULL DEFAULT 'active',
  department        ENUM('studentServices','admissions','visa','scholarships','compliance') NULL,
  title             VARCHAR(80)  NULL,
  title_ar          VARCHAR(80)  NULL,
  avatar_path       VARCHAR(255) NULL,
  two_factor        TINYINT(1)   NOT NULL DEFAULT 0,
  login_alerts      TINYINT(1)   NOT NULL DEFAULT 1,
  email_verified_at DATETIME     NULL,
  last_login_at     DATETIME     NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- signed-in devices (one row per token)
DROP TABLE IF EXISTS user_sessions;
CREATE TABLE user_sessions (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  token_id       CHAR(32)     NOT NULL,
  device_type    ENUM('laptop','phone','tablet') NOT NULL DEFAULT 'laptop',
  browser        VARCHAR(60)  NULL,
  os             VARCHAR(60)  NULL,
  ip_address     VARCHAR(45)  NULL,
  city           VARCHAR(80)  NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at     DATETIME     NULL,
  UNIQUE KEY uq_sessions_token (token_id),
  KEY idx_sessions_user (user_id, revoked_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS password_resets;
CREATE TABLE password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(190) NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME     NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_resets_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS email_verifications;
CREATE TABLE email_verifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  email      VARCHAR(190) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME     NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_verify_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS students;
CREATE TABLE students (
  user_id          INT UNSIGNED PRIMARY KEY,
  first_name_ar    VARCHAR(80)  NULL,
  last_name_ar     VARCHAR(80)  NULL,
  gender           ENUM('female','male') NULL,
  birth_date       DATE         NULL,
  nationality      VARCHAR(30)  NULL,
  country          VARCHAR(30)  NULL,
  city             VARCHAR(80)  NULL,
  current_level    ENUM('highSchool','bachelor','master') NULL,
  target_level     ENUM('bachelor','master','phd') NULL,
  field            VARCHAR(40)  NULL,
  gpa              DECIMAL(5,2) NULL,
  gpa_scale        DECIMAL(5,2) NOT NULL DEFAULT 4.00,
  institution      VARCHAR(160) NULL,
  institution_ar   VARCHAR(160) NULL,
  graduation_year  SMALLINT     NULL,
  language_test    VARCHAR(20)  NULL,
  language_score   DECIMAL(5,1) NULL,
  funding_pref     ENUM('full','partial','self') NULL,
  intake           VARCHAR(40)  NULL,
  help_level       ENUM('full','partial','no') NULL,
  assigned_to      INT UNSIGNED NULL,
  priority         ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  stage            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_contact_at  DATETIME     NULL,
  KEY idx_students_assigned (assigned_to),
  CONSTRAINT fk_students_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_students_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_students_stage CHECK (stage BETWEEN 0 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS student_countries;
CREATE TABLE student_countries (
  student_id INT UNSIGNED NOT NULL,
  country    VARCHAR(30)  NOT NULL,
  PRIMARY KEY (student_id, country),
  CONSTRAINT fk_stcountry_student FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS document_types;
CREATE TABLE document_types (
  code             VARCHAR(30)  PRIMARY KEY,
  name_en          VARCHAR(80)  NOT NULL,
  name_ar          VARCHAR(80)  NOT NULL,
  readiness_weight TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_required      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order       TINYINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS documents;
CREATE TABLE documents (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id    INT UNSIGNED NOT NULL,
  type_code     VARCHAR(30)  NOT NULL,
  file_name     VARCHAR(190) NOT NULL,
  stored_path   VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(80)  NOT NULL,
  size_bytes    INT UNSIGNED NOT NULL,
  status        ENUM('underReview','approved','rejected') NOT NULL DEFAULT 'underReview',
  reject_reason VARCHAR(255) NULL,
  reviewed_by   INT UNSIGNED NULL,
  reviewed_at   DATETIME     NULL,
  uploaded_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_documents_student (student_id, type_code),
  CONSTRAINT fk_documents_student  FOREIGN KEY (student_id)  REFERENCES students(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_type     FOREIGN KEY (type_code)   REFERENCES document_types(code),
  CONSTRAINT fk_documents_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Scholarships
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS scholarships;
CREATE TABLE scholarships (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(190) NOT NULL,
  name_ar        VARCHAR(190) NULL,
  university     VARCHAR(190) NOT NULL,
  university_ar  VARCHAR(190) NULL,
  country        VARCHAR(30)  NOT NULL,
  funding        ENUM('full','partial','self') NOT NULL DEFAULT 'full',
  min_gpa        DECIMAL(4,2) NULL,
  language_test  VARCHAR(20)  NULL,
  language_score DECIMAL(5,1) NULL,
  amount         VARCHAR(80)  NULL,
  opens_on       DATE         NULL,
  deadline       DATE         NULL,
  status         ENUM('draft','upcoming','open','closed') NOT NULL DEFAULT 'open',
  results_status ENUM('notStarted','inProgress','partial','completed') NOT NULL DEFAULT 'notStarted',
  description    TEXT         NULL,
  description_ar TEXT         NULL,
  created_by     INT UNSIGNED NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_scholarships_filter (status, country, deadline),
  CONSTRAINT fk_scholarships_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS scholarship_levels;
CREATE TABLE scholarship_levels (
  scholarship_id INT UNSIGNED NOT NULL,
  level          ENUM('bachelor','master','phd') NOT NULL,
  PRIMARY KEY (scholarship_id, level),
  CONSTRAINT fk_schlevel FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS scholarship_fields;
CREATE TABLE scholarship_fields (
  scholarship_id INT UNSIGNED NOT NULL,
  field          VARCHAR(40)  NOT NULL,
  PRIMARY KEY (scholarship_id, field),
  CONSTRAINT fk_schfield FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 'all' means open to every nationality
DROP TABLE IF EXISTS scholarship_nationalities;
CREATE TABLE scholarship_nationalities (
  scholarship_id INT UNSIGNED NOT NULL,
  nationality    VARCHAR(30)  NOT NULL,
  PRIMARY KEY (scholarship_id, nationality),
  CONSTRAINT fk_schnat FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS scholarship_documents;
CREATE TABLE scholarship_documents (
  scholarship_id INT UNSIGNED NOT NULL,
  type_code      VARCHAR(30)  NOT NULL,
  PRIMARY KEY (scholarship_id, type_code),
  CONSTRAINT fk_schdoc_sch  FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
  CONSTRAINT fk_schdoc_type FOREIGN KEY (type_code) REFERENCES document_types(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cached AI / rule-based match results (recomputed when profile or scholarship changes)
DROP TABLE IF EXISTS match_scores;
CREATE TABLE match_scores (
  student_id     INT UNSIGNED NOT NULL,
  scholarship_id INT UNSIGNED NOT NULL,
  score          TINYINT UNSIGNED NOT NULL,
  level          ENUM('eligible','potential','notSuitable') NOT NULL,
  details        JSON NULL,
  explanation    TEXT NULL,
  computed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, scholarship_id),
  CONSTRAINT fk_match_student FOREIGN KEY (student_id)     REFERENCES students(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_match_sch     FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Services, requests, applications (CRM)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS services;
CREATE TABLE services (
  code    VARCHAR(40) PRIMARY KEY,
  name_en VARCHAR(80) NOT NULL,
  name_ar VARCHAR(80) NOT NULL,
  active  TINYINT(1)  NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS service_requests;
CREATE TABLE service_requests (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id     INT UNSIGNED NOT NULL,
  service_code   VARCHAR(40)  NOT NULL,
  scholarship_id INT UNSIGNED NULL,
  priority       ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  notes          TEXT NULL,
  status         ENUM('newRequest','inProgress','waitingStudent','completed') NOT NULL DEFAULT 'newRequest',
  assigned_to    INT UNSIGNED NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_requests_status (status, assigned_to),
  CONSTRAINT fk_requests_student  FOREIGN KEY (student_id)     REFERENCES students(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_service  FOREIGN KEY (service_code)   REFERENCES services(code),
  CONSTRAINT fk_requests_sch      FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE SET NULL,
  CONSTRAINT fk_requests_assignee FOREIGN KEY (assigned_to)    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- stage: 0 newRequest · 1 contacted · 2 preparingDocuments · 3 waitingStudent
--        4 readyToApply · 5 submitted · 6 waitingResult · 7 accepted/rejected
DROP TABLE IF EXISTS applications;
CREATE TABLE applications (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(20)  NOT NULL,
  student_id     INT UNSIGNED NOT NULL,
  scholarship_id INT UNSIGNED NOT NULL,
  advisor_id     INT UNSIGNED NULL,
  stage          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  result         ENUM('accepted','rejected') NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_applications_code (code),
  UNIQUE KEY uq_applications_pair (student_id, scholarship_id),
  CONSTRAINT fk_apps_student FOREIGN KEY (student_id)     REFERENCES students(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_apps_sch     FOREIGN KEY (scholarship_id) REFERENCES scholarships(id),
  CONSTRAINT fk_apps_advisor FOREIGN KEY (advisor_id)     REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_apps_stage CHECK (stage BETWEEN 0 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS application_documents;
CREATE TABLE application_documents (
  application_id INT UNSIGNED NOT NULL,
  document_id    INT UNSIGNED NOT NULL,
  PRIMARY KEY (application_id, document_id),
  CONSTRAINT fk_appdoc_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_appdoc_doc FOREIGN KEY (document_id)    REFERENCES documents(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS application_stage_history;
CREATE TABLE application_stage_history (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  from_stage     TINYINT UNSIGNED NULL,
  to_stage       TINYINT UNSIGNED NOT NULL,
  changed_by     INT UNSIGNED NULL,
  note           VARCHAR(255) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_history_app (application_id),
  CONSTRAINT fk_history_app  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (changed_by)     REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS notes;
CREATE TABLE notes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  author_id  INT UNSIGNED NULL,
  body       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notes_student (student_id),
  CONSTRAINT fk_notes_student FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_author  FOREIGN KEY (author_id)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS communications;
CREATE TABLE communications (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id   INT UNSIGNED NOT NULL,
  employee_id  INT UNSIGNED NULL,
  channel      ENUM('call','whatsapp','email','meeting') NOT NULL,
  direction    ENUM('inbound','outbound') NOT NULL DEFAULT 'outbound',
  summary      TEXT NOT NULL,
  duration_min SMALLINT UNSIGNED NULL,
  follow_up_on DATE NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_comms_student (student_id),
  CONSTRAINT fk_comms_student  FOREIGN KEY (student_id)  REFERENCES students(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_comms_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Notifications, contact form, audit log
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       ENUM('deadline','document','service','scholarship','message','system') NOT NULL,
  title      VARCHAR(190) NOT NULL,
  title_ar   VARCHAR(190) NULL,
  body       VARCHAR(500) NULL,
  body_ar    VARCHAR(500) NULL,
  link       VARCHAR(255) NULL,
  read_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_user (user_id, read_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS notification_settings;
CREATE TABLE notification_settings (
  user_id  INT UNSIGNED NOT NULL,
  category ENUM('requests','documents','deadlines','matches','messages') NOT NULL,
  email    TINYINT(1) NOT NULL DEFAULT 1,
  in_app   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, category),
  CONSTRAINT fk_nsettings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS contact_messages;
CREATE TABLE contact_messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  phone      VARCHAR(30)  NOT NULL,
  subject    ENUM('general','scholarships','services','support') NOT NULL DEFAULT 'general',
  message    TEXT NOT NULL,
  handled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS audit_log;
CREATE TABLE audit_log (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  action     VARCHAR(60)  NOT NULL,
  entity     VARCHAR(40)  NULL,
  entity_id  INT UNSIGNED NULL,
  meta       JSON NULL,
  ip_address VARCHAR(45)  NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_user (user_id, created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ===================== seed.sql =====================
-- =====================================================================
-- EduBridge demo data. Every demo account uses the password: demo1234
--   student@edubridge.app · advisor@edubridge.app · admin@edubridge.app
-- =====================================================================
SET NAMES utf8mb4;
SET @pw = '$2y$10$o.uNZfH5xeTCmTPHw63iHeI/t344hZf7p9WDrw6OIenSc3UrC/yyu';

-- ---------- lookup tables ----------
INSERT INTO document_types (code, name_en, name_ar, readiness_weight, is_required, sort_order) VALUES
('passport',       'Passport',              'جواز السفر',     15, 1, 1),
('transcript',     'Academic transcript',   'كشف الدرجات',    20, 1, 2),
('degree',         'Degree certificate',    'شهادة التخرج',   15, 1, 3),
('cv',             'CV / Résumé',           'السيرة الذاتية', 15, 1, 4),
('language',       'Language certificate',  'شهادة اللغة',    15, 1, 5),
('motivation',     'Motivation letter',     'رسالة الدافع',   10, 1, 6),
('recommendation', 'Recommendation letter', 'رسالة توصية',    10, 1, 7),
('other',          'Other document',        'مستند آخر',       0, 0, 8);

INSERT INTO services (code, name_en, name_ar) VALUES
('scholarshipSearch',     'Scholarship search',     'البحث عن منحة'),
('filePreparation',       'File preparation',       'تجهيز الملف'),
('cv',                    'CV preparation',         'إعداد السيرة الذاتية'),
('motivationLetter',      'Motivation letter',      'رسالة الدافع'),
('translation',           'Document translation',   'ترجمة المستندات'),
('applicationAssistance', 'Application assistance', 'المساعدة في التقديم'),
('followUp',              'Application follow-up',  'متابعة الطلب');

-- ---------- users (ids are fixed so the rest of the seed can refer to them) ----------
INSERT INTO users (id, role, first_name, last_name, name_ar, email, phone, password_hash, status, department, title, title_ar, email_verified_at, created_at) VALUES
(1,  'student',  'Sarah',  'Ahmed',       'سارة أحمد',      'student@edubridge.app',  '+970 59 123 4567', @pw, 'active',  NULL,              NULL, NULL, NOW(), '2026-09-01 10:00:00'),
(2,  'employee', 'Maya',   'Khalil',      'مايا خليل',      'advisor@edubridge.app',  '+970 59 222 1100', @pw, 'active',  'studentServices', 'Senior Advisor', 'مستشارة أولى', NOW(), '2026-06-15 09:00:00'),
(3,  'admin',    'Admin',  'User',        'مسؤول النظام',   'admin@edubridge.app',    '+970 59 000 0001', @pw, 'active',  'compliance',      NULL, NULL, NOW(), '2026-06-01 09:00:00'),
(4,  'employee', 'Omar',   'Farouk',      'عمر فاروق',      'omar.farouk@edubridge.app',  NULL, @pw, 'active',  'scholarships', 'Advisor', 'مستشار', NOW(), '2026-07-01 09:00:00'),
(5,  'employee', 'Noor',   'Hassan',      'نور حسن',        'noor.hassan@edubridge.app',  NULL, @pw, 'active',  'visa',         'Visa Specialist', 'أخصائية تأشيرات', NOW(), '2026-07-10 09:00:00'),
(6,  'student',  'Yousef', 'Karimi',      'يوسف كريمي',     'yousef.k@example.com',  NULL, @pw, 'active', NULL, NULL, NULL, NOW(), '2026-08-20 09:00:00'),
(7,  'student',  'Noor',   'Hassan',      'نور حسن',        'noor.h@example.com',    NULL, @pw, 'active', NULL, NULL, NULL, NOW(), '2026-09-05 09:00:00'),
(8,  'student',  'Omar',   'Saleh',       'عمر صالح',       'omar.s@example.com',    NULL, @pw, 'active', NULL, NULL, NULL, NOW(), '2026-10-24 09:00:00'),
(9,  'student',  'Layla',  'Saeed',       'ليلى سعيد',      'layla.s@example.com',   NULL, @pw, 'active', NULL, NULL, NULL, NOW(), '2026-08-02 09:00:00'),
(10, 'student',  'Hadi',   'Tamimi',      'هادي التميمي',   'hadi.t@example.com',    NULL, @pw, 'active', NULL, NULL, NULL, NOW(), '2026-06-12 09:00:00');

INSERT INTO students (user_id, first_name_ar, last_name_ar, gender, birth_date, nationality, country, city, current_level, target_level, field, gpa, gpa_scale, institution, institution_ar, graduation_year, language_test, language_score, funding_pref, intake, help_level, assigned_to, priority, stage, last_contact_at) VALUES
(1,  'سارة', 'أحمد', 'female', '2002-04-18', 'palestine', 'palestine', 'Khan Younis', 'bachelor', 'master', 'computerScience', 3.70, 4, 'University College of Science and Technology', 'الكلية الجامعية للعلوم والتكنولوجيا', 2024, 'IELTS', 6.5, 'full', 'Fall 2027', 'full', 2, 'high',   2, '2026-10-22 12:30:00'),
(6,  'يوسف', 'كريمي', 'male',  '2000-01-09', 'jordan',    'jordan',    'Amman',       'master',   'phd',    'engineering',     3.90, 4, NULL, NULL, 2023, 'IELTS', 7.5, 'full',    'Fall 2027', 'partial', 2, 'medium', 5, '2026-10-24 10:00:00'),
(7,  'نور',  'حسن',  'female', '2001-07-21', 'egypt',     'egypt',     'Cairo',       'bachelor', 'master', 'business',        3.40, 4, NULL, NULL, 2024, 'IELTS', 6.5, 'partial', 'Spring 2027', 'full', 4, 'high',   3, '2026-10-15 09:00:00'),
(8,  'عمر',  'صالح', 'male',   '2007-03-02', 'palestine', 'palestine', 'Gaza',        'highSchool','bachelor','science',        3.10, 4, NULL, NULL, 2026, NULL,    NULL, 'full',    'Fall 2027', 'full', 2, 'low',    0, '2026-10-25 08:00:00'),
(9,  'ليلى', 'سعيد', 'female', '2001-11-30', 'saudi',     'saudi',     'Riyadh',      'bachelor', 'master', 'publicHealth',    3.60, 4, NULL, NULL, 2024, 'IELTS', 7.0, 'full',    'Fall 2027', 'partial', 5, 'medium', 6, '2026-10-20 09:00:00'),
(10, 'هادي', 'التميمي','male',  '2000-05-14', 'uae',       'uae',       'Dubai',       'bachelor', 'master', 'computerScience', 3.80, 4, NULL, NULL, 2023, 'IELTS', 7.5, 'full',    'Fall 2026', 'no', 2, 'low',    7, '2026-10-12 09:00:00');

INSERT INTO student_countries (student_id, country) VALUES
(1,'canada'),(1,'germany'),(6,'germany'),(6,'canada'),(7,'uk'),(7,'malaysia'),(8,'turkey'),(9,'uk'),(10,'canada');

-- ---------- scholarships ----------
INSERT INTO scholarships (id, name, name_ar, university, university_ar, country, funding, min_gpa, language_test, language_score, amount, opens_on, deadline, status, results_status, description, description_ar, created_by) VALUES
(1, 'Global Excellence Scholarship', 'منحة التميّز العالمية', 'University of Toronto', 'جامعة تورنتو', 'canada', 'full', 3.30, 'IELTS', 7.0, 'CAD 42,000 / yr', '2026-08-01', '2026-11-15', 'open', 'notStarted',
   'A fully funded award for outstanding international graduate students with leadership potential.', 'منحة ممولة بالكامل لطلاب الدراسات العليا الدوليين المتميزين ممن لديهم إمكانات قيادية.', 2),
(2, 'DAAD Graduate Scholarship', 'منحة DAAD للدراسات العليا', 'Technical University of Munich', 'الجامعة التقنية في ميونخ', 'germany', 'full', 3.00, 'IELTS', 6.5, 'EUR 992 / month', '2026-07-15', '2026-12-01', 'open', 'notStarted',
   'Monthly stipend, travel allowance and health insurance for development-related master programmes.', 'راتب شهري وبدل سفر وتأمين صحي لبرامج الماجستير المرتبطة بالتنمية.', 2),
(3, 'Commonwealth Master’s Scholarship', 'منحة الكومنولث للماجستير', 'University of Manchester', 'جامعة مانشستر', 'uk', 'full', 3.40, 'IELTS', 7.0, 'Full tuition + stipend', '2026-09-01', '2026-12-18', 'open', 'notStarted',
   'For talented students committed to making a positive impact in their home countries.', 'للطلاب الموهوبين الملتزمين بإحداث أثر إيجابي في بلدانهم.', 2),
(4, 'Türkiye Burslari', 'المنح التركية (Türkiye Burslari)', 'Istanbul Technical University', 'جامعة إسطنبول التقنية', 'turkey', 'full', 2.80, 'IELTS', 6.0, 'Tuition + monthly stipend', '2027-01-10', '2027-02-20', 'upcoming', 'notStarted',
   'Government scholarship covering tuition, accommodation, health insurance and a Turkish language year.', 'منحة حكومية تشمل الرسوم والسكن والتأمين الصحي وسنة لتعلّم اللغة التركية.', 4),
(5, 'Erasmus Mundus Joint Master', 'منحة إيراسموس موندوس للماجستير المشترك', 'EU Consortium', 'اتحاد جامعات أوروبي', 'netherlands', 'full', 3.50, 'IELTS', 7.0, 'EUR 1,400 / month', '2026-10-01', '2027-01-15', 'open', 'notStarted',
   'Study in at least two European countries with a full scholarship.', 'ادرس في دولتين أوروبيتين على الأقل بمنحة كاملة.', 4),
(6, 'Malaysia International Scholarship', 'منحة ماليزيا الدولية', 'University of Malaya', 'جامعة مالايا', 'malaysia', 'partial', 3.00, 'IELTS', 6.0, 'Partial tuition', '2026-06-01', '2026-10-10', 'closed', 'partial',
   'Partial funding for high-achieving postgraduate applicants.', 'تمويل جزئي لمتقدمي الدراسات العليا ذوي التحصيل المرتفع.', 4);

INSERT INTO scholarship_levels (scholarship_id, level) VALUES
(1,'master'),(1,'phd'),(2,'master'),(2,'phd'),(3,'master'),(4,'bachelor'),(4,'master'),(4,'phd'),(5,'master'),(6,'master'),(6,'phd');

INSERT INTO scholarship_fields (scholarship_id, field) VALUES
(1,'computerScience'),(1,'engineering'),(1,'business'),
(2,'engineering'),(2,'computerScience'),(2,'science'),
(3,'business'),(3,'publicHealth'),(3,'computerScience'),
(4,'engineering'),(4,'computerScience'),(4,'business'),(4,'science'),
(5,'computerScience'),(5,'science'),(5,'engineering'),
(6,'engineering'),(6,'science'),(6,'business');

INSERT INTO scholarship_nationalities (scholarship_id, nationality) VALUES (1,'all'),(2,'all'),(3,'all'),(4,'all'),(5,'all'),(6,'all');

INSERT INTO scholarship_documents (scholarship_id, type_code)
SELECT s.id, d.code FROM scholarships s CROSS JOIN document_types d WHERE d.is_required = 1;

-- ---------- Sarah's documents (no CV / language certificate yet → readiness 65%) ----------
INSERT INTO documents (student_id, type_code, file_name, stored_path, mime_type, size_bytes, status, uploaded_at) VALUES
(1, 'passport',       'Passport_Sarah.pdf',          'demo/passport.pdf',       'application/pdf', 1258291, 'approved',    '2026-09-02 10:00:00'),
(1, 'transcript',     'Academic_Transcript.pdf',     'demo/transcript.pdf',     'application/pdf',  870400, 'approved',    '2026-09-03 10:00:00'),
(1, 'degree',         'Bachelor_Certificate.pdf',    'demo/degree.pdf',         'application/pdf',  655360, 'underReview', '2026-10-11 10:00:00'),
(1, 'motivation',     'Statement_of_Purpose.docx',   'demo/motivation.docx',    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 98304, 'approved', '2026-10-01 10:00:00'),
(1, 'recommendation', 'Recommendation_Letter.pdf',   'demo/recommendation.pdf', 'application/pdf',  317440, 'underReview', '2026-10-20 10:00:00');

-- ---------- applications & history ----------
INSERT INTO applications (id, code, student_id, scholarship_id, advisor_id, stage, result, created_at, updated_at) VALUES
(1, 'APP-2041', 1, 1, 2, 2, NULL,       '2026-10-05 09:00:00', '2026-10-22 12:30:00'),
(2, 'APP-2055', 1, 2, 2, 1, NULL,       '2026-10-12 09:00:00', '2026-10-19 11:00:00'),
(3, 'APP-1988', 1, 6, 4, 7, 'rejected', '2026-06-20 09:00:00', '2026-09-30 15:00:00');

INSERT INTO application_stage_history (application_id, from_stage, to_stage, changed_by, note, created_at) VALUES
(1, NULL, 0, 1, 'Application created', '2026-10-05 09:00:00'),
(1, 0, 1, 2, 'First call with student', '2026-10-08 10:00:00'),
(1, 1, 2, 2, 'Collecting documents', '2026-10-22 12:30:00');

-- ---------- service requests ----------
INSERT INTO service_requests (student_id, service_code, scholarship_id, priority, notes, status, assigned_to, created_at) VALUES
(1, 'cv',          NULL, 'medium', 'Academic CV for master applications.', 'inProgress', 2, '2026-10-18 09:00:00'),
(1, 'translation', NULL, 'low',    'Translate transcript to English.',     'completed',  4, '2026-10-02 09:00:00'),
(7, 'motivationLetter', 3, 'high', 'Statement for Commonwealth.',          'newRequest', NULL, '2026-10-24 09:00:00');

-- ---------- CRM notes & communications ----------
INSERT INTO notes (student_id, author_id, body, created_at) VALUES
(1, 2, 'Strong profile for Canada and Germany. Missing CV and IELTS certificate.', '2026-10-22 12:40:00');
INSERT INTO communications (student_id, employee_id, channel, direction, summary, duration_min, follow_up_on, created_at) VALUES
(1, 2, 'call', 'outbound', 'Reviewed missing documents and next deadlines.', 15, '2026-10-29', '2026-10-22 12:30:00');

-- ---------- notifications ----------
INSERT INTO notifications (user_id, type, title, title_ar, body, body_ar, link, created_at) VALUES
(1, 'deadline', 'Deadline reminder', 'تذكير بموعد نهائي', 'Global Excellence Scholarship closes in 5 days.', 'يُغلق التقديم على منحة التميّز العالمية خلال 5 أيام.', '/student/scholarships/1', NOW()),
(1, 'document', 'Document reviewed', 'تمت مراجعة مستند', 'Your academic transcript was approved.', 'تم اعتماد كشف الدرجات الخاص بك.', '/student/documents', NOW()),
(1, 'service',  'Service update', 'تحديث على الخدمة', 'Your CV preparation request is now in progress.', 'طلب إعداد السيرة الذاتية أصبح قيد التنفيذ.', '/student/services', NOW());

-- ===================== views.sql =====================
-- =====================================================================
-- EduBridge reporting views (proposal §8.2 · Reporting Module)
-- Run after schema.sql:  php bin/setup.php   (loads schema, seed, views)
-- =====================================================================

-- Number of students, requests and applications
CREATE OR REPLACE VIEW v_totals AS
SELECT
  (SELECT COUNT(*) FROM students)                                   AS students,
  (SELECT COUNT(*) FROM service_requests)                           AS service_requests,
  (SELECT COUNT(*) FROM applications)                               AS applications,
  (SELECT COUNT(*) FROM applications WHERE result = 'accepted')     AS accepted,
  (SELECT COUNT(*) FROM applications WHERE result IS NOT NULL)      AS decided;

-- Most requested destination countries (students' preferences)
CREATE OR REPLACE VIEW v_countries_demand AS
SELECT sc.country, COUNT(*) AS students
FROM student_countries sc
GROUP BY sc.country
ORDER BY students DESC;

-- Most requested services
CREATE OR REPLACE VIEW v_services_demand AS
SELECT s.code, s.name_en, s.name_ar, COUNT(r.id) AS requests
FROM services s
LEFT JOIN service_requests r ON r.service_code = s.code
GROUP BY s.code, s.name_en, s.name_ar
ORDER BY requests DESC;

-- Application status statistics (8 stages + result)
CREATE OR REPLACE VIEW v_application_stages AS
SELECT
  CASE
    WHEN a.result IS NOT NULL THEN a.result
    ELSE ELT(a.stage + 1, 'newRequest','contacted','preparingDocuments','waitingStudent',
                          'readyToApply','submitted','waitingResult','decided')
  END AS status,
  COUNT(*) AS applications
FROM applications a
GROUP BY status;

-- Acceptance rate (decided applications only)
CREATE OR REPLACE VIEW v_acceptance_rate AS
SELECT
  SUM(result = 'accepted')                                   AS accepted,
  SUM(result = 'rejected')                                   AS rejected,
  ROUND(100 * SUM(result = 'accepted') / NULLIF(COUNT(result), 0), 1) AS acceptance_pct
FROM applications;

-- Employee workload: open vs completed items per advisor
CREATE OR REPLACE VIEW v_employee_workload AS
SELECT
  u.id, CONCAT(u.first_name, ' ', u.last_name) AS employee,
  (SELECT COUNT(*) FROM students s WHERE s.assigned_to = u.id)                                      AS students,
  (SELECT COUNT(*) FROM service_requests r WHERE r.assigned_to = u.id AND r.status <> 'completed') AS open_requests,
  (SELECT COUNT(*) FROM service_requests r WHERE r.assigned_to = u.id AND r.status = 'completed')  AS completed_requests,
  (SELECT COUNT(*) FROM applications a WHERE a.advisor_id = u.id AND a.result IS NULL)              AS active_applications
FROM users u
WHERE u.role = 'employee';

-- Student readiness (weighted required documents; under review counts 80 %)
CREATE OR REPLACE VIEW v_student_readiness AS
SELECT
  st.user_id AS student_id,
  CONCAT(u.first_name, ' ', u.last_name) AS student,
  ROUND(SUM(
    CASE d.status WHEN 'approved' THEN dt.readiness_weight
                  WHEN 'underReview' THEN dt.readiness_weight * 0.8
                  ELSE 0 END)) AS readiness
FROM students st
JOIN users u ON u.id = st.user_id
CROSS JOIN document_types dt
LEFT JOIN documents d ON d.student_id = st.user_id AND d.type_code = dt.code
  AND d.id = (SELECT MAX(d2.id) FROM documents d2 WHERE d2.student_id = st.user_id AND d2.type_code = dt.code)
WHERE dt.is_required = 1
GROUP BY st.user_id, student;
