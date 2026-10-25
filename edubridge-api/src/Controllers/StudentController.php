<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, HttpException, Request, Response, Validator};
use App\Services\{Mapper, Matching};

/** Endpoints for the signed-in student: /api/students/me/... */
final class StudentController
{
    private const MAX_UPLOAD = 10 * 1024 * 1024;
    private const MIME = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx'];

    public function profile(Request $req): never
    {
        Response::json($this->student($req));
    }

    public function updateProfile(Request $req): never
    {
        $id = (int) $req->user['id'];
        $d = Validator::check($req->body(), [
            'firstName' => 'required|max:80', 'lastName' => 'required|max:80', 'gpa' => 'numeric|between:0,100',
            'birthDate' => 'date', 'level' => 'in:bachelor,master,phd', 'funding' => 'in:full,partial,self',
        ]);
        Database::transaction(function () use ($id, $d) {
            Database::run('UPDATE users SET first_name = ?, last_name = ?, phone = ?, name_ar = ? WHERE id = ?', [
                $d['firstName'], $d['lastName'], $d['phone'] ?? null,
                trim(($d['firstNameAr'] ?? '') . ' ' . ($d['lastNameAr'] ?? '')) ?: null, $id,
            ]);
            Database::run(
                'UPDATE students SET first_name_ar=?, last_name_ar=?, gender=?, birth_date=?, nationality=?, country=?, target_level=?, field=?, gpa=?, institution=?, institution_ar=?, graduation_year=?, language_test=?, language_score=?, funding_pref=?, intake=? WHERE user_id = ?',
                [$d['firstNameAr'] ?? null, $d['lastNameAr'] ?? null, $d['gender'] ?? null, $d['birthDate'] ?? null, $d['nationality'] ?? null,
                 $d['country'] ?? null, $d['level'] ?? null, $d['field'] ?? null, $d['gpa'] ?? null, $d['university'] ?? null,
                 $d['universityAr'] ?? null, $d['graduationYear'] ?? null, $d['language']['test'] ?? null, $d['language']['score'] ?? null,
                 $d['funding'] ?? null, $d['intake'] ?? null, $id],
            );
            if (isset($d['preferredCountries'])) {
                Database::run('DELETE FROM student_countries WHERE student_id = ?', [$id]);
                foreach (array_slice((array) $d['preferredCountries'], 0, 3) as $c) {
                    Database::run('INSERT INTO student_countries (student_id, country) VALUES (?, ?)', [$id, (string) $c]);
                }
            }
        });
        Response::json(Mapper::student($id));
    }

    public function documents(Request $req): never
    {
        $id = $this->studentId($req);
        $docs = Database::all('SELECT * FROM documents WHERE student_id = ? ORDER BY uploaded_at DESC', [$id]);
        $byType = [];
        foreach ($docs as $d) $byType[$d['type_code']] ??= Mapper::document($d);
        // list every required type; missing ones come back with status "missing"
        $out = [];
        foreach (Database::all('SELECT code FROM document_types WHERE is_required = 1 ORDER BY sort_order') as $i => $t) {
            $out[] = $byType[$t['code']] ?? ['id' => 'missing-' . $t['code'], 'type' => $t['code'], 'file' => null, 'status' => 'missing'];
            unset($byType[$t['code']]);
        }
        Response::json(array_merge($out, array_values($byType)));
    }

    /** POST /api/students/me/documents  (multipart: type, file) */
    public function upload(Request $req): never
    {
        $id = $this->studentId($req);
        $type = (string) ($_POST['type'] ?? '');
        if (!Database::value('SELECT code FROM document_types WHERE code = ?', [$type])) throw new HttpException(422, 'validation_failed', ['type' => 'in']);
        $f = $_FILES['file'] ?? null;
        if (!$f || $f['error'] !== UPLOAD_ERR_OK) throw new HttpException(422, 'validation_failed', ['file' => 'required']);
        if ($f['size'] > self::MAX_UPLOAD) throw new HttpException(422, 'validation_failed', ['file' => 'max']);
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: '';
        if (!isset(self::MIME[$mime])) throw new HttpException(422, 'validation_failed', ['file' => 'type']);

        // stored outside public/ with a random name; served only through an authorised endpoint
        $dir = dirname(__DIR__, 2) . "/storage/uploads/$id";
        if (!is_dir($dir)) mkdir($dir, 0775, true);
        $stored = bin2hex(random_bytes(12)) . '.' . self::MIME[$mime];
        if (!move_uploaded_file($f['tmp_name'], "$dir/$stored")) throw new HttpException(500, 'upload_failed');

        Database::run(
            'INSERT INTO documents (student_id, type_code, file_name, stored_path, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)',
            [$id, $type, mb_substr(basename($f['name']), 0, 190), "$id/$stored", $mime, $f['size']],
        );
        Response::json(Mapper::document(Database::one('SELECT * FROM documents WHERE id = ?', [Database::insertId()])), 201);
    }

