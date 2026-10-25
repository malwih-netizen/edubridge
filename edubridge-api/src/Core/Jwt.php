<?php
declare(strict_types=1);

namespace App\Core;

/** JSON Web Token (HS256) without external libraries. */
final class Jwt
{
    public static function encode(array $payload): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $segments = [self::b64(json_encode($header)), self::b64(json_encode($payload))];
        $segments[] = self::b64(hash_hmac('sha256', implode('.', $segments), self::secret(), true));
        return implode('.', $segments);
    }

    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$h, $p, $s] = $parts;
        $expected = self::b64(hash_hmac('sha256', "$h.$p", self::secret(), true));
        if (!hash_equals($expected, $s)) return null;
        $payload = json_decode(self::unb64($p), true);
        if (!is_array($payload) || ($payload['exp'] ?? 0) < time()) return null;
        return $payload;
    }

    private static function secret(): string
    {
        $secret = (string) Env::get('JWT_SECRET', '');
        if (strlen($secret) < 32 || $secret === 'change-me') {
            throw new \RuntimeException('Set a long random JWT_SECRET in .env');
        }
        return $secret;
    }

    private static function b64(string $data): string { return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); }
    private static function unb64(string $data): string { return base64_decode(strtr($data, '-_', '+/')) ?: ''; }
}
