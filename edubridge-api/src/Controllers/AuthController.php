<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Auth, Database, HttpException, Request, Response, Validator};

final class AuthController
{
    /** POST /api/auth/register — creates a student account + profile, returns a token. */
    public function register(Request $req): never
    {
        $d = Validator::check($req->body(), [
            'firstName' => 'required|max:80', 'lastName' => 'required|max:80',
            'email' => 'required|email|max:190', 'password' => 'required|min:8',
            'gpa' => 'numeric|between:0,100', 'birth' => 'date',
        ]);
        $email = strtolower(trim($d['email']));
        if (Database::value('SELECT id FROM users WHERE email = ?', [$email])) {
            throw new HttpException(409, 'email_taken', ['email' => 'taken']);
        }

        $userId = Database::transaction(function () use ($d, $email) {
            Database::run(
                "INSERT INTO users (role, first_name, last_name, email, phone, password_hash) VALUES ('student', ?, ?, ?, ?, ?)",
                [trim($d['firstName']), trim($d['lastName']), $email, $d['phone'] ?? null, password_hash($d['password'], PASSWORD_BCRYPT)],
            );
            $id = Database::insertId();
            $v = fn (string $k) => isset($d[$k]) && $d[$k] !== '' ? $d[$k] : null;   // empty → NULL
            Database::run(
                'INSERT INTO students (user_id, gender, birth_date, nationality, country, city, current_level, target_level, field, gpa, institution, funding_pref, intake, help_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$id, $v('gender'), $v('birth'), $v('nationality'), $v('nationality'), $v('city'), $v('currentLevel'),
                 $v('level') ?? 'master', $v('field'), $v('gpa'), $v('institution'), $v('funding') ?? 'full', $v('intake'), $v('help') ?? 'full'],
            );
            foreach (array_slice((array) ($d['countries'] ?? []), 0, 3) as $c) {
                Database::run('INSERT IGNORE INTO student_countries (student_id, country) VALUES (?, ?)', [$id, (string) $c]);
            }
            Database::run(
                "INSERT INTO email_verifications (user_id, email, token_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))",
                [$id, $email, password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT)],
            );
            return $id;
        });

        $user = Database::one('SELECT * FROM users WHERE id = ?', [$userId]);
        Response::json(['token' => Auth::issueToken($user, $req), 'user' => Auth::publicUser($user)], 201);
    }

    /** POST /api/auth/login */
    public function login(Request $req): never
    {
        $d = Validator::check($req->body(), ['email' => 'required|email', 'password' => 'required']);
        $user = Database::one('SELECT * FROM users WHERE email = ?', [strtolower(trim($d['email']))]);
        if (!$user || !password_verify($d['password'], $user['password_hash'])) {
            usleep(300000); // slow down guessing
            throw new HttpException(401, 'invalid_credentials');
        }
        if ($user['status'] === 'suspended') throw new HttpException(403, 'account_suspended');
        Response::json(['token' => Auth::issueToken($user, $req), 'user' => Auth::publicUser($user)]);
    }

    /** GET /api/auth/me */
    public function me(Request $req): never
    {
        Response::json(Auth::publicUser($req->user));
    }

    /** POST /api/auth/logout — revokes this device's token. */
    public function logout(Request $req): never
    {
        Database::run('UPDATE user_sessions SET revoked_at = NOW() WHERE token_id = ?', [$req->sessionId]);
        Response::json(['ok' => true]);
    }

    /** POST /api/auth/forgot-password — stores a 6-digit code (email sending comes later). */
    public function forgot(Request $req): never
    {
        $d = Validator::check($req->body(), ['email' => 'required|email']);
        $email = strtolower(trim($d['email']));
        if (Database::value('SELECT id FROM users WHERE email = ?', [$email])) {
            $code = (string) random_int(100000, 999999);
            Database::run(
                'INSERT INTO password_resets (email, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
                [$email, password_hash($code, PASSWORD_BCRYPT)],
            );
            // TODO: send $code by email (PHPMailer). In local mode we return it to ease testing.
            if (\App\Core\Env::get('APP_ENV') === 'local') Response::json(['sent' => true, 'devCode' => $code]);
        }
        Response::json(['sent' => true]); // same answer whether or not the email exists
    }

    /** POST /api/auth/verify-code */
    public function verifyCode(Request $req): never
    {
        $d = Validator::check($req->body(), ['email' => 'required|email', 'code' => 'required|min:6|max:6']);
        $row = Database::one(
            'SELECT * FROM password_resets WHERE email = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
            [strtolower(trim($d['email']))],
        );
        if (!$row || !password_verify($d['code'], $row['code_hash'])) throw new HttpException(422, 'invalid_code');
        $resetToken = bin2hex(random_bytes(24));
        Database::run('UPDATE password_resets SET code_hash = ? WHERE id = ?', [password_hash($resetToken, PASSWORD_BCRYPT), $row['id']]);
        Response::json(['resetToken' => $row['id'] . '.' . $resetToken]);
    }

    /** POST /api/auth/reset-password */
    public function resetPassword(Request $req): never
    {
        $d = Validator::check($req->body(), ['resetToken' => 'required', 'password' => 'required|min:8']);
        [$id, $secret] = array_pad(explode('.', (string) $d['resetToken'], 2), 2, '');
        $row = Database::one('SELECT * FROM password_resets WHERE id = ? AND used_at IS NULL AND expires_at > NOW()', [(int) $id]);
        if (!$row || !password_verify($secret, $row['code_hash'])) throw new HttpException(422, 'invalid_token');
        Database::transaction(function () use ($row, $d) {
            Database::run('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash($d['password'], PASSWORD_BCRYPT), $row['email']]);
            Database::run('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [$row['id']]);
            Database::run('UPDATE user_sessions s JOIN users u ON u.id = s.user_id SET s.revoked_at = NOW() WHERE u.email = ? AND s.revoked_at IS NULL', [$row['email']]);
        });
        Response::json(['ok' => true]);
    }

    /** POST /api/auth/resend-confirmation */
    public function resendConfirmation(Request $req): never
    {
        Validator::check($req->body(), ['email' => 'required|email']);
        // TODO: send the confirmation email. Response is identical whether or not the account exists.
        Response::json(['sent' => true]);
    }
}
