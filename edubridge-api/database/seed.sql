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
