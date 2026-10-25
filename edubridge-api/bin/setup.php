<?php
// إنشاء قاعدة البيانات والجداول والبيانات التجريبية:
//   php bin/setup.php          → ينشئ القاعدة إن لم تكن موجودة، ثم الجداول والبيانات
//   php bin/setup.php --fresh  → يحذف القاعدة ويعيد إنشاءها من الصفر

declare(strict_types=1);
require __DIR__ . '/../src/bootstrap.php';

use App\Core\Env;

$name = Env::get('DB_NAME', 'edubridge');
if (!preg_match('/^[A-Za-z0-9_]+$/', $name)) exit("Invalid DB_NAME\n");

$server = new PDO(
    sprintf('mysql:host=%s;port=%s;charset=utf8mb4', Env::get('DB_HOST', '127.0.0.1'), Env::get('DB_PORT', '3306')),
    Env::get('DB_USER', 'root'),
    Env::get('DB_PASS', ''),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
);

if (in_array('--fresh', $argv, true)) {
    $server->exec("DROP DATABASE IF EXISTS `$name`");
    echo "Dropped database $name\n";
}
$server->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$server->exec("USE `$name`");

foreach (['schema.sql', 'seed.sql', 'views.sql'] as $file) {
    $sql = file_get_contents(__DIR__ . "/../database/$file");
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);               // strip comment lines
    $statements = array_filter(array_map('trim', preg_split('/;\s*(\r?\n|$)/', $sql)));
    foreach ($statements as $stmt) $server->exec($stmt);
    printf("✓ %-11s %d statements\n", $file, count($statements));
}

$counts = [];
foreach (['users', 'students', 'scholarships', 'documents', 'applications', 'service_requests'] as $t) {
    $counts[] = $t . '=' . $server->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
}
echo "Database `$name` ready: " . implode(', ', $counts) . "\n";
echo "Demo password for all accounts: demo1234\n";
