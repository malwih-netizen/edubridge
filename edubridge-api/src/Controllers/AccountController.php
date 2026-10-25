<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, HttpException, Request, Response, Validator};

/** Settings shared by every role: devices, email, password. */
final class AccountController
{
    public function sessions(Request $req): never
    {
        $rows = Database::all(
            'SELECT * FROM user_sessions WHERE user_id = ? AND revoked_at IS NULL ORDER BY last_active_at DESC',
            [$req->user['id']],
        );
        Response::json(array_map(fn ($s) => [
            'id' => (string) $s['id'], 'type' => $s['device_type'], 'browser' => $s['browser'], 'os' => $s['os'],
            'city' => $s['city'] ?? $s['ip_address'], 'cityAr' => $s['city'] ?? $s['ip_address'],
            'current' => $s['token_id'] === $req->sessionId, 'lastActive' => date(DATE_ATOM, strtotime($s['last_active_at'])),
        ], $rows));
    }

    public function revokeSession(Request $req, string $id): never
    {
        Database::run('UPDATE user_sessions SET revoked_at = NOW() WHERE id = ? AND user_id = ? AND token_id <> ?', [(int) $id, $req->user['id'], $req->sessionId]);
        Response::json(['ok' => true]);
    }

    public function revokeOthers(Request $req): never
    {
        Database::run('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND token_id <> ? AND revoked_at IS NULL', [$req->user['id'], $req->sessionId]);
        Response::json(['ok' => true]);
    }

    public function changePassword(Request $req): never
    {
        $d = Validator::check($req->body(), ['current' => 'required', 'next' => 'required|min:8']);
        if (!password_verify($d['current'], $req->user['password_hash'])) throw new HttpException(422, 'validation_failed', ['current' => 'wrong']);
        Database::run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($d['next'], PASSWORD_BCRYPT), $req->user['id']]);
        Response::json(['ok' => true]);
    }

    public function changeEmail(Request $req): never
    {
        $d = Validator::check($req->body(), ['email' => 'required|email|max:190', 'password' => 'required']);
        if (!password_verify($d['password'], $req->user['password_hash'])) throw new HttpException(422, 'validation_failed', ['password' => 'wrong']);
        $email = strtolower(trim($d['email']));
        if (Database::value('SELECT id FROM users WHERE email = ?', [$email])) throw new HttpException(409, 'email_taken');
        Database::run(
            'INSERT INTO email_verifications (user_id, email, token_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))',
            [$req->user['id'], $email, password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT)],
        );
        // TODO: email the confirmation link; the address changes only after it is opened.
        Response::json(['pending' => true, 'email' => $email]);
    }

    public function updateSecurity(Request $req): never
    {
        $b = $req->body();
        Database::run('UPDATE users SET two_factor = ?, login_alerts = ? WHERE id = ?', [!empty($b['twoFa']) ? 1 : 0, !empty($b['alerts']) ? 1 : 0, $req->user['id']]);
        Response::json(['ok' => true]);
    }

    public function updateProfile(Request $req): never
    {
        $d = Validator::check($req->body(), ['firstName' => 'required|max:80', 'lastName' => 'required|max:80']);
        Database::run('UPDATE users SET first_name = ?, last_name = ?, name_ar = ?, phone = ? WHERE id = ?',
            [$d['firstName'], $d['lastName'], $d['nameAr'] ?? null, $d['phone'] ?? null, $req->user['id']]);
        Response::json(['ok' => true]);
    }

    public function updateNotifications(Request $req): never
    {
        foreach ($req->body() as $category => $ch) {
            if (!in_array($category, ['requests', 'documents', 'deadlines', 'matches', 'messages'], true)) continue;
            Database::run(
                'INSERT INTO notification_settings (user_id, category, email, in_app) VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE email = VALUES(email), in_app = VALUES(in_app)',
                [$req->user['id'], $category, !empty($ch['email']) ? 1 : 0, !empty($ch['inApp']) ? 1 : 0],
            );
        }
        Response::json(['ok' => true]);
    }
}
