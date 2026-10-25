<?php
declare(strict_types=1);

namespace App\Core;

final class Request
{
    public readonly string $method;
    public readonly string $path;
    public readonly array $query;
    private ?array $json = null;
    /** Set by the auth middleware for protected routes. */
    public ?array $user = null;
    public ?string $sessionId = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $this->path = '/' . trim($uri, '/');
        $this->query = $_GET;
    }

    /** JSON body (or form fields for multipart uploads). */
    public function body(): array
    {
        if ($this->json === null) {
            $raw = file_get_contents('php://input') ?: '';
            $decoded = json_decode($raw, true);
            $this->json = is_array($decoded) ? $decoded : $_POST;
        }
        return $this->json;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body()[$key] ?? $default;
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public function bearerToken(): ?string
    {
        $h = $this->header('Authorization') ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);
        return ($h && preg_match('/^Bearer\s+(.+)$/i', $h, $m)) ? trim($m[1]) : null;
    }

    public function lang(): string
    {
        return str_starts_with((string) $this->header('Accept-Language'), 'ar') ? 'ar' : 'en';
    }

    public function ip(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
