<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, Request, Response};

final class HealthController
{
    /** MySQL error numbers → a reason that is safe to show (no host, user or password). */
    private const DB_REASONS = [
        1045 => 'access_denied',     // wrong DB_USER or DB_PASS
        1044 => 'unknown_database',  // user has no database by that name
        1049 => 'unknown_database',  // wrong DB_NAME
        2002 => 'cannot_reach_host', // wrong DB_HOST / server down
        2005 => 'cannot_reach_host',
        1146 => 'missing_tables',    // database exists but the SQL file was not imported
    ];

    /** GET /api/health — confirms the API and the database are reachable, or says why not. */
    public function show(Request $req): never
    {
        try {
            $version = Database::value('SELECT VERSION()');
            $tables = (int) Database::value('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()');
        } catch (\PDOException $e) {
            $code = (int) ($e->errorInfo[1] ?? $e->getCode());
            Response::json([
                'status'   => 'error',
                'database' => self::DB_REASONS[$code] ?? 'database_error',
                'mysql'    => $code,
                'time'     => date(DATE_ATOM),
            ], 503);
        }

        Response::json([
            'status'   => $tables > 0 ? 'ok' : 'error',
            'database' => $tables > 0 ? $version : 'missing_tables',
            'tables'   => $tables,
            'time'     => date(DATE_ATOM),
        ], $tables > 0 ? 200 : 503);
    }
}
