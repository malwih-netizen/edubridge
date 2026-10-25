<?php
declare(strict_types=1);

namespace App\Core;

/** Reads KEY=value pairs from .env into a static store. */
final class Env
{
    private static array $vars = [];

    public static function load(string $path): void
    {
        if (!is_file($path)) return;
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
            [$key, $value] = array_map('trim', explode('=', $line, 2));
            self::$vars[$key] = trim($value, "\"'");
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        return self::$vars[$key] ?? (getenv($key) !== false ? getenv($key) : $default);
    }
}
