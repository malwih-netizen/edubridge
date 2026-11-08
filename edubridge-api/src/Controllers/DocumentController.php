<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, HttpException, Request, Response, Validator};
use App\Services\Mapper;

/** Staff side of documents: list a student's files, open them, and review them. */
final class DocumentController
{
    /** GET /api/students/{id}/documents */
    public function forStudent(Request $req, string $id): never
    {
        if (!Database::value('SELECT user_id FROM students WHERE user_id = ?', [(int) $id])) throw new HttpException(404, 'not_found');
        $rows = Database::all('SELECT * FROM documents WHERE student_id = ? ORDER BY uploaded_at DESC', [(int) $id]);
        Response::json(array_map([Mapper::class, 'document'], $rows));
    }

    /** GET /api/documents/{id}/file */
    public function file(Request $req, string $id): never
    {
        $doc = $this->find($id);
        Response::file(StudentController::uploadsDir() . '/' . $doc['stored_path'], $doc['mime_type'], $doc['file_name']);
    }

    /** PUT /api/documents/{id}/review  { status: approved|rejected, reason } — the student is notified. */
    public function review(Request $req, string $id): never
    {
        $doc = $this->find($id);
        $d = Validator::check($req->body(), ['status' => 'required|in:approved,rejected', 'reason' => 'max:255']);
        if ($d['status'] === 'rejected' && trim((string) ($d['reason'] ?? '')) === '') {
            throw new HttpException(422, 'validation_failed', ['reason' => 'required']);
        }
        $reason = $d['status'] === 'rejected' ? trim((string) $d['reason']) : null;

        Database::transaction(function () use ($doc, $d, $reason, $req) {
            Database::run(
                'UPDATE documents SET status = ?, reject_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
                [$d['status'], $reason, $req->user['id'], $doc['id']],
            );
            $approved = $d['status'] === 'approved';
            Database::run(
                "INSERT INTO notifications (user_id, type, title, title_ar, body, body_ar, link) VALUES (?, 'document', ?, ?, ?, ?, '/student/documents')",
                [
                    $doc['student_id'],
                    $approved ? 'Document approved' : 'Document needs changes',
                    $approved ? 'تم قبول المستند' : 'المستند يحتاج تعديل',
                    $approved ? $doc['file_name'] : $doc['file_name'] . ': ' . $reason,
                    $approved ? $doc['file_name'] : $doc['file_name'] . ': ' . $reason,
                ],
            );
            Database::run(
                "INSERT INTO audit_log (user_id, action, entity, entity_id, meta, ip_address) VALUES (?, 'document.review', 'document', ?, ?, ?)",
                [$req->user['id'], $doc['id'], json_encode(['status' => $d['status']]), $req->ip()],
            );
        });
        Response::json(Mapper::document(Database::one('SELECT * FROM documents WHERE id = ?', [$doc['id']])));
    }

    private function find(string $id): array
    {
        return Database::one('SELECT * FROM documents WHERE id = ?', [(int) $id]) ?? throw new HttpException(404, 'not_found');
    }
}
