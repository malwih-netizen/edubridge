<?php
declare(strict_types=1);

namespace App\Core;

final class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
        exit;
    }

    /** Unified error shape: { "error": { "code": "...", "message": "...", "details": {...} } } */
    public static function error(int $status, string $code, array $details = [], string $message = ''): never
    {
        self::json(['error' => array_filter([
            'code'    => $code,
            'message' => $message ?: $code,
            'details' => $details ?: null,
        ], fn ($v) => $v !== null)], $status);
    }

    public static function cors(): void
    {
        $allowed = array_map('trim', explode(',', (string) Env::get('CORS_ORIGINS', 'http://localhost:5173')));
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (in_array($origin, $allowed, true)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Vary: Origin');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Accept-Language');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Max-Age: 600');
        }
    }
}
