<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, Env, HttpException, Request, Response, Validator};
use App\Services\Mailer;

/** Administrator: manage user accounts — /api/admin/users */
final class AdminController
{
    private const DEPARTMENTS = 'studentServices,admissions,visa,scholarships,compliance';

    /** GET /api/admin/users?role=&status=&department=&q= */
    public function users(Request $req): never
    {
        $where = ['1=1'];
        $params = [];
        $q = $req->query;
        foreach (['role', 'status', 'department'] as $col) {
            if (!empty($q[$col])) { $where[] = "u.$col = ?"; $params[] = $q[$col]; }
        }
        if (!empty($q['q'])) {
            $where[] = "(CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.name_ar LIKE ? OR u.email LIKE ?)";
            array_push($params, ...array_fill(0, 3, '%' . $q['q'] . '%'));
        }
        $rows = Database::all(
            'SELECT u.*, COALESCE((SELECT MAX(s.last_active_at) FROM user_sessions s WHERE s.user_id = u.id), u.last_login_at) AS last_active
             FROM users u WHERE ' . implode(' AND ', $where) . ' ORDER BY u.created_at DESC',
            $params,
        );
        Response::json(array_map([self::class, 'map'], $rows));
    }

    /** POST /api/admin/users  { name, email, role, department } — invited with a temporary password sent by email. */
    public function create(Request $req): never
    {
        $d = Validator::check($req->body(), [
            'name' => 'required|max:160', 'email' => 'required|email|max:190',
            'role' => 'required|in:student,employee,admin', 'department' => 'in:' . self::DEPARTMENTS,
        ]);
        if ($d['role'] !== 'student' && empty($d['department'])) throw new HttpException(422, 'validation_failed', ['department' => 'required']);
        $email = strtolower(trim($d['email']));
        if (Database::value('SELECT id FROM users WHERE email = ?', [$email])) throw new HttpException(409, 'email_taken');

        [$first, $last] = array_pad(preg_split('/\s+/', trim($d['name']), 2), 2, '');
        $tempPassword = bin2hex(random_bytes(5));
        $id = Database::transaction(function () use ($d, $email, $first, $last, $tempPassword) {
            Database::run(
                "INSERT INTO users (role, first_name, last_name, email, password_hash, status, department) VALUES (?, ?, ?, ?, ?, 'invited', ?)",
                [$d['role'], $first, $last ?: '-', $email, password_hash($tempPassword, PASSWORD_BCRYPT), $d['role'] === 'student' ? null : $d['department']],
            );
            $id = Database::insertId();
            if ($d['role'] === 'student') Database::run('INSERT INTO students (user_id) VALUES (?)', [$id]);
            return $id;
        });
        $this->audit($req, 'user.create', $id, ['role' => $d['role']]);

        $sent = Mailer::send($email, 'EduBridge — your account / حسابك على EduBridge',
            "Hello {$first},\n\nAn EduBridge account was created for you.\nEmail: $email\nTemporary password: $tempPassword\n"
            . 'Sign in at ' . Env::get('APP_URL', '') . "/login and change your password from Settings.\n\n"
            . "مرحباً {$first}،\nتم إنشاء حساب لك على EduBridge. كلمة المرور المؤقتة: $tempPassword\nغيّرها بعد أول تسجيل دخول من الإعدادات.");

        $user = self::map(Database::one('SELECT u.*, NULL AS last_active FROM users u WHERE id = ?', [$id]));
        // without email settings (local development) the temporary password is returned so the account can be tried
        if (!$sent && Env::get('APP_ENV') === 'local') $user['devPassword'] = $tempPassword;
        $user['emailSent'] = $sent;
        Response::json($user, 201);
    }

    /** PUT /api/admin/users/{id}  { role?, status?: active|suspended, department? } */
    public function update(Request $req, string $id): never
    {
        $user = Database::one('SELECT * FROM users WHERE id = ?', [(int) $id]) ?? throw new HttpException(404, 'not_found');
        $d = Validator::check($req->body(), [
            'role' => 'in:student,employee,admin', 'status' => 'in:active,suspended', 'department' => 'in:' . self::DEPARTMENTS,
        ]);
        $self = (int) $user['id'] === (int) $req->user['id'];
        if ($self && ((isset($d['role']) && $d['role'] !== $user['role']) || ($d['status'] ?? '') === 'suspended')) {
            throw new HttpException(409, 'cannot_change_own_account');
        }
        $role = $d['role'] ?? $user['role'];
        $dept = $role === 'student' ? null : ($d['department'] ?? $user['department']);

        Database::transaction(function () use ($user, $d, $role, $dept) {
            Database::run('UPDATE users SET role = ?, status = ?, department = ? WHERE id = ?', [$role, $d['status'] ?? $user['status'], $dept, $user['id']]);
            if ($role === 'student') Database::run('INSERT IGNORE INTO students (user_id) VALUES (?)', [$user['id']]);
            // a suspended account is signed out on every device
            if (($d['status'] ?? '') === 'suspended') Database::run('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [$user['id']]);
        });
        $this->audit($req, 'user.update', (int) $user['id'], array_intersect_key($d, array_flip(['role', 'status', 'department'])));
        Response::json(self::map(Database::one(
            'SELECT u.*, COALESCE((SELECT MAX(s.last_active_at) FROM user_sessions s WHERE s.user_id = u.id), u.last_login_at) AS last_active FROM users u WHERE id = ?',
            [$user['id']],
        )));
    }

    public static function map(array $u): array
    {
        return [
            'id'         => (int) $u['id'],
            'name'       => trim($u['first_name'] . ' ' . ($u['last_name'] === '-' ? '' : $u['last_name'])),
            'nameAr'     => $u['name_ar'],
            'email'      => $u['email'],
            'role'       => $u['role'],
            'department' => $u['department'],
            'status'     => $u['status'],
            'lastActive' => $u['last_active'] ? str_replace(' ', 'T', $u['last_active']) : null,
        ];
    }

    private function audit(Request $req, string $action, int $entityId, array $meta): void
    {
        Database::run(
            "INSERT INTO audit_log (user_id, action, entity, entity_id, meta, ip_address) VALUES (?, ?, 'user', ?, ?, ?)",
            [$req->user['id'], $action, $entityId, json_encode($meta), $req->ip()],
        );
    }
}
