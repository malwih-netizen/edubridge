<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Minimal router:  $r->get('/api/scholarships/{id}', [ScholarshipController::class, 'show'], roles: ['employee']);
 * roles: null = public, [] = any signed-in user, ['admin', ...] = only these roles.
 */
final class Router
{
    private array $routes = [];

    public function get(string $p, array $h, ?array $roles = null): void    { $this->add('GET', $p, $h, $roles); }
    public function post(string $p, array $h, ?array $roles = null): void   { $this->add('POST', $p, $h, $roles); }
    public function put(string $p, array $h, ?array $roles = null): void    { $this->add('PUT', $p, $h, $roles); }
    public function delete(string $p, array $h, ?array $roles = null): void { $this->add('DELETE', $p, $h, $roles); }

    private function add(string $method, string $pattern, array $handler, ?array $roles): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', rtrim($pattern, '/')) . '$#';
        $this->routes[] = compact('method', 'regex', 'handler', 'roles');
    }

    public function dispatch(Request $req): never
    {
        $pathMatched = false;
        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $req->path, $m)) continue;
            $pathMatched = true;
            if ($route['method'] !== $req->method) continue;

            if ($route['roles'] !== null) {
                Auth::authenticate($req);
                if ($route['roles'] && !in_array($req->user['role'], $route['roles'], true)) {
                    throw new HttpException(403, 'forbidden');
                }
            }
            $params = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            [$class, $method] = $route['handler'];
            (new $class())->$method($req, ...$params);
            Response::json(['ok' => true]); // handlers normally respond themselves
        }
        throw new HttpException($pathMatched ? 405 : 404, $pathMatched ? 'method_not_allowed' : 'not_found');
    }
}
