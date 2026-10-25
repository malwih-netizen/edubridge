<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, Request, Response};

final class HealthController
{
    /** GET /api/health — confirms the API and the database are reachable. */
    public function show(Request $req): never
    {
        Response::json([
            'status'   => 'ok',
            'database' => Database::value('SELECT VERSION()'),
            'time'     => date(DATE_ATOM),
        ]);
    }
}
