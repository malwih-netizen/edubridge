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