    public function readiness(Request $req): never
    {
        Response::json(Matching::readiness($this->studentId($req)));
    }

    public function recommendations(Request $req): never
    {
        $id = $this->studentId($req);
        Response::json(Matching::recommend($id, $this->student($req), Mapper::scholarships("status <> 'draft'")));
    }

    public function applications(Request $req): never
    {
        $id = $this->studentId($req);
        $rows = Database::all(
            "SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) AS advisor, u.name_ar AS advisor_ar
             FROM applications a LEFT JOIN users u ON u.id = a.advisor_id WHERE a.student_id = ? ORDER BY a.updated_at DESC",
            [$id],
        );
        $sch = [];
        foreach (Mapper::scholarships("status <> 'draft'") as $s) $sch[$s['id']] = $s;
        Response::json(array_map(fn ($a) => [
            'id' => $a['code'], 'scholarshipId' => (int) $a['scholarship_id'], 'stage' => (int) $a['stage'], 'result' => $a['result'],
            'updatedAt' => substr($a['updated_at'], 0, 10), 'advisor' => $a['advisor'], 'advisorAr' => $a['advisor_ar'],
            'scholarship' => $sch[$a['scholarship_id']] ?? null,
        ], $rows));
    }

    public function serviceRequests(Request $req): never
    {
        $rows = Database::all(
            "SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) AS assignee, u.name_ar AS assignee_ar
             FROM service_requests r LEFT JOIN users u ON u.id = r.assigned_to WHERE r.student_id = ? ORDER BY r.created_at DESC",
            [$this->studentId($req)],
        );
        Response::json(array_map(fn ($r) => [
            'id' => 'SR-' . $r['id'], 'service' => $r['service_code'], 'status' => $r['status'], 'priority' => $r['priority'],
            'notes' => $r['notes'], 'createdAt' => substr($r['created_at'], 0, 10), 'assignee' => $r['assignee'], 'assigneeAr' => $r['assignee_ar'],
        ], $rows));
    }

    /** POST /api/service-requests */
    public function requestService(Request $req): never
    {
        $id = $this->studentId($req);
        $d = Validator::check($req->body(), ['service' => 'required', 'priority' => 'in:high,medium,low', 'notes' => 'max:2000']);
        if (!Database::value('SELECT code FROM services WHERE code = ?', [$d['service']])) throw new HttpException(422, 'validation_failed', ['service' => 'in']);
        $schId = isset($d['scholarshipId']) && $d['scholarshipId'] !== '' ? (int) $d['scholarshipId'] : null;
        Database::run(
            'INSERT INTO service_requests (student_id, service_code, scholarship_id, priority, notes) VALUES (?, ?, ?, ?, ?)',
            [$id, $d['service'], $schId, $d['priority'] ?? 'medium', $d['notes'] ?? null],
        );
        Response::json(['id' => 'SR-' . Database::insertId(), 'status' => 'newRequest', 'service' => $d['service']], 201);
    }

    private function studentId(Request $req): int
    {
        $id = (int) $req->user['id'];
        if (!Database::value('SELECT user_id FROM students WHERE user_id = ?', [$id])) throw new HttpException(404, 'student_profile_missing');
        return $id;
    }

    private function student(Request $req): array
    {
        return Mapper::student($this->studentId($req)) ?? throw new HttpException(404, 'student_profile_missing');
    }
}
