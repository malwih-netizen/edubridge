<?php
declare(strict_types=1);

namespace App\Core;

/** Issues tokens (one per signed-in device) and checks them on protected routes. */
final class Auth
{
    public static function issueToken(array $user, Request $req): string
    {
        $tokenId = bin2hex(random_bytes(16));
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        Database::run(
            'INSERT INTO user_sessions (user_id, token_id, device_type, browser, os, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [$user['id'], $tokenId, self::deviceType($ua), self::browser($ua), self::os($ua), $req->ip()],
        );
        Database::run('UPDATE users SET last_login_at = NOW() WHERE id = ?', [$user['id']]);
        $ttl = (int) Env::get('JWT_TTL_HOURS', '72') * 3600;
        return Jwt::encode(['sub' => (int) $user['id'], 'role' => $user['role'], 'jti' => $tokenId, 'iat' => time(), 'exp' => time() + $ttl]);
    }

    public static function authenticate(Request $req): void
    {
        $payload = ($t = $req->bearerToken()) ? Jwt::decode($t) : null;
        if (!$payload) throw new HttpException(401, 'unauthenticated');

        $session = Database::one('SELECT id FROM user_sessions WHERE token_id = ? AND revoked_at IS NULL', [$payload['jti']]);
        if (!$session) throw new HttpException(401, 'session_revoked');

        $user = Database::one("SELECT * FROM users WHERE id = ? AND status <> 'suspended'", [$payload['sub']]);
        if (!$user) throw new HttpException(401, 'unauthenticated');

        Database::run('UPDATE user_sessions SET last_active_at = NOW() WHERE id = ?', [$session['id']]);
        $req->user = $user;
        $req->sessionId = $payload['jti'];
    }

    /** Public shape of a user, as the React app expects it. */
    public static function publicUser(array $u): array
    {
        return [
            'id'      => (int) $u['id'],
            'role'    => $u['role'],
            'email'   => $u['email'],
            'name'    => trim($u['first_name'] . ' ' . $u['last_name']),
            'nameAr'  => $u['name_ar'],
            'title'   => $u['title'] ?? null,
            'titleAr' => $u['title_ar'] ?? null,
        ];
    }

    private static function deviceType(string $ua): string
    {
        if (preg_match('/iPad|Tablet/i', $ua)) return 'tablet';
        return preg_match('/Mobile|Android|iPhone/i', $ua) ? 'phone' : 'laptop';
    }

    private static function browser(string $ua): string
    {
        foreach (['Edg' => 'Edge', 'Chrome' => 'Chrome', 'Firefox' => 'Firefox', 'Safari' => 'Safari'] as $k => $name) {
            if (str_contains($ua, $k)) return $name;
        }
        return 'Browser';
    }

    private static function os(string $ua): string
    {
        foreach (['Windows' => 'Windows', 'Android' => 'Android', 'iPhone' => 'iOS', 'iPad' => 'iPadOS', 'Mac OS' => 'macOS', 'Linux' => 'Linux'] as $k => $name) {
            if (str_contains($ua, $k)) return $name;
        }
        return 'Unknown';
    }
}
