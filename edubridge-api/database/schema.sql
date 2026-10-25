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
