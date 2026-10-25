<?php
// تحميل الإعدادات والكلاسات تلقائياً (بدون Composer): App\Core\Database → src/Core/Database.php

declare(strict_types=1);

spl_autoload_register(function (string $class): void {
    if (str_starts_with($class, 'App\\')) {
        $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, 4)) . '.php';
        if (is_file($file)) require $file;
    }
});

App\Core\Env::load(dirname(__DIR__) . '/.env');

date_default_timezone_set('Asia/Gaza');
mb_internal_encoding('UTF-8');
