<?php
// EduBridge REST API — front controller.
// Local run:  php -S localhost:8000 -t public public/index.php

declare(strict_types=1);

// static files (Swagger page, openapi.json) when running with the PHP built-in server
if (PHP_SAPI === 'cli-server') {
    $uriPath = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
    if (rtrim($uriPath, '/') === '/docs') { header('Content-Type: text/html; charset=utf-8'); readfile(__DIR__ . '/docs/index.html'); exit; }
    if ($uriPath !== '/' && !str_contains($uriPath, '..') && is_file(__DIR__ . $uriPath)) return false;
}

require dirname(__DIR__) . '/src/bootstrap.php';

use App\Controllers\{AccountController, AuthController, ContactController, HealthController, ScholarshipController, StudentController};
use App\Core\{HttpException, Request, Response, Router};

Response::cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

$r = new Router();
$any = [];                         // any signed-in user
$staff = ['employee', 'admin'];

// ---- health ----
$r->get('/api/health', [HealthController::class, 'show']);

// ---- authentication ----
$r->post('/api/auth/register',            [AuthController::class, 'register']);
$r->post('/api/auth/login',               [AuthController::class, 'login']);
$r->post('/api/auth/forgot-password',     [AuthController::class, 'forgot']);
$r->post('/api/auth/verify-code',         [AuthController::class, 'verifyCode']);
$r->post('/api/auth/reset-password',      [AuthController::class, 'resetPassword']);
$r->post('/api/auth/resend-confirmation', [AuthController::class, 'resendConfirmation']);
$r->get('/api/auth/me',                   [AuthController::class, 'me'], $any);
$r->post('/api/auth/logout',              [AuthController::class, 'logout'], $any);

// ---- scholarships (public read, staff write) ----
$r->get('/api/scholarships',               [ScholarshipController::class, 'index']);
$r->get('/api/scholarships/{id}',          [ScholarshipController::class, 'show']);
$r->post('/api/scholarships',              [ScholarshipController::class, 'store'], $staff);
$r->put('/api/scholarships/{id}',          [ScholarshipController::class, 'update'], $staff);
$r->put('/api/scholarships/{id}/results',  [ScholarshipController::class, 'results'], $staff);

// ---- signed-in student ----
$r->get('/api/students/me',                  [StudentController::class, 'profile'], ['student']);
$r->put('/api/students/me',                  [StudentController::class, 'updateProfile'], ['student']);
$r->get('/api/students/me/documents',        [StudentController::class, 'documents'], ['student']);
$r->post('/api/students/me/documents',       [StudentController::class, 'upload'], ['student']);
$r->get('/api/students/me/readiness',        [StudentController::class, 'readiness'], ['student']);
$r->get('/api/students/me/recommendations',  [StudentController::class, 'recommendations'], ['student']);
$r->get('/api/students/me/applications',     [StudentController::class, 'applications'], ['student']);
$r->get('/api/students/me/service-requests', [StudentController::class, 'serviceRequests'], ['student']);
$r->post('/api/service-requests',            [StudentController::class, 'requestService'], ['student']);

// ---- account settings (every role) ----
$r->get('/api/account/sessions',                  [AccountController::class, 'sessions'], $any);
$r->delete('/api/account/sessions/{id}',          [AccountController::class, 'revokeSession'], $any);
$r->post('/api/account/sessions/revoke-others',   [AccountController::class, 'revokeOthers'], $any);
$r->put('/api/account/profile',                   [AccountController::class, 'updateProfile'], $any);
$r->post('/api/account/email',                    [AccountController::class, 'changeEmail'], $any);
$r->post('/api/account/password',                 [AccountController::class, 'changePassword'], $any);
$r->put('/api/account/security',                  [AccountController::class, 'updateSecurity'], $any);
$r->put('/api/account/notifications',             [AccountController::class, 'updateNotifications'], $any);

// ---- public contact form ----
$r->post('/api/contact', [ContactController::class, 'store']);

try {
    $r->dispatch(new Request());
} catch (HttpException $e) {
    Response::error($e->status, $e->errorCode, $e->details);
} catch (\PDOException $e) {
    error_log('[db] ' . $e->getMessage());
    Response::error(500, 'database_error');
} catch (\Throwable $e) {
    error_log('[app] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Response::error(500, 'server_error');
}
